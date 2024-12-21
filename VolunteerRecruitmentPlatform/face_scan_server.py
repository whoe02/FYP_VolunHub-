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

# Function to extract face embedding using DeepFace
def extract_face_embedding(image):
    embedding = DeepFace.represent(image, model_name="VGG-Face", enforce_detection=False)
    if embedding:
        return embedding[0]['embedding']
    return None

# Function to check if a valid face is detected using OpenCV's Haar Cascade
def detect_face_using_opencv(image):
    # Load pre-trained face detection model (Haar Cascade or DNN model)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

    # Convert the image to grayscale for better face detection
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)

    # Detect faces
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.1, minNeighbors=5, minSize=(30, 30))

    return faces

# Function to check if the face is valid (face size and other properties)
def is_valid_face(face_image):
    # Check for minimum face size (50x50 or greater)
    if face_image.shape[0] < 50 or face_image.shape[1] < 50:
        return False
    return True

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
                print(existing_names)
            if name in existing_names:
                return jsonify({'success': False, 'message': f"The email - '{name}' already exists. Please use a different email."}), 400

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
                print('valid face',valid_faces_count)
            except Exception as e:
                return jsonify({'success': False, 'message': f'Error during face detection: {str(e)}'}), 500

        # If less than 6 valid faces are detected, return an error
        if valid_faces_count < 4:
            return jsonify({'success': False, 'message': 'Insufficient valid faces detected. Please upload more images with clear faces.'}), 400

        # Return success after storing enough valid data
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

                if len(faces) > 1:
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

        # Load uploaded image
        file = request.files['image']
        file_bytes = np.frombuffer(file.read(), np.uint8)
        uploaded_image = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        faces = DeepFace.extract_faces(uploaded_image, enforce_detection=False)
        if len(faces) != 1:
            return jsonify({'success': False, 'message': 'Please provide snap with exactly one face.'}), 400

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