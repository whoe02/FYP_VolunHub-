import React, { useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,  // To show alert messages
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';

import CustomButton from '../components/CustomButton'; 
import InputField from '../components/InputField'; 

const loginImage = require('../assets/misc/login.png'); 
const googleImage = require('../assets/misc/google.png'); 
const facebookImage = require('../assets/misc/facebook.png'); 
const twitterImage = require('../assets/misc/twitter.png'); 

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Email validation regex
  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  // Login handler
  const handleLogin = () => {

    // if (email.trim() === '' || password.trim() === '') {
    //   Alert.alert('Error', 'Please fill in fields required');
    //   return;
    // }

    // if (!isValidEmail(email)) {
    //   Alert.alert('Error', 'Please enter a valid email');
    //   return;
    // }

    // Proceed with login if everything is fine
    Alert.alert('Login Successful', 'You have logged in successfully');
    // navigation.navigate('Home'); 
    navigation.replace('VolunHub'); 

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
          }}>
          {"\n"}
          Login
        </Text>

        {/* Email Input */}
        <InputField
          label={'Email ID'}
          icon={
            <MaterialIcons
              name="mail"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
          }
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />

        {/* Password Input */}
        <InputField
          label={'Password'}
          icon={
            <Ionicons
              name="lock-closed"
              size={20}
              color="#666"
              style={{ marginRight: 5 }}
            />
          }
          inputType="password"
          fieldButtonLabel={"Forgot?"}
          fieldButtonFunction={() => { navigation.navigate('Forgot') }}
          value={password}
          onChangeText={setPassword}
        />

        {/* Login Button */}
        <CustomButton label={"Login"} onPress={handleLogin} />

        <Text style={{ textAlign: 'center', color: '#666', marginBottom: 30 }}>
          Or, login with ...
        </Text>

        {/* Social Login Buttons */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 30 }}>
          <TouchableOpacity onPress={() => { }} style={styles.socialButton}>
            <Image source={googleImage} style={{ height: 24, width: 24 }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { }} style={styles.socialButton}>
            <Image source={facebookImage} style={{ height: 24, width: 24 }} resizeMode="contain" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { }} style={styles.socialButton}>
            <Image source={twitterImage} style={{ height: 24, width: 24 }} resizeMode="contain" />
          </TouchableOpacity>
        </View>

        {/* Register Link */}
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          <Text>New to the app?</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={{ color: '#95c194', fontWeight: '700' }}> Register</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

// Style for social buttons
const styles = {
  socialButton: {
    borderColor: '#ddd',
    borderWidth: 2,
    borderRadius: 10,
    paddingHorizontal: 30,
    paddingVertical: 10,
  },
};

export default LoginScreen;
