// MyEventPage.js
import React, { useState } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, TextInput, Image, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyEventTab from '../components/MyEventTab';
import MyEventList from '../components/MyEventList';
import Ionicons from 'react-native-vector-icons/Ionicons';
import OrganizationEventTab from '../components/OrganizationEventTab';

const MyEventPage = ({ navigation }) => {
    const {top: safeTop} = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('all');
    const [user] = useState('Organization');
    return (
        <View style={[{ flex: 1 }, { paddingTop: safeTop }]}>

            {user === 'Organization' && (
                <OrganizationEventTab onTabChanged={setActiveTab} />
            )}
            {user === 'Volunteer' && (
                <MyEventTab onTabChanged={setActiveTab} />
            )}
            <MyEventList activeTab={activeTab} />
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