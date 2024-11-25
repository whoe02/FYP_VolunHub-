import React, { useEffect, useState } from 'react';
import { Image, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { Colors } from 'react-native/Libraries/NewAppScreen';
import { useUserContext } from '../UserContext';
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure this is correctly initialized


function Header() {
    const { top: safeTop } = useSafeAreaInsets();
    const [userData, setUserData] = useState(null); // Store user data here
    const { user, setUser } = useUserContext();

    const navigation = useNavigation();

    const fetchUserData = async () => {
        try {
          const userDoc = await getDoc(doc(firestore, "User", user.userId));
    
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          } else {
            Alert.alert("Error", "User data not found");
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          Alert.alert("Error", "Failed to fetch user data");
        }
      };
      useEffect(() => {
        fetchUserData();
      }, []);

    return (
        <View style={styles.container} >
            <View style={styles.userInfo}>
                <Image source={require('../assets/img/prof.png')} style={styles.userImg} />
                <View style={{ gap: 3 }}>
                    <Text style={styles.welcomeText}>Welcome</Text>
                    <Text style={styles.userName}>Jx</Text>
                </View>
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('Notification')}>
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