import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';

const PointHistoryScreen = () => {
  const [pointHistory, setPointHistory] = useState([
    {
      id: '1',
      title: '10% Off',
      type: 'Discount',
      points: -500, // Negative for used points
      description: 'Get 10% off on your next purchase.',
      date: '2024-11-15',
    },
    {
      id: '2',
      title: 'Free Shipping',
      type: 'Shipping',
      points: -800, // Negative for used points
      description: 'Enjoy free shipping on your order.',
      date: '2024-11-17',
    },
    {
      id: '3',
      title: 'Gift Card Earned',
      type: 'Gift',
      points: 1500, // Positive for earned points
      description: 'Earned a $50 gift card.',
      date: '2024-11-18',
    },
    {
      id: '4',
      title: '20% Off',
      type: 'Discount',
      points: -700, // Negative for used points
      description: 'Save 20% on your favorite items.',
      date: '2024-11-19',
    },
  ]);

  // Sort the history array by date (latest first)
  const sortedPointHistory = [...pointHistory].sort((a, b) => new Date(b.date) - new Date(a.date));

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionHeader, item.points < 0 && styles.decrease]}>
        <Text style={[styles.transactionTitle, styles.boldLeft]}>{item.title}</Text>
        <Text style={styles.transactionType}>{item.type}</Text>
      </View>
      <Text style={styles.transactionAmount}>
        {item.points < 0 ? '-' : '+'} {Math.abs(item.points)} Points
      </Text>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>Date: {item.date}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Point History</Text>

      {/* Point History List */}
      <FlatList
        data={sortedPointHistory}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.historyList}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2e7d32',
    marginBottom: 20,
    textAlign: 'center',
  },
  historyList: {
    paddingBottom: 20,
  },
  transactionCard: {
    backgroundColor: '#e8e3df',
    padding: 20,
    marginBottom: 15,
    borderRadius: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    borderLeftWidth: 5,
    borderLeftColor: '#6a8a6d',
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  decrease: {
    borderLeftColor: '#d32f2f', // Red color for decrease
  },
  boldLeft: {
    fontWeight: '700', // Bold the left side title text
  },
  transactionTitle: {
    fontSize: 18,
    color: '#424242',
    flex: 1,
  },
  transactionType: {
    fontSize: 14,
    fontWeight: '500',
    color: '#616161',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 10,
    color: '#2e7d32', // Green for increase
  },
  transactionDescription: {
    fontSize: 14,
    color: '#757575',
    marginVertical: 5,
  },
  transactionDate: {
    fontSize: 12,
    color: '#616161',
  },
});

export default PointHistoryScreen;
