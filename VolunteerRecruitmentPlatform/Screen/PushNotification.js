import React, { useState } from 'react';
import { View, Text, TextInput, Alert, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { collection, getDocs, doc, addDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust path to your Firebase config

const PushNotification = () => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [content, setContent] = useState('');
  const [recipient, setRecipient] = useState('all'); // Default to "all"

  const saveNotificationToFirestore = async (userId, notificationData) => {
    try {
      const userRef = doc(firestore, 'User', userId);
      const notificationRef = collection(userRef, 'Notification');
      await addDoc(notificationRef, notificationData);
      console.log('Notification saved to Firestore successfully');
    } catch (error) {
      console.error('Error saving notification to Firestore:', error);
    }
  };
  
  const sendNotification = async (recipientToken, title, body, content) => {
    try {
      const messageBody = {
        to: recipientToken,
        sound: 'default',
        title,
        body,
        data: { content },
      };
  
      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };
  
  const handlePushNotification = async () => {
    if (!title || !body || !content) {
      Alert.alert('Validation Error', 'Please fill in all fields before sending.');
      return;
    }
  
    try {
      const usersQuery = await getDocs(collection(firestore, 'User'));
      const tokens = [];
      const notificationData = {
        title,
        body,
        content,
        type: 'announcement', // or 'event' if applicable
        eventId: null, // Set to null if it's an announcement
        timestamp: new Date(),
        read: false,
      };
  
      // Collect tokens and save notifications to Firestore
      usersQuery.forEach(async (doc) => {
        const user = doc.data();
  
        if (
          recipient === 'all' ||
          (recipient === 'volunteer' && user.role === 'volunteer') ||
          (recipient === 'organization' && user.role === 'organization')
        ) {
          if (user.deviceToken) {
            tokens.push({ token: user.deviceToken, userId: doc.id });
          }
  
          // Save notification to Firestore for eligible users
          await saveNotificationToFirestore(doc.id, notificationData);
        }
      });
  
      if (tokens.length === 0) {
        Alert.alert('No Recipients', 'No users found for the selected recipient group.');
        return;
      }
  
      // Send notifications to each token
      for (const { token } of tokens) {
        await sendNotification(token, title, body, content);
      }
  
      Alert.alert('Success', 'Notification pushed successfully to the selected group.');
      setTitle('');
      setBody('');
      setContent('');
      setRecipient('all');
    } catch (error) {
      console.error('Error fetching users or pushing notifications:', error);
      Alert.alert('Error', 'Failed to push notifications. Please try again later.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Title</Text>
      <TextInput
        style={styles.input}
        value={title}
        onChangeText={setTitle}
        placeholder="Enter notification title"
      />

      <Text style={styles.label}>Body</Text>
      <TextInput
        style={styles.textAreaSmall}
        value={body}
        onChangeText={setBody}
        placeholder="Enter notification body"
        multiline
      />

      <Text style={styles.label}>Content</Text>
      <TextInput
        style={styles.textAreaLarge}
        value={content}
        onChangeText={setContent}
        placeholder="Enter detailed content"
        multiline
      />

      <Text style={styles.label}>Recipient</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={recipient}
          onValueChange={(itemValue) => setRecipient(itemValue)}
        >
          <Picker.Item label="All" value="all" />
          <Picker.Item label="Volunteer" value="volunteer" />
          <Picker.Item label="Organization" value="organization" />
        </Picker>
      </View>

      <TouchableOpacity style={styles.button} onPress={handlePushNotification}>
        <Text style={styles.buttonText}>Push Notification</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
  },
  textAreaSmall: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 80,
  },
  textAreaLarge: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    height: 150,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 80,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default PushNotification;
