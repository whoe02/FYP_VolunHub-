import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';

const SetEventPreference = ({ route, navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();
    const { userId } = route.params; // User ID passed via route
    const [skills, setSkills] = useState([]);
    const [preferences, setPreferences] = useState([]);
    const [locations, setLocations] = useState([]);

    const [selectedSkills, setSelectedSkills] = useState([]);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedLocations, setSelectedLocations] = useState([]);
    const [isSkillsPage, setIsSkillsPage] = useState(true);
    const [isCategoryPage, setIsCategoryPage] = useState(false);

    // Fetch categories from Firestore
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categorySnapshot = await getDocs(collection(firestore, 'Category'));
                const categoryData = categorySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

                // Separate categories into skills, preferences, and locations
                setSkills(categoryData.filter(category => category.categoryType === 'skills'));
                setPreferences(categoryData.filter(category => category.categoryType === 'preference'));
                setLocations(categoryData.filter(category => category.categoryType === 'location'));
            } catch (error) {
                console.error("Error fetching categories:", error);
            }
        };

        const fetchUserPreferences = async () => {
            try {
                const userRef = doc(firestore, 'User', userId);
                const userSnapshot = await getDoc(userRef);
                const userData = userSnapshot.data();

                if (userData) {
                    setSelectedSkills(userData.skills || []);
                    setSelectedCategories(userData.preference || []);
                    setSelectedLocations(userData.location || []);
                }
            } catch (error) {
                console.error("Error fetching user preferences:", error);
            }
        };

        fetchCategories(); // Fetch categories first
        fetchUserPreferences(); // Then fetch user preferences
    }, [userId]);

    // Handle toggle for skills selection
    const toggleSkill = (skillId) => {
        if (selectedSkills.includes(skillId)) {
            setSelectedSkills(selectedSkills.filter((id) => id !== skillId));
        } else if (selectedSkills.length < 2) {
            setSelectedSkills([...selectedSkills, skillId]);
        } else {
            Alert.alert('Limit Reached', 'You can select up to 2 skills only.');
        }
    };

    // Handle toggle for category selection
    const toggleCategory = (categoryId) => {
        if (selectedCategories.includes(categoryId)) {
            setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
        } else if (selectedCategories.length < 5) {
            setSelectedCategories([...selectedCategories, categoryId]);
        } else {
            Alert.alert('Limit Reached', 'You can select up to 5 categories only.');
        }
    };

    // Handle toggle for location selection
    const toggleLocation = (locationId) => {
        if (selectedLocations.includes(locationId)) {
            setSelectedLocations(selectedLocations.filter((id) => id !== locationId));
        } else if (selectedLocations.length < 3) {
            setSelectedLocations([...selectedLocations, locationId]);
        } else {
            Alert.alert('Limit Reached', 'You can select up to 3 locations only.');
        }
    };

    // Handle next step from skills to category
    const handleNextFromSkills = () => {

        setIsSkillsPage(false);
        setIsCategoryPage(true);

    };

    // Handle next step from category to location
    const handleNextFromCategory = () => {

        setIsCategoryPage(false);

    };

    const handleUpdatePreference = async () => {

        try {
            const updatedData = {
                skills: selectedSkills,
                preference: selectedCategories,
                location: selectedLocations,
                preferencesSkipped: true
            };

            await updateDoc(doc(firestore, 'User', userId), updatedData);
            Alert.alert('Preferences Updated', 'Your event preferences have been updated.');
            setTimeout(() => {
                navigation.goBack();
            }, 1000); // 2000 milliseconds = 2 seconds
        } catch (error) {
            console.error("Error updating preferences:", error);
            Alert.alert('Error', 'Failed to update preferences.');

        }
    };

    const handleSkip = () => {
        Alert.alert(
            "Skip Preference Setup",
            "Are you sure you want to skip setting preferences? You can always update them later.",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Skip", onPress: () => handleSkipPreference() }
            ]
        );
    };

    // Skip preference setup and set the flag
    const handleSkipPreference = async () => {
        try {
            await updateDoc(doc(firestore, 'User', userId), {
                preferencesSkipped: true, // Mark as skipped in Firestore
            });

            // Delay for 2 seconds before going back
            setTimeout(() => {
                navigation.goBack();
            }, 1000); // 2000 milliseconds = 2 seconds
        } catch (error) {
            console.error('Error skipping preferences:', error);
            Alert.alert('Error', 'Failed to skip preferences.');
        }
    };

    return (
        <View style={[styles.container, { paddingTop: safeTop }]}>
            <Text style={styles.title}>
                {isSkillsPage
                    ? 'Select Skills for Volunteer Events'
                    : isCategoryPage
                        ? 'Select Preferred Event Categories'
                        : 'Select Preferred Locations'}
            </Text>

            <View style={styles.listWrapper}>
                {isSkillsPage
                    ? skills.map((item) => (
                        <TouchableOpacity
                            key={item.id}
                            onPress={() => toggleSkill(item.id)}
                            style={[styles.item, selectedSkills.includes(item.id) && styles.itemActive]}>
                            <Text style={[styles.itemText, selectedSkills.includes(item.id) && styles.itemTextActive]}>
                                {item.categoryName}
                            </Text>
                        </TouchableOpacity>
                    ))
                    : isCategoryPage
                        ? preferences.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleCategory(item.id)}
                                style={[styles.item, selectedCategories.includes(item.id) && styles.itemActive]}>
                                <Text style={[styles.itemText, selectedCategories.includes(item.id) && styles.itemTextActive]}>
                                    {item.categoryName}
                                </Text>
                            </TouchableOpacity>
                        ))
                        : locations.map((item) => (
                            <TouchableOpacity
                                key={item.id}
                                onPress={() => toggleLocation(item.id)}
                                style={[styles.item, selectedLocations.includes(item.id) && styles.itemActive]}>
                                <Text style={[styles.itemText, selectedLocations.includes(item.id) && styles.itemTextActive]}>
                                    {item.categoryName}
                                </Text>
                            </TouchableOpacity>
                        ))}
            </View>

            <TouchableOpacity
                style={styles.button}
                onPress={isSkillsPage ? handleNextFromSkills : isCategoryPage ? handleNextFromCategory : handleUpdatePreference}>
                <Text style={styles.buttonText}>
                    {isSkillsPage ? 'Next' : isCategoryPage ? 'Next' : 'Update Preference'}
                </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
                <Text style={styles.skipButtonText}>Skip Now</Text>
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
    skipButton: {
        backgroundColor: 'transparent',
        paddingVertical: 12,
        borderRadius: 10,
        alignItems: 'center',
        marginTop: 10,
        borderWidth: 1,
        borderColor: '#ccc',
    },
    skipButtonText: { color: '#333', fontSize: 14, fontWeight: '500' },
});

export default SetEventPreference;