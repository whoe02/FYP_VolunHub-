import React, { useState, useContext } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDoc, getDocs, collection, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; 
import { UserContext } from '../UserContext'; // Import UserContext

import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';

const loginImage = require('../assets/misc/login.png');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { setUser } = useContext(UserContext); // Use setUser to store user data

  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    if (email.trim() === '' || password.trim() === '') {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    if (!isValidEmail(email)) {
      Alert.alert('Error', 'Please enter a valid email');
      return;
    }

    try {
      const usersQuery = await getDocs(collection(firestore, 'User'));
      let userDocRef = null;

      usersQuery.forEach((docSnapshot) => {
        const userData = docSnapshot.data();
        if (userData.email === email) {
          userDocRef = doc(firestore, 'User', docSnapshot.id);
        }
      });

      if (!userDocRef) {
        Alert.alert('Error', 'User not found');
        return;
      }

      const userDoc = await getDoc(userDocRef);
      const userData = userDoc.data();

      if (password !== userData.password) {
        Alert.alert('Error', 'Invalid email or password');
        return;
      }

      // Set the user data in context
      setUser(userData); 
      
      Alert.alert('Login Successful', 'You have logged in successfully');
      
      // Navigate to the main screen after successful login
      navigation.replace('VolunHub'); 
    } catch (error) {
      console.error('Error logging in:', error);
      Alert.alert('Error', 'Something went wrong. Please try again later');
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <View style={{ paddingHorizontal: 25 }}>
        <View style={{ alignItems: 'center' }}>
          <Image
            source={loginImage}
            style={{ height: 200, width: 500, transform: [{ rotate: '-5deg' }] }}
            resizeMode="contain"
          />
        </View>

        <Text
          style={{
            fontFamily: 'Roboto-Medium',
            fontSize: 28,
            fontWeight: '500',
            color: '#333',
            marginBottom: 30,
          }}
        >
          Login
        </Text>

        <InputField
          label={'Email ID'}
          icon={<MaterialIcons name="mail" size={20} color="#666" style={{ marginRight: 5 }} />}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        <InputField
          label={'Password'}
          icon={<Ionicons name="lock-closed" size={20} color="#666" style={{ marginRight: 5 }} />}
          inputType="password"
          fieldButtonLabel={"Forgot?"}
          fieldButtonFunction={() => { navigation.navigate('Forgot') }}
          value={password}
          onChangeText={setPassword}
        />

        <CustomButton label={"Login"} onPress={handleLogin} />

        <Text style={{ textAlign: 'center', marginVertical: 15 }}>
          Or, sign up as{' '}
          <Text
            style={{ color: '#95c194', fontWeight: '700' }}
            onPress={() => navigation.navigate('Register', { role: 'Volunteer' })}
          >
            Volunteer
          </Text>{' '}
          or{' '}
          <Text
            style={{ color: '#95c194', fontWeight: '700' }}
            onPress={() => navigation.navigate('Register', { role: 'Organization' })}
          >
            Organization
          </Text>
        </Text>
      </View>
    </SafeAreaView>
  );
};

export default LoginScreen;
