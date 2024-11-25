import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase config

const RewardManagement = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data based on the selected tab
  const fetchRewards = async () => {
    setLoading(true);
    try {
      const querySnapshot = await getDocs(collection(firestore, 'Rewards'));
      const rewardsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setRewards(rewardsData);
    } catch (error) {
      console.error('Error fetching rewards:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRewards();
  }, [selectedTab]);

  // Filter rewards based on search query
  const filteredData = rewards.filter((reward) => {
    // Check if the reward matches the selected tab type or if 'All' is selected
    const matchesTab = selectedTab === 'All' || reward.type === selectedTab;
  
    // Check if the reward title matches the search query
    const matchesSearch = reward.title.toLowerCase().includes(searchQuery.toLowerCase());
  
    // Return the reward if it matches both the search query and the selected tab
    return matchesTab && matchesSearch;
  });

  // Render each reward item with image, title, description, and type
  const renderReward = ({ item }) => (
    <TouchableOpacity
      style={styles.rewardContainer}
      onPress={() => navigation.navigate('EditRewardScreen', { rewardId: item.id })} 
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.imageVoucher }} // Use the first image in the imageVoucher array
        style={styles.rewardImage}
      />
      <View style={styles.rewardInfo}>
        <Text style={styles.rewardTitle}>{item.title}</Text>
        <Text style={styles.rewardDescription}>{item.description}</Text>
        <Text style={styles.rewardPoints}>{item.pointsRequired} points</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search rewards..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['All', 'Discount', 'Gift', 'Shipping'].map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, selectedTab === tab && styles.activeTab]}
            onPress={() => setSelectedTab(tab)}
            activeOpacity={0.9}
          >
            <Text style={styles.tabText}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List of Rewards */}
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderReward}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Reward Button */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate('AddRewardScreen')}
        activeOpacity={0.7}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default RewardManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  searchBar: {
    backgroundColor: '#e8e3df',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
    marginBottom: 20,
  },
  tabContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#ddd',
  },
  activeTab: {
    borderBottomColor: '#6a8a6d',
  },
  tabText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    paddingVertical: 10,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8e3df',
    borderRadius: 8,
    marginBottom: 10,
  },
  rewardImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 15,
  },
  rewardInfo: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  rewardDescription: {
    fontSize: 14,
    color: '#666',
  },
  rewardPoints: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6a8a6d',
  },
  addButton: {
    position: 'absolute',
    bottom: 30,
    right: 30,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#6a8a6d',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
});
