import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from 'react-native/Libraries/NewAppScreen';


function Header({ user }) {
    const { top: safeTop } = useSafeAreaInsets();

    const navigation = useNavigation();


    return (
        <View style={styles.container} >
            <View style={styles.userInfo}>
                <Image source={{ uri: user.image }} style={styles.userImg} />
                <View style={{ gap: 3 }}>
                    <Text style={styles.welcomeText}>Welcome</Text>
                    <Text style={styles.userName}>{user.name}</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notification', {user: user})}>
                <Ionicons name="notifications-outline" size={24} color={Colors.black} />
            </TouchableOpacity>
        </View>
    );
}

export default Header;

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 15,
        marginBottom: 15,
    },
    userImg: {
        width: 50,
        height: 50,
        borderRadius: 30,
    },
    userInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    welcomeText: {
        fontSize: 14,
        color: "#616161",
    },
    userName: {
        fontSize: 16,
        fontWeight: '700',
    },
});