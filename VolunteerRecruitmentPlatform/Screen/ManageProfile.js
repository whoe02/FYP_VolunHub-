import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    StyleSheet,
    ActivityIndicator, // Add ActivityIndicator for loading
} from 'react-native';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import UUID from 'react-native-uuid';

const ManageProfile = ({ route, navigation }) => {
    const { userId, onProfileUpdate } = route.params; 
    const [userData, setUserData] = useState(null);
    const [newProfileImage, setNewProfileImage] = useState(null); // Temporary image state
    const [isLoading, setIsLoading] = useState(false); // Loading state

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const userDoc = await getDoc(doc(firestore, 'User', userId));
                if (userDoc.exists()) {
                    setUserData(userDoc.data());
                } else {
                    Alert.alert('Error', 'User not found', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching user:', error);
                Alert.alert('Error', 'Failed to fetch user data', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        };

        fetchUserData();
    }, [userId]);

    // Open Image Picker
    const handleChangeProfilePicture = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
        });

        if (!result.canceled) {
            setNewProfileImage(result.assets[0].uri); // Save the selected image temporarily
        }
    };

    const validateFields = () => {
        if (!userData.name || !userData.email || !userData.phoneNum) {
            Alert.alert('Validation Error', 'Please fill all required fields.');
            return false;
        }
        if (userData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userData.email)) {
            Alert.alert('Validation Error', 'Please enter a valid email address.');
            return false;
        }
        return true;
    };

    const randomFileName = `profile_picture_${Date.now()}_${UUID.v4()}.jpg`;

    // Cloudinary configuration
    const uploadImageToCloudinary = async (imageUri) => {
        const data = new FormData();
        data.append('file', {
            uri: imageUri,
            type: 'image/jpeg', // Adjust the type based on your file format
            name: randomFileName,
        });
        data.append('upload_preset', 'profilepic'); // Replace with your upload preset
        data.append('cloud_name', 'dnj0n4m7k'); // Replace with your cloud name

        try {
            const response = await fetch('https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload', {
                method: 'POST',
                body: data,
            });

            const result = await response.json();

            if (response.ok) {
                return result.secure_url; // Return the uploaded image's URL
            } else {
                console.error('Upload failed:', result);
                Alert.alert('Error', 'Failed to upload image. Please try again.');
                return null;
            }
        } catch (error) {
            console.error('Error uploading image:', error);
            Alert.alert('Error', 'Failed to upload image. Please try again.');
            return null;
        }
    };

    const handleSavePress = async () => {
        if (!validateFields()) return;

        setIsLoading(true); // Set loading to true

        try {
            let updatedData = { ...userData };

            // If a new profile picture is selected, upload it and update the profile image URL
            if (newProfileImage) {
                const imageUrl = await uploadImageToCloudinary(newProfileImage);
                if (!imageUrl) return; // Stop if image upload fails
                updatedData.image = imageUrl;
            }

            // Update Firestore with the new data
            await updateDoc(doc(firestore, 'User', userId), updatedData);
            Alert.alert('Success', 'Profile updated successfully', [
                {
                  text: 'OK',
                  onPress: () => {
                    setIsLoading(false);
                    if (onProfileUpdate) {
                        onProfileUpdate(); // This triggers the callback to fetch updated data in ProfileScreen
                      }// Call the callback to update profile screen
                    navigation.goBack();
                  },
                },
              ]);
        } catch (error) {
            console.error('Error updating user:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false); // Set loading to false after the operation
        }
    };

    if (!userData) {
        return null; // Render nothing if userData is not loaded
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={{ uri: newProfileImage || userData.image || 'https://via.placeholder.com/150' }}
                        style={styles.profileImage}
                    />
                    <TouchableOpacity onPress={handleChangeProfilePicture}>
                        <Text style={styles.changePictureText}>Change Profile Picture</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.section}>
                    <InputField
                        label="Full Name"
                        value={userData.name}
                        onChangeText={(text) => setUserData({ ...userData, name: text })}
                        editable={true}
                    />
                    <InputField
                        label="Address"
                        value={userData.address}
                        onChangeText={(text) => setUserData({ ...userData, address: text })}
                        editable={true}
                    />
                    <InputField
                        label="Email ID"
                        value={userData.email}
                        onChangeText={(text) => setUserData({ ...userData, email: text })}
                        keyboardType="email-address"
                        editable={true}
                    />
                    <InputField
                        label="Phone Number"
                        value={userData.phoneNum}
                        onChangeText={(text) => setUserData({ ...userData, phoneNum: text })}
                        keyboardType="phone-pad"
                        editable={true}
                    />
                </View>

                <CustomButton label="Save Profile" onPress={handleSavePress} />

                {/* Show loading spinner if saving is in progress */}
                {isLoading && (
                    <View style={styles.loadingContainer}>
                        <ActivityIndicator size="large" color="#0000ff" />
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    profileImageContainer: {
        marginVertical: 20,
        alignItems: 'center',
    },
    profileImage: {
        width: 150,
        height: 150,
        borderRadius: 75,
    },
    changePictureText: {
        color: '#6a8a6d',
        marginTop: 15,
        marginBottom: 20,
        fontSize: 16,
    },
    section: {
        width: '100%',
        marginBottom: 20,
    },
    loadingContainer: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 20,
    },
});

export default ManageProfile;