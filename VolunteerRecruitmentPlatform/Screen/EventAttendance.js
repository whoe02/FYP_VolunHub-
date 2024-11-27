import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
} from 'react-native';
import { firestore } from '../firebaseConfig'; // Ensure your Firebase config is imported
import { collection, doc, query, onSnapshot, updateDoc, deleteDoc, getDoc } from 'firebase/firestore';

const ParticipantListScreen = ({ route }) => {
    const { event } = route.params;
    const eventId = event.eventId;
  
    const [tab, setTab] = useState('waiting'); // Default tab
    const [waitingApproval, setWaitingApproval] = useState([]);
    const [approvedParticipants, setApprovedParticipants] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]); // For attendance record
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
  
    useEffect(() => {
      if (!eventId) {
        console.error('Event ID not provided.');
        return;
      }
  
      const fetchParticipants = () => {
        const eventRef = doc(firestore, 'Event', eventId);
        const participantsRef = collection(eventRef, 'EventParticipant');
  
        const q = query(participantsRef);
        const unsubscribe = onSnapshot(q, async (snapshot) => {
          const waiting = [];
          const approved = [];
  
          const fetchUserDetails = async (userId) => {
            const userRef = doc(firestore, 'User', userId);
            const userSnap = await getDoc(userRef);
            return userSnap.exists() ? { id: userId, ...userSnap.data() } : null;
          };
  
          const participantPromises = snapshot.docs.map(async (docSnap) => {
            const userId = docSnap.id; // Document ID is the userId
            const { status } = docSnap.data();
  
            const userDetails = await fetchUserDetails(userId);
            if (userDetails) {
              const participantData = { id: userId, status, ...userDetails };
  
              if (status === 'pending') {
                waiting.push(participantData);
              } else if (status === 'approved') {
                approved.push(participantData);
              }
            }
          });
  
          await Promise.all(participantPromises);
  
          setWaitingApproval(waiting);
          setApprovedParticipants(approved);
        });
  
        return unsubscribe;
      };
  
      const fetchAttendanceRecords = () => {
        const attendanceRef = collection(firestore, 'Event', eventId, 'Attendance');
        const unsubscribe = onSnapshot(attendanceRef, (snapshot) => {
          const records = snapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            ...docSnap.data(),
          }));
          setAttendanceRecords(records);
        });
  
        return unsubscribe;
      };
  
      const unsubscribeParticipants = fetchParticipants();
      const unsubscribeAttendance = fetchAttendanceRecords();
  
      return () => {
        unsubscribeParticipants();
        unsubscribeAttendance();
      };
    }, [eventId]);
  
    const renderTabContent = () => {

      if (tab === 'approved') {
        return (
          <FlatList
            data={approvedParticipants}
            renderItem={({ item }) => renderParticipantCard(item, 'approved')}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No approved participants.</Text>}
          />
        );
      }
  
      if (tab === 'attendance') {
        return (
          <FlatList
            data={attendanceRecords}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.name}>Name: {item.name}</Text>
                <Text style={styles.status}>Status: {item.attendanceStatus}</Text>
                <Text style={styles.email}>Email: {item.email}</Text>
                <Text>Date: {item.date || 'N/A'}</Text>
              </View>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<Text style={styles.emptyText}>No attendance records found.</Text>}
          />
        );
      }
    };
  
    const renderParticipantCard = (item, type) => (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.status}>Status: {item.status}</Text>
        <View style={styles.actionButtons}>
          {type === 'approved' && (
            <>
              <TouchableOpacity
                style={styles.detailsButton}
                onPress={() => viewDetails(item)}
              >
                <Text style={styles.buttonText}>Details</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    );
  
    return (
      <View style={styles.container}>
        {/* Tab Buttons */}
        <View style={styles.tabs}>
          <TouchableOpacity
            style={[styles.tab, tab === 'approved' && styles.activeTab]}
            onPress={() => setTab('approved')}
          >
            <Text style={[styles.tabText, tab === 'approved' && styles.activeTabText]}>
              Participants
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, tab === 'attendance' && styles.activeTab]}
            onPress={() => setTab('attendance')}
          >
            <Text style={[styles.tabText, tab === 'attendance' && styles.activeTabText]}>
              Attendance Record
            </Text>
          </TouchableOpacity>
        </View>
  
        {/* Tab Content */}
        {renderTabContent()}
      </View>
    );
  };
  


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginHorizontal: 5,
  },
  activeTab: {
    backgroundColor: '#6a8a6d',
  },
  tabText: {
    fontSize: 14,
    color: '#616161',
  },
  activeTabText: {
    color: 'white',
    fontWeight: '600',
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
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 5,
  },
  email: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  detailsButton: {
    backgroundColor: '#4f7ec4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 20,
  },
  
});

export default ParticipantListScreen;
