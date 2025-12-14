const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { Expo } = require('expo-server-sdk');

admin.initializeApp();
const db = admin.firestore();
const expo = new Expo();

/**
 * Send push notifications to all mobile users when a new alert is created
 * This ensures notifications are delivered even when the app is closed or in background
 */
exports.sendAlertNotifications = functions.firestore
  .document('alerts/{alertId}')
  .onCreate(async (snapshot, context) => {
    try {
      const alert = snapshot.data();
      const alertId = context.params.alertId;
      
      console.log('New alert created:', alertId, alert);
      
      // Get all mobile users with push tokens
      const usersSnapshot = await db.collection('mobileUsers').get();
      const pushTokens = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.pushToken && Expo.isExpoPushToken(userData.pushToken)) {
          pushTokens.push(userData.pushToken);
        }
      });
      
      if (pushTokens.length === 0) {
        console.log('No valid push tokens found');
        return null;
      }
      
      console.log(`Sending notifications to ${pushTokens.length} devices`);
      
      // Prepare notification message
      const title = alert.message?.split('\n')[0] || alert.title || 'EMERGENCY ALERT';
      const body = alert.description || alert.message || 'A new emergency alert has been issued in your area.';
      const type = (alert.type || 'alert').toLowerCase();
      const zones = Array.isArray(alert.zones) ? alert.zones.join(', ') : (alert.zone || 'All Zones');
      
      // Create messages for each token
      const messages = pushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: {
          alertId: alertId,
          type: type,
          zones: zones,
          timestamp: Date.now(),
          source: 'alerts'
        },
        priority: 'high',
        channelId: 'alert-channel',
        // Critical alert configuration for iOS
        _displayInForeground: true,
      }));
      
      // Send notifications in chunks (Expo recommends max 100 per batch)
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log('Sent chunk:', ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }
      
      // Log results
      console.log(`Successfully sent ${tickets.length} notifications`);
      
      // Mark alert as sent
      await snapshot.ref.update({
        status: 'sent',
        notificationsSent: tickets.length,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, sent: tickets.length };
    } catch (error) {
      console.error('Error sending alert notifications:', error);
      
      // Mark alert as failed
      await snapshot.ref.update({
        status: 'failed',
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  });

/**
 * Send push notifications to all mobile users when a new warning is created
 */
exports.sendWarningNotifications = functions.firestore
  .document('warnings/{warningId}')
  .onCreate(async (snapshot, context) => {
    try {
      const warning = snapshot.data();
      const warningId = context.params.warningId;
      
      console.log('New warning created:', warningId, warning);
      
      // Get all mobile users with push tokens
      const usersSnapshot = await db.collection('mobileUsers').get();
      const pushTokens = [];
      
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        if (userData.pushToken && Expo.isExpoPushToken(userData.pushToken)) {
          pushTokens.push(userData.pushToken);
        }
      });
      
      if (pushTokens.length === 0) {
        console.log('No valid push tokens found');
        return null;
      }
      
      console.log(`Sending warning notifications to ${pushTokens.length} devices`);
      
      // Prepare notification message
      const title = warning.message?.split('\n')[0] || warning.title || 'WARNING';
      const body = warning.description || warning.message || 'A new warning has been issued in your area.';
      const type = (warning.type || 'warning').toLowerCase();
      const zones = Array.isArray(warning.zones) ? warning.zones.join(', ') : (warning.zone || 'All Zones');
      
      // Create messages for each token
      const messages = pushTokens.map(token => ({
        to: token,
        sound: 'default',
        title: title,
        body: body,
        data: {
          warningId: warningId,
          type: type,
          zones: zones,
          timestamp: Date.now(),
          source: 'warnings'
        },
        priority: 'high',
        channelId: 'alert-channel',
        _displayInForeground: true,
      }));
      
      // Send notifications in chunks
      const chunks = expo.chunkPushNotifications(messages);
      const tickets = [];
      
      for (const chunk of chunks) {
        try {
          const ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          tickets.push(...ticketChunk);
          console.log('Sent chunk:', ticketChunk);
        } catch (error) {
          console.error('Error sending chunk:', error);
        }
      }
      
      // Log results
      console.log(`Successfully sent ${tickets.length} warning notifications`);
      
      // Mark warning as sent
      await snapshot.ref.update({
        status: 'sent',
        notificationsSent: tickets.length,
        sentAt: admin.firestore.FieldValue.serverTimestamp()
      });
      
      return { success: true, sent: tickets.length };
    } catch (error) {
      console.error('Error sending warning notifications:', error);
      
      // Mark warning as failed
      await snapshot.ref.update({
        status: 'failed',
        error: error.message
      });
      
      return { success: false, error: error.message };
    }
  });

/**
 * Clean up old notifications receipts periodically
 * Run daily to check notification delivery status
 */
exports.checkNotificationReceipts = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    console.log('Checking notification receipts...');
    // This can be expanded to track delivery status if needed
    return null;
  });
