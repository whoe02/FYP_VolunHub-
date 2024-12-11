import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { firestore } from '../firebaseConfig';
import { collection, doc, getDocs, setDoc } from 'firebase/firestore';
import { useUserContext } from '../UserContext';
import axios from 'axios'; // Import axios
import { getDistance } from 'geolib'; // For calculating distance

const GOOGLE_API_KEY = 'AIzaSyDmpiHdkyhItoKFv5HWfx0XBixlK2vWqno'; // Replace with your API key

const VolunteerAttendanceScreen = ({ route, navigation }) => {
  const { user } = useUserContext();
  const { event } = route.params; // event contains latitude and longitude
  const eventId = event.eventId;
  const userId = user.userId;
  const email = user.email;

  const [attendanceRecords, setAttendanceRecords] = useState([]);

  useEffect(() => {
    fetchAttendanceRecords();
  }, [eventId, userId]);

  const fetchAttendanceRecords = async () => {
    try {
      const eventRef = doc(firestore, 'Event', eventId);
      const participantDocRef = doc(eventRef, 'EventParticipant', userId);

      const attendanceRef = collection(participantDocRef, 'Attendance');
      const attendanceSnapshot = await getDocs(attendanceRef);

      const attendanceData = attendanceSnapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      }));

      setAttendanceRecords(attendanceData);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date); // Support Firestore Timestamp
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const validateLocation = async () => {
    console.log('Event Location:', {
      latitude: event.latitude,
      longitude: event.longitude,
    });
    if (!event.latitude || !event.longitude) {
      Alert.alert('Error', 'Event location data is not available.');
      return;
    }

    try {
      // Use Google Maps Geolocation API to get the current location
      const response = await axios.post(
        `https://www.googleapis.com/geolocation/v1/geolocate?key=${GOOGLE_API_KEY}`,
        {}
      );

      const { lat, lng } = response.data.location;
      console.log(`Current location: Latitude: ${lat}, Longitude: ${lng}`);
      // Calculate distance between user's location and event location
      const distance = getDistance(
        { latitude: lat, longitude: lng },
        { latitude: event.latitude, longitude: event.longitude }
      );

      // Check if within acceptable range (e.g., 50 meters)
      if (distance <= 50) {
        navigation.navigate('VolunteerRecognitionScreen', {
          email,
          onComplete: async (status) => {
            if (status) {
              Alert.alert('Success', 'Face recognition completed successfully!');

              // Now handle the attendance check-in/check-out
              await handleAttendance();
            } else {
              Alert.alert('Error', 'Face recognition failed.');
            }
          },
        });
      } else {
        Alert.alert('Error', 'You are not within the event location range.');
      }
    } catch (error) {
      console.error('Error validating location:', error);
      Alert.alert('Error', 'Unable to fetch your location. Please try again.');
    }
  };

  const handleAttendance = async () => {
    // Fetch the latest attendance record
    const latestAttendance = attendanceRecords[0];
    const currentTime = new Date();
    const lastStatus = latestAttendance?.status; // Get the last status if exists
  
    // If there's no previous attendance record, this is the first one of the day, so it must be "check-in"
    if (!latestAttendance || !lastStatus) {
      await saveAttendance('check-in');
    } else {
      // If there's a record, check the last status and decide whether to check-in or check-out
      const currentHour = currentTime.getHours();
      const isNewDay = currentHour < 12; // This can be adjusted based on your needs
  
      // If it's a new day or last status was check-out, we must check-in
      if (isNewDay || lastStatus === 'check-out') {
        // Save check-in status
        await saveAttendance('check-in');
      } else {
        // Otherwise, it's check-out
        await saveAttendance('check-out');
      }
    }
  };

  const saveAttendance = async (status) => {
    try {
      const eventRef = doc(firestore, 'Event', eventId);
      const participantDocRef = doc(eventRef, 'EventParticipant', userId);
      const attendanceRef = collection(participantDocRef, 'Attendance');

      // Create the attendance document with the current status and timestamp
      await setDoc(doc(attendanceRef, new Date().toISOString()), {
        status: status,
        timestamp: new Date(),
        userName: user.name, // Assuming `user.name` exists
      });

      // Refresh the attendance records
      fetchAttendanceRecords();
      Alert.alert('Success', `Successfully marked as ${status}`);
    } catch (error) {
      console.error('Error saving attendance:', error);
      Alert.alert('Error', 'Failed to save attendance.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance for {event.title}</Text>

      <FlatList
        data={attendanceRecords}
        renderItem={({ item }) => {
          const formattedDate = item.timestamp
            ? formatDateTime(item.timestamp)
            : 'N/A';
          const [date, time] = formattedDate.split(' ');

          return (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.dateContainer}>
                  <Text style={styles.date}>
                    <Text style={styles.label}>Date: </Text>
                    {date || 'N/A'}
                  </Text>
                  <Text style={styles.date}>
                    <Text style={styles.label}>Time: </Text>
                    {time || 'N/A'}
                  </Text>
                </View>
                <Text style={styles.status}>{item.status || 'N/A'}</Text>
              </View>
            </View>
          );
        }}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No attendance records found.</Text>
        }
      />

      <TouchableOpacity
        style={styles.addButton}
        onPress={validateLocation} // Call validation before navigation
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  card: {
    backgroundColor: '#e8e3df',
    borderRadius: 12,
    padding: 15,
    marginBottom: 12,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    borderLeftWidth: 5,
    borderLeftColor: '#6a8a6d',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flex: 1, // This ensures the date and time are aligned properly
  },
  date: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 2,
  },
  label: {
    fontWeight: 'bold',
  },
  status: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    textAlign: 'right',
    flexShrink: 1,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 20,
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6a8a6d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
});

export default VolunteerAttendanceScreen;
