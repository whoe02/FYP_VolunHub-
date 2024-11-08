import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors } from 'react-native/Libraries/NewAppScreen';

const SearchPage = () => {
    const categories = ['Volunteer', 'Community Service', 'Education', 'Environment'];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];
    const { top: safeTop } = useSafeAreaInsets();

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);

    const toggleCategory = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter((item) => item !== category));
        } else {
            setSelectedCategories([...selectedCategories, category]);
        }
    };

    const toggleLocation = (location) => {
        if (selectedLocations.includes(location)) {
            setSelectedLocations(selectedLocations.filter((item) => item !== location));
        } else {
            setSelectedLocations([...selectedLocations, location]);
        }
    };

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <TextInput
                placeholder="Search for events..."
                style={styles.searchBar}
            />

            <Text style={styles.sectionTitle}>Categories</Text>
            <View style={styles.listWrapper}>
                {categories.map((category, index) => (
                    <TouchableOpacity key={index} onPress={() => toggleCategory(category)} style={[
                        styles.item,
                        selectedCategories.includes(category) && styles.itemActive
                    ]}>
                        <Text style={[
                            styles.itemText,
                            selectedCategories.includes(category) && styles.itemTextActive
                        ]}>
                            {category}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <Text style={styles.sectionTitle}>Locations</Text>
            <View style={styles.listWrapper}>
                {locations.map((location, index) => (
                    <TouchableOpacity key={index} onPress={() => toggleLocation(location)} style={[
                        styles.item,
                        selectedLocations.includes(location) && styles.itemActive
                    ]}>
                        <Text style={[
                            styles.itemText,
                            selectedLocations.includes(location) && styles.itemTextActive
                        ]}>
                            {location}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
            <TouchableOpacity style={styles.searchButton}>
                <Text style={styles.searchButtonText}>Search</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    searchBar: {
        backgroundColor: '#e8e3df',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius: 10,
        marginTop: 20,
        marginBottom: 20,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
    },
    listWrapper: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    item: {
        borderWidth: 1,
        borderColor: '#666',
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 15,
        marginRight: 10,
        marginBottom: 10,
    },
    itemActive: {
        backgroundColor: '#6a8a6d',
        borderColor: '#6a8a6d',
    },
    itemText: {
        fontSize: 14,
        color: '#666',

    },
    itemTextActive: {
        color: '#fff',
        fontWeight: '600',
    },
    searchButton: {
        backgroundColor: '#6a8a6d',
        paddingVertical: 10,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    searchButtonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SearchPage;