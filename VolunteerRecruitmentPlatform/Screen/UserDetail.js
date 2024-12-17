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
    TextInput
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import InputField from '../components/InputField';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const UserDetail = ({ route, navigation }) => {
    const { userId } = route.params; // User ID passed via route
    const [isEditable, setIsEditable] = useState(false);
    const [userData, setUserData] = useState(null);

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

    const handleUpdatePress = async () => {
        if (isEditable) {
            if (!validateFields()) return;
            try {
                await updateDoc(doc(firestore, 'User', userId), userData);
                Alert.alert('Success', 'User updated successfully');
            } catch (error) {
                console.error('Error updating user:', error);
                Alert.alert('Error', 'Failed to update user');
            }
        }
        setIsEditable(!isEditable);
    };

    const handleDeletePress = () => {
        Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(firestore, 'User', userId));
                        Alert.alert('Success', 'User deleted successfully');
                        navigation.goBack();
                    } catch (error) {
                        console.error('Error deleting user:', error);
                        Alert.alert('Error', 'Failed to delete user');
                    }
                },
            },
        ]);
    };
    const getSelectedQuestionLabel = (value) => {
        switch (value) {
            case 0:
                return "What is your favorite movie?";
            case 1:
                return "What was the name of your first pet?";
            case 2:
                return "What is your mother's maiden name?";
            default:
                return userData.secretQuestion;
        }
    };

    if (!userData) {
        return null; // Don't render anything if userData is not loaded
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
                <View style={styles.profileImageContainer}>
                    <Image
                        source={{ uri: userData.image || 'https://via.placeholder.com/150' }}
                        style={styles.profileImage}
                    />
                </View>

                <View style={styles.section}>
                    <InputField
                        label="Full Name"
                        value={userData.name}
                        onChangeText={(text) => setUserData({ ...userData, name: text })}
                        editable={isEditable}
                        icon={<Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 10 }} />}

                    />
                    {/* Address Selection */}
                    <View style={styles.pickerButtonStyle}>
                        <Ionicons name="location-outline" size={25} color="#666" style={{ marginRight: 15 }} />

                        {isEditable ? ( // Conditionally render TouchableOpacity when editable
                            <TouchableOpacity onPress={navigateToLocationScreen}>
                                <Text style={styles.addressButtonText}>
                                    {userData.address || 'Select Address'}
                                </Text>
                            </TouchableOpacity>
                        ) : ( // Show as plain text when not editable
                            <Text style={[styles.addressButtonText, { color: '#999' }]}>
                                {userData.address || 'No Address Selected'}
                            </Text>
                        )}
                    </View>
                    <InputField
                        label="Phone Number"
                        value={userData.phoneNum}
                        onChangeText={(text) => setUserData({ ...userData, phoneNum: text })}
                        keyboardType="phone-pad"
                        editable={isEditable}
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

                        {isEditable ? (
                            <Picker
                                selectedValue={userData.secretQuestion}
                                onValueChange={(itemValue) => setUserData({ ...userData, secretQuestion: itemValue })}
                                style={{ flex: 1, color: userData.secretQuestion ? '#333' : '#666' }}
                            >
                                <Picker.Item label="What is your favorite movie?" value={0} />
                                <Picker.Item label="What was the name of your first pet?" value={1} />
                                <Picker.Item label="What is your mother's maiden name?" value={2} />
                            </Picker>
                        ) : (
                            <Text style={{ flex: 1, color: '#999', marginLeft: 10 }}>
                                {getSelectedQuestionLabel(userData.secretQuestion)}
                            </Text>
                        )}
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
                        editable={isEditable}
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
                                editable={isEditable}
                            />
                        </>
                    )}
                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeletePress}>
                        <Text style={styles.buttonText}>Delete User</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleUpdatePress}>
                        <Text style={styles.buttonText}>{isEditable ? 'Save Changes' : 'Update User'}</Text>
                    </TouchableOpacity>
                </View>
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
    scrollView: {
        alignItems: 'center',
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
    section: {
        width: '100%',
        marginBottom: 20,
    },
    icon: {
        marginRight: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginTop: 20,
    },
    button: {
        flex: 1,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#d9534f',
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
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

export default UserDetail;