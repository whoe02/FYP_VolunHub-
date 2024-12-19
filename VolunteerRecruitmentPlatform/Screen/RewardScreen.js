import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useUserContext } from '../UserContext'; // Adjust the path to your context file
import { collection, getDocs, doc, getDoc, updateDoc, addDoc,setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Import Firestore configuration
import QRCode  from 'react-native-qrcode-svg'; // Assuming you're using this for QR code generation
import axios from 'axios'; // For sending requests to Cloudinary
import ViewShot from 'react-native-view-shot';

const RewardScreen = ({ navigation }) => {
  const { user, setUser } = useUserContext(); // Context for user data
  const [userPoints, setUserPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]); // Rewards list

  const [loading, setLoading] = useState(false); // Loading indicator
  const [isCheckedInToday, setIsCheckedInToday] = useState(false); // Daily check-in status
  const qrCodeRef = useRef(null); // Ref for QR code
  const today = new Date().toISOString().split('T')[0];
  const [checkInStreak, setCheckInStreak] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(false);
  const [rewardPoints, setRewardPoints] = useState(user?.rewardPoint || 0);

  let pointsForToday = 5;
    if (checkInStreak === 1) pointsForToday = 10;
    else if (checkInStreak === 2) pointsForToday = 15;
    else if (checkInStreak === 3) pointsForToday = 20;
    else if (checkInStreak === 4) pointsForToday = 25;
    else if (checkInStreak === 5) pointsForToday = 30;
    else if (checkInStreak === 6) pointsForToday = 35;

  const checkUserCheckInStatus = async () => {
    try {
      const userRef = doc(firestore, 'User', user.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const lastCheckInDate = userData.lastCheckInDate;
        const today = new Date().toISOString().split('T')[0];
        setIsCheckedInToday(lastCheckInDate === today);
      }
    } catch (error) {
      console.error('Error checking user check-in status:', error);
    }
  };

// Handle daily check-in
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
      let currentCheckInStreak = userData.checkInStreak || 0; // Track consecutive check-ins

      // Determine points based on the streak
      let pointsForToday = 5;  // Default points
      if (currentCheckInStreak === 1) pointsForToday = 10;
      else if (currentCheckInStreak === 2) pointsForToday = 15;
      else if (currentCheckInStreak === 3) pointsForToday = 20;
      else if (currentCheckInStreak === 4) pointsForToday = 25;
      else if (currentCheckInStreak === 5) pointsForToday = 30;
      else if (currentCheckInStreak === 6) pointsForToday = 35;

      setRewardPoints(currentRewardPoints + pointsForToday); 
      // Update user's reward points
      await updateDoc(userRef, {
        rewardPoint: currentRewardPoints + pointsForToday,
        lastCheckInDate: new Date().toISOString().split('T')[0],
        checkInStreak: currentCheckInStreak + 1, // Increment streak
      });

      // Handle check-in reset after 7 days
      if (currentCheckInStreak >= 6) {
        await updateDoc(userRef, {
          checkInStreak: 0,  // Reset streak after 7 days
        });
      }

      // Add check-in to user history
      const historyRef = collection(firestore, 'User', user.userId, 'userHistory');
      const historySnapshot = await getDocs(historyRef);
      const newHistoryId = `HIS${(historySnapshot.size + 1).toString().padStart(5, '0')}`;

      const checkInData = {
        date: today,
        description: `You have checked in and earned ${pointsForToday} points!`,
        historyId: newHistoryId,
        pointGet: pointsForToday,
        title: 'Daily Check-In',
      };

      // Store the check-in data in the userHistory subcollection
      await addDoc(historyRef, checkInData);
      setRefreshTrigger((prev) => !prev);
      alert(`You have successfully checked in and earned ${pointsForToday} points!`);
      setUser({ ...user, rewardPoint: currentRewardPoints + pointsForToday });
    }
    checkUserCheckInStatus();
  } catch (error) {
    console.error('Error during check-in:', error);
  }
};

const fetchUserCheckInStreak = async () => {
  try {
    const userRef = doc(firestore, 'User', user.userId);
    const userDoc = await getDoc(userRef);
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setCheckInStreak(userData.checkInStreak || 0); // Update streak from user data
    }
  } catch (error) {
    console.error('Error fetching user check-in streak:', error);
  }
};

  // Fetch rewards data from Firestore
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
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserPoints = async () => {
    try {
      const userRef = doc(firestore, 'User', user.userId);
      const userDoc = await getDoc(userRef);
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUserPoints(userData.rewardPoint || 0);
        setCheckInStreak(userData.checkInStreak || 0);
      }
    } catch (error) {
      console.error('Error fetching user points:', error);
    }
  };

  const generateIncrementalRewardId = async (userId) => {
    try {
      // Reference to the user's rewards collection
      const userRewardsRef = collection(firestore, 'User', userId, 'usersReward');
      const rewardsSnapshot = await getDocs(userRewardsRef);
  
      let maxId = 0;
  
      // Loop through each reward document to find the highest ID
      rewardsSnapshot.forEach((doc) => {
        const docId = doc.id; // e.g., "RWD00001"
        const numericPart = parseInt(docId.replace('RWD', ''), 10); // Extract numeric part
        if (numericPart > maxId) {
          maxId = numericPart;
        }
      });
  
      // Generate the next ID by incrementing the highest found ID
      const newId = `RWD${(maxId + 1).toString().padStart(5, '0')}`;
      return newId;
    } catch (error) {
      console.error('Error generating new reward ID:', error);
      throw new Error('Could not generate a new reward ID.');
    }
  };

  // Handle voucher redemption
  const handleRedeem = async (item) => {
    setLoading(true);
    if (userPoints < item.pointsRequired) {
      Alert.alert('Not Enough Points', 'You do not have enough points to redeem this voucher.');
      setLoading(false);

      return;
    }

    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${item.title}" for ${item.pointsRequired} points?`,
      [
        { text: 'Cancel', style: 'cancel',onPress: () => {setLoading(false);} },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              
              // Deduct points
              const userRef = doc(firestore, 'User', user.userId);
              const newPoints = userPoints - item.pointsRequired;
              setRewardPoints(newPoints); 

              await updateDoc(userRef, { rewardPoint: newPoints });
              setUserPoints(newPoints);

              // Generate new Reward ID
              const userRewardsRef = collection(firestore, 'User', user.userId, 'usersReward');
              const rewardsSnapshot = await getDocs(userRewardsRef);
              const newRewardId = await generateIncrementalRewardId(user.userId);

              // Generate QR code
              const qrCodeUri = await generateQRCode(newRewardId);

              // Upload QR code to Cloudinary
              const cloudinaryUrl = await uploadQRCodeToCloudinary(qrCodeUri);

              // Prepare reward data
              const rewardData = {
                rewardCode: cloudinaryUrl,
                userRewardId: newRewardId,
                title: item.title,
                description: item.description,
                expirationDate: item.date || 'No Expiry',
                pointsRequired: -item.pointsRequired,
                image: item.imageVoucher,
                dateUsed : '',
                dateGet : today,
                status: 'active',
              };


              // Store reward in Firestore
              const rewardDocRef = doc(firestore, 'User', user.userId, 'usersReward', newRewardId);
              await setDoc(rewardDocRef, rewardData);
              // Update stock in Rewards collection
              const rewardRef = doc(firestore, 'Rewards', item.rewardId);
              const newStock = item.remainingStock - 1;
              
              await updateDoc(rewardRef, { remainingStock: newStock });
              setRefreshTrigger((prev) => !prev);
              setLoading(false);

              // Success alert
              Alert.alert('Redemption Successful', `You have redeemed "${item.title}"!`);
            } catch (error) {
              console.error('Error during redemption process:', error);
              Alert.alert('Redemption Failed', 'An error occurred during the redemption process. Please try again.');
            }
          },
        },
      ]
    );
  };

  const generateQRCode = async (rewardCode) => {
    return new Promise((resolve, reject) => {
      if (qrCodeRef.current) {
        qrCodeRef.current
          .capture()
          .then((uri) => {
            console.log('QR Code captured URI:', uri); // Add this log to verify URI
            if (!uri) {
              throw new Error('Failed to capture QR code');
            }
            resolve(uri); // Proceed if URI is valid
          })
          .catch((error) => {
            console.error('Error capturing QR code:', error);
            reject(error); // Reject if capture fails
          });
      } else {
        console.error('QR Code reference is null or not ready');
        reject('QR Code reference is null or not ready');
      }
    });
  };

  // Upload the QR code to Cloudinary
  const uploadQRCodeToCloudinary = async (uri) => {
    try {
      if (!uri) {
        throw new Error('Invalid URI provided for Cloudinary upload');
      }
      console.log('Uploading QR code to Cloudinary. URI:', uri);
      
      const formData = new FormData();
      formData.append('file', {
        uri,
        type: 'image/png',
        name: 'qr_code.png',
      });
      formData.append('upload_preset', 'rewardqr');
      formData.append('cloud_name', 'dnj0n4m7k');
      formData.append('folder', 'rewardQr');

      const response = await axios.post(
        'https://api.cloudinary.com/v1_1/dnj0n4m7k/image/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      console.log('Cloudinary upload response:', response.data);

      if (response.data && response.data.secure_url) {
        return response.data.secure_url;
      } else {
        throw new Error('Cloudinary did not return a secure URL');
      }
    } catch (error) {
      console.error('Error uploading QR code to Cloudinary:', error.message);
      throw error;
    }
  };

  // Load vouchers and check-in status on component mount
  useEffect(() => {
    
    fetchVouchers();
    fetchUserPoints();
    checkUserCheckInStatus();
    fetchUserCheckInStreak();
  }, [refreshTrigger]);

  // Render vouchers
  const renderVouchers = () => {
    const limitedVouchers = vouchers.slice(0, 7);
    return limitedVouchers.map((voucher) => (
      <View key={voucher.rewardId} style={styles.voucherCard}>
        <View style={styles.imageContainer}>
          <Image source={{ uri: voucher.imageVoucher }} style={styles.voucherImage} />
          <View style={styles.typeLabel}>
            <Text style={styles.typeLabelText}>{voucher.type}</Text>
          </View>
        </View>
        <Text style={styles.voucherText}>{voucher.title}</Text>
        <Text style={styles.pointsText}>{voucher.pointsRequired} Points</Text>
        <TouchableOpacity style={styles.swapButton} onPress={() => handleRedeem(voucher)}>
          <Text style={styles.buttonText}>Redeem</Text>
        </TouchableOpacity>
      </View>
    ));
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.pointsAndNavSection}>
        <View style={styles.pointsSection}>
          <Text style={styles.pointsTitle}>Your Points</Text>
          <Text style={styles.points}>{rewardPoints || 0}</Text>
        </View>
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

      <Text style={styles.sectionTitle}>Available Vouchers</Text>
      {loading ? <ActivityIndicator size="large" color="#6a8a6d" /> : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherScroll}>
          {renderVouchers()}
        </ScrollView>
      )}

      <View style={styles.dailyCheckInBox}>
        <View style={styles.dailyCheckInContent}>
          <Ionicons name="calendar-outline" size={24} color="#4caf50" />
          <Text style={styles.dailyCheckInTitle}>Daily Check-In</Text>
        </View>

        {/* Display Streak */}
        <View style={styles.streakContainer}>

          <View style={styles.streakIcons}>
            {/* Render the stars for the current streak */}
            {[...Array(checkInStreak)].map((_, index) => (
              <Ionicons key={index} name="star" size={20} color="#FFCC00" />
            ))}
            
            {/* Display the "empty" stars if the streak is not 7 */}
            {[...Array(7 - checkInStreak)].map((_, index) => (
              <Ionicons key={checkInStreak + index} name="star-outline" size={20} color="#FFD700" />
            ))}

            {/* Show points for today if the streak is less than 7 */}
            {checkInStreak < 7 && (
              <Text style={styles.streakText}>
                +{pointsForToday} points for next check in
              </Text>
            )}
            {checkInStreak >= 7 && (
              <Text style={styles.streakText}>
                points will be reset for next
              </Text>
            )}
          </View>
        </View>

        <TouchableOpacity
          style={styles.dailyCheckInButton}
          onPress={handleCheckIn}
          disabled={isCheckedInToday}
        >
          <Text style={styles.checkInButtonText}>{isCheckedInToday ? 'Checked In Today' : 'Check-In'}</Text>
        </TouchableOpacity>

        <ViewShot ref={qrCodeRef} style={{ opacity: 0, width: 100, height: 100 }}>
          <QRCode value="sampleQR" size={100} />
        </ViewShot>
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
    height:265,
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
    height: 160,
  },
  dailyCheckInContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
    marginTop: 5,
    textAlign: 'center',
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#4caf50',
    marginRight: 8,
  },
  streakIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  streakText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
    marginLeft: 8,
  },
});

export default RewardScreen;
