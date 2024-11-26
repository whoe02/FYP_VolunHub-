import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import HomeTab from '../components/HomeTab';
import EventList from '../components/EventList';
import { useUserContext } from '../UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const Home = ({ navigation }) => {
  const { top: safeTop } = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');
  const { user, setUser } = useUserContext(); // Access user from context

  const fetchUserData = async () => {
    if (!user?.userId) return; // Ensure userId exists
    try {
      const userDoc = await getDoc(doc(firestore, 'User', user.userId));
      if (userDoc.exists()) {
        setUser({ ...user, ...userDoc.data() }); // Update context with user data
      } else {
        console.error('User data not found');
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  useEffect(() => {
    fetchUserData(); // Fetch data when Home is loaded
  }, []);

  const onTabChanged = (tab) => {
    setActiveTab(tab);
  };

  const handleSearchBarPress = () => {
    navigation.navigate('SearchPage'); // Navigate to the search page
  };

  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <Header user={user} /> 
      <SearchBar onPress={handleSearchBarPress} />
      <HomeTab onTabChanged={onTabChanged} />
      <EventList activeTab={activeTab} navigation={navigation} user={user} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f9f9f9' },
});

export default Home;
