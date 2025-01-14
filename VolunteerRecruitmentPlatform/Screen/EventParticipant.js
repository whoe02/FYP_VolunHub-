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
import { collection, doc, query, onSnapshot, updateDoc, deleteDoc, getDoc, setDoc, addDoc, getDocs } from 'firebase/firestore';

const ParticipantListScreen = ({ route }) => {
  const { event } = route.params;
  const eventId = event.eventId;

  const [tab, setTab] = useState('waiting');
  const [waitingApproval, setWaitingApproval] = useState([]);
  const [approvedParticipants, setApprovedParticipants] = useState([]);
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
          } else {
            console.warn(`User details not found for userId: ${userId}`);
          }
        });

        await Promise.all(participantPromises);

        setWaitingApproval(waiting);
        setApprovedParticipants(approved);
      });

      return unsubscribe;
    };

    const unsubscribe = fetchParticipants();
    return () => unsubscribe();
  }, [eventId]);

  const confirmAction = (action, participant) => {
    let message = '';
    switch (action) {
      case 'approve':
        message = `Are you sure you want to approve ${participant.name}?`;
        break;
      case 'reject':
        message = `Are you sure you want to reject ${participant.name}?`;
        break;
      case 'remove':
        message = `Are you sure you want to remove ${participant.name}?`;
        break;
      default:
        return;
    }

    Alert.alert(
      'Confirm Action',
      message,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Yes', onPress: () => handleAction(action, participant) },
      ],
      { cancelable: true }
    );
  };
  // Save the notification to Firestore
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

  const fetchNotificationPreferences = async (userId) => {
    try {
      const preferencesRef = doc(firestore, 'User', userId, 'NotificationPreferences', 'Preferences');
      const preferencesSnap = await getDoc(preferencesRef);

      if (preferencesSnap.exists()) {
        return preferencesSnap.data();
      } else {
        // Assume default preferences (all true) if the subcollection does not exist
        return {
          application: true,
          announcement: true,
          message: true,
          review: true,
        };
      }
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      // Fallback to default preferences in case of error
      return {
        application: true,
        announcement: true,
        message: true,
        review: true,
      };
    }
  };

  // Send notification to a user
  const sendNotification = async (recipientToken, message, notificationData, recipientId) => {
    try {
      // Fetch notification preferences for the recipient
      const preferences = await fetchNotificationPreferences(recipientId);

      // Check if the notification type is enabled in preferences
      const notificationType = notificationData.type;
      if (!preferences[notificationType]) {
        console.log(`Notification type "${notificationType}" is disabled for user ${recipientId}.`);
        // Save the notification in Firestore without pushing it
        await saveNotificationToFirestore(recipientId, notificationData);
        return;
      }
      const messageBody = {
        to: recipientToken,
        sound: 'default',
        title: notificationData.title,
        body: notificationData.body,
        data: {
          type: notificationData.type,
        },
      };

      await fetch('https://exp.host/--/api/v2/push/send', {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageBody),
      });

      // Save notification to Firestore
      await saveNotificationToFirestore(recipientId, notificationData);
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  };

  const deleteDocumentAndSubCollections = async (docRef, subCollectionNames) => {
    try {
      for (const subCollectionName of subCollectionNames) {
        // Fetch all documents in the sub-collection
        const subCollectionRef = collection(docRef, subCollectionName);
        const subCollectionDocs = await getDocs(subCollectionRef);

        for (const subDoc of subCollectionDocs.docs) {
          // Recursively delete documents and their sub-collections
          const subDocRef = doc(subCollectionRef.firestore, `${subCollectionRef.path}`, subDoc.id);
          await deleteDocumentAndSubCollections(subDocRef, []); // Pass [] for nested sub-collections if not tracked
        }
      }

      // Delete the parent document
      await deleteDoc(docRef);
    } catch (error) {
      console.error('Error deleting document and sub-collections:', error);
      throw error; // Optionally re-throw for higher-level error handling
    }
  };

  // Handle participant actions (approve/reject/remove)
  const handleAction = async (action, participant) => {
    const eventRef = doc(firestore, 'Event', eventId);
    const participantRef = doc(eventRef, 'EventParticipant', participant.id); // Use participant.id as userId

    try {
      const participantSnap = await getDoc(participantRef);
      if (!participantSnap.exists()) {
        Alert.alert('Error', 'Participant not found.');
        return;
      }

      const recipientRef = doc(firestore, 'User', participant.id);
      const userEventRef = doc(recipientRef, 'UserEvent', eventId);
      const recipientDoc = await getDoc(recipientRef);

      if (action === 'approve') {
        await updateDoc(participantRef, { status: 'approved' });
        await updateDoc(userEventRef, { applicationStatus: 'approved' });
      } else if (action === 'reject') {
        await deleteDocumentAndSubCollections(participantRef, ['EventParticipant']);
        await updateDoc(userEventRef, { applicationStatus: 'rejected' });
      } else if (action === 'remove') {
        await deleteDocumentAndSubCollections(participantRef, ['EventParticipant']);
        await updateDoc(userEventRef, { applicationStatus: 'removed' });
      }

      if (recipientDoc.exists()) {
        const recipientData = recipientDoc.data();
        const recipientToken = recipientData.deviceToken;

        if (recipientToken) {
          const notificationData = {
            title: 'Application Update',
            body:
              action === 'approve'
                ? `Your application for ${event.title} has been approved.`
                : `Your application for ${event.title} has been rejected.`,
            type: 'application',
            eventId: eventId,
            timestamp: new Date(),
            read: false,
          };

          await sendNotification(recipientToken, notificationData.body, notificationData, participant.id);
        }
      }
    } catch (error) {
      console.error('Error handling action:', error);
      Alert.alert('Error', 'Failed to perform the action.');
    }
  };

  const viewDetails = (participant) => {
    setSelectedParticipant(participant);
    setShowDetailsModal(true);
  };

  const renderTabContent = () => {
    const data = tab === 'waiting' ? waitingApproval : approvedParticipants;

    return (
      <FlatList
        data={data}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.email}>{item.email}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
            <View style={styles.actionButtons}>
              {tab === 'waiting' && (
                <>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => viewDetails(item)}
                  >
                    <Text style={styles.buttonText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.approveButton}
                    onPress={() => confirmAction('approve', item)}
                  >
                    <Text style={styles.buttonText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectButton}
                    onPress={() => confirmAction('reject', item)}
                  >
                    <Text style={styles.buttonText}>Reject</Text>
                  </TouchableOpacity>
                </>
              )}
              {tab === 'approved' && (
                <>
                  <TouchableOpacity
                    style={styles.detailsButton}
                    onPress={() => viewDetails(item)}
                  >
                    <Text style={styles.buttonText}>Details</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => confirmAction('remove', item)}
                  >
                    <Text style={styles.buttonText}>Remove</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        )}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.emptyText}>No participants in this category.</Text>}
      />
    );
  };


  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'waiting' && styles.activeTab]}
          onPress={() => setTab('waiting')}
        >
          <Text style={[styles.tabText, tab === 'waiting' && styles.activeTabText]}>
            Waiting Approval
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'approved' && styles.activeTab]}
          onPress={() => setTab('approved')}
        >
          <Text style={[styles.tabText, tab === 'approved' && styles.activeTabText]}>
            Approved Participants
          </Text>
        </TouchableOpacity>
      </View>

      {renderTabContent()}

      <Modal
        visible={showDetailsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailsModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedParticipant && (
              <>
                <Text style={styles.modalTitle}>Participant Details</Text>

                <View style={styles.detailRow}>
                  <Text style={styles.modalLabel}>Name:</Text>
                  <Text style={styles.modalValue}>{selectedParticipant.name}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.modalLabel}>Email:</Text>
                  <Text style={styles.modalValue}>{selectedParticipant.email}</Text>
                </View>

                <View style={styles.detailRow}>
                  <Text style={styles.modalLabel}>Phone:</Text>
                  <Text style={styles.modalValue}>
                    {selectedParticipant.phoneNum || 'N/A'}
                  </Text>
                </View>

                {selectedParticipant.skills && selectedParticipant.skills.length > 0 && (
                  <View style={styles.skillsContainer}>
                    <Text style={styles.modalLabel}>Skills:</Text>
                    <Text style={styles.modalValue}>{selectedParticipant.skills.join(', ')}</Text>
                  </View>
                )}


                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowDetailsModal(false)}
                >
                  <Text style={styles.buttonText}>Close</Text>
                </TouchableOpacity>
              </>
            )}
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
    marginBottom: 15,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  approveButton: {
    backgroundColor: '#6a8a6d',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  rejectButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  detailsButton: {
    backgroundColor: '#4f7ec4',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  removeButton: {
    backgroundColor: '#f44336',
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
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '80%',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: '#333',
    marginBottom: 15,
  },
  closeModalButton: {
    backgroundColor: '#6a8a6d',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 10,
  },
  emptyText: {
    textAlign: 'center',
    color: '#757575',
    fontSize: 14,
    marginTop: 20,
  },
  removeButton: {
    backgroundColor: '#f44336',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 15,
    marginRight: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },
  modalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4caf50',
  },
  modalValue: {
    fontSize: 16,
    color: '#333',
    flexShrink: 1,
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
    marginBottom: 15,
    textAlign: 'center',
  },
  closeModalButton: {
    backgroundColor: '#6a8a6d',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 20,
    marginTop: 15,
  },
  skillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap', // Allows content to wrap to the next line
    width: '100%',
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    paddingBottom: 5,
  },

});

export default ParticipantListScreen;
