import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { firestore } from '../firebaseConfig'; // Adjust the path to your Firebase configuration
import { Colors } from 'react-native/Libraries/NewAppScreen';

function Header({ user }) {
    const { top: safeTop } = useSafeAreaInsets();
    const navigation = useNavigation();
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user?.userId) return;

        const notificationsQuery = query(
            collection(firestore, `User/${user.userId}/Notification`), // Corrected collection path
            where('read', '==', false) // Filter for unread notifications
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            setUnreadCount(snapshot.size); // Count the unread notifications
        });

        return () => unsubscribe(); // Clean up listener on unmount
    }, [user?.userId]);

    return (
        <View style={styles.container}>
            <View style={styles.userInfo}>
                <Image source={{ uri: user.image }} style={styles.userImg} />
                <View style={{ gap: 3 }}>
                    <Text style={styles.welcomeText}>Welcome</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notification', { user: user })}>
                <View style={styles.notificationIconContainer}>
                    <Ionicons name="notifications-outline" size={24} color={Colors.black} />
                    {unreadCount > 0 && (
                        <View style={styles.badge}>
                            <Text style={styles.badgeText}>{unreadCount}</Text>
                        </View>
                    )}
                </View>
            </TouchableOpacity>
        </View>
    );
}

export default Header;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
    },
    userImg: {
        width: 50,
        height: 50,
        borderRadius: 30,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    welcomeText: {
        fontSize: 14,
        color: '#616161',
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
    notificationIconContainer: {
        position: 'relative',
    },
    badge: {
        position: 'absolute',
        top: -5,
        right: -5,
        backgroundColor: 'red',
        borderRadius: 10,
        height: 18,
        minWidth: 18,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 5,
    },
    badgeText: {
        color: 'white',
        fontSize: 12,
        fontWeight: 'bold',
    },
});
