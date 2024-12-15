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
      // Fetch `usersReward` collection
      const rewardsRef = collection(firestore, 'User', user.userId, 'usersReward');
      const rewardsSnapshot = await getDocs(rewardsRef);
      const rewardsData = rewardsSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: data.dateGet, // Use `dateGet` field from `usersReward`
          type: 'Reward', // Tag to identify reward items
        };
      });

      // Fetch `userHistory` subcollection
      const historyRef = collection(firestore, 'User', user.userId, 'userHistory');
      const historySnapshot = await getDocs(historyRef);
      const historyData = historySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        type: 'History', // Tag to identify history items
      }));

      // Combine `usersReward` and `userHistory` into one array
      const combinedData = [...rewardsData, ...historyData];

      // Sort by date in descending order
      const sortedHistory = combinedData.sort(
        (a, b) => new Date(b.date) - new Date(a.date)
      );

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

  const renderTransaction = ({ item }) => {
    // Check if necessary fields exist or provide default values
    const transactionDate = item.date || 'N/A';  // Default date if not available
    const transactionTitle = item.title || 'Untitled Transaction';  // Default title if not available
    const transactionDescription = item.description || 'No description available.';  // Default description
    const transactionAmount = (item.pointsUsed < 0 || item.pointsRequired < 0) ? '-' : '+'; // Use + or - based on condition
    const transactionPoints = Math.abs(item.pointGet || item.pointsRequired) || 0; // Ensure points are valid
  
    return (
      <View style={styles.transactionCard}>
        <View style={styles.transactionHeader}>
          <Text style={[styles.transactionTitle, styles.boldLeft]}>
            {item.type === 'Reward' ? transactionTitle : transactionTitle}
          </Text>
          <Text style={styles.transactionAmount}>
            {transactionAmount} {transactionPoints} Points
          </Text>
        </View>
        <Text style={styles.transactionDescription}>
          {transactionDescription}
        </Text>
        <Text style={styles.transactionDate}>Date: {transactionDate}</Text>
      </View>
    );
  };
  

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
  boldLeft: {
    fontWeight: '700',
  },
  transactionTitle: {
    fontSize: 18,
    color: '#424242',
    flex: 1,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    marginVertical: 10,
    color: '#2e7d32',
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
  transactionHistoryId: {
    fontSize: 12,
    color: '#616161',
    fontStyle: 'italic',
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
