import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    Text,
    Alert,
    StyleSheet,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore setup

const EditPassword = ({ route, navigation }) => {
    const { userId } = route.params;
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { top: safeTop } = useSafeAreaInsets();

    // Validate and update password
    const handlePasswordUpdate = async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return;
        }

        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match');
            return;
        }

        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters long');
            return;
        }

        try {
            // Fetch the current password from Firestore
            const userRef = doc(firestore, 'User', userId); // Use the user's Firestore document ID
            const userSnapshot = await getDoc(userRef);

            if (!userSnapshot.exists()) {
                Alert.alert('Error', 'User does not exist');
                return;
            }

            const userData = userSnapshot.data();

            // Check if the entered current password matches the one in Firestore
            if (userData.password !== currentPassword) {
                Alert.alert('Error', 'Current password is incorrect');
                return;
            }

            // Update the password in Firestore
            await updateDoc(userRef, { password: newPassword });

            Alert.alert('Success', 'Password updated successfully');
            navigation.goBack(); // Navigate back to the previous screen
        } catch (error) {
            console.error('Error updating password:', error.message);
            Alert.alert('Error', 'Failed to update password. Please try again.');
        }
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <Text style={styles.title}>Change Password</Text>

                {/* Current Password Field */}
                <InputField
                    label="Current Password"
                    value={currentPassword}
                    inputType="password"
                    onChangeText={setCurrentPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                {/* New Password Field */}
                <InputField
                    label="New Password"
                    value={newPassword}
                    inputType="password"
                    onChangeText={setNewPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                {/* Confirm Password Field */}
                <InputField
                    label="Confirm New Password"
                    value={confirmPassword}
                    inputType="password"
                    onChangeText={setConfirmPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                <CustomButton
                    label="Update Password"
                    onPress={handlePasswordUpdate}
                />
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 15,
        color: '#333',
    },
    icon: {
        marginRight: 5,
    },
});

export default EditPassword;