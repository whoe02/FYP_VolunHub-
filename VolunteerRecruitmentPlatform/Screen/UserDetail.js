import React, { useState } from 'react';
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
import InputField from '../components/InputField';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

const UserDetail = () => {
    const [isEditable, setIsEditable] = useState(false);

    const [userData, setUserData] = useState({
        fullName: 'John Doe',
        email: 'john.doe@example.com',
        phoneNumber: '1234567890',
        icNumber: '123456789012',
        street: '123 Main Street',
        city: 'New York',
        postalCode: '10001',
    });

    const handleUpdatePress = () => {
        setIsEditable(!isEditable);
    };

    const handleDeletePress = () => {
        Alert.alert('Delete User', 'Are you sure you want to delete this user?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', onPress: () => console.log('User deleted') },
        ]);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
                <View style={styles.profileImageContainer}>
                    <Image source={{ uri: 'https://via.placeholder.com/150' }} style={styles.profileImage} />
                </View>

                <View style={styles.detailContainer}>
                    <InputField
                        label="Full Name"
                        value={userData.fullName}
                        onChangeText={(text) => setUserData({ ...userData, fullName: text })}
                        editable={isEditable}
                        icon={<Ionicons name="person" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="Email ID"
                        value={userData.email}
                        onChangeText={(text) => setUserData({ ...userData, email: text })}
                        editable={isEditable}
                        keyboardType="email-address"
                        icon={<MaterialIcons name="alternate-email" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="Phone Number"
                        value={userData.phoneNumber}
                        onChangeText={(text) => setUserData({ ...userData, phoneNumber: text })}
                        editable={isEditable}
                        keyboardType="phone-pad"
                        icon={<Ionicons name="call" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="IC Number"
                        value={userData.icNumber}
                        onChangeText={(text) => setUserData({ ...userData, icNumber: text })}
                        editable={isEditable}
                        icon={<Ionicons name="id-card" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="Street Address"
                        value={userData.street}
                        onChangeText={(text) => setUserData({ ...userData, street: text })}
                        editable={isEditable}
                        icon={<Ionicons name="home" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="City"
                        value={userData.city}
                        onChangeText={(text) => setUserData({ ...userData, city: text })}
                        editable={isEditable}
                        icon={<Ionicons name="location" size={20} color="#6a8a6d" />}
                    />
                    <InputField
                        label="Postal Code"
                        value={userData.postalCode}
                        onChangeText={(text) => setUserData({ ...userData, postalCode: text })}
                        editable={isEditable}
                        icon={<Ionicons name="mail" size={20} color="#6a8a6d" />}
                    />
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
        marginBottom: 20,
    },
    detailContainer: {
        width: '100%',
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginTop: 20,
        marginBottom: 40,
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