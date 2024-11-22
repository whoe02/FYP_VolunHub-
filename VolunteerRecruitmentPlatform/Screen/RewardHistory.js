import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { collection, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Import your Firebase configuration
import { useUserContext } from '../UserContext'; // Import user context

const PointHistoryScreen = () => {
  const { user } = useUserContext(); // Get user context
  const [pointHistory, setPointHistory] = useState([]);
  const [loading, setLoading] = useState(true); // To show a loading indicator while fetching data

  // Fetch point history from Firestore
  const fetchPointHistory = async () => {
    setLoading(true);
    try {
      const historyRef = collection(firestore, 'User', user.userId, 'usersReward');
      const historySnapshot = await getDocs(historyRef);
      const historyData = historySnapshot.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) => item.status === 'redeemed'); // Filter for redeemed items
      // Sort data by date in descending order
      const sortedHistory = historyData.sort((a, b) => new Date(b.dateUsed) - new Date(a.dateUsed));
      setPointHistory(sortedHistory);
    } catch (error) {
      console.error('Error fetching point history:', error);
    } finally {
      setLoading(false);
    }
  };
  

  // Use Effect to fetch data on component mount
  useEffect(() => {
    fetchPointHistory();
  }, []);

  const renderTransaction = ({ item }) => (
    <View style={styles.transactionCard}>
      <View style={[styles.transactionHeader, item.points < 0 && styles.decrease]}>
        <Text style={[styles.transactionTitle, styles.boldLeft]}>{item.title}</Text>
        <Text style={styles.transactionType}>{item.type}</Text>
      </View>
      <Text
        style={[
          styles.transactionAmount,
          item.points < 0 ? styles.decreaseColor : styles.increaseColor,
        ]}
      >
        {item.pointsRequired < 0 ? '-' : '+'} {Math.abs(item.pointsRequired)} Points
      </Text>
      <Text style={styles.transactionDescription}>{item.description}</Text>
      <Text style={styles.transactionDate}>Date: {item.dateUsed}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Point History</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : pointHistory.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No transaction history found.</Text>
        </View>
      ) : (
        <FlatList
          data={pointHistory}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.historyList}
        />
      )}
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
    borderLeftColor: '#d32f2f',
  },
  boldLeft: {
    fontWeight: '700',
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
  },
  increaseColor: {
    color: '#2e7d32',
  },
  decreaseColor: {
    color: '#d32f2f',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#757575',
  },
});

export default PointHistoryScreen;
