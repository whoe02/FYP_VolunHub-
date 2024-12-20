import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase config

const CategoryManagement = ({ navigation }) => {
  const [selectedTab, setSelectedTab] = useState('Location');
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter categories based on search query
  const filteredData = categories.filter((category) =>
    category.categoryName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    category.id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Fetch categories based on the selected tab
  const fetchCategories = async () => {
    setLoading(true);
    try {
      const categoryType = selectedTab.toLowerCase(); // "location", "preference", or "skills"
      const q = query(collection(firestore, 'Category'), where('categoryType', '==', categoryType));
      const querySnapshot = await getDocs(q);
      const data = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        categoryName: doc.data().categoryName || 'Unknown', // Provide a default value if `categoryName` is missing
        ...doc.data(),
      }));
      console.log('Fetched categories:', data); // Debugging log
      setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [selectedTab]);

  // Render each category item
  const renderCategory = ({ item }) => (
    <TouchableOpacity
      style={styles.categoryContainer}
      onPress={() => navigation.navigate('CategoryDetail', { categoryId: item.id })}
      activeOpacity={0.7}
    >
      <View style={styles.categoryInfo}>
        <Text style={styles.categoryName}>{item.categoryName}</Text>
        <Text style={styles.categoryId}>{item.id}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Main Content */}
      <View style={styles.belowContainer}>
        {/* Search Bar */}
        <TextInput
          style={styles.searchBar}
          placeholder="Search categories..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
  
        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          {['Location', 'Preference', 'Skills'].map((tab) => (
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
  
        {/* List of Categories */}
        {loading ? (
          <ActivityIndicator size="large" color="#6a8a6d" />
        ) : (
          <FlatList
            data={filteredData}
            renderItem={renderCategory}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
        )}
      </View>
  
      {/* Add Button */}
      <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddCategory')} activeOpacity={0.7}>
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>
    </View>
  );
};

export default CategoryManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  belowContainer: {
    paddingHorizontal: 20,
    marginBottom: 130,
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
  categoryContainer: {
    padding: 15,
    backgroundColor: '#e8e3df',
    borderRadius: 8,
    marginBottom: 10,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  categoryId: {
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
