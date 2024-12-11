import cv2
import pickle
import numpy as np
import os
from flask import Flask, request, jsonify
from deepface import DeepFace
from sklearn.neighbors import KNeighborsClassifier


app = Flask(__name__)

# Ensure 'data' directory exists
os.makedirs('data', exist_ok=True)

# Global variables for storing face data and names
faces_data = []
names_data = []

# Initialize the KNN model
knn = None

# Function to extract face embeddings using DeepFace
def extract_face_embedding(image):
    # Extract face embeddings using DeepFace (can use other models too like VGG, Facenet)
    embedding = DeepFace.represent(image, model_name="VGG-Face", enforce_detection=False)
    return embedding[0]['embedding']

@app.route('/start_capture', methods=['POST'])
def start_capture():
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
            if name in existing_names:
                return jsonify({'success': False, 'message': f"The email - '{name}' already exists. Please use a different email."}), 400

        for file in files:
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            if img is None:
                return jsonify({'success': False, 'message': 'Invalid image file'}), 400

            try:
                faces = DeepFace.extract_faces(img, enforce_detection=False)

                if len(faces) > 1:
                    return jsonify({'success': False, 'message': 'Multiple faces detected. Please provide one face per image.'}), 400

                for face in faces:
                    face_image = face['face']
                    if face_image.dtype == np.float64:
                        face_image = (face_image * 255).astype(np.uint8)

                    # Extract the face embedding and store it
                    face_embedding = extract_face_embedding(face_image)
                    faces_data.append(face_embedding)
                    names_data.append(name)  # Store the name corresponding to the face

            except Exception as e:
                return jsonify({'success': False, 'message': 'Error during face detection'}), 500

        if not faces_data:
            return jsonify({'success': False, 'message': 'No valid faces detected'}), 400

        return jsonify({'success': True, 'message': 'Faces data captured successfully', 'count': len(faces_data)})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    global faces_data, names_data

    try:
        if not faces_data or not names_data:
            return jsonify({'success': False, 'message': 'No valid face data captured'}), 400

        # Save face data and names
        save_face_data(np.array(faces_data), names_data)

        # Train and save the updated KNN model
        train_knn_model()

        return jsonify({'success': True, 'message': 'Registered successfully and model updated!'})

    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    global knn

    if knn is None:
        return jsonify({'success': False, 'message': 'KNN model is not available. Please register users first.'}), 500

    try:

        # Load uploaded image
        file = request.files['image']
        file_bytes = np.frombuffer(file.read(), np.uint8)
        uploaded_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        faces = DeepFace.extract_faces(uploaded_image, enforce_detection=False)
        if len(faces) != 1:
            return jsonify({'success': False, 'message': 'Please provide an image with exactly one face.'}), 400

        # Extract face embedding
        face_image = faces[0]['face']
        if face_image.dtype == np.float64:
            face_image = (face_image * 255).astype(np.uint8)
        face_embedding = extract_face_embedding(face_image)

        # Predict using KNN
        predicted_label = knn.predict([face_embedding])
        distances, indices = knn.kneighbors([face_embedding])
        min_distance = distances[0][0]
        print(min_distance)
        # Set a threshold for attendance marking
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
