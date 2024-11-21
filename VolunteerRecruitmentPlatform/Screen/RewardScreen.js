import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '../UserContext'; // Adjust the path to your context file
import { collection, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Import Firestore configuration

const RewardScreen = ({ navigation }) => {
  const { user, setUser } = useUserContext(); // Get user data from context and a method to update it
  const [vouchers, setVouchers] = useState([]); // State to store fetched rewards data
  const [loading, setLoading] = useState(false); // State to handle loading indicator
  const [isCheckedInToday, setIsCheckedInToday] = useState(false); // State to track if user checked in today

  // Fetch rewards from Firestore
  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'Rewards'));
      const rewardsData = querySnapshot.docs.map((doc) => ({
        rewardId: doc.id,
        ...doc.data(),
      }));
      setVouchers(rewardsData);
    } catch (error) {
      console.error("Error fetching rewards:", error);
    } finally {
      setLoading(false);
    }
  };

  // Check if user has checked in today
  const checkUserCheckInStatus = async () => {
    try {
      const userRef = doc(firestore, 'User', user.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastCheckInDate = userData.lastCheckInDate;

        // Compare last check-in date with today's date
        const today = new Date().toISOString().split('T')[0]; // Get today's date in YYYY-MM-DD format
        setIsCheckedInToday(lastCheckInDate === today);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    }
  };

  // Handle the check-in action
  const handleCheckIn = async () => {
    if (isCheckedInToday) {
      alert('You have already checked in today!');
      return;
    }

    try {
      const userRef = doc(firestore, 'User', user.userId);
      const userDoc = await getDoc(userRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const currentRewardPoints = parseInt(userData.rewardPoint || 0);

        // Update the reward points and last check-in date
        await updateDoc(userRef, {
          rewardPoint: currentRewardPoints + 10,
          lastCheckInDate: new Date().toISOString().split('T')[0], // Set today's date as the last check-in date
        });

        alert('You have successfully checked in and earned 10 points!');
        
        // Fetch updated user data to refresh the points
        const updatedUserDoc = await getDoc(userRef);
        if (updatedUserDoc.exists()) {
          const updatedUserData = updatedUserDoc.data();
          setUser({ ...user, rewardPoint: updatedUserData.rewardPoint }); // Update user context with new points
        }
        
        checkUserCheckInStatus(); // Re-fetch the check-in status to update the UI
      }
    } catch (error) {
      console.error("Error during check-in:", error);
    }
  };

  // Fetch rewards and user check-in status when the component mounts
  useEffect(() => {
    fetchVouchers();
    checkUserCheckInStatus(); // Check if the user has already checked in today
  }, []);

  // Render the reward vouchers
  const renderVouchers = () => {
    // Slice the vouchers array to show only the first 7
    const limitedVouchers = vouchers.slice(0, 7);
  
    return limitedVouchers.map((voucher) => (
      <View key={voucher.rewardId} style={styles.voucherCard}>
        {/* Image Container */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: voucher.imageVoucher }} style={styles.voucherImage} />
          
          {/* Type Label */}
          <View style={styles.typeLabel}>
            <Text style={styles.typeLabelText}>{voucher.type}</Text>
          </View>
        </View>
        
        {/* Title and Points */}
        <Text style={styles.voucherText}>{voucher.title}</Text>
        <Text style={styles.pointsText}>{voucher.pointsRequired} Points</Text>
        
        {/* Button */}
        <TouchableOpacity style={styles.swapButton}>
          <Text style={styles.buttonText}>Swap</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Points and Navigation Buttons Section */}
      <View style={styles.pointsAndNavSection}>
        <View style={styles.pointsSection}>
          <Text style={styles.pointsTitle}>Your Points</Text>
          {/* Ensure the rewardPoint is valid */}
          <Text style={styles.points}>
            {user && user.rewardPoint !== undefined ? user.rewardPoint : 0} {/* Fallback to 0 if undefined */}
          </Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtonsContainer}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RewardCatalogue')}>
            <Text style={styles.navButtonText}>Catalogue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyRewards')}>
            <Text style={styles.navButtonText}>Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RewardsHistory')}>
            <Text style={styles.navButtonText}>History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vouchers Section */}
      <Text style={styles.sectionTitle}>Available Vouchers</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherScroll}>
          {renderVouchers()}
        </ScrollView>
      )}

      {/* Daily Check-In Section */}
      <View style={styles.dailyCheckInBox}>
        <View style={styles.dailyCheckInContent}>
          <Ionicons name="calendar-outline" size={24} color="#4caf50" />
          <Text style={styles.dailyCheckInTitle}>Daily Check-In</Text>
          <Text style={styles.dailyCheckInDescription}>
            Check-in now and earn points!
          </Text>
        </View>
        <TouchableOpacity 
          style={styles.dailyCheckInButton} 
          onPress={handleCheckIn}
          disabled={isCheckedInToday} // Disable the button if already checked in
        >
          <Text style={styles.checkInButtonText}>{isCheckedInToday ? 'Checked In Today' : 'Check-In'}</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  pointsAndNavSection: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  pointsSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  pointsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4caf50',
  },
  points: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2d7a34',
    marginVertical: 2,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  navButton: {
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#6a8a6d',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 5,
  },
  navButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#616161',
    marginBottom: 10,
  },
  voucherScroll: {
    marginBottom: 30,
  },
  voucherCard: {
    backgroundColor: '#ffffff',
    marginBottom: 10,
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    width: 200,
    height:290,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  voucherImage: {
    width: '100%',
    height: '100%',
    borderRadius: 12,
  },
  typeLabel: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#d6b069', 
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeLabelText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  voucherText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#616161',
    textAlign: 'center',
    marginTop: 10,
  },
  pointsText: {
    fontSize: 12,
    color: '#b0b0b0',
    marginVertical: 8,
  },
  swapButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    elevation: 2,
  },
  buttonText: {
    color: 'white',
    fontSize: 14,
  },
  dailyCheckInBox: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 20,
    marginTop: -10,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  dailyCheckInContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dailyCheckInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4caf50',
    marginLeft: 10,
  },
  dailyCheckInDescription: {
    fontSize: 14,
    color: '#757575',
    marginLeft: 5,
    marginRight:15,
  },
  dailyCheckInButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 15,
    alignItems: 'center',
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RewardScreen;
