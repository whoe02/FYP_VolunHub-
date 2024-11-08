import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import LoginScreen from './Screen/LoginScreen';
import RegisterScreen from './Screen/RegisterScreen'; 
import ForgotPasswordScreen from './Screen/ForgotPasswordScreen';
import ChangePasswordScreen from './Screen/ChangePasswordScreen';
import Home from './Screen/Browse';
import Detail from './Screen/Detail';
import EventDetail from './Screen/EventDetail';
import SearchPage from './Screen/SearchPage';
import OrganizationEvent from './Screen/OraganizationEventScreen';
import Reviews from './Screen/ReviewScreen';
import EditEvent from './Screen/EditEventScreen';

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
        <Stack.Screen name="OrganizationEvent" component={OrganizationEvent} />
        <Stack.Screen name="Reviews" component={Reviews} />
        <Stack.Screen name="EditEvent" component={EditEvent} />
      </Stack.Navigator>
    </NavigationContainer>
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
          } else if (route.name === 'Notification') {
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
      <Tab.Screen name="My Event" component={OrganizationEvent} />
      <Tab.Screen name="Rewards" component={Detail} />
      <Tab.Screen name="Notification" component={Home} />
      <Tab.Screen name="Profile" component={Detail} />
    </Tab.Navigator>
  );
};

export default App;
