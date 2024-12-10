
'''
import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
import numpy as np
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix

# Load datasets
events_df = pd.read_csv('test_events.csv')
users_df = pd.read_csv('test_users.csv')
interactions_df = pd.read_csv('test_user_interactions.csv')

# Preprocessing Functions
def preprocess_text(df, column):
    """Combines multiple textual columns into a single feature."""
    df[column] = df['Preferences'].fillna('') + ' ' + \
                 df['Skills Required'].fillna('') + ' ' + \
                 df['Location'].fillna('')
    return df

# Preprocess events for content-based filtering
events_df = preprocess_text(events_df, 'content_features')

# Create a TF-IDF matrix for events
vectorizer = TfidfVectorizer(stop_words='english')
tfidf_matrix = vectorizer.fit_transform(events_df['content_features'])

# Map interaction types to weights
interaction_weights = {
    'view': 0.5,
    'review': 2,
    'watchlisted': 3,
    'enquiry': 4,
    'apply': 5
}

# Create the Interaction column
interactions_df['Interaction'] = interactions_df['Type'].map(interaction_weights)
# Aggregate duplicate (User ID, Event ID) entries
interactions_df = interactions_df.groupby(['User ID', 'Event ID'], as_index=False).agg({
    'Interaction': 'sum'  # You can use 'mean' or another aggregation function if preferred
})

# Build User-Item Interaction Matrix for Collaborative Filtering
interaction_matrix = interactions_df.pivot(index='User ID', columns='Event ID', values='Interaction').fillna(0)
interaction_matrix_csr = csr_matrix(interaction_matrix.values)

# KNN Collaborative Filtering Setup
knn = NearestNeighbors(n_neighbors=20, metric='cosine', algorithm='auto')
knn.fit(interaction_matrix_csr)  # Fit KNN model to the interaction matrix

# Recommendation Logic
def content_based_recommend(user_id, num_recommendations=20):
    """Provides content-based recommendations."""
    user = users_df[users_df['User ID'] == user_id]
    if user.empty:
        return {"error": "User not found"}
    
    # Create user profile based on preferences and skills
    user_features = user['Preferences'].fillna('') + ' ' + \
                    user['Skills'].fillna('') + ' ' + \
                    user['Location'].fillna('')
    user_tfidf = vectorizer.transform(user_features)
    
    # Compute cosine similarity between user profile and event TF-IDF matrix
    cosine_sim = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    
    # Rank events by similarity
    event_indices = cosine_sim.argsort()[-num_recommendations:][::-1]
    recommended_events = events_df.iloc[event_indices][['Event ID', 'Title']].copy()
    # Add the Score column based on cosine similarity
    recommended_events['Score'] = cosine_sim[event_indices]
    # Normalize scores
    recommended_events['Normalized Score'] = normalize_scores(recommended_events['Score'])
    
    return recommended_events.to_dict(orient='records')

# Generate Collaborative Recommendations using KNN
def collaborative_recommend(user_id, num_recommendations=20):
    """Generates collaborative recommendations using KNN."""
    if user_id not in interaction_matrix.index:
        return {"error": "User not found"}
    
    user_idx = interaction_matrix.index.get_loc(user_id)
    user_interactions = interaction_matrix_csr[user_idx].reshape(1, -1)  # Get user's interaction vector
    
    # Find similar users using KNN
    distances, indices = knn.kneighbors(user_interactions, n_neighbors=num_recommendations)
    
    # Collect all recommended events from similar users
    recommended_events = {}
    for idx in indices.flatten():
        user_events = interaction_matrix.iloc[idx]
        for event_id, score in user_events.items():
            if score > 0:  # Only consider events with interactions
                recommended_events[event_id] = recommended_events.get(event_id, 0) + score
    
    # Rank events by total score
    top_events = sorted(recommended_events.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    event_ids = [event[0] for event in top_events]
    recommended_df = events_df[events_df['Event ID'].isin(event_ids)][['Event ID', 'Title']].copy()
    recommended_df['Score'] = [recommended_events[event_id] for event_id in recommended_df['Event ID']]
    recommended_df['Normalized Score'] = normalize_scores(recommended_df['Score'])

    return recommended_df.sort_values('Normalized Score', ascending=False).to_dict(orient='records')

# Hybrid Recommendation Logic
def hybrid_recommendation(user_id, num_recommendations=20):
    """Combines collaborative filtering and content-based filtering."""
    # Collaborative Filtering Scores
    collaborative_recs = collaborative_recommend(user_id, num_recommendations)
    if "error" in collaborative_recs:
        return content_based_recommend(user_id, num_recommendations)
    
    collaborative_scores = {rec['Event ID']: rec['Normalized Score'] for rec in collaborative_recs}
    
    # Content-Based Filtering Scores
    content_recs = content_based_recommend(user_id, num_recommendations)
    content_scores = {rec['Event ID']: rec['Normalized Score'] for rec in content_recs}
    
    # Combine Scores (weighted average)
    combined_scores = {}
    for event_id in set(collaborative_scores.keys()).union(content_scores.keys()):
        combined_scores[event_id] = (
            0.8 * collaborative_scores.get(event_id, 0) +
            0.2 * content_scores.get(event_id, 0)
        )
    
    # Rank by combined scores
    top_events = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    recommended_events = events_df[events_df['Event ID'].isin(dict(top_events).keys())][['Event ID', 'Title']].copy()
    recommended_events['Score'] = [combined_scores[event_id] for event_id in recommended_events['Event ID']]

    return recommended_events.sort_values('Score', ascending=False).to_dict(orient='records')


# Flask API for Recommendations
app = Flask(__name__)

@app.route('/recommend', methods=['GET'])
def recommend_route():
    user_id = request.args.get('user_id')
    num_recommendations = int(request.args.get('n', 5))
    return jsonify(content_based_recommend(user_id, num_recommendations))

@app.route('/collaborative_recommend', methods=['GET'])
def collaborative_recommend_route():
    user_id = request.args.get('user_id')
    num_recommendations = int(request.args.get('n', 5))
    return jsonify(collaborative_recommend(user_id, num_recommendations))

@app.route('/hybrid_recommend', methods=['GET'])
def hybrid_recommend_route():
    user_id = request.args.get('user_id')
    num_recommendations = int(request.args.get('n', 5))
    return jsonify(hybrid_recommendation(user_id, num_recommendations))


# Performance Evaluation
def evaluate_recommendations():
    # Split interactions into train/test sets (e.g., 80% train, 20% test)
    train_size = int(len(interactions_df) * 0.8)
    train_interactions = interactions_df.iloc[:train_size]
    test_interactions = interactions_df.iloc[train_size:]

    # Simulate recommendations for test users
    test_user_ids = test_interactions['User ID'].unique()

    # Initialize metrics for each method
    metrics = {
        "content_based": {"precision": [], "recall": [], "f1_score": []},
        "collaborative": {"precision": [], "recall": [], "f1_score": []},
        "hybrid": {"precision": [], "recall": [], "f1_score": []},
    }

    def calculate_metrics(actual, recommended):
        """Helper to calculate precision, recall, and F1 score."""
        true_positives = len(actual & recommended)
        precision = true_positives / len(recommended) if recommended else 0
        recall = true_positives / len(actual) if actual else 0
        f1_score = 2 * (precision * recall) / (precision + recall) if (precision + recall) > 0 else 0
        return precision, recall, f1_score

    for user_id in test_user_ids:
        actual_events = set(test_interactions[test_interactions['User ID'] == user_id]['Event ID'])

        # Evaluate Content-Based Filtering
        cb_recommended = content_based_recommend(user_id=user_id, num_recommendations=5)
        cb_recommended_ids = set([rec['Event ID'] for rec in cb_recommended])
        precision, recall, f1 = calculate_metrics(actual_events, cb_recommended_ids)
        metrics["content_based"]["precision"].append(precision)
        metrics["content_based"]["recall"].append(recall)
        metrics["content_based"]["f1_score"].append(f1)

        # Evaluate Collaborative Filtering
        cf_recommended = collaborative_recommend(user_id=user_id, num_recommendations=5)
        cf_recommended_ids = set([rec['Event ID'] for rec in cf_recommended])
        precision, recall, f1 = calculate_metrics(actual_events, cf_recommended_ids)
        metrics["collaborative"]["precision"].append(precision)
        metrics["collaborative"]["recall"].append(recall)
        metrics["collaborative"]["f1_score"].append(f1)

        # Evaluate Hybrid Approach
        hybrid_recommended = hybrid_recommendation(user_id=user_id, num_recommendations=5)
        hybrid_recommended_ids = set([rec['Event ID'] for rec in hybrid_recommended])
        precision, recall, f1 = calculate_metrics(actual_events, hybrid_recommended_ids)
        metrics["hybrid"]["precision"].append(precision)
        metrics["hybrid"]["recall"].append(recall)
        metrics["hybrid"]["f1_score"].append(f1)

    # Calculate average scores for each method
    avg_metrics = {method: {metric: np.mean(scores) for metric, scores in method_metrics.items()}
                   for method, method_metrics in metrics.items()}

    return avg_metrics

def normalize_scores(scores):
    """Normalizes a list of scores using min-max normalization."""
    min_score = min(scores)
    max_score = max(scores)
    return [(score - min_score) / (max_score - min_score) for score in scores]


# Run the Flask app
if __name__ == '__main__':
    print("Evaluating system performance...")
    metrics = evaluate_recommendations()
    print(f"Content-Based Precision: {metrics['content_based']['precision']:.2f}, "
      f"Recall: {metrics['content_based']['recall']:.2f}, "
      f"F1-Score: {metrics['content_based']['f1_score']:.2f}")

    print(f"Collaborative Filtering Precision: {metrics['collaborative']['precision']:.2f}, "
      f"Recall: {metrics['collaborative']['recall']:.2f}, "
      f"F1-Score: {metrics['collaborative']['f1_score']:.2f}")

    print(f"Hybrid Method Precision: {metrics['hybrid']['precision']:.2f}, "
      f"Recall: {metrics['hybrid']['recall']:.2f}, "
      f"F1-Score: {metrics['hybrid']['f1_score']:.2f}")
    app.run(debug=True)
'''