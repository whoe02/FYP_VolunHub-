import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Image } from 'react-native';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
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
      let userEventQuery;

      // Define query conditions for UserEvent based on activeTab
      if (activeTab === 'watchlist') {
        userEventQuery = query(
          collection(firestore, `User/${user.userId}/UserEvent`),
          where('status', '==', 'watchlist')
        );
      } else if (activeTab === 'pending') {
        userEventQuery = query(
          collection(firestore, `User/${user.userId}/UserEvent`),
          where('applicationStatus', '==', 'pending')
        );
      } else if (['upcoming', 'active', 'completed'].includes(activeTab)) {
        userEventQuery = query(
          collection(firestore, `User/${user.userId}/UserEvent`),
          where('applicationStatus', '==', 'approved')
        );
      } else {
        throw new Error('Invalid activeTab condition');
      }

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

      // Extract eventIds to query Event collection
      const eventIds = userEventData.map((userEvent) => userEvent.eventId);

      const eventQuery = query(
        collection(firestore, 'Event'),
        where('__name__', 'in', eventIds)
      );
      const eventSnapshot = await getDocs(eventQuery);

      const eventsData = eventSnapshot.docs.map((doc) => {
        const data = doc.data();
        const startDate = data.startDate ? new Date(data.startDate.seconds * 1000) : null;
        const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : null;
        const startTime = data.startTime ? new Date(data.startTime.seconds * 1000) : null;
        const endTime = data.endTime ? new Date(data.endTime.seconds * 1000) : null;
        return { id: doc.id, ...data, startDate, endDate, startTime, endTime };
      });

      const userIds = [...new Set(eventsData.map((event) => event.userId))];
      const categoryIds = [...new Set(eventsData.flatMap((event) => event.categoryIds || []))];

      const [organizationMap, categoryMap] = await Promise.all([
        fetchOrganizationNames(userIds),
        fetchCategoryNames(categoryIds),
      ]);

      const combinedEvents = userEventData.map((userEvent) => {
        const eventData = eventsData.find((event) => event.id === userEvent.eventId);

        // Filter events based on activeTab status
        if (!eventData) return null;

        if (
          (activeTab === 'pending' && eventData.status !== 'upcoming') ||
          (activeTab === 'upcoming' && eventData.status !== 'upcoming') ||
          (activeTab === 'active' && eventData.status !== 'inprogress') ||
          (activeTab === 'completed' && eventData.status !== 'completed')
        ) {
          return null;
        }

        return {
          ...userEvent,
          ...eventData,
          organizationName: organizationMap[eventData.userId] || 'Unknown Organization',
          categories: (eventData.categoryIds || []).map((id) => categoryMap[id] || 'Unknown Category'),
        };
      }).filter(Boolean);

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


  const logInteraction = async (userId, eventId, interactionType) => {
    try {
      await addDoc(collection(firestore, 'Interactions'), {
        userId: userId,
        eventId: eventId,
        type: interactionType, // e.g., "view", "apply", "watchlist"
        timestamp: new Date(),
      });
      console.log('Interaction logged successfully');
    } catch (error) {
      console.error('Error logging interaction:', error);
    }
  };

  const renderEventItem = ({ item }) => (

    <TouchableOpacity style={styles.eventItem}
      onPress={() => { logInteraction(user.userId, item.id, 'view'); navigation.navigate('EventDetail', { event: item, user: user }) }}>

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
      ) : events.length > 0 ? (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id}
          renderItem={renderEventItem}
          contentContainerStyle={styles.listContent}
        />
      ) : (
        <View style={styles.noEventsContainer}>
          <Text style={styles.noEventsText}>
            No Events Available
          </Text>
        </View>
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
  noEventsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  noEventsText: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
  },
});
