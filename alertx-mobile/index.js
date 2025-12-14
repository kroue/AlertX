import { registerRootComponent } from 'expo';
import * as Notifications from 'expo-notifications';

import App from './App';

// CRITICAL: Set notification handler BEFORE app initialization
// This ensures notifications work even when app is closed/in background
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
