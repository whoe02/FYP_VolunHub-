import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const SetEventPreference = () => {
    const categories = ['Volunteer', 'Community Service', 'Education', 'Environment', 'Health', 'Art', 'Sports'];
    const locations = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Miami'];
    const { top: safeTop } = useSafeAreaInsets();

    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [isCategoryPage, setIsCategoryPage] = useState(true);

    const toggleCategory = (category) => {
        if (selectedCategories.includes(category)) {
            setSelectedCategories(selectedCategories.filter((item) => item !== category));
        } else if (selectedCategories.length < 5) {
            setSelectedCategories([...selectedCategories, category]);
        } else {
            Alert.alert('Limit Reached', 'You can select up to 5 categories only.');
        }
    };

    const toggleLocation = (location) => {
        if (selectedLocations.includes(location)) {
            setSelectedLocations(selectedLocations.filter((item) => item !== location));
        } else if (selectedLocations.length < 3) {
            setSelectedLocations([...selectedLocations, location]);
        } else {
            Alert.alert('Limit Reached', 'You can select up to 3 locations only.');
        }
    };

    const handleNext = () => {
        if (selectedCategories.length === 0) {
            Alert.alert('Select Category', 'Please select at least one category.');
        } else {
            setIsCategoryPage(false);
        }
    };

    const handleUpdatePreference = () => {
        if (selectedLocations.length === 0) {
            Alert.alert('Select Location', 'Please select at least one location.');
        } else {
            Alert.alert('Preferences Updated', 'Your event preferences have been updated.');
            // Reset or save preferences here if needed
        }
    };

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <Text style={styles.title}>{isCategoryPage ? 'Select Preferred Event Categories' : 'Select Preferred Locations'}</Text>
            
            <View style={styles.listWrapper}>
                {(isCategoryPage ? categories : locations).map((item, index) => (
                    <TouchableOpacity
                        key={index}
                        onPress={() => isCategoryPage ? toggleCategory(item) : toggleLocation(item)}
                        style={[
                            styles.item,
                            (isCategoryPage ? selectedCategories.includes(item) : selectedLocations.includes(item)) && styles.itemActive
                        ]}
                    >
                        <Text style={[
                            styles.itemText,
                            (isCategoryPage ? selectedCategories.includes(item) : selectedLocations.includes(item)) && styles.itemTextActive
                        ]}>
                            {item}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={isCategoryPage ? handleNext : handleUpdatePreference}
            >
                <Text style={styles.buttonText}>{isCategoryPage ? 'Next' : 'Update Preference'}</Text>
            </TouchableOpacity>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
    },
    title: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 15,
        color: '#333',
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
    button: {
        backgroundColor: '#6a8a6d',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: 'bold',
    },
});

export default SetEventPreference;