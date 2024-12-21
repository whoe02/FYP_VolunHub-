import React, { useState, useEffect } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    TouchableOpacity,
    Alert,
    StyleSheet,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../firebaseConfig';
import InputField from '../components/InputField';
import Ionicons from 'react-native-vector-icons/Ionicons';

const CategoryDetail = ({ route, navigation }) => {
    const { categoryId } = route.params; // Category ID passed via route
    const [isEditable, setIsEditable] = useState(false);
    const [categoryData, setCategoryData] = useState(null);

    useEffect(() => {
        const fetchCategoryData = async () => {
            try {
                const categoryDoc = await getDoc(doc(firestore, 'Category', categoryId));
                if (categoryDoc.exists()) {
                    setCategoryData(categoryDoc.data());
                } else {
                    Alert.alert('Error', 'Category not found', [
                        { text: 'OK', onPress: () => navigation.goBack() },
                    ]);
                }
            } catch (error) {
                console.error('Error fetching category:', error);
                Alert.alert('Error', 'Failed to fetch category data', [
                    { text: 'OK', onPress: () => navigation.goBack() },
                ]);
            }
        };

        fetchCategoryData();
    }, [categoryId]);

    const handleUpdatePress = async () => {
        if (isEditable) {
            if (!categoryData.categoryName || !categoryData.categoryType) {
                Alert.alert('Error', 'Please fill in all required fields.');
                return;
            }
            try {
                await updateDoc(doc(firestore, 'Category', categoryId), categoryData);
                Alert.alert('Success', 'Category updated successfully');
            } catch (error) {
                console.error('Error updating category:', error);
                Alert.alert('Error', 'Failed to update category');
            }
        }
        setIsEditable(!isEditable);
    };

    const handleDeletePress = () => {
        Alert.alert('Delete Category', 'Are you sure you want to delete this category?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                onPress: async () => {
                    try {
                        await deleteDoc(doc(firestore, 'Category', categoryId));
                        Alert.alert('Success', 'Category deleted successfully');
                        navigation.goBack();
                    } catch (error) {
                        console.error('Error deleting category:', error);
                        Alert.alert('Error', 'Failed to delete category');
                    }
                },
            },
        ]);
    };

    const getSelectedCategoryLabel = (value) => {
        switch (value) {
            case 0:
                return "location";
            case 1:
                return "preference";
            case 2:
                return "skills";
            default:
                return categoryData.categoryType;
        }
    };

    if (!categoryData) {
        return null; // Don't render anything if categoryData is not loaded
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollView}>
                <View style={styles.section}>
                    <InputField
                        label="Category Name"
                        value={categoryData.categoryName}
                        onChangeText={(text) => setCategoryData({ ...categoryData, categoryName: text })}
                        editable={isEditable}
                        icon={<Ionicons name="pricetags-outline" size={20} color="#666" style={styles.icon} />}
                    />

                    <InputField label="Category Type" value={categoryData.categoryType} editable={false} icon={<Ionicons name="list-outline" size={20} color="#666" />} />

                </View>

                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={[styles.button, styles.deleteButton]} onPress={handleDeletePress}>
                        <Text style={styles.buttonText}>Delete Category</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.button} onPress={handleUpdatePress}>
                        <Text style={styles.buttonText}>{isEditable ? 'Save Changes' : 'Update Category'}</Text>
                    </TouchableOpacity>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        padding: 20,
        backgroundColor: '#f9f9f9',
        paddingTop: 250,
    },
    scrollView: {
        alignItems: 'center',
    },
    section: {
        width: '100%',
        marginBottom: 20,
    },
    icon: {
        marginRight: 10,
    },
    buttonContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 10,
        marginTop: 20,
    },
    button: {
        flex: 1,
        backgroundColor: '#6a8a6d',
        paddingVertical: 15,
        borderRadius: 8,
        alignItems: 'center',
    },
    deleteButton: {
        backgroundColor: '#d9534f',
        marginRight: 10,
    },
    buttonText: {
        color: '#fff',
        fontSize: 16,
        fontWeight: '600',
    },
});

export default CategoryDetail;
