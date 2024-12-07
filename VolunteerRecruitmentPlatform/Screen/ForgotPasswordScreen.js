import React, { useState } from 'react';
import { Picker } from '@react-native-picker/picker';
import { View, Text, StyleSheet, Image, Alert } from 'react-native';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { getDocs, query, where, collection } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore config
import Ionicons from 'react-native-vector-icons/Ionicons';

const loginImage = require('../assets/misc/login.png'); 

const ForgotPasswordScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');

  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');

  const handleSubmit = async () => {
    // Basic validation to ensure all fields are filled
    if (email.trim() === '' ) {
      Alert.alert('Error', 'Please fill in email');
      return;
    }
  
    // Check if the email is valid
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
  
    // Fetch the user data based on the email entered
    const fetchUserData = async () => {
      const q = query(collection(firestore, 'User'), where('email', '==', email));
      const querySnapshot = await getDocs(q);
  
      if (querySnapshot.empty) {
        Alert.alert('Error', 'Email not found');
        return;
      }
  
      // User data found, now check if secret question and answer match
      const user = querySnapshot.docs[0].data();
      if (user.secretQuestion !== secretQuestion || user.secretAnswer !== secretAnswer) {
        Alert.alert('Error', 'Secret question or answer is incorrect');
        return;
      }
  
      // If all validations pass, navigate to ChangePassword screen
      navigation.navigate('ChangePassword', { userData: user });
    };
  
    // Trigger the user data fetch and validation process
    fetchUserData();
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

      <View style={{ marginBottom: -15 }}> 
        <InputField
          label="Enter Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Secret Question and Answer */}
      <Text style={styles.label}>{"\n"}Choose a secret question:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc',marginBottom:25 }}>
        <Ionicons name="help-circle-outline" size={20} color="#666" />
        <Picker selectedValue={secretQuestion} onValueChange={(itemValue) => setSecretQuestion(itemValue)} style={{ flex: 1, color: secretQuestion ? '#333' : '#666' }}>
          <Picker.Item label="What is your favorite movie?" value={0} />
          <Picker.Item label="What was the name of your first pet?" value={1}  />
          <Picker.Item label="What is your mother's maiden name?" value={2}  />
        </Picker>
      </View>
      <InputField
        label="Answer"
        value={secretAnswer}
        onChangeText={setSecretAnswer}
      />

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
    marginBottom: 15,
  },
});

export default ForgotPasswordScreen;
