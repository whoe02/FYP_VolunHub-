import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Alert,
    StyleSheet,
    ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, setDoc, doc } from 'firebase/firestore';

const AddUser = ({ navigation, route }) => {
    const { top: safeTop } = useSafeAreaInsets();

    // Input states
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [icNumber, setIcNumber] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [userType, setUserType] = useState('Volunteer');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false); // Loading state

    // Validation
    const isValidEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
    const isValidPhoneNumber = (phone) => /^[0-9]{10,11}$/.test(phone);

    const validateForm = () => {
        if (!fullName || !email || !phoneNumber || !password || !confirmPassword) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return false;
        }
        if (!isValidEmail(email)) {
            Alert.alert('Error', 'Please enter a valid email.');
            return false;
        }
        if (!isValidPhoneNumber(phoneNumber)) {
            Alert.alert('Error', 'Please enter a valid phone number.');
            return false;
        }
        if (userType === 'Volunteer' && !icNumber) {
            Alert.alert('Error', 'IC Number is required for volunteers.');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return false;
        }
        return true;
    };

    const generateUserId = async () => {
        const userPrefix = {
            Volunteer: 'VL',
            Organization: 'OG',
            Admin: 'AD',
        }[userType];

        const q = query(
            collection(firestore, 'User'),
            orderBy('userId', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return `${userPrefix}00001`;
        }

        const lastUserId = querySnapshot.docs[0].data().userId;
        const numericId = parseInt(lastUserId.slice(2)) + 1;
        return `${userPrefix}${numericId.toString().padStart(5, '0')}`;
    };

    const handleAddUser = async () => {
        if (!validateForm()) return;

        setLoading(true); // Start loading
        try {
            const userId = await generateUserId();
            const newUser = {
                address,
                email,
                icNum: userType === 'Volunteer' || userType === 'Admin' ? icNumber : null,
                businessType: userType === 'Organization' ? businessType : null,
                image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731669903/UserProfilePic/c6p0bojyw2g6ojdlvo30.webp',
                name: fullName,
                password,
                phoneNum: phoneNumber,
                rewardPoint: userType === 'Volunteer' ? '0' : null,
                role: userType.toLowerCase(),
                status: 'active',
                userId,
                username: userName,
            };
            await setDoc(doc(firestore, 'User', userId), newUser);
            Alert.alert('Success', 'User added successfully.');

            // Trigger refresh in User Management page
            if (route.params?.onUserAdded) {
                route.params.onUserAdded(); // Callback to refresh the list
            }

            navigation.goBack();
        } catch (error) {
            console.error('Error adding user:', error);
            Alert.alert('Error', 'Failed to add user.');
        } finally {
            setLoading(false); // Stop loading
        }
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <Text style={styles.title}>Add User</Text>

                {/* Loading Spinner */}
                {loading ? (
                    <ActivityIndicator size="large" color="#6a8a6d" style={styles.loading} />
                ) : (
                    <>
                        <View style={styles.section}>
                            <InputField
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                icon={<Ionicons name="person" size={20} color="#6a8a6d" style={styles.icon} />}
                            />
                            <InputField
                                label="Address"
                                value={address}
                                onChangeText={setAddress}
                                icon={<Ionicons name="home" size={20} color="#6a8a6d" style={styles.icon} />}
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
                            {userType !== 'Organization' && (
                                <InputField
                                    label="IC Number"
                                    value={icNumber}
                                    onChangeText={setIcNumber}
                                    icon={<Ionicons name="id-card" size={20} color="#6a8a6d" style={styles.icon} />}
                                />
                            )}
                            {userType === 'Organization' && (
                                <InputField
                                    label="Business Type"
                                    value={businessType}
                                    onChangeText={setBusinessType}
                                    icon={<Ionicons name="briefcase" size={20} color="#6a8a6d" style={styles.icon} />}
                                />
                            )}
                        </View>

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

                        <View style={styles.section}>
                            <InputField
                                label="Username"
                                value={userName}
                                onChangeText={setUserName}
                                icon={<Ionicons name="person" size={20} color="#6a8a6d" style={styles.icon} />}
                            />
                            <InputField
                                label="Password"
                                value={password}
                                inputType="password"
                                onChangeText={setPassword}
                                icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                                secureTextEntry
                            />
                            <InputField
                                label="Confirm Password"
                                value={confirmPassword}
                                inputType="password"
                                onChangeText={setConfirmPassword}
                                icon={<Ionicons name="lock-closed" size={20} color="#6a8a6d" style={styles.icon} />}
                                secureTextEntry
                            />
                        </View>

                        <CustomButton label="Add User" onPress={handleAddUser} />
                    </>
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
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 15,
        color: '#333',
    },
    section: {
        marginBottom: 10,
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
        borderWidth: 0.5,
        borderColor: '#666',
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 20,
    },
    picker: {
        height: 50,
        color: '#333',
    },
});

export default AddUser;