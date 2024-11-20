import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import InputField from '../components/InputField'; 
import CustomButton from '../components/CustomButton'; 
import { doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore config

const ChangePasswordScreen = ({ route, navigation }) => {
  const { userData } = route.params; // Access user data passed from ForgotPasswordScreen
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    console.log('Received user data:', userData); // For debugging purpose
  }, []);

  const handleSubmit = async () => {
    if (!password || !confirmPassword) {
      Alert.alert("Error", "Password and confirm password cannot be empty");
      return;
    }

    if (password === confirmPassword) {
      try {
        const { userId } = userData; // Access userId from userData

        if (!userId) {
          Alert.alert("Error", "User ID is missing");
          return;
        }

        // Update the password in Firestore
        const userRef = doc(firestore, 'User', userId); // Use userId for document reference
        await updateDoc(userRef, {
          password: password, // Update password
        });

        Alert.alert("Success", "Password changed successfully");
        navigation.navigate('Login'); // Navigate to Login screen after password update
      } catch (error) {
        console.error("Error updating password: ", error);
        Alert.alert("Error", "Failed to update password");
      }
    } else {
      Alert.alert("Error", "Passwords do not match");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter New Password:</Text>
      <InputField
        label="Enter New Password"
        inputType="password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>Confirm Password:</Text>
      <InputField
        label="Confirm Password"
        inputType="password"
        secureTextEntry
        value={confirmPassword}
        onChangeText={setConfirmPassword}
      />

      {/* Submit Button */}
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
});

export default ChangePasswordScreen;
