import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Alert,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore } from '../firebaseConfig';
import { collection, query, orderBy, limit, getDocs, setDoc, doc, where } from 'firebase/firestore';
import DateTimePicker from '@react-native-community/datetimepicker';

const AddUser = ({ navigation, route }) => {
    const { top: safeTop } = useSafeAreaInsets();

    // Input states
    const [fullName, setFullName] = useState('');
    const [address, setAddress] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [icNumber, setIcNumber] = useState('');
    const [businessType, setBusinessType] = useState('');
    const [userType, setUserType] = useState('Admin');
    const [userName, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [gender, setGender] = useState('');  // New state for Gender
    const [loading, setLoading] = useState(false); // Loading state
    const [dobLabel, setDobLabel] = useState('Date of Birth');
    const [show, setShow] = useState(false);
    const [date, setDate] = useState(new Date());
    const [secretQuestion, setSecretQuestion] = useState(0);
    const [secretAnswer, setSecretAnswer] = useState('');
    const [latitude, setLatitude] = useState(null);
    const [longitude, setLongitude] = useState(null);
    // Validation
    const isValidEmail = (email) => /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
    const isValidPhoneNumber = (phone) => /^[0-9]{10,11}$/.test(phone);

    const validateForm = () => {
        if (!fullName || !email || !phoneNumber || !address || !password || !confirmPassword || !gender) {
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
        if (userType === 'Admin' && !icNumber) {
            Alert.alert('Error', 'IC Number is required for admin.');
            return false;
        }
        if (password !== confirmPassword) {
            Alert.alert('Error', 'Passwords do not match.');
            return false;
        }
        // Validate Age: Ensure user is at least 18 years old
        const today = new Date();
        const age = today.getFullYear() - date.getFullYear();
        const m = today.getMonth() - date.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
            age--;
        }

        if (age < 18) {
            Alert.alert('Error', 'You must be select the date of birth and at least 18 years old');
            return false;
        }
        return true;
    };

    const isEmailUnique = async (email) => {
        const q = query(collection(firestore, 'User'), where('email', '==', email));
        const querySnapshot = await getDocs(q);
        return querySnapshot.empty; // Return true if the email is unique
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

    const generateUserId = async () => {
        // Map user types to prefixes
        const userPrefix = {
            Volunteer: 'VL',
            Organization: 'OG',
            Admin: 'AD',
        }[userType];

        // Query for the latest user ID based on the selected prefix
        const q = query(
            collection(firestore, 'User'),
            where('userId', '>=', userPrefix),  // Ensure userId starts with the selected prefix
            where('userId', '<', userPrefix + 'Z'), // Ensure userId is within the range for that prefix
            orderBy('userId', 'desc'),
            limit(1)
        );

        const querySnapshot = await getDocs(q);
        if (querySnapshot.empty) {
            return `${userPrefix}00001`;  // If no users exist, start with the first ID for that prefix
        }

        const lastUserId = querySnapshot.docs[0].data().userId;
        const numericId = parseInt(lastUserId.slice(2)) + 1;  // Extract the numeric part and increment
        return `${userPrefix}${numericId.toString().padStart(5, '0')}`;  // Return the formatted ID
    };

    const onChange = (event, selectedDate) => {
        const currentDate = selectedDate || date;
        setShow(false);
        setDate(currentDate);
        setDobLabel(currentDate.toLocaleDateString());
    };

    const handleAddUser = async () => {
        if (!validateForm()) return;
        if (validateForm()) {
            const emailUnique = await isEmailUnique(email);
            if (!emailUnique) {
                Alert.alert('Error', 'Email already exists please take other email...');
                return;
            }
            setLoading(true); // Start loading
            try {
                const userId = await generateUserId();
                const newUser = {
                    address,
                    latitude,
                    longitude,
                    email,
                    icNum: userType === 'Admin' ? icNumber : null,
                    businessType: userType === 'Organization' ? businessType : null,
                    image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731669903/UserProfilePic/c6p0bojyw2g6ojdlvo30.webp',
                    name: fullName,
                    password,
                    phoneNum: phoneNumber,
                    role: userType.toLowerCase(),
                    status: 'active',
                    userId,
                    username: userName,
                    birthDate: date.toLocaleDateString(), // Adding birth date
                    gender, // Adding gender
                    secretQuestion,
                    secretAnswer,
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
        }
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>
                <Text style={styles.title}>Add User</Text>

                {/* Loading Spinner */}
                {loading ? (
                    <ActivityIndicator size="large" color="#666" style={styles.loading} />
                ) : (
                    <>
                        <View style={styles.section}>
                            <InputField
                                label="Full Name"
                                value={fullName}
                                onChangeText={setFullName}
                                icon={<Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />}
                            />
                            <View style={styles.pickerButtonStyle}>
                                <Ionicons name="location-outline" size={25} color="#666" style={{ marginRight: 15 }} />
                                <TouchableOpacity onPress={navigateToLocationScreen}>
                                    <Text style={{color: '#666'}}>
                                        {address || 'Select Address'}
                                    </Text>
                                </TouchableOpacity>
                            </View>
                            <InputField
                                label="Email ID"
                                value={email}
                                onChangeText={setEmail}
                                icon={<MaterialIcons name="alternate-email" size={20} color="#666" style={styles.icon} />}
                                keyboardType="email-address"
                            />
                            <InputField
                                label="Phone Number"
                                value={phoneNumber}
                                onChangeText={setPhoneNumber}
                                icon={<Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />}
                                keyboardType="phone-pad"
                            />
                            {userType !== 'Organization' && (
                                <InputField
                                    label="IC Number"
                                    value={icNumber}
                                    onChangeText={setIcNumber}
                                    icon={<Ionicons name="id-card-outline" size={20} color="#666" style={styles.icon} />}
                                />
                            )}

                            <View
                                style={{
                                    flexDirection: 'row',
                                    borderBottomColor: '#ccc',
                                    borderBottomWidth: 1,
                                    paddingVertical: 15,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
                                <TouchableOpacity onPress={() => setShow(true)}>
                                    <Text style={{ color: '#666', marginLeft: 10, fontSize: 16 }}>{dobLabel}</Text>
                                </TouchableOpacity>
                            </View>
                            {show && <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />}

                            {/* Gender Picker */}
                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomColor: '#ccc',
                                    borderBottomWidth: 1,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="male-female-outline" size={20} color="#666" />
                                <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={{ flex: 1, color: gender ? '#333' : '#666', marginLeft: 3 }}>
                                    <Picker.Item label="Select Gender" value="" color="#aaa" />
                                    <Picker.Item label="Male" value="Male" />
                                    <Picker.Item label="Female" value="Female" />
                                    <Picker.Item label="Other" value="Other" />
                                </Picker>
                            </View>

                        </View>

                        {/* Gender Picker */}
                        <View
                            style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                borderBottomColor: '#ccc',
                                borderBottomWidth: 1,
                                marginBottom: 10,
                            }}
                        >
                            <Ionicons name="person-outline" size={20} color="#666" />

                            <Picker
                                selectedValue={userType}
                                onValueChange={(itemValue) => setUserType(itemValue)}
                                style={{ flex: 1, color: gender ? '#333' : '#666', marginLeft: 3 }}
                            >
                                <Picker.Item label="Organization" value="Organization" />
                                <Picker.Item label="Admin" value="Admin" />
                            </Picker>

                        </View>

                        <View style={styles.section}>
                            <InputField
                                label="Password"
                                value={password}
                                inputType="password"
                                onChangeText={setPassword}
                                icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />}
                                secureTextEntry
                            />
                            <InputField
                                label="Confirm Password"
                                value={confirmPassword}
                                inputType="password"
                                onChangeText={setConfirmPassword}
                                icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={styles.icon} />}
                                secureTextEntry
                            />
                        </View>
                        {/* Secret Question and Answer */}
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            marginTop: 30
                        }}>Choose a secret question</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
                            <Ionicons name="help-circle-outline" size={20} color="#666" />
                            <Picker selectedValue={secretQuestion} onValueChange={(itemValue) => setSecretQuestion(itemValue)} style={{ flex: 1, color: secretQuestion ? '#333' : '#666' }}>
                                <Picker.Item label="What is your favorite movie?" value={0} />
                                <Picker.Item label="What was the name of your first pet?" value={1} />
                                <Picker.Item label="What is your mother's maiden name?" value={2} />
                            </Picker>
                        </View>
                        <Text style={{
                            fontSize: 16,
                            fontWeight: '500',
                            marginTop: 10
                        }}>Answer</Text>
                        <View style={{ marginBottom: 50 }}>
                            <InputField
                                icon={<Ionicons name="create-outline" size={22} color="#666" style={{ marginRight: 5 }} />}
                                label="Answer"
                                value={secretAnswer}
                                onChangeText={setSecretAnswer}
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
    pickerButtonStyle: {
        flexDirection: 'row',
        borderBottomColor: '#ccc',
        borderBottomWidth: 1,
        paddingVertical: 15,
        marginBottom: 10,
    }
});

export default AddUser;
