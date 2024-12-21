import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert,Dimensions,TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import Button from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

const FaceRecognitionScreen = ({ route, navigation }) => {
  const { email, onComplete } = route.params; // Email and callback passed from the previous screen
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

// Calculate the crop region based on the circle position
  const cropRegion = {
    x: (width - CIRCLE_SIZE) / (2 * width),
    y: (height * 0.35 - CIRCLE_SIZE / 2) / height,
    width: CIRCLE_SIZE / width,
    height: CIRCLE_SIZE / width,
  };

  // Function to take a single picture
  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Error', 'Camera is not ready.');
      return;
    }

    try {
      const picture = await cameraRef.current.takePictureAsync({
        base64: true, // Capture image as a Base64 string
        quality: 1,
        skipProcessing: true,
        // Add camera options for cropping
        ratio: "1:1", // Ensure square aspect ratio
        exif: false,
      });

      if (picture.base64) {
        uploadImage(email, picture.base64); // Upload the captured image
      } else {
        Alert.alert('Error', 'Failed to capture image.');
      }
    } catch (error) {
      console.error('Error capturing image:', error);
      Alert.alert('Error', 'An unexpected error occurred while taking the picture.');
    }
  };

  // Function to upload the captured image
  const uploadImage = async (email, imageBase64) => {
    setIsUploading(true);

    const formData = new FormData();
    formData.append('email', email);
    formData.append('image', {
      uri: `data:image/jpeg;base64,${imageBase64}`,
      name: 'face.jpg',
      type: 'image/jpeg',
    });

    try {
      // Update the endpoint to use `mark_attendance`
      const response = await fetch('https://fair-casual-garfish.ngrok-free.app/mark_attendance', {
      // const response = await fetch('http://192.168.0.12:5000/mark_attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });

      const result = await response.json();

      if (result.success) {
        // Handle successful attendance marking
        Alert.alert('Success', 'Face is matched! Attendance marked successfully.');
        onComplete(true); // Callback to notify success
        navigation.goBack(); // Navigate back
      } else {
        // Handle failure cases
        Alert.alert('Error', result.message || 'Face recognition failed.');
        onComplete(false);
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload the image.');
      onComplete(false);
    } finally {
      setIsUploading(false);
    }
  };

    const showHelp = () => {
      Alert.alert(
        'How to Scan Your Face',
        '1. Keep your face centered in the camera view.\n' +
        '2. Ensure that your forehead is visible in the frame.\n' + 
        '3. Avoid covering your face or changing expressions too much.\n' +
        '4. Ensure proper lighting for better results.',
        [{ text: 'Got it!' }]
      );
    };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="front" // Use the front camera for selfies
          onCameraReady={() => setIsCameraReady(true)}
          ratio="1:1"
          zoom={0}
          autoFocus={true}
        />
        {/* Semi-transparent overlay with circular cutout */}
        <View style={styles.overlay}>
          <View style={styles.transparentCircle} />
        </View>
        {/* Guide circle */}
        <View style={styles.circleGuide} />
      </View>
      <View style={{display:'flex',flexDirection: 'row',alignItems:'center',marginTop:20}}>
        <View style={{marginRight:5}}>
          <Text style={styles.guideText}>Position your face within the circle</Text>
        </View>
        <TouchableOpacity onPress={showHelp}>
            <Ionicons name="help-circle-outline" size={28} color="#6a8a6d" />
        </TouchableOpacity>
      </View>

      {isUploading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button
          icon="camera"
          title="Snap"
          onPress={takePicture}
          style={styles.snapButton}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  cameraContainer: {
    width: CIRCLE_SIZE,  // Match the circle size
    height: CIRCLE_SIZE, // Make it square
    position: 'relative',
    overflow: 'hidden',
    borderRadius: CIRCLE_SIZE / 2,
    marginTop: 50,
  },
  camera: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  transparentCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    backgroundColor: 'transparent',
  },
  circleGuide: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 3,
    borderColor: '#4CAF50',
    borderStyle: 'dashed',
  },
  guideContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: 20,
  },
  guideText: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  pictureCountText: {
    fontSize: 16,
  },
  captureButton: {
    marginTop: 20,
  },
  captureMessage: {
    fontSize: 18,
    color: 'gray',
    marginTop: 20,
  },
  snapButton: {
    marginBottom: 20,
    width: '80%',
  },
});

export default FaceRecognitionScreen;
