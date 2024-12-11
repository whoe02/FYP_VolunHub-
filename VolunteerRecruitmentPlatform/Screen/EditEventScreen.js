import React, { useState, useEffect,useMemo } from 'react';
import { SafeAreaView, ScrollView, View, Text, TouchableOpacity, Alert, Image, StyleSheet,ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { firestore } from '../firebaseConfig';
import { collection, getDocs, addDoc, Timestamp,query, orderBy, limit,setDoc,doc,updateDoc,getDoc } from 'firebase/firestore';
import axios from 'axios';

const EditEventScreen = ({route, navigation }) => {
  // Initial states
  const { event,user } = route.params;
  const [title, setTitle] = useState(event.title);
  const [address, setAddress] = useState(event.address);
  const [capacity, setCapacity] = useState(event.capacity);
  const [description, setDescription] = useState(event.description);
  const [location, setLocation] = useState(event.location);
  const [locationCategory, setLocationCategory] = useState('');
  const [eventImages, setEventImages] = useState(event.image || []);
  const [skills, setSkills] = useState(event.skills || []);
  const [preferences, setPreferences] = useState(event.preferences || []);
  const [selectedSkills, setSelectedSkills] = useState(event.skills || []);
  const [selectedPreferences, setSelectedPreferences] = useState(event.preferences || []);

  const [startDate, setStartDate] = useState(new Date(event.startDate) || new Date());
  const [endDate, setEndDate] = useState(new Date(event.endDate) || new Date());
  const [startTime, setStartTime] = useState(new Date(event.startTime) || new Date());
  const [endTime, setEndTime] = useState(new Date(event.endTime) || new Date());
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  
  const [showPicker, setShowPicker] = useState({ visible: false, mode: 'date', pickerType: '' });
  const formatDate = (date) => (date instanceof Date ? date.toLocaleDateString() : 'Select Date');
  const formatTime = (time) => (time instanceof Date ? time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Select Time');
  const [isLoading, setIsLoading] = useState(false);

  const handlePickerChange = (event, selectedValue) => {
    setShowPicker({ ...showPicker, visible: false });
    if (selectedValue) {
      const newValue = new Date(selectedValue); // Ensure it's a Date object
      if (showPicker.pickerType === 'startDate') setStartDate(newValue);
      if (showPicker.pickerType === 'endDate') setEndDate(newValue);
      if (showPicker.pickerType === 'startTime') setStartTime(newValue);
      if (showPicker.pickerType === 'endTime') setEndTime(newValue);
    }
  };

  const navigateToLocationScreen = () => {
    navigation.navigate('LocationSelection', {
      onLocationSelected: (address, latitude, longitude) => {
        // This function will be executed when location is confirmed
        setAddress(address);
        setLatitude(latitude);  // Update latitude separately
        setLongitude(longitude);  // Update longitude separately
      },
    });
  };
  
  const pickerValue = useMemo(() => {
    if (showPicker.pickerType === 'startDate') return startDate || new Date();
    if (showPicker.pickerType === 'endDate') return endDate || new Date();
    if (showPicker.pickerType === 'startTime') return startTime || new Date();
    if (showPicker.pickerType === 'endTime') return endTime || new Date();
    return new Date(); // Default to current date/time
  }, [showPicker.pickerType, startDate, endDate, startTime, endTime]);
  
  
  const openPicker = (type, mode) => {
    setShowPicker({ visible: true, mode, pickerType: type });
  };

  // Request permissions for accessing media
  const requestPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      alert('Sorry, we need permission to access your photo library!');
    }
  };

  useEffect(() => {
    requestPermission();
    fetchCategories();
    if (showPicker.visible) {
      // Only run if the picker is visible
      console.log('Date Picker is open');
    }
    if (route.params?.selectedAddress) {
      setAddress(route.params.selectedAddress);
      setLatitude(route.params.latitude);
      setLongitude(route.params.longitude);
    }
  }, [showPicker.visible,route.params?.selectedAddress, route.params?.latitude, route.params?.longitude]);

  useEffect(() => {
    if (address && locationCategory.length > 0) {
      updateLocationBasedOnAddress();
    }
  }, [address, locationCategory]);

  const updateLocationBasedOnAddress = () => {
    if (!address) return;
  
    // Directly match the city/state part from the address
    const cityState = address.toLowerCase();
  
    // Check if any location category name matches the city/state in the address
    const matchedCategory = locationCategory.find((category) =>
      cityState.includes(category.categoryName.toLowerCase())
    );
  
    // Set location based on match
    if (matchedCategory) {
      setLocation(`location_${matchedCategory.categoryName}`);
    } else {
      setLocation('location_Other');
    }
  
    console.log(`Address: ${address}`);
    console.log(`Set Location: ${matchedCategory ? matchedCategory.categoryName : 'Other'}`);
  };

  // Fetch skills and preferences from Firestore (Category collection)
  const fetchCategories = async () => {
    try {
      const categorySnapshot = await getDocs(collection(firestore, 'Category'));
      const categoryData = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Separate into skills and preferences based on the categoryType
      const fetchedSkills = categoryData.filter(category => category.categoryType === 'skills');
      const fetchedPreferences = categoryData.filter(category => category.categoryType === 'preference');
      const fetchedLocation = categoryData.filter(category => category.categoryType === 'location');

      setSkills(fetchedSkills);
      setPreferences(fetchedPreferences);
      setLocationCategory(fetchedLocation);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };
  
  const generateEventId = async () => {
    const eventsRef = collection(firestore, 'Event');
    const eventsSnapshot = await getDocs(eventsRef);
  
    return `EV${(eventsSnapshot.size + 1).toString().padStart(5, '0')}`;
  };

  const uploadToCloudinary = async (uris) => {
    try {
      const uploadedUrls = [];
  
      for (let uri of uris) {
        console.log('Uploading image:', uri);
  
        const formData = new FormData();
        formData.append('file', {
          uri: uri.startsWith('file://') ? uri : `file://${uri}`,
          type: 'image/jpeg',
          name: `event_${Date.now()}.jpg`,
        });
        formData.append('upload_preset', 'eventPhoto');
        formData.append('cloud_name', 'dnj0n4m7k');
        formData.append('folder', 'eventPic');
  
        const response = await axios.post(
          'https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload',
          formData,
          { headers: { 'Content-Type': 'multipart/form-data' } }
        );
  
        if (response.data.secure_url) {
          console.log('Image uploaded:', response.data.secure_url);
          uploadedUrls.push(response.data.secure_url);
        } else {
          throw new Error('Secure URL not found in Cloudinary response');
        }
      }
  
      return uploadedUrls;
    } catch (error) {
      console.error('Error uploading to Cloudinary:', error);
      throw error;
    }
  };

  // Photo picker function
  const handlePickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
  
    if (!result.canceled && result.assets?.length > 0) {
      const { uri } = result.assets[0];
      setEventImages([...eventImages, uri]);
    }
  };
  
  // Remove image function
  const handleRemoveImage = (index) => {
    // Create a new array with the item removed
    const updatedImages = eventImages.filter((_, i) => i !== index);
    setEventImages(updatedImages);
  };

  // Toggle skill selection
  const toggleSkill = (skillId) => {
    if (selectedSkills.includes(skillId)) {
      setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
    } else if (selectedSkills.length < 2) {
      setSelectedSkills([...selectedSkills, skillId]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 2 skills only.');
    }
  };

  // Toggle preference selection
  const togglePreference = (prefId) => {
    if (selectedPreferences.includes(prefId)) {
      setSelectedPreferences(selectedPreferences.filter((id) => id !== prefId));
    } else if (selectedPreferences.length < 5) {
      setSelectedPreferences([...selectedPreferences, prefId]);
    } else {
      Alert.alert('Limit Reached', 'You can select up to 5 preferences only.');
    }
  };

  const validateAndSave = async () => {
    setIsLoading(true); // Show loading indicator
    
    // Validate form fields
    if (!title || !startDate || !endDate || !address || !capacity || !description) {
      Alert.alert('Error', 'Please fill in all required fields');
      setIsLoading(false);
      return;
    }
  
    try {
      // Separate new (local) images from existing (remote) ones
      const newImageUris = eventImages.filter((uri) => !uri.startsWith('http')); // New images
      const existingImageUrls = eventImages.filter((uri) => uri.startsWith('http')); // Already uploaded
  
      // Upload new images if any
      const uploadedImageUrls = newImageUris.length > 0 ? await uploadToCloudinary(newImageUris) : [];
  
      // Combine new and existing URLs
      const finalImageUrls = [...existingImageUrls, ...uploadedImageUrls];
  
      // Prepare event data
      const eventData = {
        title: title || '',
        description: description || '',
        address: address || '',
        capacity: parseInt(capacity) || 0,
        startDate: Timestamp.fromDate(startDate),
        startTime: startTime || '',
        endDate: Timestamp.fromDate(endDate),
        endTime: endTime || '',
        status: 'upcoming',
        location: location || '',
        skills: selectedSkills || [],
        preferences: selectedPreferences || [],
        image: finalImageUrls, // Save combined URLs
        categoryIds: [location, ...selectedSkills, ...selectedPreferences].filter((item) => item != null),
      };
  
      // Check if it's an update or new event
      const eventId = event.eventId || await generateEventId();
      const eventRef = doc(firestore, 'Event', eventId);
      const existingEventDoc = await getDoc(eventRef);
  
      if (existingEventDoc.exists()) {
        await updateDoc(eventRef, eventData); // Update existing event
        Alert.alert('Success', 'Event updated successfully');
      } else {
        await setDoc(eventRef, {
          ...eventData,
          eventId,
          createdAt: Timestamp.now(),
          userId: user?.userId || null,
        });
        Alert.alert('Success', 'New event added');
      }
  
      navigation.goBack(); // Navigate back to the previous screen
    } catch (error) {
      console.error('Error saving event:', error);
      Alert.alert('Error', 'Failed to save event');
    } finally {
      setIsLoading(false); // Hide loading indicator
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>

        {/* Display event images horizontally */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
          {eventImages.length > 0 ? (
            eventImages.map((img, index) => (
              <View key={index} style={styles.imageContainer}>
                <Image source={{ uri: img }} style={styles.image} />
                <TouchableOpacity onPress={() => handleRemoveImage(index)} style={styles.removeIcon}>
                  <Ionicons name="close-circle" size={24} color="#ff0000" />
                </TouchableOpacity>
              </View>
            ))
          ) : (
            <Text style={styles.noImageText}>No images available</Text>
          )}
        </ScrollView>


        {/* Upload Event Photo */}
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

        {/* Start Date Picker */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <TouchableOpacity onPress={() => openPicker('startDate', 'date')}>
            <Text style={styles.datePickerText}>{formatDate(startDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* End Date Picker */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="calendar-outline" size={20} color="#666" />
          <TouchableOpacity onPress={() => openPicker('endDate', 'date')}>
            <Text style={styles.datePickerText}>{formatDate(endDate)}</Text>
          </TouchableOpacity>
        </View>

        {/* Start Time Picker */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <TouchableOpacity onPress={() => openPicker('startTime', 'time')}>
            <Text style={styles.datePickerText}>{formatTime(startTime)}</Text>
          </TouchableOpacity>
        </View>

        {/* End Time Picker */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="time-outline" size={20} color="#666" />
          <TouchableOpacity onPress={() => openPicker('endTime', 'time')}>
            <Text style={styles.datePickerText}>{formatTime(endTime)}</Text>
          </TouchableOpacity>
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

        {/* Address Button */}
        <View style={styles.pickerButtonStyle}>
          <Ionicons name="location-outline" size={20} color="#666" />
          <TouchableOpacity onPress={navigateToLocationScreen}>
            <Text style={styles.addressButtonText}>
              {address || 'Select Address'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Capacity */}
        <InputField
          label="Capacity"
          value={capacity.toString()}
          onChangeText={setCapacity}
          icon={<Ionicons name="people-outline" size={20} color="#666" style={styles.icon} />}
          keyboardType="numeric"
        />

        {/* Description */}
        <InputField
          label="Description"
          value={description}
          onChangeText={setDescription}
          icon={<Ionicons name="document-text-outline" size={20} color="#666" style={styles.icon} />}
          multiline
          numberOfLines={4}
        />

        {/* Skills Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.label}>Skills</Text>
          {skills.map((skill) => (
            <TouchableOpacity
              key={skill.id || skill.categoryName}
              style={[
                styles.selectionButton,
                selectedSkills.includes(skill.id) && styles.selectedButton,
              ]}
              onPress={() => toggleSkill(skill.id)}
            >
              <Text style={styles.selectionText}>{skill.categoryName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Preferences Selection */}
        <View style={styles.selectionContainer}>
          <Text style={styles.label}>Preferences</Text>
          {preferences.map((preference) => (
            <TouchableOpacity
              key={preference.id || preference.categoryName}
              style={[
                styles.selectionButton,
                selectedPreferences.includes(preference.id) && styles.selectedButton,
              ]}
              onPress={() => togglePreference(preference.id)}
            >
              <Text style={styles.selectionText}>{preference.categoryName}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Save Event Button */}
        {isLoading ? (
          <ActivityIndicator size="large" color="#6a8a6d" style={styles.loading} />
        ) : (
          <CustomButton label="Edit Event" onPress={validateAndSave} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
  },
  scrollView: {
    paddingHorizontal: 25,
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
  icon: {
    marginRight: 5,
  },
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
  selectionContainer: {
    marginBottom: 20,
    
  },
  label: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  selectionButton: {
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 5,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 15,
  },
  selectedButton: {
    backgroundColor: '#6a8a6d',
  },
  selectionText: {
    color: '#000',
    fontSize: 16,
  },
  pickerButtonStyle:{
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 15,
    marginBottom: 10,
  }
});

export default EditEventScreen;