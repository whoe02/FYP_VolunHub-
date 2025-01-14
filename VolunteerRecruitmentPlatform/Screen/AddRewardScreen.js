import React, { useState, useEffect,useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { firestore } from '../firebaseConfig';
import { doc, setDoc, collection, getDocs ,query, orderBy, limit} from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import InputField from '../components/InputField'; // Import InputField component
import { Picker } from '@react-native-picker/picker'; // Import Picker for dropdown
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddRewardScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [remainingStock, setRemainingStock] = useState('');
  const [rewardType, setRewardType] = useState('Discount');  
  const [date, setDate] = useState('');
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showPicker, setShowPicker] = useState({ visible: false, mode: 'date', pickerType: '' });
  const [startDate, setStartDate] = useState(null);
  const formatDate = (date) => (date instanceof Date ? date.toLocaleDateString() : 'Select Date');

  // Function to handle image picking
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const selectedImageUri = result.assets[0].uri;
        setNewImageUri(selectedImageUri);
      } else {
        console.log('Image selection canceled or no assets found');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image');
      console.error('Image picker error:', error);
    }
  };

  const uploadToCloudinary = async (uri) => {
    try {
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/jpeg',
        name: `reward_${Date.now()}.jpg`,
      });
      formData.append('upload_preset', 'rewardqr');
      formData.append('cloud_name', 'dnj0n4m7k');
      formData.append('folder', 'rewardPic');

      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      if (response.data.secure_url) {
        return response.data.secure_url;
      } else {
        throw new Error('Cloudinary did not return a secure URL');
      }
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      throw error;
    }
  };

  const generateRewardId = async () => {
    try {
      // Reference to the user's rewards collection
      const userRewardsRef = collection(firestore, 'Rewards');
      const rewardsSnapshot = await getDocs(userRewardsRef);
  
      let maxId = 0;
  
      // Loop through each reward document to find the highest ID
      rewardsSnapshot.forEach((doc) => {
        const docId = doc.id; // e.g., "RWD00001"
        const numericPart = parseInt(docId.replace('RW', ''), 10); // Extract numeric part
        if (numericPart > maxId) {
          maxId = numericPart;
        }
      });
  
      // Generate the next ID by incrementing the highest found ID
      const newId = `RW${(maxId + 1).toString().padStart(5, '0')}`;
      return newId;
    } catch (error) {
      console.error('Error generating new reward ID:', error);
      throw new Error('Could not generate a new reward ID.');
    }
  };
  
  const handleAddReward = async () => {
    // Validate inputs
    if (!title || !description || !pointsRequired || !remainingStock || !rewardType) {
      Alert.alert('Validation Error', 'All fields are required.');
      return;
    }

    if (!newImageUri) {
      Alert.alert('Validation Error', 'Please select an image for the reward.');
      return;
    }

    // Validate remainingStock
    const remainingStockInt = parseInt(remainingStock, 10);
    if (isNaN(remainingStockInt) || remainingStockInt <= 0) {
      Alert.alert('Validation Error', 'Remaining stock must be a valid positive number.');
      return;
    }

    setLoading(true); // Show loading spinner
    try {
      const rewardId = await generateRewardId(); // Generate a new Reward ID
      const cloudinaryUrl = await uploadToCloudinary(newImageUri); // Upload the image

      const newReward = {
        rewardId,
        title,
        description,
        pointsRequired: parseInt(pointsRequired, 10),
        imageVoucher: cloudinaryUrl,
        remainingStock: remainingStockInt,
        type: rewardType,
        date,
      };

      const rewardDocRef = doc(firestore, 'Rewards', rewardId); // Reference for Firestore document
      await setDoc(rewardDocRef, newReward); // Save reward to Firestore

      Alert.alert('Success', 'Reward added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add reward. Please try again.');
      console.error('Error adding reward:', error);
    } finally {
      setLoading(false); // Hide loading spinner
    }
  };

  const openPicker = (type, mode) => {
    setShowPicker({ visible: true, mode, pickerType: type });
  };

  const handlePickerChange = (event, selectedValue) => {
    setShowPicker({ ...showPicker, visible: false });
    if (selectedValue) {
      const newValue = new Date(selectedValue); // Ensure it's a Date object
      if (showPicker.pickerType === 'startDate') setStartDate(newValue);
      setDate(newValue ? newValue.toISOString().split('T')[0] : ''); // Save in YYYY-MM-DD format
    }
  };
  
  const pickerValue = useMemo(() => {
    if (showPicker.pickerType === 'startDate') return startDate || new Date();
    return new Date(); // Default to current date/time
  }, [showPicker.pickerType, startDate]);
  
  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need media library permissions to select an image.');
      }
    })();
  }, []);

  // Render loading spinner
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6a8a6d" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image Picker */}
      <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
        <Image
          source={newImageUri ? { uri: newImageUri } : require('../assets/img/prof.png')}
          style={styles.rewardImage}
        />
        <Text style={styles.changeImageText}>Pick Image</Text>
      </TouchableOpacity>

      {/* Reward Input Fields */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title:</Text>
        <InputField
          value={title}
          onChangeText={setTitle}
          placeholder="Enter Reward Title"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description:</Text>
        <InputField
          value={description}
          onChangeText={setDescription}
          placeholder="Enter Reward Description"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Points Required:</Text>
        <InputField
          value={pointsRequired}
          onChangeText={setPointsRequired}
          keyboardType="numeric"
          placeholder="Enter Points Required"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Remaining Stock:</Text>
        <InputField
          value={remainingStock}
          onChangeText={setRemainingStock}
          keyboardType="numeric"
          placeholder="Enter Remaining Stock"
        />
      </View>

      {/* Reward Type Dropdown */}
      <View style={styles.dropdown}>
        <Text style={styles.inputLabel}>Reward Type:</Text>
        <Picker
          selectedValue={rewardType}
          onValueChange={(itemValue) => setRewardType(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Discount" value="Discount" />
          <Picker.Item label="Gift" value="Gift" />
          <Picker.Item label="Shipping" value="Shipping" />
          <Picker.Item label="Other" value="Other" />
        </Picker>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Expired Date:</Text>
        {/* Start Date Picker */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="calendar-outline" size={20} color="#666" style={{marginRight:10}} />
          <TouchableOpacity onPress={() => openPicker('startDate', 'date')}>
            <Text style={styles.datePickerText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Conditional Picker */}
      {showPicker.visible && (
        <DateTimePicker
          value={pickerValue}
          mode={showPicker.mode}
          display="default"
          onChange={handlePickerChange}
        />
      )}

      {/* Save Button */}
      <TouchableOpacity onPress={handleAddReward} style={styles.saveButton}>
        <Text style={styles.saveButtonText}>Save Reward</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardImage: {
    width: 150,
    height: 150,
    borderRadius: 75,
    marginBottom: 10,
  },
  changeImageText: {
    fontSize: 16,
    color: '#6a8a6d',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    height: 50,
    width: '100%',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
  },
  saveButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 15,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    color: '#fff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    marginBottom: 20,
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
  },
  pickerButtonStyle:{
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 15,
    marginBottom: 10,
  }
});

export default AddRewardScreen;
