// LiveChatList.js
import React from 'react';
import { View, Text, Image, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const chatData = [
    { id: '1', name: 'Alice Johnson', lastMessage: 'Can we reschedule?', timestamp: '2 mins ago', avatar: 'https://via.placeholder.com/150/0000FF' },
    { id: '2', name: 'Bob Smith', lastMessage: 'See you soon!', timestamp: '1 hour ago', avatar: 'https://via.placeholder.com/150/0000FF' },
    { id: '3', name: 'Charlie Lee', lastMessage: 'Thanks for the update.', timestamp: 'Yesterday', avatar: 'https://via.placeholder.com/150/0000FF' },
    // More chat entries...
];

const LiveChatList = ({ navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();

    const renderChatItem = ({ item }) => (
        <TouchableOpacity
            style={styles.chatItem}
            onPress={() => navigation.navigate('Chat', { user: item })}
            activeOpacity={0.8}
        >
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
            <View style={styles.textContainer}>
                <Text style={styles.name}>{item.name}</Text>
                <Text style={styles.lastMessage}>{item.lastMessage}</Text>
            </View>
            <Text style={styles.timestamp}>{item.timestamp}</Text>
        </TouchableOpacity>
    );

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <Text style={styles.header}>Live Chat</Text>
            <FlatList
                data={chatData}
                keyExtractor={(item) => item.id}
                renderItem={renderChatItem}
                contentContainerStyle={styles.listContent}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 15,
        color: '#333',
    },
    chatItem: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 15,
        borderBottomWidth: 0.5,
        borderBottomColor: '#ddd',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    name: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#6a8a6d',
    },
    lastMessage: {
        fontSize: 14,
        color: '#555',
        marginTop: 2,
    },
    timestamp: {
        fontSize: 12,
        color: '#777',
    },
    listContent: {
        paddingBottom: 20,
    },
});

export default LiveChatList;