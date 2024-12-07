import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDocs, collection, query, where, setDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore config

const loginImage = require('../assets/misc/login.png');

const RegisterScreen = ({ route, navigation }) => {
  const { role } = route.params; // Get the role from route params

  const [gender, setGender] = useState('');
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);
  const [dobLabel, setDobLabel] = useState('Date of Birth');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [icNumber, setIcNumber] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [secretQuestion, setSecretQuestion] = useState('');
  const [secretAnswer, setSecretAnswer] = useState('');

  useEffect(() => {
    const fetchLatestUserId = async () => {
      let prefix = '';
      switch (role) {
        case 'Volunteer':
          prefix = 'VL';
          break;
        case 'Organization':
          prefix = 'OG';
          break;
        case 'Admin':
          prefix = 'AD';
          break;
      }

      const usersQuerySnapshot = await getDocs(collection(firestore, 'User'));
      const ids = [];

      usersQuerySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.userId.startsWith(prefix)) {
          const userId = userData.userId;
          ids.push(parseInt(userId.slice(2))); // Extract the numeric part
        }
      });

      if (ids.length === 0) {
        setUserId(`${prefix}00001`);
      } else {
        const maxId = Math.max(...ids);
        setUserId(`${prefix}${String(maxId + 1).padStart(5, '0')}`);
      }
    };

    fetchLatestUserId();
  }, [role]);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
    setDobLabel(currentDate.toLocaleDateString());
  };

  const validateRegistration = () => {
    if (!fullName || !email || !phoneNumber || !street || !city || !postalCode || !password || !confirmPassword || !gender) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (role === 'Volunteer' || role === 'Admin') {
      if (!icNumber) {
        Alert.alert('Error', 'IC Number is required for this role');
        return false;
      }
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  const isEmailUnique = async (email) => {
    const q = query(collection(firestore, 'User'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    return querySnapshot.empty; // Return true if the email is unique
  };

  const handleRegister = async () => {
    if (validateRegistration()) {
      const emailUnique = await isEmailUnique(email);
      if (!emailUnique) {
        Alert.alert('Error', 'Email already exists');
        return;
      }
  
      const fullAddress = `${street}, ${city}, ${postalCode}`;
      const userData = {
        userId,
        fullName,
        email,
        phoneNumber,
        address: fullAddress,
        gender,
        birthDate: date.toLocaleDateString(),
        password,
        role,
        status: 'active',
        secretQuestion,
        secretAnswer, 
        image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg',
      };
  
      if (role === 'Volunteer') {
        userData.icNumber = icNumber;
        userData.rewardPoint = 0;
        userData.location = [];
        userData.preference = [];
        userData.skills = [];
      } else if (role === 'Organization') {
        userData.businessType = '';
      } else if (role === 'Admin') {
        userData.icNumber = icNumber;
      }
  
      try {
        // Create the user document
        const userDocRef = doc(firestore, 'User', userData.userId);
        await setDoc(userDocRef, userData);
  
        // If role is Volunteer, initialize the usersReward subcollection
        if (role === 'Volunteer') {
          const usersRewardRef = collection(userDocRef, 'usersReward');
          await setDoc(doc(usersRewardRef, 'usersReward'), {
            userRewardId: '',            
            rewardCode: '',         
            title: '',              
            description: '',         
            expirationDate: '',      
            userRewardId: '',        
            pointsRequired: 0,        
            image: ''                
          });
        }
  
        Alert.alert('Success', 'Registration Successful');
        navigation.goBack();
      } catch (error) {
        console.error('Error adding document: ', error);
        Alert.alert('Error', 'Registration failed. Please try again.');
      }
    }
  };
  

  return (
    <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 25 }}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Image
            source={loginImage}
            style={{
              height: 280,
              width: 280,
              transform: [{ rotate: '-5deg' }],
            }}
          />
        </View>

        <Text
          style={{
            fontFamily: 'Roboto-Medium',
            fontSize: 28,
            fontWeight: '500',
            color: '#6a8a6d',
            marginBottom: 15,
            textAlign: 'center',
          }}
        >
          {role}
        </Text>

        <InputField
          label={'Full Name'}
          value={fullName}
          onChangeText={setFullName}
          icon={<Ionicons name="person-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
        />
        <InputField
          label={'Email ID'}
          value={email}
          onChangeText={setEmail}
          icon={<MaterialIcons name="alternate-email" size={20} color="#666" style={{ marginRight: 10 }} />}
          keyboardType="email-address"
        />
        <InputField
          label={'Phone Number'}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          icon={<Ionicons name="call-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
          keyboardType="phone-pad"
        />
        {role !== 'Organization' && (
          <InputField
            label={'IC Number'}
            value={icNumber}
            onChangeText={setIcNumber}
            icon={<Ionicons name="id-card-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
          />
        )}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            borderBottomColor: '#ccc',
            borderBottomWidth: 1,
            marginBottom: 10,
            marginTop: -20,
          }}
        >
          <Ionicons name="male-female-outline" size={20} color="#666" />
          <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={{ flex: 1, color: gender ? '#333' : '#666' }}>
            <Picker.Item label="Select Gender" value="" color="#aaa" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <View
          style={{
            flexDirection: 'row',
            borderBottomColor: '#ccc',
            borderBottomWidth: 1,
            paddingBottom: 8,
            marginBottom: 20,
            marginTop: 10,
          }}
        >
          <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
          <TouchableOpacity onPress={() => setShow(true)}>
            <Text style={{ color: '#666', marginLeft: 5, marginTop: 5 }}>{dobLabel}</Text>
          </TouchableOpacity>
        </View>
        {show && <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />}

        <InputField
          label={'Street'}
          value={street}
          onChangeText={setStreet}
          icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
        />
        <InputField
          label={'City'}
          value={city}
          onChangeText={setCity}
          icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
        />
        <InputField
          label={'Postal Code'}
          value={postalCode}
          onChangeText={setPostalCode}
          icon={<Ionicons name="mail-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
        />

        <InputField
          label={'Password'}
          value={password}
          onChangeText={setPassword}
          icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
          secureTextEntry={true}
        />
        <InputField
          label={'Confirm Password'}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
          secureTextEntry={true}
        />

        {/* Secret Question and Answer */}
        <Text style={{ marginBottom: 10 }}>Choose a secret question</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc',marginBottom:20 }}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Picker selectedValue={secretQuestion} onValueChange={(itemValue) => setSecretQuestion(itemValue)} style={{ flex: 1, color: secretQuestion ? '#333' : '#666' }}>
            <Picker.Item label="What is your favorite movie?" value={0}  />
            <Picker.Item label="What was the name of your first pet?" value={1}  />
            <Picker.Item label="What is your mother's maiden name?" value={2}  />
          </Picker>
        </View>
        <InputField
          label="Answer"
          value={secretAnswer}
          onChangeText={setSecretAnswer}
        />

        <CustomButton label="Register" onPress={handleRegister} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 30 }}>
          <Text>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#6a8a6d', fontWeight: '700', marginLeft: 5 }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
