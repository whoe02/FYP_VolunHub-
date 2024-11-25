import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase config
import { doc, setDoc, collection, getDocs } from 'firebase/firestore'; // Use doc and setDoc for custom document ID
import * as ImagePicker from 'expo-image-picker'; // For image picker functionality

const AddRewardScreen = ({ navigation }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [remainingStock, setRemainingStock] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [date, setDate] = useState('');
  const [newImageUri, setNewImageUri] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle image picker for adding reward image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setNewImageUri(result.uri);
    }
  };

  // Generate Reward ID based on the existing rewards count
  const generateRewardId = async () => {
    const rewardsRef = collection(firestore, 'Rewards');
    const rewardsSnapshot = await getDocs(rewardsRef);

    // Generate new Reward ID based on the number of rewards in the collection
    const newRewardId = `RW${(rewardsSnapshot.size + 1).toString().padStart(5, '0')}`;
    return newRewardId;
  };

  // Add new reward to Firestore with a custom document ID
  const handleAddReward = async () => {
    if (!title || !description || !pointsRequired || !remainingStock || !rewardType || !date) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const rewardId = await generateRewardId(); // Generate Reward ID before adding

      // Prepare the new reward data
      const newReward = {
        rewardId,
        title,
        description,
        pointsRequired: parseInt(pointsRequired),
        imageVoucher: newImageUri || '', // If no image is selected, use an empty string
        remainingStock: parseInt(remainingStock),
        type: rewardType,
        date,
      };

      // Get the reference to the custom document ID in the Rewards collection
      const rewardDocRef = doc(firestore, 'Rewards', rewardId); // Custom document ID: rewardId

      // Use setDoc() to add the new reward with the custom ID
      await setDoc(rewardDocRef, newReward);

      Alert.alert('Success', 'Reward added successfully');
      navigation.goBack();
    } catch (error) {
      Alert.alert('Error', 'Failed to add reward');
      console.error('Error adding reward:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#6a8a6d" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image picker */}
      <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
        <Image
          source={{ uri: newImageUri }}
          style={styles.rewardImage}
        />
        <Text style={styles.changeImageText}>Pick Image:</Text>
      </TouchableOpacity>

      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Reward Title"
          value={title}
          onChangeText={setTitle}
        />
      </View>

      {/* Description Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Description:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Reward Description"
          value={description}
          onChangeText={setDescription}
          multiline
        />
      </View>

      {/* Points Required Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Points Required:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Points Required"
          value={pointsRequired}
          onChangeText={setPointsRequired}
          keyboardType="numeric"
        />
      </View>

      {/* Remaining Stock Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Remaining Stock:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Remaining Stock"
          value={remainingStock}
          onChangeText={setRemainingStock}
          keyboardType="numeric"
        />
      </View>

      {/* Reward Type Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Reward Type:</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Reward Type"
          value={rewardType}
          onChangeText={setRewardType}
        />
      </View>

      {/* Date Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Date: (YYYY-MM-DD)</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
      </View>

      {/* Add Button */}
      <TouchableOpacity onPress={handleAddReward} style={styles.addButton}>
        <Text style={styles.buttonText}>Add Reward</Text>
      </TouchableOpacity>

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
    borderRadius: 8,
    marginBottom: 10,
  },
  changeImageText: {
    color: '#6a8a6d',
    fontWeight: 'bold',
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  input: {
    height: 45,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 10,
    fontSize: 16,
  },
  addButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
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
});

export default AddRewardScreen;
