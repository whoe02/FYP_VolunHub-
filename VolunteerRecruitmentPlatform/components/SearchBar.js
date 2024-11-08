import React from 'react'
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

function SearchBar({ onPress }){
    return (
        <View style={styles.container}>
        <TouchableOpacity onPress={onPress}>
            <View style={styles.searchBar}>
                <Ionicons name='search-outline' size={20} color={Colors.lightGrey}></Ionicons>
                <TextInput placeholder='Search' placeholderTextColor={Colors.lightGrey} style={styles.searchText} autoCapitalize='none' editable={false}></TextInput>
            </View>
            </TouchableOpacity>
        </View>
    )
}

export default SearchBar

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    searchBar:{
        backgroundColor: '#e8e3df',
        paddingHorizontal: 10,
        paddingVertical: 12,
        borderRadius:10,
        flexDirection: 'row',
        gap: 10,
    },
    searchText:{
        fontSize: 14,
        flex: 1,
        color: Colors.darkGrey,
    },

})