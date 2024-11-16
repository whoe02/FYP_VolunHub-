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
} from 'react-native';
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
                        icon={<Ionicons name="person" size={20} color="#6a8a6d" style={styles.icon} />}
                        editable={isEditable}
                    />
                    <InputField
                        label="Address"
                        value={userData.address}
                        onChangeText={(text) => setUserData({ ...userData, address: text })}
                        icon={<Ionicons name="home" size={20} color="#6a8a6d" style={styles.icon} />}
                        editable={isEditable}
                    />
                    <InputField
                        label="Email ID"
                        value={userData.email}
                        onChangeText={(text) => setUserData({ ...userData, email: text })}
                        icon={<MaterialIcons name="alternate-email" size={20} color="#6a8a6d" style={styles.icon} />}
                        keyboardType="email-address"
                        editable={isEditable}
                    />
                    <InputField
                        label="Phone Number"
                        value={userData.phoneNum}
                        onChangeText={(text) => setUserData({ ...userData, phoneNum: text })}
                        icon={<Ionicons name="call" size={20} color="#6a8a6d" style={styles.icon} />}
                        keyboardType="phone-pad"
                        editable={isEditable}
                    />
                    {userData.role !== 'organization' && (
                        <InputField
                            label="IC Number"
                            value={userData.icNum}
                            onChangeText={(text) => setUserData({ ...userData, icNum: text })}
                            icon={<Ionicons name="id-card" size={20} color="#6a8a6d" style={styles.icon} />}
                            editable={isEditable}
                        />
                    )}
                    {userData.role === 'organization' && (
                        <InputField
                            label="Business Type"
                            value={userData.businessType}
                            onChangeText={(text) => setUserData({ ...userData, businessType: text })}
                            icon={<Ionicons name="briefcase" size={20} color="#6a8a6d" style={styles.icon} />}
                            editable={isEditable}
                        />
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
});

export default UserDetail;