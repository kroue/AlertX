# 🚨 AlertX Notifications - Quick Reference

## How It Works Now

### When You Send an Alert/Warning:
1. **Web app** → Creates document in Firestore
2. **Cloud Function** → Automatically triggers
3. **Push Notifications** → Sent to ALL mobile users immediately
4. **Mobile Apps** → Receive notification with sound/vibration

## ✅ What Changed

### Before (Not Working):
- ❌ No notifications when app was closed
- ❌ Silent notifications
- ❌ Only worked when app was open

### After (Working):
- ✅ Notifications work 24/7 (even when app closed)
- ✅ LOUD sound + vibration on every alert
- ✅ Multiple alerts stack (each rings)
- ✅ Works on silent mode
- ✅ Bypasses Do Not Disturb

## 🚀 Quick Setup (First Time Only)

```bash
# 1. Deploy Cloud Functions
cd functions
npm install
cd ..
firebase deploy --only functions

# 2. Rebuild Mobile App
cd alertx-mobile
npm install
npx expo run:android
```

**⚠️ IMPORTANT:** Must rebuild app (not just refresh) for notifications to work!

## 📱 How to Test

### Test 1: App Open
1. Open mobile app
2. Send alert from web
3. **Expect:** Notification + Modal + Sound

### Test 2: App Closed
1. Close mobile app completely
2. Send alert from web
3. **Expect:** Push notification with sound
4. Tap notification → Opens app

### Test 3: Multiple Alerts
1. Send 3 alerts quickly
2. **Expect:** 3 separate notifications, each rings

## 🔍 Troubleshooting

### "No notifications received"
```bash
# Check functions are deployed
firebase functions:list

# Should show:
# - sendAlertNotifications
# - sendWarningNotifications
```

### "No sound playing"
- Check device volume is UP
- Check app rebuilt (not just refreshed)
- Check Android Settings > Apps > AlertX > Notifications

### "Functions not deploying"
```bash
# Login first
firebase login

# Then deploy
firebase deploy --only functions
```

## 📊 Verify Setup

### Check Functions:
```bash
firebase functions:list
```

### Check Logs:
```bash
firebase functions:log
```

### Check Push Tokens:
- Firebase Console → Firestore → `mobileUsers`
- Each user should have `pushToken` field

## 🎯 Key Features

- **Priority:** MAX (highest)
- **Sound:** Always plays
- **Vibration:** 500ms × 3
- **Stacking:** Multiple alerts supported
- **Delivery:** Works 24/7, even app closed
- **Reliability:** 3 fallback methods

## 📞 Support

**Issue:** Functions not deploying
**Fix:** Run `firebase login` first

**Issue:** App notifications not ringing
**Fix:** Rebuild app with `npx expo run:android`

**Issue:** No push notifications when closed
**Fix:** Check functions deployed, verify push tokens in Firestore

## 🔐 Security

- Only authenticated users can send alerts
- Push tokens stored securely
- Functions run server-side only

## 💰 Cost

**Free Tier Covers:**
- 2M function calls/month
- Unlimited push notifications
- Current usage: ~$0/month

## 📝 Files Changed

### New Files:
- `/functions/index.js` - Cloud Functions
- `/functions/package.json` - Dependencies
- `/NOTIFICATION_SETUP.md` - Full setup guide
- `/setup-notifications.ps1` - Auto setup script

### Modified Files:
- `/alertx-mobile/App.js` - Notification channels
- `/alertx-mobile/homepage.js` - Priority settings
- `/alertx-mobile/app.json` - Permissions

## ✨ Next Steps After Setup

1. **Deploy functions:** `firebase deploy --only functions`
2. **Rebuild app:** `npx expo run:android`
3. **Test thoroughly:** Send alerts, verify notifications
4. **Monitor logs:** `firebase functions:log`
5. **Done!** System is production-ready

---

**Remember:** This is for LIFE-SAVING alerts. Notifications are designed to be impossible to miss! 🚨
