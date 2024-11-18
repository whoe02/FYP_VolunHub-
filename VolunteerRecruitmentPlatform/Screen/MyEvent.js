// MyEventPage.js
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyEventTab from '../components/MyEventTab';
import MyEventList from '../components/MyEventList';
import OrganizationEventTab from '../components/OrganizationEventTab';

const MyEventPage = () => {
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
        </View>
    );
};

export default MyEventPage;