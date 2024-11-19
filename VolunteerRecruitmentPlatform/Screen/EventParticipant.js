import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';

const ParticipantListScreen = () => {
  const [tab, setTab] = useState('waiting'); // 'waiting' or 'approved'
  const [waitingApproval, setWaitingApproval] = useState([
    { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
    { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
    { id: 3, name: 'Charlie Davis', email: 'charlie@example.com' },
  ]);
  const [approvedParticipants, setApprovedParticipants] = useState([
    { id: 4, name: 'Diana Prince', email: 'diana@example.com' },
    { id: 5, name: 'Ethan Hunt', email: 'ethan@example.com' },
  ]);
  const [selectedParticipant, setSelectedParticipant] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

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
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: () => handleAction(action, participant.id),
        },
      ],
      { cancelable: true }
    );
  };

  const handleAction = (action, id) => {
    if (action === 'approve') {
      const participant = waitingApproval.find((p) => p.id === id);
      setApprovedParticipants([...approvedParticipants, participant]);
      setWaitingApproval(waitingApproval.filter((p) => p.id !== id));
    } else if (action === 'reject') {
      setWaitingApproval(waitingApproval.filter((p) => p.id !== id));
    } else if (action === 'remove') {
      setApprovedParticipants(approvedParticipants.filter((p) => p.id !== id));
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
            <View style={styles.actionButtons}>
              {tab === 'waiting' ? (
                
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
              ) : (
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
        keyExtractor={(item) => item.id.toString()}
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            {tab === 'waiting'
              ? 'No participants waiting for approval.'
              : 'No approved participants yet.'}
          </Text>
        }
      />
    );
  };

  return (
    <View style={styles.container}>
      {/* Tabs */}
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

      {/* Tab Content */}
      {renderTabContent()}

      {/* Modal for Participant Details */}
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
                <Text style={styles.modalText}>Name: {selectedParticipant.name}</Text>
                <Text style={styles.modalText}>Email: {selectedParticipant.email}</Text>
              </>
            )}
            <TouchableOpacity
              style={styles.closeModalButton}
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
  });
  
  

export default ParticipantListScreen;
