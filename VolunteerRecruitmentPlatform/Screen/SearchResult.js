import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import EventList from '../components/EventList';

const SearchResult = ({ route, navigation }) => {
  const { events, user } = route.params; // Get the filtered events
  const { top: safeTop } = useSafeAreaInsets();
  console.log(user?.userId);
  // Extract and validate event IDs
  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <Text style={styles.header}>Search Results</Text>
      {events.length > 0 ? (
        <EventList
          event={events}  // Pass the events directly
          user={user}
          navigation={navigation}
          isSearchResult={true}
        />
      ) : (
        <Text style={styles.noResultsText}>No results found.</Text>
      )}
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    fontSize: 20,
    fontWeight: 'bold',
    marginHorizontal: 20,
    marginBottom: 10,
  },
  noResultsText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
});

export default SearchResult;
