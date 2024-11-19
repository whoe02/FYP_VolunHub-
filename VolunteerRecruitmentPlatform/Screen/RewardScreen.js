import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const RewardScreen = ({ navigation }) => {
  const [points, setPoints] = useState(1200);

  const vouchers = [
    { id: 1, title: '10% off on next purchase', pointsRequired: 500, type: 'Discount', image: 'https://via.placeholder.com/150' },
    { id: 2, title: 'Free Shipping', pointsRequired: 1000, type: 'Shipping', image: 'https://via.placeholder.com/150' },
    { id: 3, title: 'Gift Card $50', pointsRequired: 1500, type: 'Gift Card', image: 'https://via.placeholder.com/150' },
  ];

  const renderVouchers = () => {
    return vouchers.map((voucher) => (
      <View key={voucher.id} style={styles.voucherCard}>
        {/* Image */}
        <Image source={{ uri: voucher.image }} style={styles.voucherImage} />
        
        {/* Type Label */}
        <View style={styles.typeLabel}>
          <Text style={styles.typeLabelText}>{voucher.type}</Text>
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
          <Text style={styles.points}>{points}</Text>
        </View>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtonsContainer}>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RewardCatalogue')}>
            <Text style={styles.navButtonText}>Catalogue</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('MyRewards')}>
            <Text style={styles.navButtonText}>My Rewards</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={() => navigation.navigate('RewardsHistory')}>
            <Text style={styles.navButtonText}>Point History</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Vouchers Section */}
      <Text style={styles.sectionTitle}>Available Vouchers</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.voucherScroll}>
        {renderVouchers()}
      </ScrollView>

      {/* Daily Check-In Section */}
      <View style={styles.dailyCheckInBox}>
        <View style={styles.dailyCheckInContent}>
          <Ionicons name="calendar-outline" size={24} color="#4caf50" />
          <Text style={styles.dailyCheckInTitle}>Daily Check-In</Text>
          <Text style={styles.dailyCheckInDescription}>
            Check-in now and earn points!
          </Text>
        </View>
        <TouchableOpacity style={styles.dailyCheckInButton}>
          <Text style={styles.checkInButtonText}>Check-In</Text>
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
    marginVertical: 10,
  },
  navigationButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    width: 230,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  voucherImage: {
    width: '100%',
    height: 120,
    borderRadius: 12,
    marginBottom: 10,
  },
  typeLabel: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
    alignSelf: 'center',
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
    marginTop: 0,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
  },
  dailyCheckInContent: {
    alignItems: 'center',
    marginBottom: 15,
  },
  dailyCheckInTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#4caf50',
    marginTop: 10,
  },
  dailyCheckInDescription: {
    fontSize: 14,
    color: '#616161',
    textAlign: 'center',
    marginTop: 5,
  },
  dailyCheckInButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  checkInButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RewardScreen;
