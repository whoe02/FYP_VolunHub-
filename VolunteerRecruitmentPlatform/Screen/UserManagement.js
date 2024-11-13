import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const volunteerData = [
  { id: '1', name: 'John Doe', email: 'johndoe@example.com', profilePic: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Jane Smith', email: 'janesmith@example.com', profilePic: 'https://via.placeholder.com/150' },
];

const organizationData = [
  { id: '1', name: 'Helping Hands Org', email: 'contact@helpinghands.org', profilePic: 'https://via.placeholder.com/150' },
  { id: '2', name: 'Green Earth', email: 'info@greenearth.org', profilePic: 'https://via.placeholder.com/150' },
];

const UserManagement = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Volunteer');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter users based on search query
  const filteredData = (selectedTab === 'Volunteer' ? volunteerData : organizationData).filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Render each user item with profile pic, name, and email
  const renderUser = ({ item }) => (
    <TouchableOpacity
      style={styles.userContainer}
      onPress={() => navigation.navigate('UserDetail')} // Navigate to UserDetail page
    >
      <Image source={{ uri: item.profilePic }} style={styles.profilePic} />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        <Text style={styles.userEmail}>{item.email}</Text>
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
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Volunteer' && styles.activeTab]}
          onPress={() => setSelectedTab('Volunteer')}
        >
          <Text style={styles.tabText}>Volunteer</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, selectedTab === 'Organization' && styles.activeTab]}
          onPress={() => setSelectedTab('Organization')}
        >
          <Text style={styles.tabText}>Organization</Text>
        </TouchableOpacity>
      </View>

      {/* List of Users */}
      <FlatList
        data={filteredData}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
      />

      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddUser')}>
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
    elevation: 5, // For shadow on Android
    shadowColor: '#000', // For shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3.84,
  },
});