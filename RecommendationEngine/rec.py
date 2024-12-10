import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix
import firebase_admin
from firebase_admin import credentials, firestore

app = Flask(__name__)

# Initialize Firebase app
cred = credentials.Certificate("C:/Users/jxche/OneDrive/Documents/FYP_VolunHub-/RecommendationEngine/test-e6569-firebase-adminsdk-2pshh-c356a436fc.json")
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

# Fetch events, users, and interactions data from Firestore
def fetch_firestore_data():
    events_ref = db.collection('Event')
    events = events_ref.stream()
    events_data = []
    for event in events:
        events_data.append(event.to_dict())
    return events_data

def fetch_users_data():
    users_ref = db.collection('User')
    users = users_ref.stream()
    users_data = []
    for user in users:
        users_data.append(user.to_dict())
    return users_data

def fetch_interactions_data():
    interactions_ref = db.collection('Interactions')
    interactions = interactions_ref.stream()
    interactions_data = []
    for interaction in interactions:
        interactions_data.append(interaction.to_dict())
    return interactions_data


# Load data from Firestore
events_data = fetch_firestore_data()
users_data = fetch_users_data()
interactions_data = fetch_interactions_data()

# Convert to DataFrame
events_df = pd.DataFrame(events_data)
users_df = pd.DataFrame(users_data)
interactions_df = pd.DataFrame(interactions_data)

# Preprocessing Functions
def preprocess_text(df, column):
    """Combines multiple textual columns into a single feature."""
    df[column] = df['preferences'].fillna('').astype(str) + ' ' + \
                 df['skills'].fillna('').astype(str) + ' ' + \
                 df['location'].fillna('').astype(str)
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
interactions_df['Interaction'] = interactions_df['type'].map(interaction_weights)
# Aggregate duplicate (User ID, Event ID) entries
interactions_df = interactions_df.groupby(['userId', 'eventId'], as_index=False).agg({
    'Interaction': 'sum'  # You can use 'mean' or another aggregation function if preferred
})

# Build User-Item Interaction Matrix for Collaborative Filtering
interaction_matrix = interactions_df.pivot(index='userId', columns='eventId', values='Interaction').fillna(0)
interaction_matrix_csr = csr_matrix(interaction_matrix.values)

# KNN Collaborative Filtering Setup
knn = NearestNeighbors(n_neighbors=20, metric='cosine', algorithm='auto')
knn.fit(interaction_matrix_csr)  # Fit KNN model to the interaction matrix

# Recommendation Logic
def content_based_recommend(user_id, num_recommendations=20):
    """Provides content-based recommendations."""
    user = users_df[users_df['userId'] == user_id]
    if user.empty:
        return {"error": "User not found"}
    
    # Create user profile based on preferences and skills
    user_features = user['preference'].fillna('').astype(str) + ' ' + \
                    user['skills'].fillna('').astype(str) + ' ' + \
                    user['location'].fillna('').astype(str)
    user_tfidf = vectorizer.transform(user_features)
    
    # Compute cosine similarity between user profile and event TF-IDF matrix
    cosine_sim = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    
    # Rank events by similarity
    event_indices = cosine_sim.argsort()[-num_recommendations:][::-1]
    recommended_events = events_df.iloc[event_indices][['eventId', 'title']].copy()
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
    recommended_df = events_df[events_df['eventId'].isin(event_ids)][['eventId', 'title']].copy()
    recommended_df['Score'] = [recommended_events[event_id] for event_id in recommended_df['eventId']]
    recommended_df['Normalized Score'] = normalize_scores(recommended_df['Score'])

    return recommended_df.sort_values('Normalized Score', ascending=False).to_dict(orient='records')

# Hybrid Recommendation Logic
def hybrid_recommendation(user_id, num_recommendations=20):
    """Combines collaborative filtering and content-based filtering."""
    # Collaborative Filtering Scores
    collaborative_recs = collaborative_recommend(user_id, num_recommendations)
    if "error" in collaborative_recs:
        return content_based_recommend(user_id, num_recommendations)
    
    collaborative_scores = {rec['eventId']: rec['Normalized Score'] for rec in collaborative_recs}
    
    # Content-Based Filtering Scores
    content_recs = content_based_recommend(user_id, num_recommendations)
    content_scores = {rec['eventId']: rec['Normalized Score'] for rec in content_recs}
    
    # Combine Scores (weighted average)
    combined_scores = {}
    for event_id in set(collaborative_scores.keys()).union(content_scores.keys()):
        combined_scores[event_id] = (
            0.8 * collaborative_scores.get(event_id, 0) +
            0.2 * content_scores.get(event_id, 0)
        )
    
    # Rank by combined scores
    top_events = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    recommended_events = events_df[events_df['eventId'].isin(dict(top_events).keys())][['eventId', 'title']].copy()
    recommended_events['Score'] = [combined_scores[event_id] for event_id in recommended_events['eventId']]

    return recommended_events.sort_values('Score', ascending=False).to_dict(orient='records')


# Flask API for Recommendations


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
    print('hi')
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
    test_user_ids = test_interactions['userId'].unique()

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
        actual_events = set(test_interactions[test_interactions['userId'] == user_id]['eventId'])

        # Evaluate Content-Based Filtering
        cb_recommended = content_based_recommend(user_id=user_id, num_recommendations=5)
        cb_recommended_ids = set([rec['eventId'] for rec in cb_recommended])
        precision, recall, f1 = calculate_metrics(actual_events, cb_recommended_ids)
        metrics["content_based"]["precision"].append(precision)
        metrics["content_based"]["recall"].append(recall)
        metrics["content_based"]["f1_score"].append(f1)

        # Evaluate Collaborative Filtering
        cf_recommended = collaborative_recommend(user_id=user_id, num_recommendations=5)
        cf_recommended_ids = set([rec['eventId'] for rec in cf_recommended])
        precision, recall, f1 = calculate_metrics(actual_events, cf_recommended_ids)
        metrics["collaborative"]["precision"].append(precision)
        metrics["collaborative"]["recall"].append(recall)
        metrics["collaborative"]["f1_score"].append(f1)

        # Evaluate Hybrid Approach
        hybrid_recommended = hybrid_recommendation(user_id=user_id, num_recommendations=5)
        hybrid_recommended_ids = set([rec['eventId'] for rec in hybrid_recommended])
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
    
    # If all scores are the same, return a list of zeros or ones (since there's no variation)
    if max_score == min_score:
        return [0 for _ in scores]  # or you can return [1 for _ in scores] depending on your preference
    
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
    app.run(host='0.0.0.0', port=5000, debug=True)

