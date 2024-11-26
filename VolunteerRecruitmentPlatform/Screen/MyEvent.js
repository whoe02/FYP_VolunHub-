// MyEventPage.js
import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyEventTab from '../components/MyEventTab';
import MyEventList from '../components/MyEventList';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrganizationEventTab from '../components/OrganizationEventTab';
import { useUserContext } from '../UserContext';
import { doc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';


const MyEventPage = ({ navigation }) => {
    const {top: safeTop} = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('watchlist');
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
    return (
        <View style={[{ flex: 1 }, { paddingTop: safeTop }, {    backgroundColor: '#f9f9f9',
}]}>

            {user.role === 'organization' && (
                <OrganizationEventTab onTabChanged={setActiveTab} />
            )}
            {user.role === 'volunteer' && (
                <MyEventTab onTabChanged={setActiveTab} />
            )}
            <MyEventList activeTab={activeTab} navigation={navigation} user={user} />
                  {/* Add Button */}
            {user === 'Organization' && (
                <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('AddEvent')} activeOpacity={0.7}>
                    <Ionicons name="add" size={30} color="#fff" />
                </TouchableOpacity>
            )}
        </View>
    );
};

  const styles = StyleSheet.create({
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
export default MyEventPage;