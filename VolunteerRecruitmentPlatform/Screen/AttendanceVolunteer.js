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
import { collection, doc, getDocs } from 'firebase/firestore';
import { useUserContext } from '../UserContext';

const VolunteerAttendanceScreen = ({ route,navigation }) => {
  const { user } = useUserContext();
  const { event } = route.params;
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
    const d = date.toDate ? date.toDate() : new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Attendance for {event.title}</Text>

      <FlatList
        data={attendanceRecords}
        renderItem={({ item }) => {
          const formattedDate = item.timestamp ? formatDateTime(item.timestamp) : 'N/A';
          const [date, time] = formattedDate.split(' '); // Split the formatted date and time

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
        ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
      />
      <TouchableOpacity
        style={styles.addButton}
        onPress={() =>
          navigation.navigate('VolunteerRecognitionScreen', {
            email,
            onComplete: (status) => {
              if (status) {
                Alert.alert('Success', 'Face recognition completed successfully!');
              } else {
                Alert.alert('Error', 'Face recognition failed1.');
              }
            },
          })
        }
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
