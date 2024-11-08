import React, { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import InputField from '../components/InputField'; 
import CustomButton from '../components/CustomButton'; 

const ChangePasswordScreen = ({ navigation }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (!password || !confirmPassword) {
      alert("Password and confirm password cannot be empty");
      return;
    }

    if (password === confirmPassword) {
      alert("Password changed successfully");
      navigation.navigate('Login');
    } else {
      alert("Passwords do not match");
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
