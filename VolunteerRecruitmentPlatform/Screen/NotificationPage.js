// NotificationPage.js
import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Ensure your Firestore instance is correctly imported

const NotificationPage = ({ route, navigation }) => {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = route.params;
    const [events, setEvents] = useState([]);


    const fetchCategoryNames = async (categoryIds) => {
        if (!categoryIds || categoryIds.length === 0) {
            return {}; // Return empty object if no categoryIds
        }

        try {
            const categoryQuery = query(
                collection(firestore, 'Category'),
                where('__name__', 'in', categoryIds) // Use `__name__` to query by document ID
            );

            const querySnapshot = await getDocs(categoryQuery);

            const categoryMap = {};
            querySnapshot.docs.forEach((doc) => {
                const { categoryName } = doc.data(); // Get `categoryName` field
                categoryMap[doc.id] = categoryName; // Map document ID to category name
            });

            return categoryMap;
        } catch (error) {
            console.error('Error fetching categories:', error);
            return {};
        }
    };

    const fetchOrganizationNames = async (userIds) => {
        if (userIds.length === 0) {
            return {}; // Return empty object if no userIds
        }

        try {
            const userQuery = query(
                collection(firestore, 'User'),
                where('__name__', 'in', userIds) // Use `__name__` for document IDs
            );

            const querySnapshot = await getDocs(userQuery);

            const organizationMap = {};
            querySnapshot.docs.forEach((doc) => {
                const { name } = doc.data(); // Assuming the field is `organizationName`
                organizationMap[doc.id] = name || 'Unknown Organization'; // Map userId to organization name
            });

            return organizationMap;
        } catch (error) {
            console.error('Error fetching organization names:', error);
            return {};
        }
    };

    const fetchEvents = async (eventIds) => {
        try {
            const eventQuery = query(
                collection(firestore, 'Event'),
                where('__name__', 'in', eventIds)
            );
            const querySnapshot = await getDocs(eventQuery);

            const fetchedEvents = querySnapshot.docs.map((doc) => {
                const data = doc.data();

                // Convert Firestore Timestamp fields to Date if necessary
                const startDate = data.startDate ? new Date(data.startDate.seconds * 1000) : null;
                const endDate = data.endDate ? new Date(data.endDate.seconds * 1000) : null;
                const startTime = data.startTime ? new Date(data.startTime.seconds * 1000) : null;
                const endTime = data.endTime ? new Date(data.endTime.seconds * 1000) : null;

                return {
                    id: doc.id,
                    ...data,
                    startDate,
                    endDate,
                    startTime,
                    endTime,
                };
            });

            const allCategoryIds = [
                ...new Set(fetchedEvents.flatMap((event) => event.categoryIds || [])), // Default to empty array if categoryIds is undefined
            ];

            const allUserIds = [...new Set(fetchedEvents.map((event) => event.userId))];

            // Fetch categories and organizations
            const categoryMap = await fetchCategoryNames(allCategoryIds);
            const organizationMap = await fetchOrganizationNames(allUserIds);

            // Update event data with category names
            const eventsWithDetails = fetchedEvents.map((event) => {
                // Map categories and organization name
                const mappedCategories = event.categoryIds
                    ? event.categoryIds.map((id) => categoryMap[id] || 'Unknown')
                    : [];

                const organizationName = organizationMap[event.userId] || 'Unknown Organization';

                return {
                    ...event,
                    categories: mappedCategories,
                    organizationName,
                };
            });

            setEvents(eventsWithDetails);
        } catch (error) {
            console.error('Error fetching events:', error);
        }
    };

    const fetchNotifications = async () => {
        try {
            setLoading(true); // Start loading
            const userRef = collection(firestore, `User/${user.userId}/Notification`);
            const notificationsQuery = query(userRef, orderBy('timestamp', 'desc'));
            const querySnapshot = await getDocs(notificationsQuery);

            const fetchedNotifications = querySnapshot.docs.map((doc) => ({
                id: doc.id,
                ...doc.data(),
            }));

            setNotifications(fetchedNotifications);

            // Fetch events related to eventId in messages
            const eventIds = [
                ...new Set(fetchedNotifications.filter((msg) => msg.eventId).map((msg) => msg.eventId)),
            ];

            if (eventIds.length > 0) {
                await fetchEvents(eventIds);
            }
        } catch (error) {
            console.error('Error fetching notifications:', error);
        } finally {
            setLoading(false); // Stop loading
        }
    };


    useEffect(() => {
        fetchNotifications();
    }, [user.userId]);

    const clearAllNotifications = async () => {
        // Clear local notifications list
        setNotifications([]);
        // Optionally, implement Firestore deletion logic here if needed
    };

    const markNotificationAsRead = async (notificationId) => {
        try {
            const notificationRef = doc(firestore, `User/${user.userId}/Notification/${notificationId}`);
            await updateDoc(notificationRef, { read: true });

            // Update the notification state locally
            setNotifications((prevNotifications) =>
                prevNotifications.map((notification) =>
                    notification.id === notificationId
                        ? { ...notification, read: true }
                        : notification
                )
            );
        } catch (error) {
            console.error('Error marking notification as read:', error);
        }
    };


    const renderNotification = ({ item }) => {
        const linkedEvent = item.eventId ? events.find((event) => event.id === item.eventId) : null;


        const handleNotificationPress = () => {
            markNotificationAsRead(item.id); // Mark the notification as read

            if (linkedEvent) {
                switch (item.type) {
                    case 'application':
                        navigation.navigate('EventDetail', { event: linkedEvent, user: user });
                        break;
                    case 'orgApplication':
                        navigation.navigate('EventParticipant', { event: linkedEvent });
                        break;
                    case 'review':
                        navigation.navigate('Reviews', { event: linkedEvent });
                        break;
                    default:
                        console.warn('Unknown notification type:', item.type);
                        break;
                }
            } else {
                navigation.navigate('Announcement', { notification: item });
            }
        };

        return (
            <TouchableOpacity
                style={[
                    styles.notificationItem,
                    item.read ? styles.readNotification : styles.unreadNotification,
                ]}
                onPress={handleNotificationPress}
            >
                <Ionicons
                    name={
                        item.type === 'announcement'
                            ? item.read
                                ? 'megaphone' // No outline for read announcements
                                : 'megaphone-outline' // Outline for unread announcements
                            : item.read
                                ? 'notifications' // No outline for read notifications
                                : 'notifications-outline' // Outline for unread notifications
                    }
                    size={24}
                    color={item.read ? '#aaa' : '#6a8a6d'}
                    style={styles.icon}
                />
                <View style={styles.textContainer}>
                    <Text style={[styles.title, item.read && styles.readText]}>
                        {item.title}
                    </Text>
                    <Text style={styles.message}>{item.body || item.message}</Text>
                    <Text style={styles.timestamp}>
                        {new Date(item.timestamp.seconds * 1000).toLocaleString()}
                    </Text>
                </View>
            </TouchableOpacity>
        );

    };



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
            {loading ? (
                <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 20 }} />
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderNotification}
                    contentContainerStyle={styles.listContent}
                    ListEmptyComponent={<Text style={styles.noNotificationsText}>No notifications</Text>}
                />
            )}
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
        color: '#007AFF',
        fontWeight: '600',
    },
    notificationItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 15,
        marginBottom: 10,
        borderRadius: 8,
    },
    unreadNotification: {
        backgroundColor: '#e8e3df',
    },
    readNotification: {
        backgroundColor: '#f5f5f5',
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
    readText: {
        color: '#999',
        fontWeight: 'normal',
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
