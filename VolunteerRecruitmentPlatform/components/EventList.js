import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native'; // Import the useNavigation hook
import { Colors } from 'react-native/Libraries/NewAppScreen';
import mockEventData from './mockEventData'; // Import the mock data

const EventList = ({ activeTab }) => {
  const navigation = useNavigation(); // Initialize the navigation hook
  const events = mockEventData[activeTab] || []; // Use activeTab to select the correct data

  const renderEventItem = ({ item }) => (
    <TouchableOpacity 
      style={styles.eventItem} 
      onPress={() => navigation.navigate('EventDetail', { event: item })} // Navigate to EventDetail with event data
    >
      <View style={{ paddingTop: 15, paddingBottom: 15, }}>
        <Image source={{ uri: item.image }} style={styles.eventImage} />
      </View>
      
      <View style={styles.eventDetails}>
        <Text style={styles.eventTitle}>{item.title}</Text>
        <Text style={styles.eventDate}>{item.date} | {item.time}</Text>
        <Text style={styles.eventAddress}>{item.address}</Text>
        <View style={styles.categoryWrapper}>
          {item.categories.map((category, index) => (
            <Text key={index} style={styles.categoryText}>{category}</Text>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* forlop laider */}
      <FlatList
        data={events}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderEventItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
};

export default EventList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginHorizontal: 20,
    marginTop: 10,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#e8e3df',
    paddingLeft: 10,
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
    fontSize: 16,
    fontWeight: 'bold',
  },
  eventDate: {
    color: '#555',
    marginBottom: 5,
  },
  eventDescription: {
    color: '#777',
    fontSize: 12,
    marginBottom: 5,
  },
  eventAddress: {
    color: '#555',
    fontSize: 12,
    marginBottom: 10,
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
    color: Colors.white,
  },
  listContent: {
    paddingBottom: 20,
  },
});