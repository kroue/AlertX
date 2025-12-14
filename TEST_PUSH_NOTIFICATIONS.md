# Test Push Notifications - Diagnostic Steps

## Step 1: Check if Push Token is Saved

1. **Open your mobile app** (should be running already)
2. **Look at the Metro Bundler terminal** for these logs:
   ```
   Attempting to register push token...
   Device.isDevice: true/false
   Got push token: ExponentPushToken[...]
   Saving push token to Firestore for user: <username>
   ✅ Push token saved successfully!
   ```

3. **Check Firebase Console:**
   - Go to: https://console.firebase.google.com/project/alertx-32a7a/firestore
   - Navigate to: `mobileUsers` collection
   - Click on your username document
   - **Look for `pushToken` field** - should contain `ExponentPushToken[...]`

## Step 2: Manual Test Push Notification

If the token is saved, test manually:

1. **Copy your push token** from Firestore (the full `ExponentPushToken[xxx]` string)

2. **Run this in PowerShell** (replace YOUR_TOKEN_HERE):

```powershell
$token = "YOUR_TOKEN_HERE"
$body = @{
    to = $token
    title = "TEST ALERT"
    body = "This is a test push notification"
    sound = "default"
    priority = "high"
    channelId = "alert-channel"
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://exp.host/--/api/v2/push/send" -Method POST -Headers @{"Content-Type"="application/json"} -Body $body
```

3. **Close your app completely**
4. **You should receive the notification!**

## Step 3: If Token is NOT Saved

If you don't see the push token in Firestore:

1. **Check the console logs** for errors
2. **Try logging out and back in**
3. **Make sure you're on the Home screen** (homepage.js runs the registration)

## Step 4: Test from Web Control Center

Once token is confirmed saved:

1. **Close mobile app completely**
2. **Send alert from web control center**
3. **Check web browser console** for:
   ```
   Push notifications sent to X devices
   ```
4. **Your phone should ring!**

## Common Issues:

### Issue: "Push notifications require a physical device"
- **Fix**: The code has been updated to work on emulators too
- Reload the app

### Issue: No push token in Firestore
- **Check**: User is logged in
- **Check**: App has notification permissions
- **Try**: Log out and log back in

### Issue: Token saved but no notifications
- **Check**: Web console shows "Push notifications sent to X devices"
- **Check**: Token format is correct (`ExponentPushToken[...]`)
- **Try**: Manual test with PowerShell command above

### Issue: Notifications only appear when app opens
- **Problem**: Push token not registered or web app not sending
- **Check**: Follow Steps 1-3 above

## Quick Diagnostic:

Run this to see what's in your mobileUsers collection:

```powershell
$user = "YOUR_USERNAME"
$url = "https://firestore.googleapis.com/v1/projects/alertx-32a7a/databases/(default)/documents/mobileUsers/$user?key=AIzaSyCtaTOBvrONNeMcFkcT8UfvXQTdNhnAfpg"
(Invoke-RestMethod -Uri $url).fields | ConvertTo-Json -Depth 10
```

Look for `pushToken` field in the output.
