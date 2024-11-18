import React, { useState, useEffect } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, Alert, Image, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';

const AddEventScreen = ({ navigation }) => {
  // Initial states
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState('');
  const [address, setAddress] = useState('');
  const [capacity, setCapacity] = useState('');
  const [description, setDescription] = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dobLabel, setDobLabel] = useState('Select Date');
  const [photo, setPhoto] = useState(null);
  const [eventImages, setEventImages] = useState([]);

  // Request permissions for accessing media
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need permission to access your photo library!');
    }
  };

  useEffect(() => {
    requestPermission();
  }, []);

  // Date picker function
  const onDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(false);
    setDate(currentDate);
    setDobLabel(currentDate.toLocaleDateString());
  };

  // Photo picker function
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setPhoto(result.uri);
    }
  };

  // Remove image function
  const handleRemoveImage = (index) => {
    const updatedImages = [...eventImages];
    updatedImages.splice(index, 1);
    setEventImages(updatedImages);
  };

  // Validation and save function
  const validateAndSave = () => {
    if (!title || !time || !address || !capacity || !description) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    // Save event logic here
    Alert.alert('Success', 'New event added');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
        <Text style={styles.headerText}>Add Event</Text>

        {/* Display event images horizontally */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {eventImages.length > 0 ? (
            eventImages.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity
                  onPress={() => handleRemoveImage(index)}
                  style={styles.removeIcon}
                >
                  <Ionicons name="close-circle" size={24} color="#ff0000" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noImageText}>No images available</Text>
          )}
        </ScrollView>

        {/* Selected Photo */}
        {photo && <Image source={{ uri: photo }} style={styles.photo} />}
        <TouchableOpacity onPress={handlePickImage} style={styles.photoButton}>
          <Text style={styles.photoButtonText}>Upload Event Photo</Text>
        </TouchableOpacity>

        {/* Form Fields */}
        <InputField
          label="Title"
          value={title}
          onChangeText={setTitle}
          icon={<Ionicons name="create-outline" size={20} color="#666" style={styles.icon} />}
        />

        {/* Date Picker */}
        <View style={styles.datePickerContainer}>
          <Ionicons name="calendar-outline" size={20} color="#666" style={styles.icon} />
          <TouchableOpacity onPress={() => setShowDatePicker(true)}>
            <Text style={styles.datePickerText}>{dobLabel}</Text>
          </TouchableOpacity>
        </View>
        {showDatePicker && <DateTimePicker value={date} mode="date" display="default" onChange={onDateChange} />}

        {/* Other Fields */}
        <InputField
          label="Time"
          value={time}
          onChangeText={setTime}
          icon={<Ionicons name="time-outline" size={20} color="#666" style={styles.icon} />}
        />
        <InputField
          label="Address"
          value={address}
          onChangeText={setAddress}
          icon={<Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />}
        />
        <InputField
          label="Capacity"
          value={capacity}
          onChangeText={setCapacity}
          icon={<Ionicons name="people-outline" size={20} color="#666" style={styles.icon} />}
          keyboardType="numeric"
        />
        <InputField
          label="Description"
          value={description}
          onChangeText={setDescription}
          icon={<Ionicons name="document-text-outline" size={20} color="#666" style={styles.icon} />}
          multiline
          numberOfLines={4}
        />

        <CustomButton label="Add Event" onPress={validateAndSave} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center' },
  scrollView: { paddingHorizontal: 25 },
  headerText: {
    fontSize: 28,
    fontWeight: '500',
    color: '#333',
    marginBottom: 30,
    textAlign: 'center',
  },
  imageScroll: {
    marginBottom: 20,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 10,
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 10,
  },
  removeIcon: {
    position: 'absolute',
    top: 0,
    right: 0,
  },
  noImageText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    paddingTop: 20,
  },
  photo: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 20,
  },
  photoButton: {
    backgroundColor: '#6a8a6d',
    padding: 10,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 20,
  },
  photoButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  icon: { marginRight: 5 },
  datePickerContainer: {
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingBottom: 8,
    marginBottom: 20,
  },
  datePickerText: {
    color: '#666',
    marginLeft: 5,
    marginTop: 5,
  },
});

export default AddEventScreen;
