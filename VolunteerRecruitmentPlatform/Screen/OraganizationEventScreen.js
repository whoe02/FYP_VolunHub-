import React, {useState} from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Header from '../components/Header';
import HomeTab from '../components/OrganizationEventTab';
import EventList from '../components/EventList';


const Home = ({ navigation }) => {
  const {top: safeTop} = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState('all');

  const onTabChanged = (tab) => {
    setActiveTab(tab);
  }

  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <Header/>
      <HomeTab onTabChanged={onTabChanged}/>
      <EventList activeTab={activeTab}/>    
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1},
});

export default Home;