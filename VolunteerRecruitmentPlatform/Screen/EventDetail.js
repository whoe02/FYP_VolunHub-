import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const EventDetail = ({ route, navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const { event, user } = route.params; // Use passed user role
    const userRole = user?.role;
    const images = event?.image || [];
    const [loading, setLoading] = useState(false);

    const renderButtons = () => {
        switch (event.status) {
            case 'upcoming':
                return (
                    <>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonApply}>
                            <Text style={styles.buttonTextApply}>Apply Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonShort}>
                            <Ionicons name="chatbubble-outline" size={24} color="black" />
                        </TouchableOpacity>
                    </>
                );
            case 'pending':
                return (
                    <>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonCancel}>
                            <Text style={styles.buttonText}>Cancel Application</Text>
                        </TouchableOpacity>
                    </>
                );
            case 'active':
                return (
                    <>
                        <TouchableOpacity style={styles.button}>
                            <Text style={styles.buttonText}>Enquiry Now</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.buttonCheckIn}>
                            <Text style={styles.buttonText}>Check In</Text>
                        </TouchableOpacity>
                    </>
                );
            case 'expired':
                return (
                    <TouchableOpacity style={[styles.buttonExpired, { backgroundColor: '#D3D3D3' }]}>
                        <Text style={styles.buttonTextExpired}>Event Expired</Text>
                    </TouchableOpacity>
                );
            default:
                return null;
        }
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
                {userRole === 'volunteer' && (
                    <TouchableOpacity style={styles.iconsContainer}>
                        <Ionicons name="bookmark-outline" size={24} color="black" />
                    </TouchableOpacity>
                )}
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
            </View>
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
        marginBottom: 40,
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
        flex: 1,
        backgroundColor: '#b83027',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonCheckIn: {
        flex: 1,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    buttonExpired: {
        flex: 1,
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
});

export default EventDetail;
