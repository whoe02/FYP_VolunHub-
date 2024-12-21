import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.neighbors import NearestNeighbors
from scipy.sparse import csr_matrix
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

# CSV file paths (update with your actual file paths)
events_csv_path = 'test_events.csv'
users_csv_path = 'test_users.csv'
interactions_csv_path = 'test_user_interactions.csv'

# Read data from CSV files
def read_csv_data(file_path):
    """Reads data from a CSV file and returns a pandas DataFrame."""
    try:
        return pd.read_csv(file_path)
    except Exception as e:
        return {"error": f"Error reading CSV file: {str(e)}"}

def fetch_events_data():
    return read_csv_data(events_csv_path)

def fetch_users_data():
    return read_csv_data(users_csv_path)

def fetch_interactions_data():
    return read_csv_data(interactions_csv_path)

def get_upcoming_events(events_df):
    """Filters and returns upcoming events based on the 'Status' column."""
    return events_df[events_df['Status'] == 'upcoming']  # Assuming 'Status' column marks upcoming events

def get_historical_events(events_df):
    """Filters and returns historical events based on the 'Status' column."""
    return events_df[events_df['Status'] != 'upcoming']  # Assuming any event that's not 'upcoming' is historical


# Preprocessing Functions
def preprocess_text(df, column):
    """Combines multiple textual columns into a single feature."""
    df[column] = df['Preferences'].fillna('').astype(str) + ' ' + \
                 df['Skills Required'].fillna('').astype(str) + ' ' + \
                 df['Location'].fillna('').astype(str)
    return df

def normalize_scores(scores):
    """Normalizes a list of scores using min-max normalization."""
    min_score = min(scores)
    max_score = max(scores)
    if max_score == min_score:
        return [0 for _ in scores]
    return [(score - min_score) / (max_score - min_score) for score in scores]

# Recommendation Functions
def content_based_recommend(user_id, num_recommendations=20):
    """Provides content-based recommendations with only upcoming events."""
    # Fetch all events and filter for upcoming events
    events_df = fetch_events_data()
    upcoming_events = get_upcoming_events(events_df)  # Filter for upcoming events
    
    # Fetch users and interactions data
    users_df = fetch_users_data()
    interactions_df = fetch_interactions_data()

    # Preprocess events data to create content features
    upcoming_events = preprocess_text(upcoming_events, 'content_features')

    # Vectorize the content features using TF-IDF
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(upcoming_events['content_features'])

    # Get user data and make sure the user exists
    user = users_df[users_df['User ID'] == user_id]
    if user.empty:
        return {"error": "User not found"}

    # Prepare the user’s features (Preferences, Skills, Location)
    user_features = user['Preferences'].fillna('').astype(str) + ' ' + \
                    user['Skills'].fillna('').astype(str) + ' ' + \
                    user['Location'].fillna('').astype(str)
    user_tfidf = vectorizer.transform(user_features)

    # Compute cosine similarity between the user and all events
    cosine_sim = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    if cosine_sim.sum() == 0:
        return []  # Poor recommendation quality, return empty

    # Sort the events by similarity and select top recommendations
    event_indices = cosine_sim.argsort()[-num_recommendations:][::-1]
    recommended_events = upcoming_events.iloc[event_indices][['Event ID', 'Title']].copy()
    
    # Add the similarity score and normalize it
    recommended_events['Score'] = cosine_sim[event_indices]
    recommended_events['Normalized Score'] = normalize_scores(recommended_events['Score'])

    return recommended_events.to_dict(orient='records')


from datetime import datetime, timedelta

def collaborative_recommend(user_id, num_recommendations=20):
    """Generates collaborative recommendations using KNN with interactions from the last week."""
    interactions_df = fetch_interactions_data()
    events_df = fetch_events_data()
    upcoming_events = get_upcoming_events(events_df)
    
    # Filter interactions to include only upcoming events
    interactions_df = interactions_df[interactions_df['Event ID'].isin(upcoming_events['Event ID'])]
    
        # Adjust to parse ISO-8601 timestamps
    try:
        interactions_df['Timestamp'] = pd.to_datetime(interactions_df['Timestamp'])
    except Exception as e:
        return {"error": f"Failed to parse timestamps: {str(e)}"}
    # Restrict interactions to the last 1 week
    one_week_ago = datetime.now() - timedelta(days=7)
    interactions_df = interactions_df[interactions_df['Timestamp'] >= one_week_ago]
    
    # Check if there are any interactions within the last week
    if interactions_df.empty:
        return {"error": "No interactions in the last week."}
    
    interaction_weights = {
        'view': 0.5,
        'review': 2,
        'watchlisted': 3,
        'enquiry': 4,
        'apply': 5
    }
    
    interactions_df['Interaction'] = interactions_df['Type'].map(interaction_weights)
    interactions_df = interactions_df.groupby(['User ID', 'Event ID'], as_index=False).agg({'Interaction': 'sum'})

    interaction_matrix = interactions_df.pivot(index='User ID', columns='Event ID', values='Interaction').fillna(0)
    interaction_matrix_csr = csr_matrix(interaction_matrix.values)

    if user_id not in interaction_matrix.index:
        return {"error": "User not found"}

    knn = NearestNeighbors(n_neighbors=20, metric='cosine', algorithm='auto')
    knn.fit(interaction_matrix_csr)
    user_idx = interaction_matrix.index.get_loc(user_id)
    user_interactions = interaction_matrix_csr[user_idx].reshape(1, -1)

    distances, indices = knn.kneighbors(user_interactions, n_neighbors=num_recommendations)
    recommended_events = {}
    for idx in indices.flatten():
        user_events = interaction_matrix.iloc[idx]
        for event_id, score in user_events.items():
            if score > 0:
                recommended_events[event_id] = recommended_events.get(event_id, 0) + score

    top_events = sorted(recommended_events.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    event_ids = [event[0] for event in top_events]
    recommended_df = events_df[events_df['Event ID'].isin(event_ids)][['Event ID', 'Title']].copy()
    recommended_df['Score'] = [recommended_events[event_id] for event_id in recommended_df['Event ID']]
    recommended_df['Normalized Score'] = normalize_scores(recommended_df['Score'])

    return recommended_df.sort_values('Normalized Score', ascending=False).to_dict(orient='records')


def popularity_based_recommendation(num_recommendations=10):
    """Provides popularity-based recommendations from upcoming events."""
    interactions_df = fetch_interactions_data()
    events_df = fetch_events_data()
    upcoming_events = get_upcoming_events(events_df)
    
    # Filter interactions to include only those related to upcoming events
    interactions_df = interactions_df[interactions_df['Event ID'].isin(upcoming_events['Event ID'])]

    # Adjust to parse ISO-8601 timestamps
    try:
        interactions_df['Timestamp'] = pd.to_datetime(interactions_df['Timestamp'])
    except Exception as e:
        return {"error": f"Failed to parse timestamps: {str(e)}"}

    one_week_ago = datetime.now() - timedelta(days=21)  # Adjusted to 21 days as per your code
    recent_interactions = interactions_df[interactions_df['Timestamp'] >= one_week_ago]

    # Get the popularity of events based on the number of interactions
    popular_events = recent_interactions.groupby('Event ID').size().sort_values(ascending=False).head(num_recommendations)
    popular_event_ids = popular_events.index.tolist()

    # Get event details for the popular events
    recommended_events = events_df[events_df['Event ID'].isin(popular_event_ids)][['Event ID', 'Title']]

    # Add the popularity score to the recommended events
    recommended_events['Score'] = recommended_events['Event ID'].map(popular_events.to_dict())

    # Order by the popularity score
    recommended_events = recommended_events.sort_values('Score', ascending=False)

    return recommended_events[['Event ID', 'Title', 'Score']].to_dict(orient='records')



def hybrid_recommendation(user_id, num_recommendations=20):
    """Combines collaborative and content-based recommendations."""
    collaborative_recs = collaborative_recommend(user_id, num_recommendations)
    if "error" in collaborative_recs:
        return content_based_recommend(user_id, num_recommendations)

    collaborative_scores = {rec['Event ID']: rec['Normalized Score'] for rec in collaborative_recs}
    content_recs = content_based_recommend(user_id, num_recommendations)
    content_scores = {rec['Event ID']: rec['Normalized Score'] for rec in content_recs}

    combined_scores = {}
    for event_id in set(collaborative_scores.keys()).union(content_scores.keys()):
        combined_scores[event_id] = (
            0.8 * collaborative_scores.get(event_id, 0) +
            0.2 * content_scores.get(event_id, 0)
        )

    top_events = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    events_df = fetch_events_data()
    recommended_events = events_df[events_df['Event ID'].isin(dict(top_events).keys())][['Event ID', 'Title']].copy()
    recommended_events['Score'] = [combined_scores[event_id] for event_id in recommended_events['Event ID']]

    return recommended_events.sort_values('Score', ascending=False).to_dict(orient='records')

# Flask API Routes
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

@app.route('/popularity_recommend', methods=['GET'])
def popularity_recommend_route():
    num_recommendations = int(request.args.get('n', 5))
    return jsonify(popularity_based_recommendation(num_recommendations))

@app.route('/hybrid_recommend', methods=['GET'])
def hybrid_recommend_route():
    user_id = request.args.get('user_id')
    num_recommendations = int(request.args.get('n', 5))
    return jsonify(hybrid_recommendation(user_id, num_recommendations))


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
