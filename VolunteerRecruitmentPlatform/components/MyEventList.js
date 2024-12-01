import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Image } from 'react-native';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const MyEventList = ({ activeTab, navigation, user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizationNames = async (userIds) => {
    if (!userIds || userIds.length === 0) return {};
  
    try {
      const userQuery = query(
        collection(firestore, 'User'),
        where('__name__', 'in', userIds)
      );
  
      const userSnapshot = await getDocs(userQuery);
  
      const organizationMap = {};
      userSnapshot.docs.forEach((doc) => {
        const { name } = doc.data(); // Assuming organization name is stored in `name`
        organizationMap[doc.id] = name || 'Unknown Organization';
      });
  
      return organizationMap;
    } catch (error) {
      console.error('Error fetching organization names:', error);
      return {};
    }
  };
  
  const fetchCategoryNames = async (categoryIds) => {
    if (!categoryIds || categoryIds.length === 0) return {};
  
    try {
      const categoryQuery = query(
        collection(firestore, 'Category'),
        where('__name__', 'in', categoryIds)
      );
      const categorySnapshot = await getDocs(categoryQuery);
  
      const categoryMap = {};
      categorySnapshot.docs.forEach((doc) => {
        const { categoryName } = doc.data();
        categoryMap[doc.id] = categoryName || 'Unknown Category';
      });
      console.log('Category Map:', categoryMap);
      return categoryMap;
    } catch (error) {
      console.error('Error fetching category names:', error);
      return {};
    }
  };
  
  
  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Fetch events based on the user's status and activeTab
      const userEventQuery = query(
        collection(firestore, `User/${user.userId}/UserEvent`),
        where(
          activeTab === 'watchlist' ? 'status' : 'applicationStatus',
          '==',
          activeTab === 'watchlist'
            ? 'watchlist'
            : activeTab === 'pending'
            ? 'pending'
            : activeTab === 'completed' || activeTab === 'active'
            ? 'completed'
            : 'approved'  
        )
      );
  
      const userEventSnapshot = await getDocs(userEventQuery);
      const userEventData = userEventSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Stop further processing if no events are found
      if (userEventData.length === 0) {
        setEvents([]);
        setLoading(false);
        return;
      }
  
      // Extract eventIds from UserEvent data to query Event collection
      const eventIds = userEventData.map((userEvent) => userEvent.eventId);
  
      // Fetch events data from the Event collection
      const eventQuery = query(
        collection(firestore, 'Event'),
        where('__name__', 'in', eventIds)
      );
      const eventSnapshot = await getDocs(eventQuery);
  
      // Extract data from events and build the map of categories and userIds
      const eventsData = eventSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
  
      // Extract unique user IDs and category IDs from events
      const userIds = [...new Set(eventsData.map((event) => event.userId))];
      const categoryIds = [...new Set(eventsData.flatMap((event) => event.categoryIds || []))];
      console.log('User IDs:', userIds);
      console.log('User IDs:', categoryIds);
      // Fetch organization and category names in parallel
      const [organizationMap, categoryMap] = await Promise.all([
        fetchOrganizationNames(userIds),
        fetchCategoryNames(categoryIds),
      ]);
      const startDate = eventsData.startDate ? new Date(eventsData.startDate.seconds * 1000) : null;
      const endDate = eventsData.endDate ? new Date(eventsData.endDate.seconds * 1000) : null;
      const startTime = eventsData.startTime ? new Date(eventsData.startTime.seconds * 1000) : null;
      const endTime = eventsData.endTime ? new Date(eventsData.endTime.seconds * 1000) : null;
      const combinedEvents = await Promise.all(
        userEventData.map(async (userEvent) => {
          // Find the event data by matching eventId
          const eventData = eventsData.find(
            (event) => event.id === userEvent.eventId
          );
      
      
          if (!eventData) {
            console.warn(`Event with ID ${userEvent.eventId} not found`);
            return { ...userEvent, organizationName: 'Unknown Organization', categories: [] };
          }
      
          return {
            ...userEvent,
            ...eventData,
            organizationName: organizationMap[eventData.userId] || 'Unknown Organization',
            categories: (eventData.categoryIds || []).map((id) => categoryMap[id] || 'Unknown Category'),
            startDate: eventData?.startDate?.toDate().toLocaleDateString() || '',
            endDate: eventData?.endDate?.toDate().toLocaleDateString() || '',
            startTime: eventData?.startTime?.toDate().toLocaleTimeString() || '',
            endTime: eventData?.endTime?.toDate().toLocaleTimeString() || '',
          };
        })
      );
  
      setEvents(combinedEvents);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  

  useEffect(() => {
    fetchEvents();
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

export default MyEventList;

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
