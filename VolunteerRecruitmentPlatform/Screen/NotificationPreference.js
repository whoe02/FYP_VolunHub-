import React, { useState, useEffect } from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { doc, collection, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const NotificationPreferences = ({ route }) => {
    const { userId } = route.params;
    // Default preferences
    const defaultPreferences = {
        application: true, // Application Status
        announcement: true, // Announcements
        message: true, // Messages
        review: true,
    };

    const [preferences, setPreferences] = useState(null); // Null distinguishes loading state
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPreferences = async () => {
            try {
                const preferencesRef = doc(
                    collection(firestore, `User/${userId}/NotificationPreferences`),
                    'Preferences'
                );
                const preferencesSnap = await getDoc(preferencesRef);

                if (preferencesSnap.exists()) {
                    const data = preferencesSnap.data();

                    // Merge with default preferences to ensure all keys are present
                    const mergedPreferences = { ...defaultPreferences, ...data };

                    // Validate keys to ensure all are boolean
                    const validPreferences = Object.keys(mergedPreferences).reduce(
                        (acc, key) => {
                            acc[key] = typeof mergedPreferences[key] === 'boolean'
                                ? mergedPreferences[key]
                                : defaultPreferences[key];
                            return acc;
                        },
                        {}
                    );

                    setPreferences(validPreferences);
                } else {
                    // If no document exists, create it with default preferences
                    await setDoc(preferencesRef, defaultPreferences);
                    setPreferences(defaultPreferences);
                }
            } catch (error) {
                console.error('Error fetching notification preferences:', error);
                Alert.alert('Error', 'Unable to fetch notification preferences.');
            } finally {
                setLoading(false); // Ensure loading stops
            }
        };

        fetchPreferences();
    }, [userId]);

    const togglePreference = async (key) => {
        if (!preferences) return; // Guard against null preferences

        const updatedPreferences = { ...preferences, [key]: !preferences[key] };
        setPreferences(updatedPreferences);

        try {
            const preferencesRef = doc(
                collection(firestore, `User/${userId}/NotificationPreferences`),
                'Preferences'
            );
            await setDoc(preferencesRef, updatedPreferences, { merge: true });
        } catch (error) {
            console.error('Error updating notification preferences:', error);
            Alert.alert('Error', 'Unable to update notification preferences.');
        }
    };

    const displayNames = {
        application: 'Application Status',
        announcement: 'Announcements',
        message: 'Messages',
        review: 'Review'
    };

    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading preferences...</Text>
            </View>
        );
    }

    if (!preferences) {
        return (
            <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Unable to load preferences.</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            {Object.keys(preferences).map((key) => (
                <View key={key} style={styles.preferenceRow}>
                    <Text style={styles.preferenceLabel}>{displayNames[key]}</Text>
                    <Switch
                        value={preferences[key]}
                        thumbColor={'#6a8a6d'}
                        onValueChange={() => togglePreference(key)}
                    />
                </View>
            ))}
        </View>
    );
};

export default NotificationPreferences;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#fff',
    },
    title: {
        fontSize: 20,
        fontWeight: 'bold',
        marginBottom: 20,
    },
    preferenceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginVertical: 10,
    },
    preferenceLabel: {
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    loadingText: {
        fontSize: 16,
        color: '#616161',
    },
    errorContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    errorText: {
        fontSize: 16,
        color: 'red',
    },
});
