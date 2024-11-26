import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import HomeTab from '../components/HomeTab';
import MyEventTab from '../components/OrganizationEventTab';
import EventList from '../components/EventList';
import { useUserContext } from '../UserContext';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const Home = ({ navigation }) => {
  const { top: safeTop } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const { user, setUser } = useUserContext(); // Access user from context
  const [isLoading, setIsLoading] = useState(true); // Loading state

  const fetchUserData = async () => {
    if (!user?.userId) return; // Ensure userId exists
    try {
      const userDoc = await getDoc(doc(firestore, 'User', user.userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        setUser({ ...user, ...userData }); // Update context with user data
      } else {
        console.error('User data not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setIsLoading(false); // Set loading to false after fetch
    }
  };

  useEffect(() => {
    if (user?.role) {
      if (user.role === 'organization') {
        setActiveTab('upcoming');
      } else if (user.role === 'volunteer') {
        setActiveTab('all');
      }
    }
    fetchUserData();
  }, [user]);

  const onTabChanged = (tab) => {
    setActiveTab(tab);
  };

  const handleSearchBarPress = () => {
    navigation.navigate('SearchPage'); // Navigate to the search page
  };

  // Ensure user data is loaded before rendering other components
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <Text>User data not found. Please log in again.</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <Header user={user} />
      
      {user.role === 'volunteer' && (
        <SearchBar onPress={handleSearchBarPress} />
      )}

      {/* Render components based on user role */}
      {user.role === 'organization' && (
        <View style={{marginTop:20}}>
          <MyEventTab onTabChanged={onTabChanged}  />
        </View>  
      )}
      {user.role === 'volunteer' && (
        <HomeTab onTabChanged={onTabChanged} />
      )}

      <EventList activeTab={activeTab} navigation={navigation} user={user} />
      {user.role === 'organization' && (
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEvent')} activeOpacity={0.7}>
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' }, 
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

export default Home;
