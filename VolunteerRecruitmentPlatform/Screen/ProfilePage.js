import React, { useEffect, useState } from "react";
import { View, ScrollView, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView, Alert } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { useUserContext } from '../UserContext';
import { doc, getDoc } from "firebase/firestore";
import { firestore } from "../firebaseConfig"; // Ensure this is correctly initialized
import AsyncStorage from '@react-native-async-storage/async-storage';

const ProfileScreen = ({ navigation }) => {
  const { top: safeTop } = useSafeAreaInsets();
  const [userData, setUserData] = useState(null); // Store user data here
  const { user, setUser } = useUserContext();

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

  // Callback function to be passed to ManageProfile
  const handleProfileUpdate = () => {
    fetchUserData(); // Re-fetch profile data after update
  };

  if (!userData) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading user data...</Text>
      </SafeAreaView>
    );
  }

  return (
    <ScrollView style={[styles.container, { paddingTop: safeTop }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <View style={styles.propicArea}>
            <Image source={{ uri: userData.image }} style={styles.propic} />
          </View>
          <Text style={styles.name}>{userData.name}</Text>
          <Text style={styles.membership}>{userData.email}</Text>
        </View>

        <View style={styles.buttonList}>
          <TouchableOpacity
            style={styles.buttonSection}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('ManageProfile', { userId: userData.userId,email:userData.email, onProfileUpdate: handleProfileUpdate })} // Pass user data and callback
          >
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="person" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Manage Account</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.buttonSection}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('EditPassword', { userId: userData.userId })} // Pass user data here
          >
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="lock-closed" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Change Password</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>
          {user?.role == 'volunteer' && (
          <TouchableOpacity
            style={styles.buttonSection}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('SetEventPref', { userId: userData.userId })} // Pass user data here
          >
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="heart" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Set Event Preference</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.buttonSection}
            activeOpacity={0.9}
            onPress={() => navigation.navigate('NotificationPreference', { userId: userData.userId })} // Pass user data here
          >
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="notifications" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Notification Setting</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>
          {user?.role != 'admin' && (
          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.9}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="help-circle" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Help</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>
          )}
          <TouchableOpacity
            style={styles.buttonSection}
            activeOpacity={0.9}
            onPress={async () => {
              try {
                // Clear AsyncStorage (if applicable)
                await AsyncStorage.clear();

                // Clear user state and reset navigation
                setUser(null);

                // Reset the navigation stack and navigate to the Login screen
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (error) {
                // Ensure error message rendering is safe inside Text
                console.error('Error during logout:', error);

                // You can also show the error using an Alert
                Alert.alert('Error', `Error during logout: ${error.message}`);
              }
            }}
          >
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="log-out" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f9f9f9',
  },
  safeArea: {
    flex: 1,
  },
  topSection: {
    paddingTop: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  propicArea: {
    width: 170,
    height: 170,
  },
  propic: {
    width: '100%',
    height: '100%',
    borderRadius: 100,
  },
  name: {
    marginTop: 20,
    fontSize: 26,
    fontWeight: '900',
  },
  membership: {
    color: '#6a8a6d',
    fontSize: 14,
    marginBottom: 20,
  },

  buttonSection: {
    paddingTop: 5,
    paddingBottom: 5,
    paddingLeft: 20,
    paddingHorizontal: 20,
  },
  buttonArea: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconArea: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonName: {
    width: 270,
    fontSize: 16,
    marginLeft: 10,
  },
  sp: {
    width: '100%',
    marginTop: 10,
    height: 1,
    backgroundColor: 'lightgrey',
  },
  buttonList: {

    marginBottom: 100,
  },
});

export default ProfileScreen;