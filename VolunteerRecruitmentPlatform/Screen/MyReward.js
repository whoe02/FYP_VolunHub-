import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal, Alert, ActivityIndicator } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // QR code generator
import { useUserContext } from '../UserContext';
import { collection, getDocs, deleteDoc, updateDoc, doc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const MyRewardsScreen = () => {
  const { user } = useUserContext(); // Get user context
  const [userRewards, setUserRewards] = useState([]);
  const [loading, setLoading] = useState(true); // To handle loading state
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedReward, setSelectedReward] = useState(null); // Store selected reward to show its QR code

  // Fetch the user's redeemed rewards
  const fetchUserRewards = async () => {
    setLoading(true);
    try {
      const userRewardsRef = collection(firestore, 'User', user.userId, 'usersReward');
      const rewardsSnapshot = await getDocs(userRewardsRef);
      const rewardsData = rewardsSnapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() }))
        .filter((reward) => reward.status === 'active'); // Filter active rewards
      console.log('Fetched active rewards:', rewardsData);
      setUserRewards(rewardsData);
    } catch (error) {
      console.error('Error fetching user rewards:', error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchUserRewards(); // Call the function to fetch rewards on mount
  }, []); // Empty dependency array means it runs once when the component is mounted

  const handleShowQRCode = (reward) => {
    setSelectedReward(reward); // Store the selected reward
    setShowQRCode(true); // Show the QR code modal
  };

  const handleCloseQRCode = () => {
    setShowQRCode(false); // Close the QR code modal
  };

  const handleRedeemReward = async () => {
    Alert.alert(
      'Redeem Voucher',
      `Are you sure you want to redeem the "${selectedReward.title}" voucher?`,
      [
        {
          text: 'Cancel',
          onPress: () => setShowQRCode(false),
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              const currentDate = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
              const rewardRef = doc(firestore, 'User', user.userId, 'usersReward', selectedReward.id);
              
              // Update reward in Firestore
              await updateDoc(rewardRef, {
                status: 'redeemed',
                dateUsed: currentDate,
              });
  
              // Remove redeemed reward from local state
              setUserRewards((prevRewards) =>
                prevRewards.filter((reward) => reward.id !== selectedReward.id)
              );
  
              setShowQRCode(false);
              Alert.alert('Success', 'Voucher redeemed successfully!');
            } catch (error) {
              console.error('Error redeeming voucher:', error);
              Alert.alert('Error', 'Something went wrong while redeeming the voucher.');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };
  

  const renderReward = ({ item }) => (
    <View style={styles.rewardCard}>
      <Image source={{ uri: item.image }} style={styles.rewardImage} />
      <View style={styles.rewardDetails}>
        <Text style={styles.rewardTitle}>{item.title}</Text>
        <Text style={styles.rewardDescription}>{item.description}</Text>
        <Text style={styles.rewardPoints}>{item.pointsRequired} Points</Text>
      </View>
      <TouchableOpacity
        style={styles.viewButton}
        onPress={() => handleShowQRCode(item)} // Trigger QR code modal
      >
        <Text style={styles.viewButtonText}>Show QR</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : userRewards.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={require('../assets/img/prof.png')} 
            style={styles.emptyImage}
          />
          <Text style={styles.emptyText}>No Rewards Available</Text>
          <Text style={styles.emptySubText}>
            You haven't redeemed any rewards yet. Start exploring and redeeming!
          </Text>
        </View>
      ) : (
        <FlatList
          data={userRewards}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.rewardList}
        />
      )}
  
      {/* Modal to show QR code */}
      <Modal
        visible={showQRCode}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseQRCode}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedReward ? (
              <>
                <Text style={styles.qrTitle}>
                  Voucher QR Code: {selectedReward.title}
                </Text>
                {selectedReward.rewardCode ? (
                  <QRCode
                    value={selectedReward.rewardCode}
                    size={200}
                    backgroundColor="white"
                    color="black"
                  />
                ) : (
                  <Text>No QR Code available for this reward.</Text> // Fallback message
                )}
              </>
            ) : (
              <Text>Loading...</Text>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={handleCloseQRCode}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeemReward} // Redeem the voucher
              >
                <Text style={styles.redeemButtonText}>Redeem</Text>
              </TouchableOpacity>
            </View>
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
  rewardList: {
    marginBottom: 20,
  },
  rewardCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 15,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 5 },
    borderLeftWidth: 5,
    borderLeftColor: '#6a8a6d',
  },
  rewardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  rewardDetails: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 5,
  },
  rewardDescription: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  rewardPoints: {
    fontSize: 14,
    color: '#757575',
  },
  viewButton: {
    marginTop: 10,
    backgroundColor: '#6a8a6d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  viewButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Transparent black overlay
  },
  modalContent: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    width: 300,
  },
  qrTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  closeButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
  modalButtons: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  redeemButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default MyRewardsScreen;
