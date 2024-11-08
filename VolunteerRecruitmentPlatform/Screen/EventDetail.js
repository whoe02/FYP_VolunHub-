import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const EventDetail = ({ route, navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const { event } = route.params;
    const [user] = useState('Organization');
    const images = event.eventImages || [];

    return (
        <ScrollView contentContainerStyle={{ paddingTop: safeTop, flexGrow: 1, paddingBottom: 80 }} style={styles.container}>
            {/* Horizontal scroll for multiple images */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageScroll}>
                {images.length > 0 ? (
                    images.map((img, index) => (
                        <Image key={index} source={{ uri: img }} style={styles.image} />
                    ))
                ) : (
                    <Text style={styles.noImageText}>No images available</Text>
                )}
            </ScrollView>

            {/* Event Title */}
            <View style={styles.titleRow}>
                <Text style={styles.title}>{event.title}</Text>
                {user === 'Organization' && (
                    <View style={styles.iconsContainer}>
                        <TouchableOpacity onPress={() => navigation.navigate('EditEvent', { event })}>
                            <Ionicons name="pencil-outline" size={30} color={Colors.black} />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => navigation.navigate('DeleteEvent', { event })}>
                            <Ionicons name="trash-outline" size={30} color={Colors.black} />
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Event Details Section */}
            <View style={styles.detailSection}>
                <Text style={styles.detailHeading}>Event Details</Text>
                <Text style={styles.detailText}>Date: {event.date}</Text>
                <Text style={styles.detailText}>Time: {event.time}</Text>
                <Text style={styles.detailText}>Address: {event.address}</Text>
                <Text style={styles.detailText}>Capacity: {event.capacity}</Text>
                <Text style={styles.detailText}>Status: {event.status}</Text>
            </View>

            {/* Categories List */}
            <View style={styles.categoriesSection}>
                <Text style={styles.detailHeading}>Categories</Text>
                <View style={styles.categoriesWrapper}>
                    {event.categories.map((category, index) => (
                        <Text key={index} style={styles.categoryText}>{category}</Text>
                    ))}
                </View>
            </View>

            {/* Event Description Section */}
            <View style={styles.descriptionSection}>
                <Text style={styles.detailHeading}>Description</Text>
                <Text style={styles.description}>{event.description}</Text>
            </View>

            {/* Additional Buttons for Organization */}
            {user === 'Organization' && (
                <View style={styles.orgButtonContainer}>
                    <TouchableOpacity style={styles.button}>
                        <Text style={styles.buttonText}>Participant List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Reviews', { event })}>
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
        backgroundColor: '#fff',
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
        fontSize: 30,
        fontWeight: '900',
        marginTop: 20,
        marginBottom: 20,
    },
    titleRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    iconsContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    },
    detailSection: {
        padding: 10,
        shadowColor: 'grey',   
        elevation: 1,
        marginTop: -15,
    },
    categoriesSection: {
        padding: 10,
        shadowColor: 'grey',   
        elevation: 1,
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
        shadowColor: 'grey',   
        elevation: 1,
    },
    orgButtonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },
    button: {
        flex: 1,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        marginRight: 10,
        alignItems: 'center',
    },
    deleteButton: {
        flex: 1,
        backgroundColor: '#d9534f',
        paddingVertical: 15,
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
});

export default EventDetail;
