import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Image,
    Alert,
    StyleSheet
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField'; // Assuming InputField component is in the same directory
import CustomButton from '../components/CustomButton'; // Assuming CustomButton component is in the same directory
import { useSafeAreaInsets } from 'react-native-safe-area-context';


const ManageProfile = ({ navigation }) => {
    // Profile info states
    const [fullName, setFullName] = useState('John Doe');
    const [email, setEmail] = useState('john.doe@example.com');
    const [phoneNumber, setPhoneNumber] = useState('1234567890');
    const [icNumber, setIcNumber] = useState('123456789012');
    const [street, setStreet] = useState('123 Main Street');
    const [city, setCity] = useState('New York');
    const [postalCode, setPostalCode] = useState('10001');
    // Password states
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const {top: safeTop} = useSafeAreaInsets();
    // Email validation regex
    const isValidEmail = (email) => {
        const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
        return regex.test(email);
    };

    // Phone validation (10 or 11 digits)
    const isValidPhoneNumber = (phone) => {
        const regex = /^[0-9]{10,11}$/; // Accepts 10 or 11 digits
        return regex.test(phone);
    };

    // IC Number validation (12 digits)
    const isValidIcNumber = (ic) => {
        const regex = /^[0-9]{12}$/; // Only 12 digits
        return regex.test(ic);
    };

    // Validation for managing profile
    const validateProfileUpdate = () => {
        if (!fullName || !email || !phoneNumber || !icNumber || !street || !city || !postalCode) {
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

        return true;
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollView}>


                <Text style={styles.title}>Manage Profile</Text>

                {/* Personal Information Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Personal Information</Text>
                    <InputField
                        label={'Full Name'}
                        value={fullName}
                        onChangeText={setFullName}
                        icon={<Ionicons name="person-outline" size={20} color="#666" style={styles.icon} />}
                    />
                    <InputField
                        label={'Email ID'}
                        value={email}
                        onChangeText={setEmail}
                        icon={<MaterialIcons name="alternate-email" size={20} color="#666" style={styles.icon} />}
                        keyboardType="email-address"
                    />
                    <InputField
                        label={'Phone Number'}
                        value={phoneNumber}
                        onChangeText={setPhoneNumber}
                        icon={<Ionicons name="call-outline" size={20} color="#666" style={styles.icon} />}
                        keyboardType="phone-pad"
                    />
                    <InputField
                        label={'IC Number'}
                        value={icNumber}
                        onChangeText={setIcNumber}
                        icon={<Ionicons name="id-card-outline" size={20} color="#666" style={styles.icon} />}
                    />
                </View>

                {/* Address Section */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Address</Text>
                    <InputField
                        label={'Street Address'}
                        value={street}
                        onChangeText={setStreet}
                        icon={<Ionicons name="home-outline" size={20} color="#666" style={styles.icon} />}
                    />
                    <InputField
                        label={'City'}
                        value={city}
                        onChangeText={setCity}
                        icon={<Ionicons name="location-outline" size={20} color="#666" style={styles.icon} />}
                    />
                    <InputField
                        label={'Postal Code'}
                        value={postalCode}
                        onChangeText={setPostalCode}
                        icon={<Ionicons name="mail-outline" size={20} color="#666" style={styles.icon} />}
                    />
                </View>



                <CustomButton
                    label={'Save Profile'}
                    onPress={() => {
                        if (validateProfileUpdate()) {
                            // Proceed with updating profile (e.g., make an API call or save to local storage)
                            Alert.alert('Success', 'Profile updated successfully');
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
    imageContainer: {
        alignItems: 'center',
        marginBottom: 20,
    },
    profileImage: {
        height: 300,
        width: 300,
        transform: [{ rotate: '-5deg' }],
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
    sectionTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#333',
        marginBottom: 10,
    },
    icon: {
        marginRight: 5,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginBottom: 30,
    },
    footerLink: {
        color: '#AD40AF',
        fontWeight: '700',
    },
});

export default ManageProfile;