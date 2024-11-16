import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase config

const UserManagement = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Volunteer');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch data based on the selected tab
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const userType = selectedTab.toLowerCase(); // "volunteer", "organization", or "admin"
      const q = query(collection(firestore, 'User'), where('role', '==', userType));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setUsers(data);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedTab]);

  // Filter users based on search query
  const filteredData = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render each user item with profile pic, name, and email
  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userContainer}
      onPress={() => navigation.navigate('UserDetail', { userId: item.id }) }
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: item.image }}  // Use the Cloudinary URL stored in Firestore
        style={styles.profilePic}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.userId}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search users..."
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {['Volunteer', 'Organization', 'Admin'].map((tab) => (
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

      {/* List of Users */}
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : (
        <FlatList
          data={filteredData}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
        />
      )}

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddUser')} activeOpacity={0.7}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default UserManagement;

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
  userContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#e8e3df',
    borderRadius: 8,
    marginBottom: 10,
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
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