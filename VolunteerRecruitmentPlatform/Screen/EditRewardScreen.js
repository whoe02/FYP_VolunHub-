import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Image, StyleSheet, ActivityIndicator, Alert, ScrollView } from 'react-native';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase config
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore'; // Added deleteDoc
import * as ImagePicker from 'expo-image-picker'; // For image picker functionality

const EditRewardScreen = ({ route, navigation }) => {
  const { rewardId } = route.params; // Get the rewardId passed from the RewardManagement screen
  const [reward, setReward] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newImageUri, setNewImageUri] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pointsRequired, setPointsRequired] = useState('');
  const [remainingStock, setRemainingStock] = useState('');
  const [rewardType, setRewardType] = useState('');
  const [date, setDate] = useState('');

  // Fetch reward data when screen is loaded
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
          setDate(rewardData.date); // Assuming 'date' is stored as a string or in a format you can display
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

  // Handle image picker for updating the reward image
  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
    });

    if (!result.canceled) {
      setNewImageUri(result.uri);
    }
  };

  // Update the reward in Firestore
  const handleUpdateReward = async () => {
    if (!title || !description || !pointsRequired || !remainingStock || !rewardType || !date) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }

    setLoading(true);
    try {
      const rewardDocRef = doc(firestore, 'Rewards', rewardId);

      // Prepare the updated data
      const updatedReward = {
        title,
        description,
        pointsRequired: parseInt(pointsRequired),
        imageVoucher: newImageUri || reward.imageVoucher, // If no new image, keep the old one
        remainingStock: parseInt(remainingStock),
        type: rewardType,
        date, // Keep the existing date value as is, unless you want to update it
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

  // Handle deleting the reward
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

  if (loading || !reward) {
    return <ActivityIndicator size="large" color="#6a8a6d" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Image picker */}
      <TouchableOpacity onPress={pickImage} style={styles.imagePickerContainer}>
        <Image
          source={{ uri: newImageUri || reward.imageVoucher }}
          style={styles.rewardImage}
        />
        <Text style={styles.changeImageText}>Change Image</Text>
      </TouchableOpacity>

      {/* Title Input */}
      <View style={styles.inputGroup}>
        <Text style={styles.inputLabel}>Title:</Text>
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
});

export default EditRewardScreen;
