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
        # Ensure images are included in the request
        if 'image0' not in request.files:
            return jsonify({'success': False, 'message': 'No images uploaded'}), 400

        files = [file for key, file in request.files.items()]
        faces_data = []

        for file in files:
            # Read image as numpy array
            file_bytes = np.frombuffer(file.read(), np.uint8)
            img = cv2.imdecode(file_bytes, cv2.IMREAD_COLOR)

            if img is None:
                return jsonify({'success': False, 'message': 'Invalid image file'}), 400

            try:
                # Extract faces using DeepFace with enforce_detection=False
                faces = DeepFace.extract_faces(img, enforce_detection=False)

                print(f"Found {len(faces)} faces in the current image using DeepFace.")

                for i, face in enumerate(faces):
                    face_image = face['face']

                    print(f"Processing face {i + 1}/{len(faces)} with shape: {face_image.shape} and dtype: {face_image.dtype}")

                    # Check if the face image is float64, convert to uint8
                    if face_image.dtype == np.float64:
                        face_image = (face_image * 255).astype(np.uint8)

                    # Resize the face to 50x50
                    resized_img = cv2.resize(face_image, (50, 50))

                    # Convert resized image to grayscale for consistency
                    grayscale_img = cv2.cvtColor(resized_img, cv2.COLOR_BGR2GRAY)

                    # Flatten the grayscale image to a 1D array
                    flattened_face = grayscale_img.flatten()

                    # Ensure flattened_face has consistent dimensions
                    if flattened_face.size == 2500:  # 50x50 = 2500
                        faces_data.append(flattened_face)
                    else:
                        print(f"Skipping face with inconsistent dimensions: {flattened_face.size}")

            except Exception as e:
                print(f"Error during face detection: {e}")
                return jsonify({'success': False, 'message': 'Error during face detection'}), 500

        if not faces_data:
            return jsonify({'success': False, 'message': 'No faces detected'}), 400

        # Ensure all face data has the same number of dimensions (flattened 1D arrays)
        faces_data = np.array(faces_data)

        # Save faces data to a pickle file
        save_face_data(faces_data)

        return jsonify({'success': True, 'message': 'Faces detected and stored successfully', 'count': len(faces_data)})

    except Exception as e:
        print(f"Error: {e}")
        return jsonify({'success': False, 'message': str(e)}), 500


def save_face_data(faces_data):
    faces_file_path = 'data/faces_data.pkl'

    # If file does not exist, create and save new data
    if not os.path.exists(faces_file_path):
        with open(faces_file_path, 'wb') as f:
            pickle.dump(faces_data, f)
        print("✅ Face data stored successfully in 'faces_data.pkl' (new file created).")
    else:
        # Append new face data to existing data
        with open(faces_file_path, 'rb') as f:
            existing_faces = pickle.load(f)

        existing_faces = np.concatenate((existing_faces, faces_data), axis=0)

        with open(faces_file_path, 'wb') as f:
            pickle.dump(existing_faces, f)
        print("✅ Face data appended successfully to 'faces_data.pkl'.")


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
