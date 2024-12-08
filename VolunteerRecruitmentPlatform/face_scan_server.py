import cv2
import pickle
import numpy as np
import os
from flask import Flask, request, jsonify
from deepface import DeepFace  # Import DeepFace

app = Flask(__name__)

# Ensure 'data' directory exists
os.makedirs('data', exist_ok=True)

# Global variables for storing face data and names
faces_data = []
names_data = []

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

                print(f"Found {len(faces)} faces in the current image using DeepFace.")

                if len(faces) > 1:
                    return jsonify({'success': False, 'message': 'Multiple faces detected. Please provide one face per image.'}), 400

                for face in faces:
                    face_image = face['face']

                    print(f"Processing face with shape: {face_image.shape} and dtype: {face_image.dtype}")

                    if face_image.dtype == np.float64:
                        face_image = (face_image * 255).astype(np.uint8)

                    resized_img = cv2.resize(face_image, (50, 50))
                    grayscale_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2GRAY)
                    flattened_face = grayscale_img.flatten()

                    if flattened_face.size == 2500:  # Ensure consistent dimensions
                        faces_data.append(flattened_face)
                        names_data.append(name)  # Store the name corresponding to the face
                    else:
                        print(f"Skipping face with inconsistent dimensions: {flattened_face.size}")

            except Exception as e:
                print(f"Error during face detection: {e}")
                return jsonify({'success': False, 'message': 'Error during face detection'}), 500

        if not faces_data:
            return jsonify({'success': False, 'message': 'No valid faces detected'}), 400

        return jsonify({'success': True, 'message': 'Faces data captured successfully', 'count': len(faces_data)})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/register', methods=['POST'])
def register():
    global faces_data, names_data

    try:
        # Check if faces_data and names_data are not empty
        if not faces_data or not names_data:
            return jsonify({'success': False, 'message': 'No valid face data captured'}), 400

        # Save face data and names
        save_face_data(np.array(faces_data), names_data)

        return jsonify({'success': True, 'message': 'Registered successfully'})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


@app.route('/mark_attendance', methods=['POST'])
def mark_attendance():
    try:
        if 'image' not in request.files:
            return jsonify({'success': False, 'message': 'No image uploaded'}), 400

        email = request.form.get('email')  # Email passed from the client
        file = request.files['image']
        file_bytes = np.frombuffer(file.read(), np.uint8)
        img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

        if img is None:
            return jsonify({'success': False, 'message': 'Invalid image file'}), 400

        # Check if the email exists in names_data.pkl
        names_file_path = 'data/names_data.pkl'
        if not os.path.exists(names_file_path):
            return jsonify({'success': False, 'message': 'No registered users found'}), 400

        with open(names_file_path, 'rb') as f:
            registered_names = pickle.load(f)

        print("Registered Emails:", registered_names)
        print("email email:", email)
        if email not in registered_names:
            return jsonify({'success': False, 'message': 'Email not found in registered users'}), 404

        # Extract faces from the image
        try:
            faces = DeepFace.extract_faces(img, enforce_detection=False)

            if len(faces) != 1:
                return jsonify({'success': False, 'message': 'Invalid number of faces detected. Please provide a clear image with one face.'}), 400

            face_image = faces[0]['face']
            if face_image.dtype == np.float64:
                face_image = (face_image * 255).astype(np.uint8)

            # Resize and preprocess the face image
            resized_img = cv2.resize(face_image, (50, 50))
            grayscale_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2GRAY)
            flattened_face = grayscale_img.flatten()

        except Exception as e:
            print(f"Error during face detection: {e}")
            return jsonify({'success': False, 'message': 'Error during face detection'}), 500

        # Load stored face data
        faces_file_path = 'data/faces_data.pkl'
        with open(faces_file_path, 'rb') as f:
            registered_faces = pickle.load(f)

        # Get the index of the email in names_data
        email_index = registered_names.index(email)
        stored_face = registered_faces[email_index]

        # Compare the captured face with the stored face
        similarity = np.linalg.norm(stored_face - flattened_face)
        threshold = 60  # Adjust this threshold as needed
        print("smiliarty",similarity)
        print("threshold",threshold)
        if similarity < threshold:
            return jsonify({'success': True, 'message': 'Attendance marked successfully!'})
        else:
            return jsonify({'success': False, 'message': 'Face verification failed. Try again.'}), 400

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500

def save_face_data(faces_data, names_data):
    faces_file_path = 'data/faces_data.pkl'
    names_file_path = 'data/names_data.pkl'

    if os.path.exists(faces_file_path) and os.path.exists(names_file_path):
        # Load existing data
        with open(faces_file_path, 'rb') as f:
            existing_faces = pickle.load(f)
        with open(names_file_path, 'rb') as f:
            existing_names = pickle.load(f)

        # Append new data
        existing_faces = np.concatenate((existing_faces, faces_data), axis=0)
        existing_names.extend(names_data)
    else:
        # Initialize new data
        existing_faces = faces_data
        existing_names = names_data

    # Save updated data
    with open(faces_file_path, 'wb') as f:
        pickle.dump(existing_faces, f)
    with open(names_file_path, 'wb') as f:
        pickle.dump(existing_names, f)

    print("✅ Face data and names stored successfully.")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
