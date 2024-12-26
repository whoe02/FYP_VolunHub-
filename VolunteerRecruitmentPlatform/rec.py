import pandas as pd
import firebase_admin
from firebase_admin import credentials, firestore
from flask import Flask, request, jsonify
from flask_cors import CORS
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors
from datetime import datetime, timedelta
from scipy.sparse import csr_matrix

app = Flask(__name__)
CORS(app)

# Initialize Firebase app
cred = credentials.Certificate("test-e6569-firebase-adminsdk-2pshh-c356a436fc.json")
firebase_admin.initialize_app(cred)

# Firestore client
db = firestore.client()

# Firestore Collections
events_collection = db.collection('Event')
users_collection = db.collection('User')
interactions_collection = db.collection('Interactions')

# Fetch data from Firestore
def fetch_events_data():
    try:
        events_ref = events_collection.stream()
        events = [{"eventId": event.id, **event.to_dict()} for event in events_ref]
        return events
    except Exception as e:
        return {"error": f"Error fetching events data: {str(e)}"}

def fetch_users_data():
    try:
        users_ref = users_collection.stream()
        users = [{"User ID": user.id, **user.to_dict()} for user in users_ref]
        return users
    except Exception as e:
        return {"error": f"Error fetching users data: {str(e)}"}

def fetch_interactions_data():
    try:
        interactions_ref = interactions_collection.stream()
        interactions = [{"User ID": interaction.id, **interaction.to_dict()} for interaction in interactions_ref]
        return interactions
    except Exception as e:
        return {"error": f"Error fetching interactions data: {str(e)}"}




def preprocess_text(df, column):
    """Combines multiple textual columns into a single feature."""
    df['preferences'] = df['preferences'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x))
    df['skills'] = df['skills'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x))
    df['location'] = df['location'].apply(lambda x: ' '.join(x) if isinstance(x, list) else str(x))
    
    df[column] = df['preferences'].fillna('') + ' ' + \
                 df['skills'].fillna('') + ' ' + \
                 df['location'].fillna('')
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
    users_df = fetch_users_data()
    # Convert upcoming_events to a DataFrame
    upcoming_events_df = pd.DataFrame(upcoming_events)
    
    # Fetch users and interactions data
    users_df = pd.DataFrame(users_df)

    # Preprocess events data to create content features
    upcoming_events_df = preprocess_text(upcoming_events_df, 'content_features')

    # Vectorize the content features using TF-IDF
    vectorizer = TfidfVectorizer(stop_words='english')
    tfidf_matrix = vectorizer.fit_transform(upcoming_events_df['content_features'])

    # Get user data and make sure the user exists
    user = users_df[users_df['User ID'] == user_id]
    if user.empty:
        return []

    # Prepare the user’s features (Preferences, Skills, Location)
    user_features = user['preference'].fillna('').astype(str) + ' ' + \
                    user['skills'].fillna('').astype(str) + ' ' + \
                    user['location'].fillna('').astype(str)
    user_tfidf = vectorizer.transform(user_features)

    # Compute cosine similarity between the user and all events
    cosine_sim = cosine_similarity(user_tfidf, tfidf_matrix).flatten()
    if cosine_sim.sum() == 0:
        return []  # Poor recommendation quality, return empty

    # Sort the events by similarity and select top recommendations
    event_indices = cosine_sim.argsort()[-num_recommendations:][::-1]
    recommended_events = upcoming_events_df.iloc[event_indices][['eventId', 'title']].copy()
    
    # Add the similarity score and normalize it
    recommended_events['Score'] = cosine_sim[event_indices]
    recommended_events['Score'] = normalize_scores(recommended_events['Score'])

    return recommended_events.to_dict(orient='records')



from datetime import datetime, timedelta

def collaborative_recommend(user_id, num_recommendations=20):
    """Generates collaborative recommendations using KNN with interactions from the last week."""
    interactions_df = fetch_interactions_data()
    events_df = fetch_events_data()
    upcoming_events = get_upcoming_events(events_df)
    events_df = pd.DataFrame(events_df)
    interactions_df = pd.DataFrame(interactions_df)
    upcoming_events = pd.DataFrame(upcoming_events)

    # Filter interactions to include only upcoming events
    interactions_df = interactions_df[interactions_df['eventId'].isin(upcoming_events['eventId'])]

    try:
        interactions_df['timestamp'] = pd.to_datetime(interactions_df['timestamp'])
    except Exception as e:
        return {"error": f"Failed to parse timestamps: {str(e)}"}

    # Restrict interactions to the last week
    interactions_df['timestamp'] = interactions_df['timestamp'].dt.tz_localize(None)
    one_week_ago = datetime.now() - timedelta(days=28)
    interactions_df = interactions_df[interactions_df['timestamp'] >= one_week_ago]

    # Check if there are any interactions within the last week
    if interactions_df.empty:
        return []

    # Map interaction weights and aggregate scores
    interaction_weights = {
        'view': 0.5,
        'review': 2,
        'watchlisted': 3,
        'enquiry': 4,
        'apply': 5
    }
    interactions_df['Interaction'] = interactions_df['type'].map(interaction_weights)
    interactions_df = interactions_df.groupby(['userId', 'eventId'], as_index=False).agg({'Interaction': 'sum'})

    # Create user-event interaction matrix
    interaction_matrix = interactions_df.pivot(index='userId', columns='eventId', values='Interaction').fillna(0)
    interaction_matrix_csr = csr_matrix(interaction_matrix.values)

    if user_id not in interaction_matrix.index:
        return []

    # Print similar users
    similarity_df = calculate_user_similarity(interactions_df)
    similar_users = get_similar_users(user_id, similarity_df, top_n=5)
    print(f"Top 5 similar users to {user_id}: {similar_users}")

    # KNN-based recommendations
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
    # Return an empty list if no recommendations exist
    if not recommended_events:
        return []
    # Get top event recommendations
    top_events = sorted(recommended_events.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    event_ids = [event[0] for event in top_events]
    recommended_df = events_df[events_df['eventId'].isin(event_ids)][['eventId', 'title']].copy()
    recommended_df['Score'] = [recommended_events[event_id] for event_id in recommended_df['eventId']]
    recommended_df['Score'] = normalize_scores(recommended_df['Score'])
    # Return an empty list if normalized scores are too low
    if recommended_df['Score'].max() < 0.1:
        return []
    return recommended_df.sort_values('Score', ascending=False).to_dict(orient='records')


def popularity_based_recommendation(num_recommendations=10):
    """Provides popularity-based recommendations from upcoming events."""
    interactions_df = fetch_interactions_data()
    events_df = fetch_events_data()
    upcoming_events = get_upcoming_events(events_df)
    events_df = pd.DataFrame(events_df)
    interactions_df = pd.DataFrame(interactions_df)
    upcoming_events = pd.DataFrame(upcoming_events)
    # Filter interactions to include only those related to upcoming events
    interactions_df = interactions_df[interactions_df['eventId'].isin(upcoming_events['eventId'])]

    try:
        interactions_df['timestamp'] = pd.to_datetime(interactions_df['timestamp'])
    except Exception as e:
        return {"error": f"Failed to parse timestamps: {str(e)}"}
    interactions_df['timestamp'] = interactions_df['timestamp'].dt.tz_localize(None)
    one_week_ago = datetime.now() - timedelta(days=28)
    recent_interactions = interactions_df[interactions_df['timestamp'] >= one_week_ago]

    # Get the popularity of events based on the number of interactions
    popular_events = recent_interactions.groupby('eventId').size().sort_values(ascending=False).head(num_recommendations)
    popular_event_ids = popular_events.index.tolist()

    # Get event details for the popular events
    recommended_events = events_df[events_df['eventId'].isin(popular_event_ids)][['eventId', 'title']]

    # Add the popularity score to the recommended events
    recommended_events['Score'] = recommended_events['eventId'].map(popular_events.to_dict())

    # Order by the popularity score
    recommended_events = recommended_events.sort_values('Score', ascending=False)

    return recommended_events[['eventId', 'title', 'Score']].to_dict(orient='records')



def hybrid_recommendation(user_id, num_recommendations=20):
    """Combines collaborative and content-based recommendations."""
    collaborative_recs = collaborative_recommend(user_id, num_recommendations)
    if "error" in collaborative_recs:
        return content_based_recommend(user_id, num_recommendations)

    collaborative_scores = {rec['eventId']: rec['Normalized Score'] for rec in collaborative_recs}
    content_recs = content_based_recommend(user_id, num_recommendations)
    content_scores = {rec['eventId']: rec['Normalized Score'] for rec in content_recs}

    combined_scores = {}
    for event_id in set(collaborative_scores.keys()).union(content_scores.keys()):
        combined_scores[event_id] = (
            0.8 * collaborative_scores.get(event_id, 0) +
            0.2 * content_scores.get(event_id, 0)
        )

    top_events = sorted(combined_scores.items(), key=lambda x: x[1], reverse=True)[:num_recommendations]
    events_df = fetch_events_data()
    events_df = pd.DataFrame(events_df)
    recommended_events = events_df[events_df['eventId'].isin(dict(top_events).keys())][['eventId', 'title']].copy()
    recommended_events['Score'] = [combined_scores[event_id] for event_id in recommended_events['eventId']]

    return recommended_events.sort_values('Score', ascending=False).to_dict(orient='records')

def get_upcoming_events(events_df):
    """Filters and returns upcoming events based on the 'Status' column."""
    return [event for event in events_df if event['status'] == 'upcoming']

def get_historical_events(events_df):
    """Filters and returns historical events based on the 'Status' column."""
    return [event for event in events_df if event['status'] != 'upcoming']

def calculate_user_similarity(interactions_df):
    """
    Calculate the cosine similarity between users based on their event interactions.
    """
    # Create a user-event matrix (rows: users, columns: events)
    user_event_matrix = interactions_df.pivot_table(index='userId', columns='eventId', aggfunc='size', fill_value=0)
    
    # Calculate cosine similarity between users
    similarity_matrix = cosine_similarity(user_event_matrix)
    
    # Convert similarity matrix to DataFrame for easy lookup
    similarity_df = pd.DataFrame(similarity_matrix, index=user_event_matrix.index, columns=user_event_matrix.index)
    return similarity_df

def get_similar_users(user_id, similarity_df, top_n=5):
    """
    Get the most similar users to the given user based on the similarity matrix.
    """
    similar_users = similarity_df[user_id].sort_values(ascending=False).iloc[1:top_n+1]
    return similar_users.index.tolist()

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
