import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useUserContext } from '../UserContext';
import { collection, getDocs, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import QRCode from 'react-native-qrcode-svg';
import ViewShot from 'react-native-view-shot';
import axios from 'axios'; // To upload the QR code to Cloudinary

const CatalogueScreen = () => {
  const { user } = useUserContext();
  const [selectedTab, setSelectedTab] = useState('All');
  const [userPoints, setUserPoints] = useState(0);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);

  const qrCodeRef = useRef();

  const fetchVouchers = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'Rewards'));
      const rewardsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setVouchers(rewardsData);
      console.log('Fetched vouchers:', rewardsData);
    } catch (error) {
      console.error('Error fetching vouchers:', error);
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
        console.log('Fetched user points:', userData.rewardPoint || 0);
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

  const handleRedeem = async (item) => {
    if (userPoints < item.pointsRequired) {
      Alert.alert('Not Enough Points', 'You do not have enough points to redeem this voucher.');
      return;
    }
  
    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${item.title}" for ${item.pointsRequired} points?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeem',
          onPress: async () => {
            try {
              setLoading(true);

              console.log('Starting redemption process...');
              
              // Deduct points
              const userRef = doc(firestore, 'User', user.userId);
              const newPoints = userPoints - item.pointsRequired;
  
              console.log('Deducting points...');
              await updateDoc(userRef, { rewardPoint: newPoints });
              setUserPoints(newPoints);
              console.log('Points deducted successfully. New balance:', newPoints);
  
              // Generate new Reward ID
              const userRewardsRef = collection(firestore, 'User', user.userId, 'usersReward');
              const rewardsSnapshot = await getDocs(userRewardsRef);
              const newRewardId = await generateIncrementalRewardId(user.userId);
              console.log('Generated Reward ID:', newRewardId);
  
              // Generate QR code
              console.log('Generating QR code...');
              const qrCodeUri = await generateQRCode(newRewardId);
  
              // Upload QR code to Cloudinary
              console.log('Uploading QR code to Cloudinary...');
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
                status: 'active',
              };
  
              console.log('Reward data prepared:', rewardData);
  
              // Store reward in Firestore
              console.log('Storing reward in Firestore...');
              const rewardDocRef = doc(firestore, 'User', user.userId, 'usersReward', newRewardId);
              await setDoc(rewardDocRef, rewardData);
              console.log('Reward stored successfully.');
  
              // Update stock in Rewards collection
              const rewardRef = doc(firestore, 'Rewards', item.id);
              const newStock = item.remainingStock - 1;
  
              console.log('Updating stock...');
              await updateDoc(rewardRef, { remainingStock: newStock });
              console.log('Stock updated successfully. New stock:', newStock);
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
            console.log('QR Code captured URI:', uri); 
            if (!uri) {
              throw new Error('Failed to capture QR code');
            }
            resolve(uri); 
          })
          .catch((error) => {
            console.error('Error capturing QR code:', error);
            reject(error); 
          });
      } else {
        console.error('QR Code reference is null or not ready');
        reject('QR Code reference is null or not ready');
      }
    });
  };

  const uploadQRCodeToCloudinary = async (uri) => {
    try {
      console.log('Uploading QR code to Cloudinary. URI:', uri); // Check URI value
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
  
      if (response.data.secure_url) {
        console.log('Uploaded QR code URL:', response.data.secure_url);
        return response.data.secure_url;
      } else {
        throw new Error('Cloudinary did not return a secure URL');
      }
    } catch (error) {
      console.error('Error uploading QR code to Cloudinary:', error);
      throw error;
    }
  };

  useEffect(() => {
    fetchVouchers();
    fetchUserPoints();
  }, []);

  const filteredVouchers = selectedTab === 'All'
    ? vouchers
    : vouchers.filter((voucher) => voucher.type === selectedTab);

  const renderVoucher = ({ item }) => {
    const canRedeem = userPoints >= item.pointsRequired;
    const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();

    return (
      <View style={styles.card}>
        <Image source={{ uri: item.imageVoucher }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
          <Text style={styles.cardPoints}>{item.pointsRequired} Points</Text>
          <Text style={styles.remainingText}>{item.remainingStock} Left</Text>
          {isExpired && <Text style={styles.expiredText}>Voucher Expired</Text>}
        </View>
        {!isExpired && (
          <TouchableOpacity
            style={[styles.redeemButton, !canRedeem && styles.disabledRedeemButton]}
            disabled={!canRedeem}
            onPress={() => handleRedeem(item)}
          >
            <Text style={styles.redeemButtonText}>
              {canRedeem ? 'Redeem' : 'Not Enough Points'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsLabel}>Your Points:</Text>
        <Text style={styles.pointsValue}>{userPoints}</Text>
      </View>

      <View style={styles.tabs}>
        {['All', 'Discount', 'Shipping', 'Gift'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.activeTabText]}>
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : (
        <FlatList
          data={filteredVouchers}
          renderItem={renderVoucher}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={styles.list}
        />
      )}

      <ViewShot ref={qrCodeRef} style={{ opacity: 0,width: 100, height: 100,position: 'absolute',top:-1000,left:-1000}}>
        <QRCode value="sampleQR" size={100} />
      </ViewShot>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
    padding: 15,
  },
  pointsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    padding: 15,
    borderRadius: 12,
    marginBottom: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 5 },
  },
  pointsLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
  },
  pointsValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#6a8a6d',
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#e8e3df',
    borderRadius: 8,
    marginRight:20,
  },
  activeTab: {
    backgroundColor: '#6a8a6d',
  },
  tabText: {
    fontSize: 14,
    color: '#757575',
  },
  activeTabText: {
    color: 'white',
  },
  card: {
    backgroundColor: '#e8e3df',
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
  cardImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4caf50',
    marginBottom: 5,
  },
  cardDescription: {
    fontSize: 14,
    color: '#616161',
    marginBottom: 8,
  },
  cardPoints: {
    fontSize: 14,
    color: '#757575',
  },
  remainingText: {
    fontSize: 12,
    color: '#757575',
    marginTop: 5,
    fontWeight: '600',
  },
  expiredText: {
    fontSize: 14,
    color: '#f44336',
    fontWeight: 'bold',
  },
  redeemButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  disabledRedeemButton: {
    backgroundColor: '#d3d3d3',
  },
  redeemButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default CatalogueScreen;
