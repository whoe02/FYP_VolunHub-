import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Alert,
    StyleSheet
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField'; // Assuming InputField component is in the same directory
import CustomButton from '../components/CustomButton'; // Assuming CustomButton component is in the same directory
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const EditPassword = ({ navigation }) => {
    // Password fields
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const { top: safeTop } = useSafeAreaInsets();

    // Validate password change requirements
    const validatePasswordChange = () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all password fields');
            return false;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New password and confirm password do not match');
            return false;
        }
        if (newPassword.length < 8) {
            Alert.alert('Error', 'New password must be at least 8 characters');
            return false;
        }
        return true;
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <Text style={styles.title}>Change Password</Text>

                {/* Current Password Field */}
                <InputField
                    label={'Current Password'}
                    value={currentPassword}
                    onChangeText={setCurrentPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                {/* New Password Field */}
                <InputField
                    label={'New Password'}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                {/* Confirm Password Field */}
                <InputField
                    label={'Confirm New Password'}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                    secureTextEntry
                />

                <CustomButton
                    label={'Update Password'}
                    onPress={() => {
                        if (validatePasswordChange()) {
                            // Proceed with updating password (e.g., make an API call or save to local storage)
                            Alert.alert('Success', 'Password updated successfully');
                        }
                    }}
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