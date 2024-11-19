import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, Image, Modal, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg'; // QR code generator

const MyRewardsScreen = () => {
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedVoucher, setSelectedVoucher] = useState(null); // Store selected voucher to show its QR
  const [redeemedVouchers, setRedeemedVouchers] = useState([
    {
      id: 1,
      title: '10% Off',
      type: 'Discount',
      pointsRequired: 500,
      description: 'Redeemed 10% off voucher for your next purchase.',
      image: require('../assets/img/prof.png'),
      redeemedDate: '2024-11-15',
    },
    {
      id: 2,
      title: 'Free Shipping',
      type: 'Shipping',
      pointsRequired: 800,
      description: 'Redeemed free shipping on your next order.',
      image: require('../assets/img/prof.png'),
      redeemedDate: '2024-11-16',
    },
    {
      id: 3,
      title: '$50 Gift Card',
      type: 'Gift',
      pointsRequired: 1500,
      description: 'Redeemed a $50 gift card for your purchases.',
      image: require('../assets/img/prof.png'),
      redeemedDate: '2024-11-17',
    },
  ]);

  const handleRedeemPress = (voucher) => {
    setSelectedVoucher(voucher); // Store the selected voucher
    setShowQRCode(true); // Show the QR code modal
  };

  const handleRedeemVoucher = () => {
    Alert.alert(
      'Redeem Voucher',
      `Are you sure you want to redeem the "${selectedVoucher.title}" voucher?`,
      [
        {
          text: 'Cancel',
          onPress: () => setShowQRCode(false), // Close the modal without removing the voucher
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            // Remove the redeemed voucher from the list
            setRedeemedVouchers((prevVouchers) =>
              prevVouchers.filter((voucher) => voucher.id !== selectedVoucher.id)
            );
            setShowQRCode(false); // Close the modal after redeeming
            Alert.alert('Success', 'Voucher redeemed successfully!');
          },
        },
      ],
      { cancelable: false }
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={redeemedVouchers}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Image source={item.image} style={styles.cardImage} />
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
              <Text style={styles.cardPoints}>{item.pointsRequired} Points</Text>
            </View>
            <TouchableOpacity
              style={styles.redeemButton}
              onPress={() => handleRedeemPress(item)}
            >
              <Text style={styles.redeemButtonText}>Show QR</Text>
            </TouchableOpacity>
          </View>
        )}
        keyExtractor={(item) => item.id.toString()}
      />

      {/* Modal to show QR code */}
      <Modal
        visible={showQRCode}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRCode(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            {selectedVoucher && (
              <>
                <Text style={styles.qrTitle}>Voucher QR Code: {selectedVoucher.title}</Text>
                <QRCode
                  value={`Voucher ID: ${selectedVoucher.id}, Title: ${selectedVoucher.title}, Redeemed on: ${selectedVoucher.redeemedDate}`}
                  size={200}
                  backgroundColor="white"
                  color="black"
                />
              </>
            )}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowQRCode(false)}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.redeemButton}
                onPress={handleRedeemVoucher}
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
    borderLeftWidth: 1,
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
    width: '100%',
  },
});

export default MyRewardsScreen;
