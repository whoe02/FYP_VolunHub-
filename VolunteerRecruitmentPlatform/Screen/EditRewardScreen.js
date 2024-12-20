import React, { useState, useEffect, useMemo } from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { firestore } from '../firebaseConfig';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import * as ImagePicker from 'expo-image-picker';
import InputField from '../components/InputField';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

const EditRewardScreen = ({ route, navigation }) => {
  const { rewardId } = route.params;
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newImageUri, setNewImageUri] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [remainingStock, setRemainingStock] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState(null);
  const [showPicker, setShowPicker] = useState({ visible: false, mode: 'date', pickerType: '' });

  const formatDate = (date) => (date instanceof Date ? date.toLocaleDateString() : 'Select Date');

  useEffect(() => {
    const fetchRewardData = async () => {
      setLoading(true);
      try {
        const rewardDocRef = doc(firestore, 'Rewards', rewardId);
        const rewardDoc = await getDoc(rewardDocRef);
        if (rewardDoc.exists()) {
          const rewardData = rewardDoc.data();
          setReward(rewardData);
          setTitle(rewardData.title);
          setDescription(rewardData.description);
          setPointsRequired(rewardData.pointsRequired.toString());
          setRemainingStock(rewardData.remainingStock.toString());
          setRewardType(rewardData.type);

          const fetchedDate = rewardData.date ? new Date(rewardData.date) : null;
          setStartDate(fetchedDate);
          setDate(fetchedDate ? fetchedDate.toISOString().split('T')[0] : '');
        } else {
          Alert.alert('Error', 'Reward not found');
        }
      } catch (error) {
        Alert.alert('Error', 'Failed to load reward data');
        console.error('Error fetching reward data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRewardData();
  }, [rewardId]);

  const openPicker = (type, mode) => {
    setShowPicker({ visible: true, mode, pickerType: type });
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        setNewImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick an image');
    }
  };

  const handleDeleteReward = async () => {
    Alert.alert(
      'Delete Reward',
      'Are you sure you want to delete this reward?',
      [
        { text: 'Cancel' },
        {
          text: 'Delete',
          onPress: async () => {
            setLoading(true);
            try {
              const rewardDocRef = doc(firestore, 'Rewards', rewardId);
              await deleteDoc(rewardDocRef);
              Alert.alert('Success', 'Reward deleted successfully');
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete reward');
              console.error('Error deleting reward:', error);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const uploadImageToCloudinary = async (localUri) => {
    const formData = new FormData();
    formData.append('file', {
      uri: localUri,
      name: 'reward_image.jpg',
      type: 'image/jpeg',
    });
    formData.append('upload_preset', 'rewardqr');
    formData.append('cloud_name', 'dnj0n4m7k');
    formData.append('folder', 'rewardPic');

    try {
      const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      return data.secure_url; // Return the uploaded image's URL
    } catch (error) {
      console.error('Error uploading image to Cloudinary:', error);
      Alert.alert('Error', 'Failed to upload image');
      throw error;
    }
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

  const handleUpdateReward = async () => {
    if (!title || !description || !pointsRequired || !remainingStock || !rewardType || !date) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const rewardDocRef = doc(firestore, 'Rewards', rewardId);
      let imageUrl = reward.imageVoucher || '';
      if (newImageUri) {
        imageUrl = await uploadImageToCloudinary(newImageUri);
      }

      const updatedReward = {
        title,
        description,
        pointsRequired: parseInt(pointsRequired),
        imageVoucher: imageUrl,
        remainingStock: parseInt(remainingStock),
        type: rewardType,
        date,
      };

      await updateDoc(rewardDocRef, updatedReward);
      Alert.alert('Success', 'Reward updated successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to update reward');
      console.error('Error updating reward:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !reward) {
    return <ActivityIndicator size="large" color="#6a8a6d" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
        <Image
          source={{ uri: newImageUri || reward.imageVoucher || 'https://via.placeholder.com/150' }}
          style={styles.rewardImage}
        />
        <Text style={styles.changeImageText}>Change Image</Text>
      </TouchableOpacity>

      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title:</Text>
        <InputField
          value={title}
          onChangeText={setTitle}
          placeholder="Enter Reward Title"
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description:</Text>
        <InputField
          value={description}
          onChangeText={setDescription}
          placeholder="Enter Reward Description"
          multiline
        />
      </View>

      {/* Points Required Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Points Required:</Text>
        <InputField
          value={pointsRequired}
          onChangeText={setPointsRequired}
          keyboardType="numeric"
          placeholder="Enter Points Required"
        />
      </View>

      {/* Remaining Stock Input */}
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

      {/* Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity onPress={handleUpdateReward} style={styles.updateButton}>
          <Text style={styles.buttonText}>Update Reward</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={handleDeleteReward} style={styles.deleteButton}>
          <Text style={styles.buttonText}>Delete Reward</Text>
        </TouchableOpacity>
      </View>

      {/* Cancel Button */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.cancelButton}>
        <Text style={styles.buttonText}>Cancel</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 30,
    backgroundColor: '#fff',
  },
  imagePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  rewardImage: {
    width: 150,
    height: 150,
    borderRadius: 8,
    marginBottom: 10,
    borderRadius: 75,
  },
  changeImageText: {
    color: '#6a8a6d',
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  picker: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  updateButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
  },
  cancelButton: {
    backgroundColor: '#ccc',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
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

export default EditRewardScreen;
