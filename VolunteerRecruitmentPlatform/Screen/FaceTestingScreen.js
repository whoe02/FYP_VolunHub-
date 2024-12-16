import React, { useState, useRef,useEffect  } from 'react';
import { StyleSheet, Text, View, Alert, ActivityIndicator,TouchableOpacity } from 'react-native';
import { CameraView } from 'expo-camera';
import { ProgressBar } from 'react-native-paper'; // Importing ProgressBar
import Button from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';

const FaceTestingScreen = ({ route,navigation  }) => {
  const [capturedImages, setCapturedImages] = useState([]);
  const [picturesTaken, setPicturesTaken] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const picturesTakenRef = useRef(0);
  const { email, onComplete } = route.params;

  // Function to take a single picture silently
  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      // console.log('Camera is not ready or ref not set.');
      return null;
    }
  
    try {
      console.log(`Taking picture ${picturesTakenRef.current + 1}...`);
      const picture = await cameraRef.current.takePictureAsync({
        base64: true,
        skipProcessing: true,
      });
  
      if (picture.base64) {
        setPicturesTaken((prev) => prev + 1);
        picturesTakenRef.current += 1;
        // console.log(`Picture ${picturesTakenRef.current} captured.`);
        return picture; // Return the captured picture
      } else {
        console.error('Failed to capture image.');
      }
    } catch (err) {
      console.error('Error while taking a picture:', err);
    }
    return null;
  };
  
  // Function to start auto-capture
  const startCapture = async () => {
    if (!isCameraReady) {
      Alert.alert('Camera is not ready yet.');
      return;
    }
  
    setIsCapturing(true);
    const tempCapturedImages = []; // Local array for synchronous tracking
    setCapturedImages([]); // Reset state for a new capture session
    setPicturesTaken(0);
    picturesTakenRef.current = 0;
  
    const captureInterval = setInterval(async () => {
      if (picturesTakenRef.current < 12) {
        const picture = await takePicture();
  
        if (picture) {
          tempCapturedImages.push(picture.base64); // Store in local array
          // console.log(`Stored image in local array. Count: ${tempCapturedImages.length}`);
        }
      } else {
        clearInterval(captureInterval);
        setIsCapturing(false);
  
        // Update state for UI purposes
        setCapturedImages(tempCapturedImages);
  
        // Directly pass the local array to the upload function
        if (tempCapturedImages.length === 12) {
          uploadCapturedImages(email, tempCapturedImages);
        } else {
          console.error(
            'Captured images count mismatch or no images found:',
            tempCapturedImages.length
          );
          Alert.alert('Error', 'Failed to capture the required number of images.');
        }
      }
    }, 1500); // Capture a picture every second
  };

  // Function to upload captured images
  const uploadCapturedImages = async (email,images) => {
    if (!images || images.length === 0) {
      Alert.alert('Error', 'No images to upload.');
      return;
    }
  
    setIsUploading(true);
  
    const formData = new FormData();
    formData.append('email', email); // add email to form data
  
    images.forEach((image, index) => {
      formData.append(`image${index}`, {
        uri: `data:image/jpeg;base64,${image}`,
        name: `image${index}.jpg`,
        type: 'image/jpeg',
      });
    });
  
    try {
      //const response = await fetch('http://192.168.100.31:5000/start_capture', {
      const response = await fetch('https://fair-casual-garfish.ngrok-free.app/start_capture', {
      // const response = await fetch('http://192.168.0.12:5000/start_capture', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
  
      const result = await response.json();
      if (result.success) {
        onComplete(true);
        Alert.alert('Success', result.message + ` (${result.count} faces detected)`);
        navigation.goBack();
      } else {
        Alert.alert('Error', result.message);
        onComplete(false);
      }
    } catch (error) {
      console.error('Error uploading images:', error);
      Alert.alert('Error', 'Failed to upload images.');
      onComplete(false);
    } finally {
      setIsUploading(false);
    }
  };
  
  const showHelp = () => {
    Alert.alert(
      'How to Scan Your Face',
      '1. Keep your face centered in the camera view.\n2. Rotate your head slowly in all directions.\n3. Avoid covering your face or changing expressions too much.\n4. Ensure proper lighting for better results.',
      [{ text: 'Got it!' }]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="front" // Use front camera for selfies
          onCameraReady={() => {
            // console.log('Camera ready');
            setIsCameraReady(true);
          }}
        />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom:20}}>
          <Text style={styles.pictureCountText}>
            {/* {picturesTaken} / 15 Pictures Taken */}
            Progress Face Data...
          </Text>
          <TouchableOpacity onPress={showHelp}>
              <Ionicons name="help-circle-outline" size={25} color="#6a8a6d" />
          </TouchableOpacity>
        </View>
        <ProgressBar
          progress={picturesTaken / 12 } 
          color="#4CAF50" 
          style={styles.progressBar}
        />
      </View>

      {isUploading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : !isCapturing ? (
        <Button
          icon="play-arrow"
          onPress={startCapture}
          style={styles.captureButton}
        />
      ) : (
        <Text style={styles.captureMessage}>Collecting Face Data...</Text>
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
    width: '100%',
    height: '70%',
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  progressContainer: {
    width: '80%',
    marginTop: 20,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
  },
  pictureCountText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 10,
  },
  captureButton: {
    marginTop: 20,
  },
  captureMessage: {
    fontSize: 18,
    color: 'gray',
    marginTop: 20,
  },
});

export default FaceTestingScreen;

