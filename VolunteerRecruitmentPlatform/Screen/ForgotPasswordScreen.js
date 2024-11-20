import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore config

const loginImage = require('../assets/misc/login.png'); 

const ForgotPasswordScreen = ({ navigation }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeSent, setVerificationCodeSent] = useState('');
  const [email, setEmail] = useState('');
  const [userData, setUserData] = useState(null); // To store the user data

  const generateVerificationCode = () => {
    // Generate a 6-digit random verification code
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const handleVerify = async () => {
    if (email.trim() === '') {
      Alert.alert('Error', 'Please fill in the email');
      return;
    }
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }

    // Check if the email exists in the Firestore database
    const q = query(collection(firestore, 'User'), where('email', '==', email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      Alert.alert('Error', 'Email not found');
      return;
    }

    // User exists, generate verification code
    const verificationCodeGenerated = generateVerificationCode();
    setVerificationCodeSent(verificationCodeGenerated);

    // Optionally, you can send the verification code to the user's email via a service
    console.log('Verification Code Sent:', verificationCodeGenerated);
    // For example, here you would integrate with an email service like Firebase functions

    Alert.alert('Success', 'Verification Code Sent');
  };

  const handleSubmit = () => {
    if (email.trim() === '' || verificationCode.trim() === '') {
      Alert.alert('Error', 'Please fill in both the email and the verification code');
      return;
    }

    if (verificationCode === verificationCodeSent) {
      // Fetch the user data and navigate to the ChangePassword screen
      const fetchUserData = async () => {
        const q = query(collection(firestore, 'User'), where('email', '==', email));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const user = querySnapshot.docs[0].data(); // Get user data
          setUserData(user); // Store user data

          navigation.navigate('ChangePassword', { userData: user }); // Pass the user data to the next screen
        }
      };

      fetchUserData();
    } else {
      Alert.alert('Error', 'Wrong Verification Code');
    }
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center' }}>
        <Image
          source={loginImage}
          style={{ height: 200, width: 500, transform: [{ rotate: '-5deg' }] }}
          resizeMode="contain"
        />
      </View>

      <Text style={styles.label}>{"\n"}Email:</Text>

      <InputField
        label="Enter Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>Enter Verification Code:</Text>

      <View style={styles.verifyContainer}>
        <InputField
          label="Enter Verification Code"
          keyboardType="number-pad"
          value={verificationCode}
          onChangeText={setVerificationCode}
        />
        <CustomButton
          label="Verify"
          onPress={handleVerify}
          style={{ flex: 0.5 }}
        />
      </View>

      <CustomButton
        label="Submit"
        onPress={handleSubmit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  verifyContainer: {
    flexDirection: 'row',      
    alignItems: 'center',         
    justifyContent: 'space-between', 
    marginBottom: 20,
    maxWidth: 300,
  },
});

export default ForgotPasswordScreen;
