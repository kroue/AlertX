# AlertX Emergency Notification System Setup

## Overview
This system ensures **every emergency alert and warning triggers a notification** that rings on all mobile devices, even when:
- The app is closed
- The app is in background  
- The device is on silent mode
- Multiple alerts are sent (they stack)

## 🚨 Critical Components

### 1. Cloud Functions (Backend)
Located in `/functions/` directory - These send push notifications to all registered mobile users whenever alerts/warnings are created in Firestore.

### 2. Mobile App Enhancements
Enhanced notification handling with:
- MAX priority notifications
- Critical notification channels
- Forced sound and vibration
- Badge notifications
- Do Not Disturb bypass (Android)

## 📋 Setup Instructions

### Step 1: Install Cloud Functions Dependencies

```bash
cd functions
npm install
```

### Step 2: Deploy Cloud Functions to Firebase

```bash
# Login to Firebase (if not already logged in)
firebase login

# Deploy the functions
firebase deploy --only functions
```

This will deploy two critical functions:
- `sendAlertNotifications` - Triggers when new alert is created
- `sendWarningNotifications` - Triggers when new warning is created

### Step 3: Install Mobile App Dependencies

```bash
cd ../alertx-mobile
npm install
```

### Step 4: Rebuild the Mobile App

```bash
# For Android
npx expo run:android

# For iOS
npx expo run:ios
```

**IMPORTANT:** You must rebuild the app (not just refresh) because we modified:
- Notification channels
- Notification handler configuration
- App.js setup logic

### Step 5: Test the System

1. **Test Emergency Alert:**
   - Login to the web control center
   - Go to Emergency Alert page
   - Select zones and send an alert
   - **Expected:** Mobile app should receive notification with sound/vibration immediately

2. **Test Warning:**
   - Send a warning from the control center
   - **Expected:** Mobile app should receive notification with sound/vibration

3. **Test Background Delivery:**
   - Close the mobile app completely
   - Send an alert from web
   - **Expected:** Push notification arrives even when app is closed

## 🔧 How It Works

### When Alert is Sent (Web Control Center):

1. Operator creates alert in `alerts` collection
2. **Cloud Function triggers automatically** (`sendAlertNotifications`)
3. Function queries all `mobileUsers` for push tokens
4. Sends high-priority push notification to ALL tokens
5. Updates alert status to 'sent'

### Mobile App Receives Notification:

**App Closed/Background:**
- Push notification arrives via Expo push service
- System shows notification with sound/vibration
- Tapping opens app to alert details

**App Open:**
- Realtime listener detects new alert
- Schedules local notification (sound rings)
- Shows in-app modal with alert details
- Plays continuous alert sound

## 📱 Notification Configuration

### Android Channels Created:
1. **default** - Standard notifications
2. **alert-channel** - Emergency alerts (MAX importance, bypasses DND)

### Notification Features:
- ✅ Sound: Always plays (uses system default for reliability)
- ✅ Vibration: 500ms pattern repeated 3 times
- ✅ Priority: MAX (highest priority)
- ✅ Badge: Shows notification count
- ✅ Lights: Red LED on supported devices
- ✅ DND Bypass: Alerts play even in Do Not Disturb mode
- ✅ Stacking: Multiple alerts stack, each rings separately

## 🔐 Security Notes

1. **Firestore Rules:** Only authenticated users can create alerts
2. **Push Tokens:** Stored securely in `mobileUsers` collection
3. **Cloud Functions:** Run with admin privileges, validate all data

## 🐛 Troubleshooting

### Notifications Not Arriving:

1. **Check Cloud Functions are deployed:**
   ```bash
   firebase functions:list
   ```
   Should show `sendAlertNotifications` and `sendWarningNotifications`

2. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```
   Look for errors or confirmation messages

3. **Verify Push Token is Saved:**
   - Check Firestore `mobileUsers` collection
   - Each user should have a `pushToken` field
   - Token should start with `ExponentPushToken[`

4. **Check Notification Permissions:**
   - Open mobile app
   - Go to Profile/Settings
   - Verify notifications are enabled in system settings

### No Sound Playing:

1. **Check Device Volume:** Ensure media volume is up
2. **Check Notification Channel Settings:**
   - Android: Settings > Apps > AlertX > Notifications
   - Verify "Emergency Alerts" channel has sound enabled
3. **Rebuild App:** Changes to notification channels require app rebuild

### Alerts Not Creating:

1. **Check User Authentication:** Must be signed in to send alerts
2. **Check Firestore Rules:** Ensure authenticated users can write to `alerts`
3. **Check Browser Console:** Look for error messages

## 📊 Monitoring

### View Function Execution:
```bash
firebase functions:log --only sendAlertNotifications
```

### Check Alert Status in Firestore:
- Open Firebase Console > Firestore
- Check `alerts` collection
- Look for `status: 'sent'` and `notificationsSent` count

## 🚀 Production Considerations

1. **Rate Limiting:** Current setup sends to all users immediately
   - For >1000 users, consider batching
   
2. **Cost Monitoring:** 
   - Cloud Functions are billed per invocation
   - Monitor usage in Firebase Console

3. **Notification Analytics:**
   - Track delivery receipts via Expo's receipt API
   - Uncomment receipt checking in `checkNotificationReceipts` function

4. **Backup Delivery:**
   - App also uses realtime listeners (when open)
   - Polling fallback every 5 seconds (when open)
   - Multiple delivery methods ensure reliability

## 📞 Support

For issues with:
- **Cloud Functions:** Check Firebase Functions logs
- **Mobile Notifications:** Check Expo push notification status
- **Firestore:** Verify security rules and permissions

## ✅ Testing Checklist

- [ ] Functions deployed successfully
- [ ] Mobile app rebuilt with new notification config
- [ ] Test alert with app open - notification rings
- [ ] Test alert with app closed - push notification arrives
- [ ] Test warning with app open - notification rings  
- [ ] Test warning with app closed - push notification arrives
- [ ] Test multiple alerts - each rings separately
- [ ] Test on device with silent mode - still rings
- [ ] Verify badge count increases with each alert

---

**Remember:** These are emergency notifications for life-saving alerts. The system is designed to be aggressive and ensure NO notification is missed.
