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

  const [secretQuestion, setSecretQuestion] = useState(0);
  const [secretAnswer, setSecretAnswer] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    // Basic validation to ensure all fields are filled
    if (email.trim() === '') {
      Alert.alert('Error', 'Please fill in email');
      return;
    }

    // Check if the email is valid
    if (!/^[\w-]+(\.[\w-]+)*@([\w-]+\.)+[a-zA-Z]{2,7}$/.test(email)) {
      Alert.alert('Error', 'Please enter a valid email address');
      return;
    }
    setLoading(true);
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
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <View style={{ alignItems: 'center', marginBottom: 0 }}>
        <Image
          source={loginImage}
          style={{ height: 200, width: 300, marginBottom: 0, marginTop: -40 }}
          resizeMode="contain"
        />
      </View>
      <View>
        <Text style={styles.label}>{"\n"}Email:</Text>
        <InputField
          icon={<Ionicons name="mail-outline" size={22} color="#666" style={{ marginRight: 5 }} />}

          label="Enter Email"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
      </View>

      {/* Secret Question and Answer */}
      <Text style={styles.label}>{"\n"}Choose a secret question:</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#ccc' }}>
        <Ionicons name="help-circle-outline" size={20} color="#666" />
        <Picker selectedValue={secretQuestion} onValueChange={(itemValue) => setSecretQuestion(itemValue)} style={{ flex: 1, color: secretQuestion ? '#333' : '#666' }}>
          <Picker.Item label="What is your favorite movie?" value={0} />
          <Picker.Item label="What was the name of your first pet?" value={1} />
          <Picker.Item label="What is your mother's maiden name?" value={2} />
        </Picker>
      </View>
      <Text style={styles.label}>{"\n"}Answer:</Text>
      <View style={{ marginBottom: 50 }}>
        <InputField
          icon={<Ionicons name="create-outline" size={22} color="#666" style={{ marginRight: 5 }} />}
          label="Answer"
          value={secretAnswer}
          onChangeText={setSecretAnswer}
        />
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" style={{ marginVertical: 20 }} />
      ) : (
        <CustomButton label="Submit" onPress={handleSubmit} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    flex: 1,
    padding: 20,
    paddingHorizontal: 40
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ForgotPasswordScreen;
