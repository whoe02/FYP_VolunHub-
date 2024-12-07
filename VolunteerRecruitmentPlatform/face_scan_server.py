import cv2
import pickle
import numpy as np
import os
from flask import Flask, request, jsonify
from deepface import DeepFace  # Import DeepFace

app = Flask(__name__)

# Ensure 'data' directory exists
os.makedirs('data', exist_ok=True)

@app.route('/start_capture', methods=['POST'])
def start_capture():
    try:
        if 'image0' not in request.files:
            return jsonify({'success': False, 'message': 'No images uploaded'}), 400

        name = request.form.get('name')  # Retrieve the name
        files = [file for key, file in request.files.items()]
        faces_data = []
        names_data = []

        # Validate if name already exists
        names_file_path = 'data/names_data.pkl'
        if os.path.exists(names_file_path):
            with open(names_file_path, 'rb') as f:
                existing_names = pickle.load(f)
            if name in existing_names:
                return jsonify({'success': False, 'message': f"The name '{name}' already exists. Please use a different name."}), 400

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

        # Save face data and names
        save_face_data(np.array(faces_data), names_data)

        return jsonify({'success': True, 'message': 'Faces detected and stored successfully', 'count': len(faces_data)})

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
