import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, Platform, ActivityIndicator } from 'react-native';
import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Feather } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MobileLoginScreen from './login';
import SignupScreen from './signup';
import ActiveAlertsPage from './homepage';
import ProfilePage from './profile';
import ReportIncidentModern from './reportincident';
import EmergencyInfoModern from './emergency';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: '#06b6d4' }}>
      <Tab.Screen
        name="Home"
        component={ActiveAlertsPage}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Report"
        component={ReportIncidentModern}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="clock" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Emergency"
        component={EmergencyInfoModern}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="phone" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfilePage}
        options={{
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [initialRoute, setInitialRoute] = useState('Login');

  useEffect(() => {
    // Check for existing user session
    const checkUserSession = async () => {
      try {
        const storedUser = await AsyncStorage.getItem('mobileUser');
        if (storedUser) {
          // User is already logged in, go straight to Home
          setInitialRoute('Home');
        } else {
          // No session found, show login
          setInitialRoute('Login');
        }
      } catch (error) {
        console.error('Error checking user session:', error);
        // On error, default to login screen
        setInitialRoute('Login');
      } finally {
        setIsLoading(false);
      }
    };

    checkUserSession();

    // Configure Android notification channel for background notifications
    const setupNotifications = async () => {
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          enableVibrate: true,
          enableLights: true,
          showBadge: true,
        });
        
        // Critical alert channel for emergencies - MUST ring every time
        await Notifications.setNotificationChannelAsync('alert-channel', {
          name: 'Emergency Alerts',
          importance: Notifications.AndroidImportance.MAX,
          sound: 'default', // Use default system sound for reliability
          vibrationPattern: [0, 500, 500, 500], // Longer vibration pattern
          enableVibrate: true,
          enableLights: true,
          lightColor: '#FF0000',
          showBadge: true,
          bypassDnd: true, // Bypass Do Not Disturb mode
        });
      }
      
      // Set global notification handler for when app is in foreground
      Notifications.setNotificationHandler({
        handleNotification: async () => ({
          shouldShowAlert: true,
          shouldPlaySound: true,
          shouldSetBadge: true,
        }),
      });
      
      // Request permissions
      if (Device.isDevice) {
        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
          const { status } = await Notifications.requestPermissionsAsync();
          finalStatus = status;
        }
        if (finalStatus !== 'granted') {
          console.log('Notification permissions not granted');
        }
      }
    };
    
    setupNotifications();
  }, []);

  // Show loading screen while checking session
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator initialRouteName={initialRoute} screenOptions={{ headerShown: false }}>
          <Stack.Screen name="Login" component={MobileLoginScreen} />
          <Stack.Screen name="Signup" component={SignupScreen} />
          {/* Home stack route now renders the tab navigator */}
          <Stack.Screen name="Home" component={MainTabs} />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
