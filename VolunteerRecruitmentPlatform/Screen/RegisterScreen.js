import React, { useState } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import { StatusBar } from 'expo-status-bar';

const loginImage = require('../assets/misc/login.png'); 

const RegisterScreen = ({ navigation }) => {
  // Date of birth state
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [dobLabel, setDobLabel] = useState('Date of Birth');

  // Personal info states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [icNumber, setIcNumber] = useState('');
  // Address states
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  // Password states
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Date picker functions
  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
    setDobLabel(currentDate.toLocaleDateString()); // Update the date label after picking a date
  };

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

  // Date of Birth validation (must pick a date)
  const isValidDateOfBirth = () => {
    return dobLabel !== 'Date of Birth'; // Ensure date is picked
  };

  // Validation for registration
  const validateRegistration = () => {
    if (!fullName || !email || !phoneNumber || !icNumber || !street || !city || !postalCode || !password || !confirmPassword) {
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

    if (!isValidDateOfBirth()) {
      Alert.alert('Error', 'Please pick a valid date of birth');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters long');
      return false;
    }

    return true;
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        style={{ paddingHorizontal: 25 }}
      >
        <View style={{ alignItems: 'center', marginBottom: 20 }}>
          <Image
            source={loginImage}
            style={{ height: 300, width: 300, transform: [{ rotate: '-5deg' }] }}
          />
        </View>

        <Text
          style={{
            fontFamily: 'Roboto-Medium',
            fontSize: 28,
            fontWeight: '500',
            color: '#333',
            marginBottom: 30,
            textAlign: 'center',
          }}
        >
          Register
        </Text>

        {/* Personal Information Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 }}>
            Personal Information
          </Text>
          <InputField
            label={'Full Name'}
            value={fullName}
            onChangeText={setFullName}
            icon={<Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
          />
          <InputField
            label={'Email ID'}
            value={email}
            onChangeText={setEmail}
            icon={<MaterialIcons name="alternate-email" size={20} color="#666" style={{ marginRight: 5 }} />}
            keyboardType="email-address"
          />
          <InputField
            label={'Phone Number'}
            value={phoneNumber}
            onChangeText={setPhoneNumber}
            icon={<Ionicons name="call-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
            keyboardType="phone-pad"
          />
          <InputField
            label={'IC Number'}
            value={icNumber}
            onChangeText={setIcNumber}
            icon={<Ionicons name="id-card-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
          />

          {/* Date of Birth Picker */}
          <View
            style={{
              flexDirection: 'row',
              borderBottomColor: '#ccc',
              borderBottomWidth: 1,
              paddingBottom: 8,
              marginBottom: 30,
            }}
          >
            <Ionicons
              name="calendar-outline"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
            <TouchableOpacity onPress={() => setShow(true)}>
              <Text style={{ color: '#666', marginLeft: 5, marginTop: 5 }}>
                {dobLabel}
              </Text>
            </TouchableOpacity>
          </View>
          {show && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={onChange}
            />
          )}
        </View>

        {/* Address Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 }}>
            Address
          </Text>
          <InputField
            label={'Street Address'}
            value={street}
            onChangeText={setStreet}
            icon={<Ionicons name="home-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
          />
          <InputField
            label={'City'}
            value={city}
            onChangeText={setCity}
            icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
          />
          <InputField
            label={'Postal Code'}
            value={postalCode}
            onChangeText={setPostalCode}
            icon={<Ionicons name="mail-outline" size={20} color="#666" style={{ marginRight: 5 }} />}
          />
        </View>

        {/* Password Section */}
        <View style={{ marginBottom: 20 }}>
          <Text style={{ fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 10 }}>
            Password
          </Text>
          <InputField
            label={'Password'}
            value={password}
            onChangeText={setPassword}
            icon={<Ionicons name="lock-closed" size={20} color="#666" style={{ marginRight: 5 }} />}
            inputType="password"
          />
          <InputField
            label={'Confirm Password'}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            icon={<Ionicons name="lock-closed" size={20} color="#666" style={{ marginRight: 5 }} />}
            inputType="password"
          />
        </View>

        <CustomButton
          label={'Register'}
          onPress={() => {
            if (validateRegistration()) {
              // Proceed with registration (e.g., navigate to login page or submit data)
              Alert.alert('Success', 'Registration Successful');
              navigation.goBack(); // Or navigate to another screen
            }
          }}
        />

        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          <Text>Already registered?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#AD40AF', fontWeight: '700' }}> Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
