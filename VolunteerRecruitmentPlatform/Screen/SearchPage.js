import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native'; // Ensure navigation is set up in your project
import { firestore } from '../firebaseConfig'; // Replace with your Firebase setup path

const SearchPage = () => {
  const { top: safeTop } = useSafeAreaInsets();
  const navigation = useNavigation();

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const categoryQuery = query(collection(firestore, 'Category'), where('categoryType', 'in', ['location', 'preference', 'skills']));
      const categorySnapshot = await getDocs(categoryQuery);

      const fetchedCategories = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Filter categories based on `categoryType`
      setCategories(fetchedCategories.filter((item) => item.categoryType === 'preference'));
      setLocations(fetchedCategories.filter((item) => item.categoryType === 'location'));
      setSkills(fetchedCategories.filter((item) => item.categoryType === 'skills'));
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const toggleSelection = (selectedArray, setSelectedArray, item) => {
    if (selectedArray.includes(item)) {
      setSelectedArray(selectedArray.filter((currentItem) => currentItem !== item));
    } else {
      setSelectedArray([...selectedArray, item]);
    }
  };

  const fetchEvents = async () => {
    try {
      const eventQuery = query(collection(firestore, 'Event'));
      const eventSnapshot = await getDocs(eventQuery);
  
      const filteredEvents = [];
      for (const eventDoc of eventSnapshot.docs) {
        const eventData = eventDoc.data();
  
        // Check if title exists and matches the search term
        const matchesTitle = eventData.title 
          ? eventData.title.toLowerCase().includes(searchTerm.toLowerCase())
          : false;
  
        // Fetch the organization name using userId from the event
        let matchesOrganization = false;
        if (eventData.userId) {
          const userDoc = await getDoc(doc(firestore, 'User', eventData.userId));
          const organizationName = userDoc.exists() && userDoc.data().organizationName 
            ? userDoc.data().organizationName 
            : '';
          matchesOrganization = organizationName.toLowerCase().includes(searchTerm.toLowerCase());
        }
  
        // Check if category IDs match selected categories
        const matchesCategory = eventData.categoryIds && eventData.categoryIds.some((categoryId) =>
          [...selectedPreferences, ...selectedSkills, ...selectedLocations].includes(categoryId)
        );
  
        // Add event if any condition matches
        if (matchesTitle || matchesOrganization || matchesCategory) {
          filteredEvents.push({ id: eventDoc.id, ...eventData });
        }
      }
  
      // Navigate to SearchResult.js with filtered events
      navigation.navigate('SearchResult', { events: filteredEvents });
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  

  return (
    <ScrollView style={[styles.container, { paddingTop: safeTop }]}>
      <TextInput
        placeholder="Search for events..."
        style={styles.searchBar}
        value={searchTerm}
        onChangeText={(text) => setSearchTerm(text)}
      />

      {/* Preferences */}
      <Text style={styles.sectionTitle}>Preferences</Text>
      <View style={styles.listWrapper}>
        {categories.map((category) => (
          <TouchableOpacity
            key={category.id}
            onPress={() => toggleSelection(selectedPreferences, setSelectedPreferences, category.categoryName)}
            style={[
              styles.item,
              selectedPreferences.includes(category.categoryName) && styles.itemActive,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                selectedPreferences.includes(category.categoryName) && styles.itemTextActive,
              ]}
            >
              {category.categoryName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Skills */}
      <Text style={styles.sectionTitle}>Skills</Text>
      <View style={styles.listWrapper}>
        {skills.map((skill) => (
          <TouchableOpacity
            key={skill.id}
            onPress={() => toggleSelection(selectedSkills, setSelectedSkills, skill.categoryName)}
            style={[
              styles.item,
              selectedSkills.includes(skill.categoryName) && styles.itemActive,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                selectedSkills.includes(skill.categoryName) && styles.itemTextActive,
              ]}
            >
              {skill.categoryName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Locations */}
      <Text style={styles.sectionTitle}>Locations</Text>
      <View style={styles.listWrapper}>
        {locations.map((location) => (
          <TouchableOpacity
            key={location.id}
            onPress={() => toggleSelection(selectedLocations, setSelectedLocations, location.categoryName)}
            style={[
              styles.item,
              selectedLocations.includes(location.categoryName) && styles.itemActive,
            ]}
          >
            <Text
              style={[
                styles.itemText,
                selectedLocations.includes(location.categoryName) && styles.itemTextActive,
              ]}
            >
              {location.categoryName}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={styles.searchButton} onPress={fetchEvents}>
        <Text style={styles.searchButtonText}>Search</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  searchBar: {
    backgroundColor: '#e8e3df',
    paddingHorizontal: 10,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  listWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  item: {
    borderWidth: 1,
    borderColor: '#666',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 15,
    marginRight: 10,
    marginBottom: 10,
  },
  itemActive: {
    backgroundColor: '#6a8a6d',
    borderColor: '#6a8a6d',
  },
  itemText: {
    fontSize: 14,
    color: '#666',
  },
  itemTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  searchButton: {
    backgroundColor: '#6a8a6d',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 80,
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchPage;
