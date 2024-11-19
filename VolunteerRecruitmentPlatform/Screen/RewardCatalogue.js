import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Image,
  Alert,
} from 'react-native';

const CatalogueScreen = () => {
  const [selectedTab, setSelectedTab] = useState('All');
  const [userPoints, setUserPoints] = useState(1000); // User's current points

  const vouchers = [
    {
      id: 1,
      title: '10% Off',
      type: 'Discount',
      pointsRequired: 500,
      description: 'Get 10% off on your next purchase.',
      image: require('../assets/img/prof.png'),
      remaining: 15, // Add remaining stock
    },
    {
      id: 2,
      title: 'Free Shipping',
      type: 'Shipping',
      pointsRequired: 800,
      description: 'Enjoy free shipping on your order.',
      image: require('../assets/img/prof.png'),
      remaining: 10, // Add remaining stock
    },
    {
      id: 3,
      title: '$50 Gift Card',
      type: 'Gift',
      pointsRequired: 1500,
      description: 'Redeem a $50 gift card.',
      image: require('../assets/img/prof.png'),
      remaining: 5, // Add remaining stock
    },
    {
      id: 4,
      title: '20% Off',
      type: 'Discount',
      pointsRequired: 700,
      description: 'Save 20% on your favorite items.',
      image: require('../assets/img/prof.png'),
      remaining: 20, // Add remaining stock
    },
  ];

  const tabs = ['All', 'Discount', 'Shipping', 'Gift'];

  const handleRedeem = (item) => {
    Alert.alert(
      'Confirm Redemption',
      `Are you sure you want to redeem "${item.title}" for ${item.pointsRequired} points?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Redeem',
          onPress: () => {
            setUserPoints(userPoints - item.pointsRequired);
            // Optionally, update remaining stock here
            console.log(`Redeemed: ${item.title}`);
          },
        },
      ]
    );
  };

  const renderVoucher = ({ item }) => {
    if (selectedTab !== 'All' && item.type !== selectedTab) return null;

    const canRedeem = userPoints >= item.pointsRequired;

    return (
      <View style={styles.card}>
        <Image source={item.image} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={styles.cardDescription}>{item.description}</Text>
          <Text style={styles.cardPoints}>{item.pointsRequired} Points</Text>
          <Text style={styles.remainingText}>{item.remaining} Left</Text>
        </View>
        <TouchableOpacity
          style={[
            styles.redeemButton,
            !canRedeem && styles.disabledRedeemButton,
          ]}
          disabled={!canRedeem}
          onPress={() => handleRedeem(item)}
        >
          <Text style={styles.redeemButtonText}>
            {canRedeem ? 'Redeem' : 'Not Enough Points'}
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Points Display */}
      <View style={styles.pointsContainer}>
        <Text style={styles.pointsLabel}>Your Points:</Text>
        <Text style={styles.pointsValue}>{userPoints}</Text>
      </View>

      {/* Tabs */}
      <View style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.tab,
              selectedTab === tab && styles.activeTab,
            ]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text
              style={[
                styles.tabText,
                selectedTab === tab && styles.activeTabText,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Voucher List */}
      <FlatList
        data={vouchers}
        renderItem={renderVoucher}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.list}
      />
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
    color: '#616161',
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4caf50',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  tab: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
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
  list: {
    paddingBottom: 20,
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
