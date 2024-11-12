// NotificationPage.js
import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const initialNotifications = [
    { id: '1', title: 'New Event Available', message: 'Check out the latest event in your area!', timestamp: 'Just now' },
    { id: '2', title: 'Application Approved', message: 'Your application for the music event has been approved.', timestamp: '2 hours ago' },
    { id: '3', title: 'Event Reminder', message: 'Don’t forget about the event you signed up for tomorrow!', timestamp: '1 day ago' },
    // Add more notifications as needed
];

const NotificationPage = () => {
    const [notifications, setNotifications] = useState(initialNotifications);

    const clearAllNotifications = () => {
        setNotifications([]); // Clears the notifications list
    };

    const renderNotification = ({ item }) => (
        <TouchableOpacity style={styles.notificationItem}>
            <Ionicons name="notifications-outline" size={24} color="#6a8a6d" style={styles.icon} />
            <View style={styles.textContainer}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.message}>{item.message}</Text>
                <Text style={styles.timestamp}>{item.timestamp}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            {/* Header with "Notifications" title and "Clear All" button on the same line */}
            <View style={styles.headerContainer}>
                <Text style={styles.header}>Notifications</Text>
                {notifications.length > 0 && (
                    <TouchableOpacity onPress={clearAllNotifications}>
                        <Text style={styles.clearAllText}>Clear All</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* Notifications List */}
            <FlatList
                data={notifications}
                keyExtractor={(item) => item.id}
                renderItem={renderNotification}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={<Text style={styles.noNotificationsText}>No notifications</Text>}
            />
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
        paddingHorizontal: 20,
        paddingTop: 10,
    },
    headerContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10,
    },
    header: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#333',
    },
    clearAllText: {
        fontSize: 14,
        color: '#007AFF', // Blue color for "Clear All" text
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#e8e3df',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
    icon: {
        marginRight: 15,
    },
    textContainer: {
        flex: 1,
    },
    title: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#333',
    },
    message: {
        fontSize: 14,
        color: '#555',
        marginVertical: 5,
    },
    timestamp: {
        fontSize: 12,
        color: '#777',
    },
    listContent: {
        paddingBottom: 20,
    },
    noNotificationsText: {
        textAlign: 'center',
        fontSize: 16,
        color: '#777',
        marginTop: 20,
    },
});

export default NotificationPage;