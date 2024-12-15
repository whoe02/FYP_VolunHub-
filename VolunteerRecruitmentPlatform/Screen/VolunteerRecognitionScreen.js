import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, ActivityIndicator, Alert } from 'react-native';
import { CameraView } from 'expo-camera';
import Button from '../components/Button';

const FaceRecognitionScreen = ({ route, navigation }) => {
  const { email, onComplete } = route.params; // Email and callback passed from the previous screen
  const cameraRef = useRef(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  // Function to take a single picture
  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      Alert.alert('Error', 'Camera is not ready.');
      return;
    }

    try {
      const picture = await cameraRef.current.takePictureAsync({
        base64: true, // Capture image as a Base64 string
        skipProcessing: true,
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
      const response = await fetch('https://fair-casual-garfish.ngrok-free.app/register', {
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

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="front" // Use the front camera for selfies
          onCameraReady={() => setIsCameraReady(true)}
        />
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
  },
  cameraContainer: {
    flex: 1,
    width: '100%',
  },
  camera: {
    flex: 1,
  },
  snapButton: {
    marginBottom: 20,
    width: '80%',
  },
});

export default FaceRecognitionScreen;
