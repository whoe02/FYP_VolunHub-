import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { firestore } from '../firebaseConfig'; // Ensure your Firebase config is imported
import { collection, doc, query, onSnapshot, updateDoc, deleteDoc, getDocs,where } from 'firebase/firestore';

const ParticipantListScreen = ({ route }) => {
    const { event } = route.params;
    const eventId = event.eventId;
    const [filter, setFilter] = useState('all');
    const [tab, setTab] = useState('approved'); // Default tab
    const [approvedParticipants, setApprovedParticipants] = useState([]);
    const [attendanceRecords, setAttendanceRecords] = useState([]); // For attendance record
    const [selectedParticipant, setSelectedParticipant] = useState(null);
    const [showDetailsModal, setShowDetailsModal] = useState(false);
  
    useEffect(() => {
      if (!eventId) {
        console.error('Event ID not provided.');
        return;
      }
  
      const unsubscribeParticipants = fetchParticipants();
      fetchAttendanceRecords();
  
      return () => {
        unsubscribeParticipants();
      };
    }, [eventId]);
  
    // Fetch Approved Participants
    const fetchParticipants = () => {
      const eventRef = doc(firestore, 'Event', eventId);
      const participantsRef = collection(eventRef, 'EventParticipant');
    
      // Query to fetch all participants
      const q = query(participantsRef);
      const unsubscribe = onSnapshot(q, async (snapshot) => {
        const approved = [];
        const participantsData = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return { id: docSnap.id, ...data }; 
        });
    
        const approvedUserIds = participantsData
          .filter(docSnap => docSnap.status === 'approved') 
          .map(docSnap => docSnap.id);
    
        if (approvedUserIds.length > 0) {
          const usersQuery = query(collection(firestore, 'User'), where('userId', 'in', approvedUserIds));
          const usersSnapshot = await getDocs(usersQuery);
  
          const usersData = usersSnapshot.docs.reduce((acc, docSnap) => {
            acc[docSnap.id] = docSnap.data(); 
            return acc;
          }, {});
    
          participantsData.forEach((docSnap) => {
            const userId = docSnap.id;
            const { status } = docSnap;
    
            if (status === 'approved' && usersData[userId]) {
              const userDetails = usersData[userId];
              const participantData = { id: userId, status, ...userDetails };
              approved.push(participantData); 
            }
          });
    
          setApprovedParticipants(approved);
        }
      });
    
      return unsubscribe;
    };
    
    // Fetch Attendance Records
    const fetchAttendanceRecords = async () => {
      try {
        const eventRef = doc(firestore, 'Event', eventId);
        const participantsRef = collection(eventRef, 'EventParticipant');

        const q = query(participantsRef);
        const participantsSnapshot = await getDocs(q);

        const attendancePromises = participantsSnapshot.docs.map(async (participantDoc) => {
          const participantId = participantDoc.id;
          const attendanceRef = collection(participantDoc.ref, 'Attendance');

          const attendanceSnapshot = await getDocs(attendanceRef);

          return attendanceSnapshot.docs.map((docSnap) => ({
            id: docSnap.id,
            participantId, // Link this record to the participant
            ...docSnap.data(),
          }));
        });

        const resolvedAttendance = await Promise.all(attendancePromises);
        const flattenedRecords = resolvedAttendance.flat();

        // Console log the fetched attendance data

        setAttendanceRecords(flattenedRecords);
      } catch (error) {
        console.error('Error fetching attendance records:', error);
      }
    };

    const formatDateTime = (date) => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };

    const viewDetails = (participant) => {
      setSelectedParticipant(participant);
      setShowDetailsModal(true);
    };
  
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
        const filteredRecords = filterAttendanceRecords();
    
        return (
          <View style={{ flex: 1 }}>
            {/* Filter Buttons */}
            <ScrollView
              horizontal={true}
              contentContainerStyle={styles.filterButtonsContainer}
              showsHorizontalScrollIndicator={false} // Hide horizontal scroll bar
              style={styles.filterScrollView}
            >
              {['all', 'today', 'weekly', 'monthly', 'check-in', 'check-out'].map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[
                    styles.filterButton,
                    filter === option && styles.activeFilterButton,
                  ]}
                  onPress={() => setFilter(option)}
                >
                  <Text
                    style={[
                      styles.filterButtonText,
                      filter === option && styles.activeFilterButtonText,
                    ]}
                  >
                    {option.charAt(0).toUpperCase() + option.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
    
            {/* Filtered Attendance Records */}
            <FlatList
              style={styles.flatList}
              data={filteredRecords}
              renderItem={({ item }) => {
                const formattedDate =
                  item.timestamp && item.timestamp.toDate
                    ? formatDateTime(item.timestamp.toDate())
                    : 'N/A';
    
                return (
                  <View style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text style={styles.name}>{item.userName || 'N/A'}</Text>
                      <Text style={{ fontWeight: 'bold' }}>{item.status || 'N/A'}</Text>
                    </View>
                    <Text style={styles.date}>
                      <Text style={{ fontWeight: 'bold' }}>Timestamp: </Text>
                      {formattedDate}
                    </Text>
                  </View>
                );
              }}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No attendance records found.</Text>
              }
              // contentContainerStyle={{ paddingTop: 10 }}
            />
          </View>
        );
      }
    };    
  
    const renderParticipantCard = (item, type) => (
      <View style={styles.card}>
        <Text style={styles.name}>{item.name}</Text>
        <Text style={styles.email}>{item.email}</Text>
        <Text style={styles.email}>Phone: {item.phoneNum}</Text>
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

    const filterAttendanceRecords = () => {
      const now = new Date();
      let filteredRecords = attendanceRecords;
  
      if (filter === 'today') {
        filteredRecords = attendanceRecords.filter((record) => {
          const recordDate = record.timestamp?.toDate();
          return recordDate.toDateString() === now.toDateString();
        });
      } else if (filter === 'weekly') {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        filteredRecords = attendanceRecords.filter((record) => {
          const recordDate = record.timestamp?.toDate();
          return recordDate >= oneWeekAgo && recordDate <= now;
        });
      } else if (filter === 'monthly') {
        const oneMonthAgo = new Date();
        oneMonthAgo.setMonth(now.getMonth() - 1);
        filteredRecords = attendanceRecords.filter((record) => {
          const recordDate = record.timestamp?.toDate();
          return recordDate >= oneMonthAgo && recordDate <= now;
        });
      } else if (filter === 'check-in') {
        filteredRecords = attendanceRecords.filter(
          (record) => record.status === 'check-in'
        );
      } else if (filter === 'check-out') {
        filteredRecords = attendanceRecords.filter(
          (record) => record.status === 'check-out'
        );
      }
  
      return filteredRecords;
    };
  
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

        {/* Modal to show participant details */}
        <Modal
          visible={showDetailsModal}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowDetailsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Attendance Record - {selectedParticipant?.name}</Text>
              <ScrollView>
                {attendanceRecords
                  .filter((record) => record.participantId === selectedParticipant?.id)
                  .map((record) => {
                    const formattedDate = formatDateTime(record.timestamp?.toDate());
                    return (
                      <View key={record.id} style={styles.card}>
                        <Text style={styles.date}>Status: {record.status}</Text>
                        <Text style={styles.date}>Timestamp: {formattedDate}</Text>
                      </View>
                    );
                  })}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowDetailsModal(false)}
              >
                <Text style={styles.buttonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
    marginBottom: 5,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingVertical: 100,
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 15,
  },
  closeButton: {
    backgroundColor: '#4f7ec4',
    padding: 10,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  date: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 5,
  },

  //filter button 
  filterButtonsContainer: {
    flexDirection: 'row', // Arrange buttons in a row
    alignItems: 'center', // Vertically center buttons
    paddingVertical: 10,
  },
  filterButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: '#e0e0e0',
    borderRadius: 20,
    marginHorizontal: 5, // Add spacing between buttons
  },
  activeFilterButton: {
    backgroundColor: '#6a8a6d',
  },
  filterButtonText: {
    color: '#616161',
    fontSize: 14,
  },
  activeFilterButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  filterScrollView: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingVertical: 10,
    zIndex: 10, // Ensure it stays on top of other content
  },
  flatList: {
    position: 'absolute',
    top: 75, 
    left: 0,
    right: 0,
    bottom: 0, 
  },
});

export default ParticipantListScreen;
