import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { collection, query, orderBy, getDocs, where } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const EventList = ({ activeTab, navigation, user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizationNames = async (userIds) => {
    if (userIds.length === 0) {
      return {}; // Return empty object if no userIds
    }

    try {
      const userQuery = query(
        collection(firestore, 'User'),
        where('userId', 'in', userIds) // Query by document ID
      );

      const querySnapshot = await getDocs(userQuery);

      const organizationMap = {};
      querySnapshot.docs.forEach((doc) => {
        const { name } = doc.data(); // Assuming the field is `organizationName`
        organizationMap[doc.id] = name || 'Unknown Organization'; // Map userId to organization name
      });

      return organizationMap;
    } catch (error) {
      console.error('Error fetching organization names:', error);
      return {};
    }
  };

  const fetchCategoryNames = async (categoryIds) => {
    if (categoryIds.length === 0) {
      return {}; // Return empty object if no categoryIds
    }

    try {
      const categoryQuery = query(
        collection(firestore, 'Category'),
        where('__name__', 'in', categoryIds) // Use `__name__` to query by document ID
      );

      const querySnapshot = await getDocs(categoryQuery);

      const categoryMap = {};
      querySnapshot.docs.forEach((doc) => {
        const { categoryName } = doc.data(); // Get `categoryName` field
        categoryMap[doc.id] = categoryName; // Map document ID to category name
      });

      return categoryMap;
    } catch (error) {
      console.error('Error fetching categories:', error);
      return {};
    }
  };

  const fetchEvents = async () => {
    setLoading(true);
    try {
      const eventCollection = collection(firestore, 'Event');
      let eventQuery;
  
      // Filter based on selected tab
      if (activeTab === 'upcoming') {
        eventQuery = query(eventCollection, where('status', '==', 'upcoming'));
      } else if (activeTab === 'inprogress') {
        eventQuery = query(eventCollection, where('status', '==', 'inprogress'));
      } else if (activeTab === 'completed') {
        eventQuery = query(eventCollection, where('status', '==', 'completed'));
      } else if (activeTab === 'canceled') {
        eventQuery = query(eventCollection, where('status', '==', 'canceled'));
      } else if (activeTab === 'all') {
        // For volunteers, fetch all events
        eventQuery = query(eventCollection);
      } else if (activeTab === 'latest') {
        // For volunteers, fetch latest events
        eventQuery = query(eventCollection, orderBy('createdAt', 'desc'));
      }
  
      const querySnapshot = await getDocs(eventQuery);
      const fetchedEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          categoryIds: [data.location, ...data.preference, ...data.skills].filter(item => item != null),
          userId: data.userId, 
        };
      });
  
      // Fetch additional data like categories and organization names
      const allCategoryIds = [...new Set(fetchedEvents.flatMap((event) => event.categoryIds))];
      const allUserIds = [...new Set(fetchedEvents.map((event) => event.userId))];
  
      const categoryMap = await fetchCategoryNames(allCategoryIds);
      const organizationMap = await fetchOrganizationNames(allUserIds);
  
      const eventsWithDetails = fetchedEvents.map((event) => ({
        ...event,
        categories: event.categoryIds.map((id) => categoryMap[id] || 'Unknown'),
        organizationName: organizationMap[event.userId] || 'Unknown Organization',
      }));
  
      setEvents(eventsWithDetails);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  

  useEffect(() => {
    fetchEvents(); // Fetch events based on the current user role and active tab
  }, [activeTab]);

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetail', { event: item , user: user})}>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.organizationWrapper}>
          <Text style={styles.organizationName}>{item.organizationName}</Text>
        </View>
        <Text style={styles.eventDate}>
          {item.startDate} - {item.endDate} | {item.startTime} - {item.endTime}
        </Text>
        <View style={styles.categoryWrapper}>
          {item.categories.map((category, index) => (
            <Text key={index} style={styles.categoryText}>
              {category}
            </Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#6a8a6d" />
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderRadius: 8,
    backgroundColor: '#e8e3df',
    overflow: 'hidden',
    padding: 5,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    borderLeftWidth: 5,
    borderLeftColor: '#6a8a6d',
  },
  eventImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  eventDetails: {
    flex: 1,
    padding: 10,
  },
  eventTitle: {
    fontSize: 18,
    color: '#333', // Dark text for readability
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#555',
    marginBottom: 5,
  },
  categoryWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryText: {
    backgroundColor: '#6a8a6d',
    marginRight: 5,
    marginBottom: 5,
    paddingVertical: 3,
    paddingHorizontal: 7,
    borderRadius: 15,
    fontSize: 12,
    color: '#fff',
  },
  listContent: {
    paddingBottom: 20,
  },
  organizationWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingVertical: 5,
  },
  organizationName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default EventList;
