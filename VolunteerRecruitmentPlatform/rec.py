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
import cv2
import pickle
import os
from deepface import DeepFace
from sklearn.neighbors import KNeighborsClassifier

app = Flask(__name__)
CORS(app)
os.makedirs('data', exist_ok=True)
# Initialize Firebase app
cred = credentials.Certificate("test-e6569-firebase-adminsdk-2pshh-c356a436fc.json")
firebase_admin.initialize_app(cred)

# Global variables for storing face data and names
faces_data = []
names_data = []

# Initialize the KNN model
knn = None

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

def extract_face_embedding(image):
    embedding = DeepFace.represent(image, model_name="VGG-Face", enforce_detection=False)
    if embedding:
        return embedding[0]['embedding']
    return None

def detect_face_using_opencv(image):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Convert the image to grayscale for better face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    return faces

def is_valid_face(face_image):
    if face_image.shape[0] < 50 or face_image.shape[1] < 50:
        return False
    return True

@app.route('/start_capture', methods=['POST'])
def start_capture():
    global faces_data, names_data

    try:
        if 'image0' not in request.files:
            return jsonify({'success': False, 'message': 'No images uploaded'}), 400

        name = request.form.get('email')  
        files = [file for key, file in request.files.items()]

        faces_data = []
        names_data = []

        names_file_path = 'data/names_data.pkl'
        if os.path.exists(names_file_path):
            with open(names_file_path, 'rb') as f:
                existing_names = pickle.load(f)
                print(existing_names)
            if name in existing_names:
                return jsonify({'success': False, 'message': f"The email - '{name}' already exists. Please use a different email."}), 400

        valid_faces_count = 0

        for file in files:
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            if img is None:
                return jsonify({'success': False, 'message': 'Invalid image file'}), 400

            faces_opencv = detect_face_using_opencv(img)
            if len(faces_opencv) == 0:
                print("Step 1")
                continue  

            try:
                faces = DeepFace.extract_faces(img, enforce_detection=False)

                if len(faces) == 0:
                    continue  
                elif len(faces) > 1:
                    print("Multiple faces detected in an image. Skipping this image...")
                    continue  
                for face in faces:
                    face_image = face['face']

                    if not is_valid_face(face_image):
                        print("Step 3")
                        continue  

                    face_embedding = extract_face_embedding(face_image)
                    if face_embedding is None:
                        print("Step 4")
                        continue  # Skip if embedding extraction failed

                    faces_data.append(face_embedding)
                    names_data.append(name) 
                    
                    valid_faces_count += 1
                print('valid face',valid_faces_count)
            except Exception as e:
                return jsonify({'success': False, 'message': f'Error during face detection: {str(e)}'}), 500

        if valid_faces_count < 4:
            return jsonify({'success': False, 'message': 'Insufficient valid faces detected. Please upload more images with clear faces.'}), 400

        return jsonify({'success': True, 'message': 'Faces data captured successfully'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/edit_face_data', methods=['POST'])
def edit_face_data():
    global faces_data, names_data

    try:
        if 'image0' not in request.files:
            return jsonify({'success': False, 'message': 'No images uploaded'}), 400

        name = request.form.get('email')  # Retrieve the name
        files = [file for key, file in request.files.items()]

        # Clear the previous faces_data and names_data
        faces_data = []
        names_data = []

        # Validate if name already exists
        names_file_path = 'data/names_data.pkl'
        if os.path.exists(names_file_path):
            with open(names_file_path, 'rb') as f:
                existing_names = pickle.load(f)
            if name not in existing_names:
                return jsonify({'success': False, 'message': f"The email - '{name}' does not exist. Please contact admin."}), 400

        # Track the number of valid faces
        valid_faces_count = 0

        for file in files:
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            if img is None:
                return jsonify({'success': False, 'message': 'Invalid image file'}), 400

            # Step 1: Detect faces using OpenCV
            faces_opencv = detect_face_using_opencv(img)
            if len(faces_opencv) == 0:
                print("Step 1")
                continue  # No face detected, skip this image

            try:
                # Step 2: Extract faces using DeepFace
                faces = DeepFace.extract_faces(img, enforce_detection=False)

                if len(faces) == 0:
                    continue  # No face detected after DeepFace extraction, skip this image
                elif len(faces) > 1:
                    print("Multiple faces detected in an image. Skipping this image...")
                    continue  # Skip images with multiple faces

                for face in faces:
                    face_image = face['face']
                    if face_image.dtype == np.float64:
                        face_image = (face_image * 255).astype(np.uint8)

                    # Step 3: Check if the face is valid (face size and properties)
                    if not is_valid_face(face_image):
                        print("Step 3")
                        continue  # Skip invalid face (too small)

                    # Extract the face embedding and store it
                    face_embedding = extract_face_embedding(face_image)
                    if face_embedding is None:
                        print("Step 4")
                        continue  # Skip if embedding extraction failed

                    faces_data.append(face_embedding)
                    names_data.append(name)  # Store the name corresponding to the face

                    # Increment the valid face count
                    valid_faces_count += 1
                    print(valid_faces_count)
            except Exception as e:
                return jsonify({'success': False, 'message': 'Error during face detection'}), 500

        # If less than 8 valid faces are detected, return an error
        if valid_faces_count < 4:
            return jsonify({'success': False, 'message': 'Please make sure to follow the guidelines for face data collecting!'}), 400

        # Return success after storing enough valid data
        return jsonify({'success': True, 'message': 'Faces data captured successfully'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    global faces_data, names_data

    try:
        if not faces_data or not names_data:
            return jsonify({'success': False, 'message': 'No data captured please add the face follow by guild'}), 400

        # Save face data and names
        save_face_data(np.array(faces_data), names_data)

        # Train and save the updated KNN model
        train_knn_model()

        return jsonify({'success': True, 'message': 'Face registered successfully !'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

#edit face data
@app.route('/confirmEditFace', methods=['POST'])
def confirm_edit_face():
    global faces_data, names_data

    try:
        if not faces_data or not names_data:
            return jsonify({'success': True, 'message': 'No face data to update, success.'}), 200

        # email = request.form.get('email')  # Get the email from the request
        email = request.json.get('email')
        if not email:
            return jsonify({'success': False, 'message': 'Email is required'}), 400

        # Paths to pickle files
        face_file_path = 'data/faces_data.pkl'
        name_file_path = 'data/names_data.pkl'

        # Load existing data
        existing_faces = []
        existing_names = []
        if os.path.exists(face_file_path) and os.path.exists(name_file_path):
            with open(face_file_path, 'rb') as f:
                existing_faces = pickle.load(f)
            with open(name_file_path, 'rb') as f:
                existing_names = pickle.load(f)

        # Ensure email exists in the data
        if email not in existing_names:
            return jsonify({'success': False, 'message': f"No data found for email: {email}"}), 400

        # Remove old data for the email
        indices_to_keep = [i for i, name in enumerate(existing_names) if name != email]
        updated_faces = [existing_faces[i] for i in indices_to_keep]
        updated_names = [existing_names[i] for i in indices_to_keep]

        # Add new data (captured in memory)
        updated_faces.extend(faces_data)  # Add new face embeddings
        updated_names.extend(names_data)  # Add corresponding names

        # Save updated data back to pickle files
        with open(face_file_path, 'wb') as f:
            pickle.dump(updated_faces, f)
        with open(name_file_path, 'wb') as f:
            pickle.dump(updated_names, f)

        # Train and save the updated KNN model
        train_knn_model()

        return jsonify({'success': True, 'message': 'Face data updated successfully !'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    global knn

    if knn is None:
        return jsonify({'success': False, 'message': 'Error during mark attendance please contact the organization !'}), 500

    try:
        file = request.files['image']
        file_bytes = np.frombuffer(file.read(), np.uint8)
        uploaded_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        faces = DeepFace.extract_faces(uploaded_image, enforce_detection=False)
        if len(faces) != 1:
            return jsonify({'success': False, 'message': 'Please provide snap with exactly one face.'}), 400

        face_image = faces[0]['face']
        if face_image.dtype == np.float64:
            face_image = (face_image * 255).astype(np.uint8)
        face_embedding = extract_face_embedding(face_image)

        predicted_label = knn.predict([face_embedding])
        distances, indices = knn.kneighbors([face_embedding])
        min_distance = distances[0][0]
        print(min_distance)
        threshold = 0.57
        if min_distance < threshold:
            predicted_name = predicted_label[0]
            return jsonify({'success': True, 'message': f"Attendance marked successfully for {predicted_name}!"})
        else:
            return jsonify({'success': False, 'message': 'Face not recognized. Distance too large.'}), 400

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

def save_face_data(faces_data, names_data):
    faces_file_path = 'data/faces_data.pkl'
    names_file_path = 'data/names_data.pkl'

    if os.path.exists(faces_file_path) and os.path.exists(names_file_path):
        with open(faces_file_path, 'rb') as f:
            existing_faces = pickle.load(f)
        with open(names_file_path, 'rb') as f:
            existing_names = pickle.load(f)

        existing_faces = np.concatenate((existing_faces, faces_data), axis=0)
        existing_names.extend(names_data)
    else:
        existing_faces = faces_data
        existing_names = names_data

    with open(faces_file_path, 'wb') as f:
        pickle.dump(existing_faces, f)
    with open(names_file_path, 'wb') as f:
        pickle.dump(existing_names, f)

    print("✅ Face data and names stored successfully.")

def train_knn_model():
    global knn

    try:
        with open('data/faces_data.pkl', 'rb') as f:
            faces = pickle.load(f)
        with open('data/names_data.pkl', 'rb') as f:
            labels = pickle.load(f)

        knn = KNeighborsClassifier(n_neighbors=5)
        knn.fit(faces, labels)

        with open('data/faces_knn.pkl', 'wb') as f:
            pickle.dump(knn, f)

        print("✅ KNN model trained and saved successfully.")

    except Exception as e:
        print(f"Error during KNN training: {e}")

# Load the KNN model at startup
try:
    with open('data/faces_knn.pkl', 'rb') as f:
        knn = pickle.load(f)
    print("✅ KNN model loaded successfully.")
except FileNotFoundError:
    print("⚠️ No KNN model found. Train the model first by registering users.")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
