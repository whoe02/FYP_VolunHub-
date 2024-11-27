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
    if (!categoryIds || categoryIds.length === 0) {
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
        eventQuery = query(eventCollection);
      } else if (activeTab === 'latest') {
        eventQuery = query(eventCollection, orderBy('createdAt', 'desc'));
      }
  
      const querySnapshot = await getDocs(eventQuery);
      console.log('Fetched event documents:', querySnapshot.docs); // Log the raw documents
  
      const fetchedEvents = querySnapshot.docs.map((doc) => {
        const data = doc.data();
        console.log('Event data:', data);
  
        // Convert Firestore Timestamp fields to Date if necessary
        const startDate = data.startDate ? new Date(data.startDate.seconds * 1000) : null;
        const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : null;
        const startTime = data.startTime ? new Date(data.startTime.seconds * 1000) : null;
        const endTime = data.endTime ? new Date(data.endTime.seconds * 1000) : null;
  
        return {
          id: doc.id,
          ...data,
          startDate,
          endDate,
          startTime,
          endTime,
        };
      });

      // Check if categoryIds is defined and non-empty before processing
      const allCategoryIds = [
        ...new Set(fetchedEvents.flatMap((event) => event.categoryIds || [])), // Default to empty array if categoryIds is undefined
      ];
      console.log('All category IDs:', allCategoryIds);

      const allUserIds = [...new Set(fetchedEvents.map((event) => event.userId))];
      console.log('All user IDs:', allUserIds);
  
      // Fetch categories and organizations
      const categoryMap = await fetchCategoryNames(allCategoryIds);
      console.log('Category Map:', categoryMap);
  
      const organizationMap = await fetchOrganizationNames(allUserIds);
      console.log('Organization Map:', organizationMap);
  
      // Update event data with category names
      const eventsWithDetails = fetchedEvents.map((event) => ({
        ...event,
        categories: event.categoryIds?.map((id) => categoryMap[id] || 'Unknown').filter((name) => name !== 'Unknown1') || [],
        organizationName: organizationMap[event.userId] || 'Unknown Organization', 
      }));
  
      console.log('Events with categories and organizations:', eventsWithDetails);
  
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

  const formatDate = (date) => {
    // Check if date is a valid Date object or Firestore Timestamp
    const validDate = date instanceof Date && !isNaN(date);
    
    // If it's a Firestore Timestamp, convert to Date
    const formattedDate = validDate ? date : date?.seconds ? new Date(date.seconds * 1000) : null;
    
    // Format the date or return 'N/A' if invalid
    return formattedDate ? formattedDate.toLocaleDateString() : 'N/A';
  };
  
  const formatTime = (time) => {
    // Check if time is a valid Date object
    const validTime = time instanceof Date && !isNaN(time);
    
    // If it's a valid Date object, format it, otherwise return 'N/A'
    if (validTime) {
      return time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return 'N/A';
    }
  };
  
  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventItem}
      onPress={() => navigation.navigate('EventDetail', { event: item , user: user})}>
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <View style={styles.organizationWrapper}>
          <Text style={styles.organizationName}>{item.organizationName}</Text>
        </View>
        <Text style={styles.eventDate}>
          {formatDate(item.startDate)} - {formatDate(item.endDate)} | 
          {formatTime(item.startTime)} - {formatTime(item.endTime)}
        </Text>
        <View style={styles.categoryWrapper}>
          {(item.categories || []).map((category, index) => (
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
