import React from 'react'
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from 'react-native/Libraries/NewAppScreen';

function Header() {
    const { top: safeTop } = useSafeAreaInsets();
    return (
        <View style={styles.container}>
            <View style={styles.userInfo}>
                <Image source={require('../assets/img/prof.png')} style={styles.userImg}></Image>
                <View style={{gap: 3,}}>
                    <Text style={styles.welcomeText}>Welcome</Text>
                    <Text style={styles.userName}>Jx</Text>
                </View>
            </View>
            <TouchableOpacity onPress>
                <Ionicons name="notifications-outline" size={24} color={Colors.black}></Ionicons>
            </TouchableOpacity>

        </View>
    )
}

export default Header

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: 20,
        paddingTop: 10,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
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
    welcomeText:{
        fontSize: 12,
        color: "#616161",
    },
    userName:{
        fontSize: 14,
        fontWeight: '700',
    },
})
