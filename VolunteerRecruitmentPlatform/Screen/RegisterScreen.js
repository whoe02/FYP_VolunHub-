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

  useEffect(() => {
    // Fetch the latest userId for the role selected (volunteer, organization, admin)
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

      // Collect all userIds with the specific prefix
      usersQuerySnapshot.forEach((doc) => {
        const userData = doc.data();
        if (userData.userId.startsWith(prefix)) {
          const userId = userData.userId;
          ids.push(parseInt(userId.slice(2))); // Extract the numeric part
        }
      });

      if (ids.length === 0) {
        // If no user exists for the role, start from 1
        setUserId(`${prefix}00001`);
      } else {
        // Increment the highest userId by 1
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
    if (!fullName || !email || !phoneNumber || !icNumber || !street || !city || !postalCode || !password || !confirmPassword || !gender) {
      Alert.alert('Error', 'Please fill in all fields');
      return false;
    }
    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return false;
    }
    return true;
  };

  // Function to check if email is unique
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

      // Combine street, city, and postal code into a single address string
      const fullAddress = `${street}, ${city}, ${postalCode}`;

      const userData = {
        userId,
        fullName,
        email,
        phoneNumber,
        icNumber,
        address: fullAddress, // Store combined address
        rewardPoint: 0,
        gender,
        birthDate: date.toLocaleDateString(),
        password,
        role,
        status: 'active',
        image: 'https://res.cloudinary.com/dnj0n4m7k/image/upload/v1731663774/UserProfilePic/fx8qvjepyyb4ifakjv3i.jpg', 
      };

      // Save user data to Firestore
      try {
        await setDoc(doc(firestore, 'User', userData.userId), userData);
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
        <InputField
          label={'IC Number'}
          value={icNumber}
          onChangeText={setIcNumber}
          icon={<Ionicons name="id-card-outline" size={20} color="#666" style={{ marginRight: 10 }} />}
        />
        <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomColor: '#ccc', borderBottomWidth: 1, marginBottom: 10, marginTop: -20 }}>
          <Ionicons name="male-female-outline" size={20} color="#666" style={{ marginRight: 10 }} />
          <Picker selectedValue={gender} onValueChange={(itemValue) => setGender(itemValue)} style={{ flex: 1, color: gender ? '#333' : '#666' }}>
            <Picker.Item label="Select Gender" value="" color="#aaa" />
            <Picker.Item label="Male" value="Male" />
            <Picker.Item label="Female" value="Female" />
            <Picker.Item label="Other" value="Other" />
          </Picker>
        </View>

        <View style={{ flexDirection: 'row', borderBottomColor: '#ccc', borderBottomWidth: 1, paddingBottom: 8, marginBottom: 20, marginTop: 10 }}>
          <Ionicons name="calendar-outline" size={20} color="#666" style={{ marginRight: 10 }} />
          <TouchableOpacity onPress={() => setShow(true)}>
            <Text style={{ color: '#666', marginLeft: 5, marginTop: 5 }}>{dobLabel}</Text>
          </TouchableOpacity>
        </View>
        {show && <DateTimePicker value={date} mode="date" display="default" onChange={onChange} />}

        <InputField label={'Street'} value={street} onChangeText={setStreet} icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />} />
        <InputField label={'City'} value={city} onChangeText={setCity} icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />} />
        <InputField label={'Postal Code'} value={postalCode} onChangeText={setPostalCode} icon={<Ionicons name="location-outline" size={20} color="#666" style={{ marginRight: 10 }} />} keyboardType="numeric" />
        <InputField label={'Password'} value={password} onChangeText={setPassword} icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />} secureTextEntry />
        <InputField label={'Confirm Password'} value={confirmPassword} onChangeText={setConfirmPassword} icon={<Ionicons name="lock-closed-outline" size={20} color="#666" style={{ marginRight: 10 }} />} secureTextEntry />

        <CustomButton label="Register" onPress={handleRegister} />
      </ScrollView>
    </SafeAreaView>
  );
};

export default RegisterScreen;
