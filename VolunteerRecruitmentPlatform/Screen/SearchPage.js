import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useNavigation } from '@react-navigation/native';
import { firestore } from '../firebaseConfig';

const SearchPage = ({route}) => {
  const { top: safeTop } = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user } = route.params;

  const [categories, setCategories] = useState([]);
  const [locations, setLocations] = useState([]);
  const [skills, setSkills] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [selectedPreferences, setSelectedPreferences] = useState([]);
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Derived state to disable search
  const isSearchDisabled =
    !searchTerm.trim() &&
    selectedLocations.length === 0 &&
    selectedPreferences.length === 0 &&
    selectedSkills.length === 0;

  useEffect(() => {
    fetchCategories();
  }, []);
console.log(user?.userId);
  const fetchCategories = async () => {
    try {
      const categoryQuery = query(
        collection(firestore, 'Category'),
        where('categoryType', 'in', ['location', 'preference', 'skills'])
      );
      const categorySnapshot = await getDocs(categoryQuery);

      const fetchedCategories = categorySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

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
      const eventQuery = query(collection(firestore, 'Event'),where('status', '==', 'upcoming'));
      const eventSnapshot = await getDocs(eventQuery);

      const filteredEvents = [];
      for (const eventDoc of eventSnapshot.docs) {
        const eventData = eventDoc.data();

        const matchesTitle = eventData.title
          ? eventData.title.toLowerCase().includes(searchTerm.toLowerCase())
          : false;

        let matchesOrganization = false;
        if (eventData.userId) {
          const userDoc = await getDoc(doc(firestore, 'User', eventData.userId));
          if (userDoc.exists()) {
            const organizationName = userDoc.data().organizationName || userDoc.data().name || '';
            matchesOrganization = organizationName
              .trim()
              .toLowerCase()
              .includes(searchTerm.trim().toLowerCase());
          }
        }

        const selectedCategories = [
          ...selectedPreferences.map((cat) => `preference_${cat}`),
          ...selectedSkills.map((cat) => `skills_${cat}`),
          ...selectedLocations.map((cat) => `location_${cat}`),
        ];

        const matchesCategory =
          selectedCategories.length > 0 &&
          eventData.categoryIds &&
          eventData.categoryIds.some((categoryId) => selectedCategories.includes(categoryId));

        if(searchTerm.trim()){
          if (matchesTitle || matchesOrganization || matchesCategory) {
            filteredEvents.push({ id: eventDoc.id, ...eventData });
          }
        }
        else{
          if (matchesCategory) {
            filteredEvents.push({ id: eventDoc.id, ...eventData });
          }
        }

      }

      navigation.navigate('SearchResult', { events: filteredEvents, user: user });
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
            onPress={() =>
              toggleSelection(selectedPreferences, setSelectedPreferences, category.categoryName)
            }
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
            onPress={() =>
              toggleSelection(selectedLocations, setSelectedLocations, location.categoryName)
            }
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

      <TouchableOpacity
        style={[styles.searchButton, isSearchDisabled && styles.searchButtonDisabled]}
        onPress={fetchEvents}
        disabled={isSearchDisabled}
      >
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
  searchButtonDisabled: {
    backgroundColor: '#a0a0a0',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default SearchPage;
