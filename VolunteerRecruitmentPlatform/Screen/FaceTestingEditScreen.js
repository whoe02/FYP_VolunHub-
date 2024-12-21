import React, { useState, useRef,useEffect  } from 'react';
import { StyleSheet, Text, View, Alert, ActivityIndicator,TouchableOpacity,Dimensions } from 'react-native';
import { CameraView } from 'expo-camera';
import { ProgressBar } from 'react-native-paper'; // Importing ProgressBar
import Button from '../components/Button';
import Ionicons from 'react-native-vector-icons/Ionicons';

const { width, height } = Dimensions.get('window');
const CIRCLE_SIZE = width * 0.8;

const FaceTestingScreen = ({ route,navigation  }) => {
  const [capturedImages, setCapturedImages] = useState([]);
  const [picturesTaken, setPicturesTaken] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const cameraRef = useRef(null);
  const picturesTakenRef = useRef(0);
  const { email, onComplete } = route.params;

  const cropRegion = {
    x: (width - CIRCLE_SIZE) / (2 * width),
    y: (height * 0.35 - CIRCLE_SIZE / 2) / height,
    width: CIRCLE_SIZE / width,
    height: CIRCLE_SIZE / width,
  };

  // Function to take a single picture silently
  const takePicture = async () => {
    if (!cameraRef.current || !isCameraReady) {
      return null;
    }
  
    try {
      console.log(`Taking picture ${picturesTakenRef.current + 1}...`);
      const picture = await cameraRef.current.takePictureAsync({
        base64: true,
        quality: 1,
        skipProcessing: false,
        // Add camera options for cropping
        ratio: "1:1", // Ensure square aspect ratio
        exif: false,
      });
  
      if (picture.base64) {
        setPicturesTaken((prev) => prev + 1);
        picturesTakenRef.current += 1;
        return picture.base64;
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
    const tempCapturedImages = [];
    setCapturedImages([]);
    setPicturesTaken(0);
    picturesTakenRef.current = 0;
  
    const captureInterval = setInterval(async () => {
      if (picturesTakenRef.current < 10) {
        const base64Image = await takePicture();
  
        if (base64Image) {
          tempCapturedImages.push(base64Image);
        }
      } else {
        clearInterval(captureInterval);
        setIsCapturing(false);
  
        setCapturedImages(tempCapturedImages);
  
        if (tempCapturedImages.length === 10) {
          uploadCapturedImages(email, tempCapturedImages);
        } else {
          console.error(
            'Captured images count mismatch:',
            tempCapturedImages.length
          );
          Alert.alert('Error', 'Failed to capture the required number of images.');
        }
      }
    }, 1500);
  };

  // Function to upload captured images
  const uploadCapturedImages = async (email, images) => {
    if (!images || images.length === 0) {
      Alert.alert('Error', 'No images to upload.');
      return;
    }
  
    setIsUploading(true);
  
    const formData = new FormData();
    formData.append('email', email);
  
    images.forEach((image, index) => {
      formData.append(`image${index}`, {
        uri: `data:image/jpeg;base64,${image}`,
        name: `image${index}.jpg`,
        type: 'image/jpeg',
      });
    });
  
    try {
      const response = await fetch('https://fair-casual-garfish.ngrok-free.app/edit_face_data', {
        method: 'POST',
        headers: { 'Content-Type': 'multipart/form-data' },
        body: formData,
      });
  
      const result = await response.json();
      if (result.success) {
        onComplete(true);
        Alert.alert('Success', result.message);
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
      '1. Keep your face centered in the camera view.\n' +
      '2. Ensure that your forehead is visible in the frame.\n' + 
      '3. Rotate your head slowly in all directions.\n' +
      '4. Avoid covering your face or changing expressions too much.\n' +
      '5. Ensure proper lighting for better results.',
      [{ text: 'Got it!' }]
    );
  };
  

  return (
    <View style={styles.container}>
      <View style={styles.cameraContainer}>
        <CameraView
          style={styles.camera}
          ref={cameraRef}
          facing="front"
          onCameraReady={() => setIsCameraReady(true)}
          // Add camera props for cropping
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

      <View style={styles.guideContainer}>
        <Text style={styles.guideText}>Position your face within the circle</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.headerRow}>
          <Text style={styles.pictureCountText}>
            Progress Face Data...
          </Text>
          <TouchableOpacity onPress={showHelp}>
            <Ionicons name="help-circle-outline" size={25} color="#6a8a6d" />
          </TouchableOpacity>
        </View>
        <ProgressBar
          progress={picturesTaken / 10}
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
});

export default FaceTestingScreen;

