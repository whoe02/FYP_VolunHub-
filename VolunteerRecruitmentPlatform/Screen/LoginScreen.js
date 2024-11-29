import React, { useState, useContext,useEffect } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import CheckBox from '@react-native-community/checkbox';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { getDoc, getDocs, collection, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; 
import { UserContext } from '../UserContext'; // Import UserContext
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';

const loginImage = require('../assets/misc/login.png');

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); 
  const [rememberMe, setRememberMe] = useState(false); 
  
  const { setUser } = useContext(UserContext); 
  
  useEffect(() => {
    const loadUserData = async () => {
      const storedEmail = await AsyncStorage.getItem('email');
      const storedPassword = await AsyncStorage.getItem('password');
      if (storedEmail && storedPassword) {
        setEmail(storedEmail);
        setPassword(storedPassword);
        setRememberMe(true); // Automatically check the "Remember Me" option
      }
    };

    loadUserData();
  }, []);

  const isValidEmail = (email) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return regex.test(email);
  };

  const handleLogin = async () => {
    // if (email.trim() === '' || password.trim() === '') {
    //   Alert.alert('Error', 'Please fill in all fields');
    //   return;
    // }

    // if (!isValidEmail(email)) {
    //   Alert.alert('Error', 'Please enter a valid email');
    //   return;
    // }

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
      
      if (rememberMe) {
        await AsyncStorage.setItem('email', email);
        await AsyncStorage.setItem('password', password);
      } else {
        await AsyncStorage.removeItem('email');
        await AsyncStorage.removeItem('password');
      }

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
        <View style={{marginBottom:-40}}>
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
            inputType="password"  // Specify the type as password
            icon={<Ionicons name="lock-closed" size={20} color="#666" style={{ marginRight: 5 }} />}
            secureTextEntry={!showPassword}  // Use showPassword to toggle visibility
            fieldButtonLabel={<Ionicons name={showPassword ? 'eye' : 'eye-off'} size={20} color="#666" />}
            fieldButtonFunction={() => setShowPassword(!showPassword)}  // Toggle the visibility state
            value={password}
            onChangeText={setPassword}
          />
        </View>


        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 25 }}>
          {/* Remember Me */}
          <TouchableOpacity
            onPress={() => setRememberMe(!rememberMe)}
            style={{ flexDirection: 'row', alignItems: 'center' }}
          >
            <Ionicons
              name={rememberMe ? 'checkbox' : 'square-outline'}
              size={24}
              color={rememberMe ? '#95c194' : '#ccc'}
            />
            <Text style={{ marginLeft: 8 }}>Remember Me</Text>
          </TouchableOpacity>

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => navigation.navigate('Forgot')}>
            <Text style={{ color: '#95c194', fontWeight: '500' }}>Forgot?</Text>
          </TouchableOpacity>
        </View>

        <CustomButton label={'Login'} onPress={handleLogin} />

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
