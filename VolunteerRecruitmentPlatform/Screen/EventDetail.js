import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Image, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { doc, collection, query, where, getDocs, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const EventDetail = ({ route, navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const { event, user } = route.params;
    const userRole = user?.role;
    const images = event?.image || [];
    const [loading, setLoading] = useState(false);
    const [isWatchlisted, setIsWatchlisted] = useState(false); // Button state
    const [approvedParticipantsCount, setApprovedParticipantsCount] = useState(0);
    const [userApplicationStatus, setUserApplicationStatus] = useState('');

    // Check if event is already in the watchlist when the component mounts
    useEffect(() => {
        const checkWatchlistStatus = async () => {
            if (!user?.userId || !event?.eventId) return;

            const userRef = doc(firestore, 'User', user.userId);
            const eventDocId = event.eventId;
            const eventRef = doc(userRef, 'UserEvent', eventDocId);

            try {
                const eventSnapshot = await getDoc(eventRef);
                if (eventSnapshot.exists() && eventSnapshot.data().status === 'watchlist') {
                    setIsWatchlisted(true);
                }
            } catch (error) {
                console.error('Error fetching event status:', error);
            }
        };

        checkWatchlistStatus();
    }, [user, event]);

    useEffect(() => {
        const fetchEventParticipantData = async () => {
            try {
                // Get the number of approved participants
                const participantsRef = collection(firestore, 'Event', event.eventId, 'EventParticipant');
                const approvedParticipantsQuery = query(participantsRef, where('status', '==', 'approved'));
                const querySnapshot = await getDocs(approvedParticipantsQuery);
                setApprovedParticipantsCount(querySnapshot.size); // Set count of approved participants

                // Check user's application status
                const userEventRef = doc(firestore, 'User', user.userId, 'UserEvent', event.eventId);
                const userEventSnapshot = await getDoc(userEventRef);
                if (userEventSnapshot.exists()) {
                    setUserApplicationStatus(userEventSnapshot.data().applicationStatus); // Set user's application status
                }
            } catch (error) {
                console.error('Error fetching participant data:', error);
            }
        };

        fetchEventParticipantData();
    }, [event.eventId, user.userId]);

    const handleWatchlist = async () => {
        try {
            if (!user?.userId || !event?.eventId) {
                throw new Error('User ID or Event ID is missing.');
            }

            setLoading(true);

            const userRef = doc(firestore, 'User', user.userId);
            const eventDocId = event.eventId || `${user.userId}_${event.eventId}`;
            const eventRef = doc(userRef, 'UserEvent', eventDocId);

            // Prepare event data for watchlist
            const eventData = {
                eventId: event.id,
                lastUpdated: new Date(),
                status: isWatchlisted ? 'catalog' : 'watchlist',
            };

            await setDoc(eventRef, eventData, { merge: true });

            setIsWatchlisted(!isWatchlisted); // Toggle watchlist state

            // Show alert based on action
            const alertMessage = isWatchlisted
                ? 'Removed from Watchlist'
                : 'Added to Watchlist';
            Alert.alert('Watchlist Update', alertMessage);

        } catch (error) {
            console.error('Error updating watchlist:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApplyNow = () => {
        // Step 1: Show confirmation prompt
        Alert.alert(
            'Confirm Application',
            'Are you sure you want to apply for this event?',
            [
                {
                    text: 'Cancel',
                    style: 'cancel',
                },
                {
                    text: 'Confirm',
                    onPress: () => applyForEvent(),
                },
            ],
            { cancelable: false }
        );
    };

    const applyForEvent = async () => {
        try {
            if (!user?.userId || !event?.eventId) {
                throw new Error('User ID or Event ID is missing.');
            }

            setLoading(true);

            // Step 2: Add or update the EventParticipant subcollection
            const eventRef = doc(firestore, 'Event', event.eventId);
            const participantRef = doc(eventRef, 'EventParticipant', user.userId);

            const participantData = {
                status: 'pending', // Set the participant status as pending
            };

            await setDoc(participantRef, participantData, { merge: true });

            // Step 3: Update the UserEvent applicationStatus to 'pending'
            const userRef = doc(firestore, 'User', user.userId);
            const userEventRef = doc(userRef, 'UserEvent', event.eventId);

            const userEventData = {
                eventId: event.eventId,
                applicationStatus: 'pending', // Update user application status
                lastUpdated: new Date(),
            };

            await setDoc(userEventRef, userEventData, { merge: true });

            // Step 4: Update local state to reflect the application status
            setUserApplicationStatus('pending');  // Update state immediately after applying

            Alert.alert('Application Submitted', 'Your application is now pending.');
        } catch (error) {
            console.error('Error applying for event:', error);
            Alert.alert('Error', 'Something went wrong while submitting your application.');
        } finally {
            setLoading(false);
        }
    };

    const handleCancelApplication = () => {

    };

    const renderWatchlistButton = () => {
        return (
            <TouchableOpacity onPress={handleWatchlist} disabled={loading}>
                {loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                    <Ionicons
                        name={isWatchlisted ? 'bookmark' : 'bookmark-outline'}
                        size={24}
                        color={isWatchlisted ? "#6a8a6d" : "black"}
                    />
                )}
            </TouchableOpacity>
        );
    };

    // Update renderButtons to reflect the new application status
    const renderButtons = () => {
        // Determine the appropriate button rendering logic
        switch (event.status) {
            case 'upcoming':
                if (userApplicationStatus !== 'pending' && userApplicationStatus !== 'approved' && approvedParticipantsCount < event.capacity) {
                    return (
                        <>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.buttonText}>Enquiry Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonApply} onPress={handleApplyNow}>
                                <Text style={styles.buttonTextApply}>Apply Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonShort}>
                                <Ionicons name="chatbubble-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </>
                    );
                } else if (userApplicationStatus === 'pending' && approvedParticipantsCount < event.capacity) {
                    return (
                        <>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.buttonText}>Enquiry Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonCancel} onPress={handleCancelApplication}>
                                <Text style={styles.buttonText}>Cancel Application</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonShort}>
                                <Ionicons name="chatbubble-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </>
                    );
                } else if (userApplicationStatus === 'approved') {
                    return (
                        <>
                            <TouchableOpacity style={styles.button}>
                                <Text style={styles.buttonText}>Enquiry Now</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonCheckIn} disabled>
                                <Text style={styles.buttonText}>Check In</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonShort}>
                                <Ionicons name="chatbubble-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </>
                    );
                } else if (approvedParticipantsCount >= event.capacity) {
                    return (
                        <>
                            <TouchableOpacity style={[styles.buttonExpired, { backgroundColor: '#D3D3D3' }]} >
                                <Text style={styles.buttonTextExpired}>Event Not Available</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.buttonShort}>
                                <Ionicons name="chatbubble-outline" size={24} color="black" />
                            </TouchableOpacity>
                        </>

                    );
                }
                break;
            default:
                return null;
        }

        return null;
    };
    if (loading) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#6a8a6d" />
            </View>
        );
    }

    return (
        <ScrollView contentContainerStyle={{ flexGrow: 1, paddingBottom: 80 }} style={styles.container}>
            <View style={styles.titleRow}>
                <Text style={styles.title}>{event.title}</Text>
                {userRole === 'volunteer' && renderWatchlistButton()}
            </View>
            {userRole === 'organization' && (
                <View style={styles.iconsContainer}>
                    <TouchableOpacity onPress={() => navigation.navigate('EditEvent', { event })}>
                        <Ionicons name="pencil-outline" size={30} color="black" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => navigation.navigate('DeleteEvent', { event })}>
                        <Ionicons name="trash-outline" size={30} color="black" />
                    </TouchableOpacity>
                </View>
            )}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {images.length > 0 ? (
                    images.map((img, index) => (
                        <Image key={index} source={{ uri: img }} style={styles.image} />
                    ))
                ) : (
                    <Text style={styles.noImageText}>No images available</Text>
                )}
            </ScrollView>
            <View style={styles.detailSection}>
                <Text style={styles.detailHeading}>Event Details</Text>
                <Text style={styles.detailText}>Date: {event.startDate || 'N/A'} - {event.endDate || 'N/A'}</Text>
                <Text style={styles.detailText}>Time: {event.startTime || 'N/A'} - {event.endTime || 'N/A'}</Text>
                <Text style={styles.detailText}>Address: {event.address || 'N/A'}</Text>
                <Text style={styles.detailText}>Capacity: {event.capacity || 'N/A'}</Text>
                <Text style={styles.detailText}>Status: {event.status || 'N/A'}</Text>
            </View>
            <View style={styles.categoriesSection}>
                <Text style={styles.detailHeading}>Categories</Text>
                <View style={styles.categoriesWrapper}>
                    {event.categories && event.categories.length > 0 ? (
                        event.categories.map((category, index) => (
                            <Text key={index} style={styles.categoryText}>
                                {category}
                            </Text>
                        ))
                    ) : (
                        <Text style={styles.noCategoryText}>No categories available</Text>
                    )}
                </View>
            </View>
            <View style={styles.descriptionSection}>
                <Text style={styles.detailHeading}>Description</Text>
                <Text style={styles.description}>{event.description || 'No description available'}</Text>
            </View>
            {userRole === 'volunteer' && (
                <View style={styles.buttonContainer}>{renderButtons()}</View>
            )}
            {userRole === 'organization' && (
                <View style={styles.orgButtonContainer}>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('EventParticipant', { event })}
                    >
                        <Text style={styles.buttonText}>Participant List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.button}
                        onPress={() => navigation.navigate('Reviews', { event })}
                    >
                        <Text style={styles.buttonText}>Review</Text>
                    </TouchableOpacity>
                </View>
            )}
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
    },
    imageScroll: {
        marginBottom: 15,
    },
    image: {
        width: 300,
        height: 200,
        borderRadius: 10,
        marginRight: 10,
    },
    noImageText: {
        fontSize: 16,
        color: '#777',
        textAlign: 'center',
        marginTop: 10,
    },
    title: {
        fontSize: 24,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 20,
    },
    detailHeading: {
        fontSize: 18,
        fontWeight: 'bold',
        marginVertical: 10,
    },
    detailText: {
        fontSize: 16,
        marginBottom: 5,
        color: "#616161",
    },
    description: {
        fontSize: 14,
        lineHeight: 20,
        color: "#616161",
        textAlign: 'justify',
    },
    detailSection: {
        padding: 10,
        paddingBottom: 20,
        borderRadius: 10,
        backgroundColor: '#ffffff',
        marginBottom: 15,
        elevation: 2,
        shadowColor: 'grey',
    },
    categoriesSection: {
        padding: 10,
        paddingBottom: 20,
        shadowColor: 'grey',
        borderRadius: 10,
        backgroundColor: '#ffffff',
        marginBottom: 15,
        elevation: 2,
    },
    categoriesWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
    },
    categoryText: {
        backgroundColor: '#6a8a6d',
        marginRight: 5,
        marginBottom: 5,
        paddingVertical: 3,
        paddingHorizontal: 7,
        borderRadius: 15,
        fontSize: 12,
        color: "white",
    },
    descriptionSection: {
        marginBottom: 5,
        padding: 10,
        paddingBottom: 20,
        borderRadius: 10,
        shadowColor: 'grey',
        backgroundColor: '#ffffff',
        elevation: 2,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 10,
        marginTop: 20,
        marginBottom: 0,
    },
    button: {
        flex: 1,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonApply: {
        flex: 2,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonShort: {
        flex: 0.5,
        borderColor: 'darkGrey',
        paddingVertical: 10,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 14,
        fontWeight: '600',
    },
    buttonTextApply: {
        color: 'white',
        fontSize: 14,
        fontWeight: 'bold',
    },
    buttonCancel: {
        flex: 2,
        backgroundColor: '#b83027',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonCheckIn: {
        flex: 2,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonExpired: {
        flex: 4,
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    buttonTextExpired: {
        color: '#888',
        fontSize: 14,
        fontWeight: 'bold',
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    orgButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    watchlistButton: {
        backgroundColor: '#d3d3d3',
        padding: 10,
        borderRadius: 8,
    },
    watchlistButtonActive: {
        backgroundColor: '#6a8a6d',
    },
});

export default EventDetail;
