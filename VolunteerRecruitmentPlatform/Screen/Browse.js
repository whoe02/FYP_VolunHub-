import React, {useState} from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import HomeTab from '../components/HomeTab';
import EventList from '../components/EventList';


const Home = ({ navigation }) => {
  const {top: safeTop} = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');

  const onTabChanged = (tab) => {
    setActiveTab(tab);
  }

  const handleSearchBarPress = () => {
    navigation.navigate('SearchPage'); // Navigate to the search page
  };

  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <Header/>
      <SearchBar onPress={handleSearchBarPress}/>
      <HomeTab onTabChanged={onTabChanged}/>
      <EventList activeTab={activeTab}/>    
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1},
});

export default Home;