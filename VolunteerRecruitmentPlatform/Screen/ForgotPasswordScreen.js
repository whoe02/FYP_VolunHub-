import React, { useState } from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';

const VerificationScreen = ({ navigation }) => {
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationCodeSent, setVerificationCodeSent] = useState('1');
  const [email, setEmail] = useState('');
  const loginImage = require('../assets/misc/login.png'); 

  const handleVerify = () => {
    console.log("Email:", email);  // Log the email value
    console.log("Verification Code:", verificationCode);  // Log the verification code

    if (email.trim() === '') {
      alert('Please fill in the email');
    } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      alert('Please enter a valid email address');
    } else {
      alert('Verification Code Sent');
    }
  };

  const handleSubmit = () => {

    if (email.trim() === '' || verificationCode.trim() === '') {
      alert('Please fill in both the email and the verification code.');
    } else if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      alert('Please enter a valid email address');
    } else if (verificationCode === verificationCodeSent){
      navigation.navigate('ChangePassword');
    } else {
      alert('Wrong Verification Code(1)');
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

      {/* Pass value and onChangeText for email */}
      <InputField
        label="Enter Email"
        keyboardType="email-address"
        value={email} // Passing the email state
        onChangeText={setEmail} // Updating the state on text change
      />

      <Text style={styles.label}>Enter Verification Code:</Text>

      <View style={styles.verifyContainer}>
        {/* Pass value and onChangeText for verification code */}
        <InputField
          label="Enter Verification Code"
          keyboardType="number-pad"
          value={verificationCode} // Passing the verification code state
          onChangeText={setVerificationCode} // Updating the state on text change
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

export default VerificationScreen;
