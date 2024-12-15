import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { UserProvider } from './UserContext';

import LoginScreen from './Screen/LoginScreen';
import RegisterScreen from './Screen/RegisterScreen'; 
import ForgotPasswordScreen from './Screen/ForgotPasswordScreen';
import ChangePasswordScreen from './Screen/ChangePasswordScreen';
import Home from './Screen/Browse';
import Detail from './Screen/Detail';
import EventDetail from './Screen/EventDetail';
import SearchPage from './Screen/SearchPage';
import Reviews from './Screen/ReviewScreen';
import EditEvent from './Screen/EditEventScreen';
import Profile from './Screen/ProfilePage';
import MyEvent from './Screen/MyEvent';
import Notification from './Screen/NotificationPage';
import LiveChat from './Screen/LiveChatList';
import Chat from './Screen/Chat';
import ManageProfile from './Screen/ManageProfile';
import EditPassword from './Screen/EditPassword';
import SetEventPref from './Screen/SetEventPreference';
import UserMan from './Screen/UserManagement';
import AddUser from './Screen/AddUser';
import UserDetail from './Screen/UserDetail';
import AddEvent from './Screen/AddEventScreen'
import RewardScreen from './Screen/RewardScreen';
import RewardCatalogue from './Screen/RewardCatalogue';
import MyRewardsScreen from './Screen/MyReward';
import RewardsHistory from './Screen/RewardHistory';
import EventParticipant from './Screen/EventParticipant';
import RewardManagement from './Screen/RewardManagement';
import EditRewardScreen from './Screen/EditRewardScreen';
import AddRewardScreen from './Screen/AddRewardScreen';
import EventAttendance from './Screen/EventAttendance';
import VolunteerAttendance from './Screen/AttendanceVolunteer';
import FaceTestingScreen from './Screen/FaceTestingScreen';
import FaceTestingEditScreen from './Screen/FaceTestingEditScreen';
import VolunteerRecognitionScreen from './Screen/VolunteerRecognitionScreen';
import LocationSelection from './Screen/LocationSelection'
import SearchResult from './Screen/SearchResult';
import PushNotification from './Screen/PushNotification';
import Announcement from './Screen/Announcement';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Global Theme
const theme = {
  colors: {
    primary: '#fff',
    background: '#fff',
    card: '#fff',
    text: 'black',
    border: '#ccc',
    notification: '#f00',
  },
  fonts: {
    regular: 'Roboto-Regular',
    bold: 'Roboto-Bold',
    medium: 'Roboto-Medium',
  },
};

// Main App Component
const App = () => {
  return (
    <UserProvider>
      <NavigationContainer theme={theme}>
        <Stack.Navigator initialRouteName="Login">
          {/* Stack Screens */}
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="Forgot" component={ForgotPasswordScreen} />
          <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />

          {/* Add Tab Navigator as a screen */}
          <Stack.Screen name="VolunHub" component={TabNavigator} />
          <Stack.Screen name="Home" component={Home} />
          <Stack.Screen name="EventDetail" component={EventDetail} />
          <Stack.Screen name="SearchPage" component={SearchPage} />
          <Stack.Screen name="Reviews" component={Reviews} />
          <Stack.Screen name="EditEvent" component={EditEvent} />
          <Stack.Screen name="Notification" component={Notification} />
          <Stack.Screen name="Chat" component={Chat} />
          <Stack.Screen name="ManageProfile" component={ManageProfile} />
          <Stack.Screen name="EditPassword" component={EditPassword} />
          <Stack.Screen name="SetEventPref" component={SetEventPref} />
          <Stack.Screen name="UserMan" component={UserMan} />
          <Stack.Screen name="AddUser" component={AddUser} />
          <Stack.Screen name="AddEvent" component={AddEvent} />
          <Stack.Screen name="UserDetail" component={UserDetail} />
          <Stack.Screen name="RewardCatalogue" component={RewardCatalogue} />
          <Stack.Screen name="MyRewards" component={MyRewardsScreen} />
          <Stack.Screen name="RewardsHistory" component={RewardsHistory} />
          <Stack.Screen name="EventParticipant" component={EventParticipant} />
          <Stack.Screen name="EditRewardScreen" component={EditRewardScreen} />
          <Stack.Screen name="AddRewardScreen" component={AddRewardScreen} />
          <Stack.Screen name="EventAttendance" component={EventAttendance} />
          <Stack.Screen name="VolunteerAttendance" component={VolunteerAttendance} />
          <Stack.Screen name="FaceTestingScreen" component={FaceTestingScreen} />
          <Stack.Screen name="LocationSelection" component={LocationSelection} />
          <Stack.Screen name="VolunteerRecognitionScreen" component={VolunteerRecognitionScreen} />
          <Stack.Screen name="SearchResult" component={SearchResult} />
          <Stack.Screen name="FaceTestingEditScreen" component={FaceTestingEditScreen} />
          <Stack.Screen name="PushNotification" component={PushNotification} />
          <Stack.Screen name="Announcement" component={Announcement} />

        </Stack.Navigator>
      </NavigationContainer>
    </UserProvider>
  );
};

// Define Bottom Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerStyle: {
          backgroundColor: '#e8e3df',
        },
        headerShown: false, // Hides the header
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Browse') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'My Event') {
            iconName = focused ? 'clipboard' : 'clipboard-outline';
          } else if (route.name === 'Rewards') {
            iconName = focused ? 'trophy' : 'trophy-outline';
          } else if (route.name === 'Live Chat') {
            iconName = focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarStyle: { backgroundColor: '#e8e3df', height: 50 },
        tabBarActiveTintColor: '#6a8a6d',
        tabBarInactiveTintColor: '#003300',
      })}
    >
      <Tab.Screen name="Browse" component={Home} />
      <Tab.Screen name="My Event" component={MyEvent} />
      {/* <Tab.Screen name="Rewards" component={EventParticipant} />  */}
      <Tab.Screen name="Rewards" component={RewardScreen} /> 
      {/* <Tab.Screen name="Rewards" component={VolunteerAttendance} />  */}
      {/* <Tab.Screen name="Rewards" component={RewardManagement} />  */}
      <Tab.Screen name="Live Chat" component={LiveChat} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
};

export default App;