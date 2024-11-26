import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, ActivityIndicator, TouchableOpacity, Text, Image } from 'react-native';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const MyEventList = ({ activeTab, navigation, user }) => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchEvents = async () => {
    setLoading(true);
    try {
      // Step 1: Query UserEvent subcollection for the current user
      const userEventQuery = query(
        collection(firestore, `User/${user.userId}/UserEvent`),
        where(
          activeTab === 'watchlist' ? 'status' : 'applicationStatus',
          '==',
          activeTab === 'watchlist'
            ? 'watchlist'
            : activeTab === 'pending'
            ? 'pending'
            : activeTab === 'completed'
            ? 'completed'
            : 'approved'
        )
      );

      const userEventSnapshot = await getDocs(userEventQuery);
      const userEventData = userEventSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // Step 2: If Upcoming or Active, filter based on Event status
      let filteredEvents = userEventData;
      if (activeTab === 'upcoming' || activeTab === 'active') {
        const eventIds = userEventData.map((ue) => ue.eventId);
      
        if (eventIds.length > 0) {
          const eventQuery = query(
            collection(firestore, 'Event'),
            where('__name__', 'in', eventIds),
            where(
              'status',
              '==',
              activeTab === 'upcoming' ? 'upcoming' : 'inProgress'
            )
          );
      
          const eventSnapshot = await getDocs(eventQuery);
          const eventData = eventSnapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
      
          filteredEvents = userEventData.filter((ue) =>
            eventData.some((e) => e.id === ue.eventId)
          );
        } else {
          filteredEvents = []; // No matching events if no event IDs
        }
      }

      // Step 3: Fetch and merge Event details
      const combinedEvents = await Promise.all(
        filteredEvents.map(async (userEvent) => {
          const eventDoc = await getDocs(
            query(
              collection(firestore, 'Event'),
              where('__name__', '==', userEvent.eventId)
            )
          );

          const eventData = eventDoc.docs[0]?.data();
          return {
            ...userEvent,
            ...eventData,
            categories: eventData?.categories || [],
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
