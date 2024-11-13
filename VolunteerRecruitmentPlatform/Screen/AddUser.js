import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Alert,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField'; // Import your InputField component
import CustomButton from '../components/CustomButton'; // Import your CustomButton component
import { Picker } from '@react-native-picker/picker'; // Import Picker for dropdown
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const AddUser = ({ navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();

    // Input states
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [icNumber, setIcNumber] = useState('');
    const [userType, setUserType] = useState('Volunteer');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Validation
    const isValidEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
    const isValidPhoneNumber = (phone) => /^[0-9]{10,11}$/.test(phone);
    const isValidIcNumber = (ic) => /^[0-9]{12}$/.test(ic);

    const validateForm = () => {
        if (!fullName || !email || !phoneNumber || !icNumber || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return false;
        }
        if (!isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email');
            return false;
        }
        if (!isValidPhoneNumber(phoneNumber)) {
            Alert.alert('Error', 'Please enter a valid phone number');
            return false;
        }
        if (!isValidIcNumber(icNumber)) {
            Alert.alert('Error', 'IC Number must be exactly 12 digits');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return false;
        }
        return true;
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <Text style={styles.title}>Add User</Text>

                {/* User Information Section */}
                <View style={styles.section}>
                    <InputField
                        label="Full Name"
                        value={fullName}
                        onChangeText={setFullName}
                        icon={<Ionicons name="person" size={20} color="#6a8a6d" style={styles.icon} />}
                    />
                    <InputField
                        label="Email ID"
                        value={email}
                        onChangeText={setEmail}
                        icon={<MaterialIcons name="alternate-email" size={20} color="#6a8a6d" style={styles.icon} />}
                        keyboardType="email-address"
                    />
                    <InputField
                        label="Phone Number"
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        icon={<Ionicons name="call" size={20} color="#6a8a6d" style={styles.icon} />}
                        keyboardType="phone-pad"
                    />
                    <InputField
                        label="IC Number"
                        value={icNumber}
                        onChangeText={setIcNumber}
                        icon={<Ionicons name="id-card" size={20} color="#6a8a6d" style={styles.icon} />}
                    />
                </View>

                {/* User Type Selection */}
                <View style={styles.section}>
                    <Text style={styles.label}>User Type</Text>
                    <View style={styles.pickerContainer}>
                        <Picker
                            selectedValue={userType}
                            onValueChange={(itemValue) => setUserType(itemValue)}
                            style={styles.picker}
                        >
                            <Picker.Item label="Volunteer" value="Volunteer" />
                            <Picker.Item label="Organization" value="Organization" />
                            <Picker.Item label="Admin" value="Admin" />
                        </Picker>
                    </View>
                </View>

                {/* Password Section */}
                <View style={styles.section}>
                    <InputField
                        label="Password"
                        value={password}
                        onChangeText={setPassword}
                        icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                        secureTextEntry
                    />
                    <InputField
                        label="Confirm Password"
                        value={confirmPassword}
                        onChangeText={setConfirmPassword}
                        icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                        secureTextEntry
                    />
                </View>

                <CustomButton
                    label="Add User"
                    onPress={() => {
                        if (validateForm()) {
                            Alert.alert('Success', 'User added successfully');
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
    section: {
        marginBottom: 20,
    },
    label: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    icon: {
        marginRight: 5,
    },
    pickerContainer: {
        borderWidth: 1,
        borderColor: '#666',
        borderRadius: 10,
        overflow: 'hidden',
    },
    picker: {
        height: 50,
        color: '#333',
    },
});

export default AddUser;