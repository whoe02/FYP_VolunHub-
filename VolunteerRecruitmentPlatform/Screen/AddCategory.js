import React, { useState } from 'react';
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    Alert,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import InputField from '../components/InputField';
import CustomButton from '../components/CustomButton';
import { Picker } from '@react-native-picker/picker';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { firestore } from '../firebaseConfig';
import { setDoc, doc } from 'firebase/firestore';

const AddCategory = ({ navigation }) => {
    const { top: safeTop } = useSafeAreaInsets();

    const [categoryName, setCategoryName] = useState('');
    const [categoryType, setCategoryType] = useState('');
    const [loading, setLoading] = useState(false);

    const generateDocumentId = () => {
        const prefixMap = {
            location: 'location_',
            preference: 'preference_',
            skills: 'skills_',
        };
        return `${prefixMap[categoryType] || ''}${categoryName}`;
    };

    const validateForm = () => {
        if (!categoryName || !categoryType) {
            Alert.alert('Error', 'Please fill in all required fields.');
            return false;
        }
        return true;
    };

    const handleAddCategory = async () => {
        if (!validateForm()) return;

        setLoading(true);
        const documentId = generateDocumentId();
        const newCategory = {
            categoryName,
            categoryType,
        };

        try {
            await setDoc(doc(firestore, 'Category', documentId), newCategory);
            Alert.alert('Success', 'Category added successfully.');
            navigation.goBack();
        } catch (error) {
            console.error('Error adding category:', error);
            Alert.alert('Error', 'Failed to add category.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={[styles.container, { paddingTop: safeTop }]}>
            <ScrollView style={styles.scrollView}>
                <Text style={styles.title}>Add Category</Text>

                {loading ? (
                    <ActivityIndicator size="large" color="#666" style={styles.loading} />
                ) : (
                    <>
                        <View style={styles.section}>
                            <InputField
                                label="Category Name"
                                value={categoryName}
                                onChangeText={setCategoryName}
                                icon={<Ionicons name="pricetags-outline" size={20} color="#666" style={styles.icon} />}
                            />

                            <View
                                style={{
                                    flexDirection: 'row',
                                    alignItems: 'center',
                                    borderBottomColor: '#ccc',
                                    borderBottomWidth: 1,
                                    marginBottom: 10,
                                }}
                            >
                                <Ionicons name="list-outline" size={20} color="#666" />
                                <Picker
                                    selectedValue={categoryType}
                                    onValueChange={(itemValue) => setCategoryType(itemValue)}
                                    style={{ flex: 1, color: categoryType ? '#333' : '#666', marginLeft: 5 }}
                                >
                                    <Picker.Item label="Select Category Type" value="" color="#aaa" />
                                    <Picker.Item label="Location" value="location" />
                                    <Picker.Item label="Preference" value="preference" />
                                    <Picker.Item label="Skills" value="skills" />
                                </Picker>
                            </View>
                        </View>

                        <CustomButton label="Add Category" onPress={handleAddCategory} />
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    scrollView: {
        paddingHorizontal: 25,
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        marginTop: 15,
        marginBottom: 15,
        color: '#333',
    },
    section: {
        marginBottom: 20,
    },
    icon: {
        marginRight: 5,
    },
    loading: {
        marginTop: 50,
    },
});

export default AddCategory;
