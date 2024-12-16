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
    TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import * as ImagePicker from 'expo-image-picker';
import UUID from 'react-native-uuid';
import { useCameraPermissions } from 'expo-camera';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const ManageProfile = ({ route, navigation }) => {
    const { userId, email, onProfileUpdate } = route.params;
    const [userData, setUserData] = useState(null);
    const [newProfileImage, setNewProfileImage] = useState(null); // Temporary image state
    const [isLoading, setIsLoading] = useState(false); // Loading state
    const [permission, requestPermission] = useCameraPermissions();
    const [isFaceDataAdded, setIsFaceDataAdded] = useState(false);

    useEffect(() => {
        const requestCameraPermission = async () => {
            const { status } = await requestPermission();
            if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Camera access is denied. Please enable it in the settings.');
            }
        };

        requestCameraPermission(); // Request permission explicitly
    }, []);

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

    const handleAddFaceData = () => {
        if (permission?.status !== 'granted') {
            Alert.alert('Error', 'Camera permission is required to add face data.');
            return;
        }

        navigation.navigate('FaceTestingEditScreen', {
            email,
            onComplete: (status) => {
                setIsFaceDataAdded(status); // Update state based on face data status
                if (status) {
                    Alert.alert('Success', 'Face data added successfully!');
                } else {
                    Alert.alert('Error', 'Failed to add face data. Try again.');
                }
            },
        });
    };

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
        if (!userData.name || !userData.phoneNum || !userData.address) {
            Alert.alert('Validation Error', 'Please fill all required fields.');
            return false;
        }
        if ((userData.role === 'admin' || userData.role === 'volunteer') && !userData.icNum) {
            Alert.alert('Error', 'Please enter your IC Number');
            return false;
        }
        const phoneRegex = /^[0-9]{9,12}$/;
        if (!phoneRegex.test(userData.phoneNum)) {
            Alert.alert('Error', 'Phone number must be between 9 to 12 digits');
            return false;
        }
        return true;
    };

    const navigateToLocationScreen = () => {
        navigation.navigate('LocationSelection', {
            onLocationSelected: (address, latitude, longitude) => {
                setUserData({ ...userData, address: address, latitude: latitude, longitude: longitude });
            },
        });
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
            updatedData.email = email;

            // Log updatedData before making the fetch call
            console.log('Updated Data:', updatedData);

            // If a new profile picture is selected, upload it and update the profile image URL
            if (newProfileImage) {
                const imageUrl = await uploadImageToCloudinary(newProfileImage);
                if (!imageUrl) return; // Stop if image upload fails
                updatedData.image = imageUrl;
            }

            // Convert data to JSON string
            const jsonData = JSON.stringify(updatedData);
            console.log('JSON Data:', jsonData); // Log JSON data

            // Send updated data to your server
            if (userData?.role == 'volunteer') {
                const response = await fetch('https://fair-casual-garfish.ngrok-free.app/confirmEditFace', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: jsonData,
                });
                if (!response.ok) {
                    const errorData = await response.json();
                    Alert.alert('Error', errorData.message || 'Failed to update face data. Please try again.');
                    return; // Stop the process if the server returns an error
                }
            }

            // Update Firestore with the new data
            await updateDoc(doc(firestore, 'User', userId), updatedData);
            Alert.alert('Success', 'Profile updated successfully', [
                {
                    text: 'OK',
                    onPress: () => {
                        setIsLoading(false);
                        if (onProfileUpdate) {
                            onProfileUpdate(); // Trigger callback to update profile screen
                        }
                        navigation.goBack();
                    },
                },
            ]);
        } catch (error) {
            console.error('Error updating user:', error);
            Alert.alert('Error', 'Failed to update profile');
        } finally {
            setIsLoading(false); // Set loading to false after operation
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
                        icon={<Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 10 }} />}

                    />
                    {/* Address Selection */}
                    <View style={styles.pickerButtonStyle}>
                        <Ionicons name="location-outline" size={25} color="#666" style={{ marginRight: 15 }} />
                        <TouchableOpacity onPress={navigateToLocationScreen}>
                            <Text style={styles.addressButtonText}>
                                {userData.address || 'Select Address'}
                            </Text>
                        </TouchableOpacity>
                    </View>
                    <InputField
                        label="Phone Number"
                        value={userData.phoneNum}
                        onChangeText={(text) => setUserData({ ...userData, phoneNum: text })}
                        keyboardType="phone-pad"
                        editable={true}
                        icon={<Ionicons name="call-outline" size={20} color="#666" style={{ marginRight: 10 }} />}

                    />
                    {/* Non-editable fields */}
                    <InputField label="Email ID" value={userData.email} editable={false} icon={<MaterialIcons name="alternate-email" size={20} color="#666" style={{ marginRight: 10 }} />}
                    />
                    {userData.role !== 'organization' && (
                        <InputField label="IC Number" value={userData.icNum} editable={false} icon={<Ionicons name="id-card-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
                        />
                    )}
                    {userData.role !== 'organization' && (
                        <InputField label="Gender" value={userData.gender} editable={false} icon={<Ionicons name="male-female-outline" size={20} color="#666" />} />
                    )}
                    {userData.role !== 'organization' && (
                        <InputField label="Date of Birth" value={userData.birthDate} editable={false} icon={<Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                        } />
                    )}
                    {/* Secret Question and Answer */}
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        marginTop: 30
                    }}>Choose a secret question</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                        <Ionicons name="help-circle-outline" size={20} color="#666" />

                        <Picker
                            selectedValue={userData.secretQuestion}
                            onValueChange={(itemValue) => setUserData({ ...userData, secretQuestion: itemValue })}
                            style={{ flex: 1, color: userData.secretQuestion ? '#333' : '#666' }}
                        >
                            <Picker.Item label="What is your favorite movie?" value={0} />
                            <Picker.Item label="What was the name of your first pet?" value={1} />
                            <Picker.Item label="What is your mother's maiden name?" value={2} />
                        </Picker>
                    </View>

                    {/* Secret Answer */}
                    <Text style={{
                        fontSize: 16,
                        fontWeight: '500',
                        marginTop: 10
                    }}>Answer</Text>
                    <InputField
                        value={userData.secretAnswer}
                        onChangeText={(text) => setUserData({ ...userData, secretAnswer: text })}
                        icon={<Ionicons name="create-outline" size={22} color="#666" style={{ marginRight: 10 }} />}
                    />

                    {/* Auto Reply Message for Organizations */}
                    {userData.role === 'organization' && (
                        <>
                            <Text style={{
                                fontSize: 16,
                                fontWeight: '500',
                                marginTop: 10
                            }}>Auto Reply Message</Text>
                            <TextInput
                                style={styles.textArea}
                                value={userData.autoReplyMsg || ''}
                                onChangeText={(text) => setUserData({ ...userData, autoReplyMsg: text })}
                                placeholder="Enter your auto-reply message"
                                multiline
                                numberOfLines={4}
                                textAlignVertical="top"
                            />
                        </>
                    )}
                </View>


                {userData.role === 'volunteer' && (
                    <CustomButton
                        variant='outline'
                        label="Edit Face Data"
                        title={isFaceDataAdded ? 'Face Data Added ✔' : 'Add Face Data'}
                        onPress={handleAddFaceData}
                    />
                )}

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
    pickerButtonStyle: {
        flexDirection: 'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingVertical: 15,
        marginBottom: 10,
    },
    textArea: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
        fontSize: 16,
        marginTop: 10,
        backgroundColor: '#f9f9f9',
    },
});

export default ManageProfile;
