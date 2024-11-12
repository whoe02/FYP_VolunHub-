import React from "react";
import { View, StyleSheet, Image, Text, TouchableOpacity, SafeAreaView } from "react-native";
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";

const profile_picture = require('../assets/img/prof.png');

const ProfileScreen = () => {
  const {top: safeTop} = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: safeTop }]}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.topSection}>
          <View style={styles.propicArea}>
            <Image source={profile_picture} style={styles.propic} />
          </View>
          <Text style={styles.name}>Tasun Prasad</Text>
          <Text style={styles.membership}>170 pts</Text>
        </View>

        <View style={styles.buttonList}>
          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.9}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="person" size={25} color={'#6a8a6d'}/>
              </View>
              <Text style={styles.buttonName}>Manage Account</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.8}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="lock-closed" size={25} color={'#6a8a6d'}/>
              </View>
              <Text style={styles.buttonName}>Change Password</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.9}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="heart" size={25}  color={'#6a8a6d'}/>
              </View>
              <Text style={styles.buttonName}>Set Event Prefrence</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.9}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="help-circle" size={25} color={'#6a8a6d'} />
              </View>
              <Text style={styles.buttonName}>Help</Text>
            </View>
            <View style={styles.sp}></View>
          </TouchableOpacity>

          <TouchableOpacity style={styles.buttonSection} activeOpacity={0.9}>
            <View style={styles.buttonArea}>
              <View style={styles.iconArea}>
                <Ionicons name="log-out" size={25} color={'#6a8a6d'}/>
              </View>
              <Text style={styles.buttonName}>Logout</Text>
            </View>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

export default ProfileScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,

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
    fontSize: 18,
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
});