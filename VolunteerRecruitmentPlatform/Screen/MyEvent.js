// MyEventPage.js
import React, { useState } from 'react';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MyEventTab from '../components/MyEventTab';
import MyEventList from '../components/MyEventList';

const MyEventPage = () => {
    const {top: safeTop} = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState('watchlist');

    return (
        <View style={[{ flex: 1 }, { paddingTop: safeTop }]}>
            <MyEventTab onTabChanged={setActiveTab} />
            <MyEventList activeTab={activeTab} />
        </View>
    );
};

export default MyEventPage;