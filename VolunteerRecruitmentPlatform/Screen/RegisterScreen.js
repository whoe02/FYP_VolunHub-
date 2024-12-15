import React, { useState, useEffect } from 'react';
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Image,
  Alert,
  StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Ionicons from 'react-native-vector-icons/Ionicons';
import CustomButton from '../components/CustomButton';
import InputField from '../components/InputField';
import DateTimePicker from '@react-native-community/datetimepicker';
import { getDocs, collection, query, where, setDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Your Firestore config
import { useCameraPermissions } from 'expo-camera';

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

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [userId, setUserId] = useState('');

  const [secretQuestion, setSecretQuestion] = useState(0);
  const [secretAnswer, setSecretAnswer] = useState('');

  const [isFaceDataAdded, setIsFaceDataAdded] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const [address, setAddress] = useState(null);
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await requestPermission();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Camera access is denied. Please enable it in the settings.');
      }
    };
    
    requestCameraPermission(); // Request permission explicitly
  }, []);
  
  useEffect(() => {
    const fetchLatestUserId = async () => {
      let prefix = '';
      switch (role) {
        case 'volunteer':
          prefix = 'VL';
          break;
        case 'organization':
          prefix = 'OG';
          break;
        case 'admin':
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

  const navigateToLocationScreen = () => {
    navigation.navigate('LocationSelection', {
      onLocationSelected: (address, latitude, longitude) => {
        // This function will be executed when location is confirmed
        setAddress(address);
        setLatitude(latitude);  // Update latitude separately
        setLongitude(longitude);  // Update longitude separately
      },
    });
  };

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(false);
    setDate(currentDate);
    setDobLabel(currentDate.toLocaleDateString());
  };

  const handleAddFaceData = () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email first.');
      return;
    }
    if (permission?.status !== 'granted') {
      Alert.alert('Error', 'Camera permission is required to add face data.');
      return;
    }

    navigation.navigate('FaceTestingScreen', {
      email,
      onComplete: (status) => {
        setIsFaceDataAdded(status); // Update state based on face data status
        if (status) {
          Alert.alert('Success', 'Face data added successfully!');
        } else {
          Alert.alert('Error', 'Failed to add face data. Try again.');
        }
      },
    });
  };

  const validateRegistration = () => {
    if (!fullName || !email || !phoneNumber || !address || !password || !confirmPassword || !gender) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }

    if ((role === 'admin' || role === 'volunteer') && !icNumber) {
      Alert.alert('Error', 'Please enter your IC Number');
      return false;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return false;
    }

    const phoneRegex = /^[0-9]{9,12}$/;
    if (!phoneRegex.test(phoneNumber)) {
      Alert.alert('Error', 'Phone number must be between 9 to 12 digits');
      return false;
    }

    // Validate Age: Ensure user is at least 18 years old
    const today = new Date();
    const age = today.getFullYear() - date.getFullYear();
    const m = today.getMonth() - date.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    if (age < 18) {
      Alert.alert('Error', 'You must be select the date of birth and at least 18 years old');
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
        Alert.alert('Error', 'Email already exists please take other email...');
        return;
      }
      if (role=='volunteer' && !isFaceDataAdded) {
        Alert.alert('Error', 'Please add your face data before registering.');
        return;
      }

      const userData = {
        userId,
        name:fullName,
        email,
        phoneNumber,
        address,
        gender,
        birthDate: date.toLocaleDateString(),
        password,
        role,
        status: 'active',
        secretQuestion,
        secretAnswer,
        image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg',
      };

      if (role === 'volunteer') {
        userData.icNumber = icNumber;
        userData.rewardPoint = 0;
        userData.location = [];
        userData.preference = [];
        userData.skills = [];
      } else if (role === 'organization') {
        userData.businessType = '';
      } else if (role === 'admin') {
        userData.icNumber = icNumber;
      }

      try {
        if (role === 'volunteer') {
          const response = await fetch('https://fair-casual-garfish.ngrok-free.app/register', {
          // const response = await fetch('http://192.168.0.12:5000/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(userData),
          });

          if (!response.ok) {
            const errorData = await response.json();
            Alert.alert('Error', errorData.message || 'Registration failed. Please add face data.');
            return;
          }
        }
        // Create the user document
        const userDocRef = doc(firestore, 'User', userData.userId);
        await setDoc(userDocRef, userData);

        // If role is Volunteer, initialize the usersReward subcollection
        if (role === 'volunteer') {
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
      <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 40 }}>
        {/* <View style={{ alignItems: 'center', marginBottom: 0 }}>
          <Image
            source={loginImage}
            style={{ height: 200, width: 300, marginTop: 20 }}
            resizeMode="contain"
          />
        </View> */}

        <Text
          style={{
            fontFamily: 'Roboto-Medium',
            fontWeight: 'bold',
            fontSize: 22,
            color: '#4CAF50',
            marginTop: 30,
            marginVertical: 25,
            textAlign: 'center',
          }}
        >
          {role.toUpperCase()}
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
        {role !== 'organization' && (
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
          }}
        >
          <Ionicons name="male-female-outline" size={20} color="#666" />
          <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={{ flex: 1, color: gender ? '#333' : '#666', marginLeft: 3 }}>
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
            paddingVertical: 15,
            marginBottom: 10,
          }}
        >
          <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
          <TouchableOpacity onPress={() => setShow(true)}>
            <Text style={{ color: '#666', marginLeft: 10, fontSize: 16 }}>{dobLabel}</Text>
          </TouchableOpacity>
        </View>
        {show && <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />}

        <View style={styles.pickerButtonStyle}>
          <Ionicons name="location-outline" size={25} color="#666" style={{marginRight:15}} />
          <TouchableOpacity onPress={navigateToLocationScreen}>
            <Text style={styles.addressButtonText}>
              {address || 'Select Address'}
            </Text>
          </TouchableOpacity>
        </View>

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
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          marginTop: 30
        }}>Choose a secret question</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
          <Ionicons name="help-circle-outline" size={20} color="#666" />
          <Picker selectedValue={secretQuestion} onValueChange={(itemValue) => setSecretQuestion(itemValue)} style={{ flex: 1, color: secretQuestion ? '#333' : '#666' }}>
            <Picker.Item label="What is your favorite movie?" value={0} />
            <Picker.Item label="What was the name of your first pet?" value={1} />
            <Picker.Item label="What is your mother's maiden name?" value={2} />
          </Picker>
        </View>
        <Text style={{
          fontSize: 16,
          fontWeight: '500',
          marginTop: 10
        }}>Answer</Text>
        <View style={{ marginBottom: 50 }}>
          <InputField
            icon={<Ionicons name="create-outline" size={22} color="#666" style={{ marginRight: 5 }} />}
            label="Answer"
            value={secretAnswer}
            onChangeText={setSecretAnswer}
          />
        </View>

        {role === 'volunteer' && (
          <CustomButton
            variant='outline'
            label="Add Face Data"
            title={isFaceDataAdded ? 'Face Data Added ✔' : 'Add Face Data'}
            onPress={handleAddFaceData}
          />
        )}

        <CustomButton label="Register" onPress={handleRegister} disabled={!isFaceDataAdded} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', marginVertical: 30 }}>
          <Text>Already have an account?</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={{ color: '#4CAF50', fontWeight: '700', marginLeft: 5 }}>Login</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  pickerButtonStyle:{
    flexDirection: 'row',
    borderBottomColor: '#ccc',
    borderBottomWidth: 1,
    paddingVertical: 15,
    marginBottom: 10,
  }
});
export default RegisterScreen;
