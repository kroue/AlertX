import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal, Image } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import firebaseConfig from './firebase-config';

export default function ActiveAlertsPage({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');

  // alerts and warnings will be populated from Firestore (start empty)
  const [alerts, setAlerts] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [debugJson, setDebugJson] = useState('');
  const [pushToken, setPushToken] = useState(null);
  const [alertModalVisible, setAlertModalVisible] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [expandedAlertId, setExpandedAlertId] = useState(null);
  const soundRef = useRef(null);

  useEffect(() => {
    // Set a notification handler so notifications show while app is foregrounded
    // CRITICAL: This ensures ALL notifications ring, even when app is open
    Notifications.setNotificationHandler({
      handleNotification: async () => ({ 
        shouldShowAlert: true, 
        shouldPlaySound: true, 
        shouldSetBadge: true 
      })
    });

    const requestNotificationPermissions = async () => {
      try {
        if (Device.isDevice) {
          const { status: existingStatus } = await Notifications.getPermissionsAsync();
          let finalStatus = existingStatus;
          if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
          }
          if (finalStatus !== 'granted') {
            // permission not granted; we'll still fetch data but won't schedule notifications
            // eslint-disable-next-line no-console
            console.log('Notification permissions not granted');
          }
        } else {
          // eslint-disable-next-line no-console
          console.log('Push notifications require a physical device');
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error requesting notification permissions', e);
      }
    };

    // request permissions on mount
    requestNotificationPermissions();
    // try registering for push token and saving it to mobileUsers if logged in
    const registerPushToken = async () => {
      try {
        console.log('=== PUSH TOKEN REGISTRATION START ===');
        console.log('Attempting to register push token...');
        console.log('Device.isDevice:', Device.isDevice);
        console.log('Platform:', Platform.OS);
        
        // Get push token using experienceId for development builds
        let tokenObj;
        try {
          tokenObj = await Notifications.getExpoPushTokenAsync();
          console.log('Token object received:', tokenObj);
        } catch (tokenError) {
          console.error('Error getting Expo push token:', tokenError);
          // Fallback: For development, still save user so notification system is testable
          console.log('Skipping push token for now - will work with Expo Go or after proper FCM setup');
          return;
        }
        
        const token = tokenObj?.data;
        console.log('Got push token:', token);
        
        if (!token) {
          console.error('Push token is null or undefined!');
          return;
        }
        
        setPushToken(token);
        // create Android channel for standalone builds with alert sound
        if (Platform.OS === 'android') {
          try {
            await Notifications.setNotificationChannelAsync('alert-channel', {
              name: 'Alerts',
              importance: Notifications.AndroidImportance.MAX,
              sound: 'alert.mp3'
            });
          } catch (e) {
            // ignore if not supported in Expo Go
          }
        }

        // store push token in Firestore mobileUsers document if we have a logged-in mobile user
        const stored = await AsyncStorage.getItem('mobileUser');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            const username = user.username || user.user || user.name || user.id;
            if (username) {
              const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
              const url = `${base}/mobileUsers/${encodeURIComponent(username)}?updateMask.fieldPaths=pushToken&key=${firebaseConfig.apiKey}`;
              // PATCH to update pushToken field - using updateMask to only update this field
              console.log('Saving push token to Firestore for user:', username);
              const response = await fetch(url, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ fields: { pushToken: { stringValue: token } } })
              });
              if (response.ok) {
                console.log('✅ Push token saved successfully!');
              } else {
                console.error('Failed to save push token:', response.status, await response.text());
              }
            }
          } catch (e) {
            // eslint-disable-next-line no-console
            console.log('Failed to save push token for user', e);
          }
        }
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error('=== PUSH TOKEN REGISTRATION FAILED ===');
        console.error('Error getting push token:', e);
        console.error('Error details:', e.message, e.stack);
      }
    };

    registerPushToken();
    // handle notification responses (when user taps a push)
    const handleNotificationResponse = async (response) => {
      try {
        const alertId = response?.notification?.request?.content?.data?.alertId;
        if (!alertId) return;
        const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
        const url = `${base}/alerts/${encodeURIComponent(alertId)}?key=${firebaseConfig.apiKey}`;
        const r = await fetch(url);
        if (!r.ok) {
          setCurrentAlert({ title: 'Alert', description: 'New alert received' });
          setAlertModalVisible(true);
          await playAlertSound();
          return;
        }
        const doc = await r.json();
        const parsed = parseDoc(doc);
        setCurrentAlert(parsed);
        setAlertModalVisible(true);
        await playAlertSound();
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log('Error handling notification response', e);
      }
    };

    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);

    // if app was cold-started from a notification, get the initial response
    (async () => {
      try {
        const last = await Notifications.getLastNotificationResponseAsync();
        if (last) handleNotificationResponse(last);
      } catch (e) {
        // ignore
      }
    })();
    let mounted = true;
    // Attempt to initialize realtime listener only if the `firebase` package is available.
    // We avoid a top-level static import so Metro won't fail bundling when `firebase` isn't installed.
    let unsubscribeRealtime = null;
    (async () => {
      try {
        // dynamic import; will throw if package not present
        const firebaseApp = await import('firebase/app');
        const firebaseFirestore = await import('firebase/firestore');
        const { initializeApp, getApps } = firebaseApp;
        const { getFirestore, collection, query, orderBy, onSnapshot } = firebaseFirestore;

        if (!getApps().length) initializeApp(firebaseConfig);
        const db = getFirestore();
        const initialSnapshotRef = { current: true };
        const alertsQuery = query(collection(db, 'alerts'), orderBy('createdAt', 'desc'));

        unsubscribeRealtime = onSnapshot(alertsQuery, (snapshot) => {
          const docs = [];
          const added = [];
          snapshot.forEach(d => {
            const data = d.data();
            docs.push({ id: d.id, ...data });
          });
          // detect added changes (only after initial snapshot)
          snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
              if (!initialSnapshotRef.current) {
                added.push(change.doc);
              }
            }
          });
          // update alerts state (map to our parsed shape)
          const parsed = docs.map(d => {
            const doc = d || {};
            const type = (doc.type || doc.alertType || 'warning').toLowerCase();
            const title = doc.title || (doc.message ? String(doc.message).split('\n')[0] : type.toUpperCase());
            const description = doc.description || doc.message || '';
            const zone = doc.zone || (Array.isArray(doc.zones) ? doc.zones.join(', ') : 'All Zones');
            const ts = doc.createdAt && doc.createdAt.toDate ? doc.createdAt.toDate() : (doc.createdAt ? new Date(doc.createdAt) : new Date());
            return {
              id: doc.id,
              type,
              title,
              description,
              zone,
              time: timeAgo(ts),
              timestamp: ts
            };
          }).sort((a,b) => b.timestamp - a.timestamp);
          if (mounted) setAlerts(parsed);
          // handle newly added docs (after initial snapshot)
          if (added.length > 0) {
            added.forEach(async (d) => {
              try {
                const doc = d.data();
                const parsed = {
                  id: d.id,
                  type: (doc.type || doc.alertType || 'alert').toLowerCase(),
                  title: doc.title || (doc.message ? String(doc.message).split('\n')[0] : 'Alert'),
                  description: doc.description || doc.message || ''
                };
                // Schedule notification to ensure it rings even when app is open
                try {
                  await Notifications.scheduleNotificationAsync({
                    content: {
                      title: parsed.title || 'EMERGENCY ALERT',
                      body: parsed.description || 'New alert received',
                      data: { id: parsed.id, type: parsed.type },
                      sound: 'default',
                      priority: Notifications.AndroidNotificationPriority.MAX,
                      vibrate: [0, 500, 500, 500],
                      badge: 1,
                    },
                    trigger: null,
                    channelId: 'alert-channel',
                  });
                } catch (e) {
                  console.log('Failed to schedule realtime notification', e);
                }
                setCurrentAlert(parsed);
                setAlertModalVisible(true);
                await playAlertSound();
              } catch (e) {
                // eslint-disable-next-line no-console
                console.log('Error handling realtime added alert', e);
              }
            });
          }
          initialSnapshotRef.current = false;
        }, (err) => {
          // eslint-disable-next-line no-console
          console.log('Realtime listener error', err);
        });
      } catch (e) {
        // If firebase isn't installed or dynamic import fails, skip realtime and rely on polling.
        // eslint-disable-next-line no-console
        console.log('Realtime init skipped (firebase not installed or failed to init)', e);
      }
    })();

    const timeAgo = (d) => {
      const diff = (Date.now() - d.getTime()) / 1000; // seconds
      if (diff < 60) return 'Just now';
      if (diff < 3600) return Math.round(diff / 60) + ' mins ago';
      if (diff < 86400) return Math.round(diff / 3600) + ' hours ago';
      return d.toLocaleDateString();
    };

    const parseDoc = (doc) => {
      const id = doc.name ? doc.name.split('/').pop() : Math.random().toString(36).slice(2, 9);
      const f = doc.fields || {};
      const type = (f.type && f.type.stringValue) || (f.alertType && f.alertType.stringValue) || 'warning';
      const title = (f.title && f.title.stringValue) || ((f.message && f.message.stringValue) ? f.message.stringValue.split('\n')[0] : type.toUpperCase());
      const description = (f.description && f.description.stringValue) || (f.message && f.message.stringValue) || '';
      const mapImageUrl = (f.mapImageUrl && f.mapImageUrl.stringValue) || null;
      // zones can be an array or a single string
      let zone = '';
      if (f.zone && f.zone.stringValue) zone = f.zone.stringValue;
      else if (f.zones && f.zones.arrayValue && f.zones.arrayValue.values) zone = f.zones.arrayValue.values.map(v => v.stringValue).join(', ');

      let ts = new Date();
      if (f.createdAt && (f.createdAt.timestampValue || f.createdAt.stringValue)) {
        const tv = f.createdAt.timestampValue || f.createdAt.stringValue;
        ts = new Date(tv);
      }

      return {
        id,
        type: type.toLowerCase(),
        title,
        description,
        zone: zone || 'All Zones',
        time: timeAgo(ts),
        timestamp: ts,
        mapImageUrl
      };
    };

    const load = async () => {
      setLoading(true);
      setFetchError(null);
      setDebugJson('');
      try {
        const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
        const urls = [
          `${base}/alerts?key=${firebaseConfig.apiKey}`,
          `${base}/warnings?key=${firebaseConfig.apiKey}`
        ];

  // add cache-busting param and request no-cache to avoid stale results
  const nowMs = Date.now();
  const fetchOpts = { cache: 'no-store', headers: { 'Cache-Control': 'no-cache', Pragma: 'no-cache' } };
  const urlsBusted = urls.map(u => `${u}&_=${nowMs}`);
  const responses = await Promise.all(urlsBusted.map(u => fetch(u, fetchOpts)));
        // capture response status for debugging
        const statusInfo = responses.map(r => ({ ok: r.ok, status: r.status, url: r.url }));
        const jsons = await Promise.all(responses.map(async (r) => {
          try {
            return r.ok ? await r.json() : { errorStatus: r.status, text: await r.text() };
          } catch (e) {
            return { error: e.message };
          }
        }));

  // include fetch time to help debugging realtime issues
  setDebugJson(JSON.stringify({ fetchedAt: new Date(nowMs).toISOString(), statusInfo, jsons }, null, 2));
  // also log to console for remote debugging
  // eslint-disable-next-line no-console
  console.log('Firestore fetch', { fetchedAt: new Date(nowMs).toISOString(), statusInfo });

        const docsAlerts = jsons[0] && jsons[0].documents ? jsons[0].documents : [];
        const docsWarnings = jsons[1] && jsons[1].documents ? jsons[1].documents : [];

        const parsedAlerts = docsAlerts.map(parseDoc).map(p => ({ ...p, source: 'alerts', tagKey: 'alert' })).sort((a, b) => b.timestamp - a.timestamp);
        const parsedWarnings = docsWarnings.map(parseDoc).map(p => ({ ...p, source: 'warnings', tagKey: 'warning' })).sort((a, b) => b.timestamp - a.timestamp);

        // detect newly added alerts (polling fallback) and schedule a local notification
        try {
          const prevAlertIds = load._prevAlertIds || new Set();
          const newAlerts = parsedAlerts.filter(a => !prevAlertIds.has(a.id));
          if (prevAlertIds.size > 0 && newAlerts.length > 0) {
            for (const a of newAlerts) {
              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: a.title || 'EMERGENCY ALERT',
                    body: a.description ? (a.description.length > 120 ? a.description.slice(0, 117) + '...' : a.description) : 'A new alert has been issued in your area.',
                    data: { id: a.id, source: a.source },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    vibrate: [0, 500, 500, 500],
                    badge: 1,
                  },
                  trigger: null,
                  channelId: 'alert-channel',
                });
                // also show in-app modal if app is foreground
                setCurrentAlert(a);
                setAlertModalVisible(true);
                await playAlertSound();
              } catch (e) {
                // eslint-disable-next-line no-console
                console.log('Failed to schedule notification for alert', a.id, e);
              }
            }
          }
          load._prevAlertIds = new Set(parsedAlerts.map(p => p.id));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('Error detecting new alerts', e);
        }

        // detect newly added warnings compared to previous state and notify
        try {
          // previous IDs stored on the function object to persist between calls
          const prevIds = load._prevWarningIds || new Set();
          const newWarnings = parsedWarnings.filter(p => !prevIds.has(p.id));
          // if this is not the initial load (i.e. prevIds non-empty), notify for new warnings
          if (prevIds.size > 0 && newWarnings.length > 0) {
            for (const w of newWarnings) {
              try {
                await Notifications.scheduleNotificationAsync({
                  content: {
                    title: w.title || 'WARNING',
                    body: w.description ? (w.description.length > 120 ? w.description.slice(0, 117) + '...' : w.description) : 'A new warning has been issued in your area.',
                    data: { id: w.id, source: w.source },
                    sound: 'default',
                    priority: Notifications.AndroidNotificationPriority.MAX,
                    vibrate: [0, 500, 500, 500],
                    badge: 1,
                  },
                  trigger: null,
                  channelId: 'alert-channel',
                });
              } catch (e) {
                // scheduling failed (permissions or other) — log and continue
                // eslint-disable-next-line no-console
                console.log('Failed to schedule notification for warning', w.id, e);
              }
            }
          }
          // update previous ids
          load._prevWarningIds = new Set(parsedWarnings.map(p => p.id));
        } catch (e) {
          // eslint-disable-next-line no-console
          console.log('Error detecting new warnings', e);
        }

        if (mounted) {
          setAlerts(parsedAlerts);
          setWarnings(parsedWarnings);
        }
      } catch (err) {
        // keep fallback lists on error; log for debugging and surface error
        // eslint-disable-next-line no-console
        console.error('Failed to load alerts/warnings from Firestore', err);
        setFetchError(String(err));
        setDebugJson(String(err.stack || err));
      }
      finally {
        setLoading(false);
      }
    };

    // initial load and then poll every 5s for new warnings/alerts (fallback when realtime/push fail)
    load();
    const POLL_INTERVAL_MS = 5000;
    const interval = setInterval(() => { load(); }, POLL_INTERVAL_MS);
    return () => { mounted = false; clearInterval(interval); subscription && subscription.remove && subscription.remove(); if (unsubscribeRealtime) unsubscribeRealtime(); };
  }, []);

  // Audio helpers
  const playAlertSound = async () => {
    try {
      if (soundRef.current) return;
      
      // Configure audio mode to override silent switch and play at full volume
      // This ensures emergency alerts play even when phone is muted or volume is 0
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: true, // Ignore silent switch on iOS
        staysActiveInBackground: true, // Keep playing in background
        shouldDuckAndroid: false, // Don't lower volume for other apps on Android
        playThroughEarpieceAndroid: false, // Use speaker, not earpiece
        allowsRecordingIOS: false,
        interruptionModeIOS: 1, // Don't mix with other audio
        interruptionModeAndroid: 1, // Don't reduce volume for other apps
      });
      
      const { sound } = await Audio.Sound.createAsync(
        require('./assets/alert.mp3'), 
        { 
          shouldPlay: true, 
          isLooping: true,
          volume: 1.0, // Maximum volume regardless of system volume
          isMuted: false,
        }
      );
      
      // Set volume to maximum (overrides system volume)
      await sound.setVolumeAsync(1.0);
      
      soundRef.current = sound;
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed to play alert sound', e);
    }
  };

  const stopAlertSound = async () => {
    try {
      if (!soundRef.current) return;
      await soundRef.current.stopAsync();
      await soundRef.current.unloadAsync();
      soundRef.current = null;
      
      // Reset audio mode to normal after stopping alert
      await Audio.setAudioModeAsync({
        playsInSilentModeIOS: false,
        staysActiveInBackground: false,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
        allowsRecordingIOS: false,
        interruptionModeIOS: 0,
        interruptionModeAndroid: 2,
      });
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log('Failed to stop alert sound', e);
    }
  };

  const acknowledgeAlert = async () => {
    // stop sound and close modal; optionally mark alert as acknowledged in Firestore
    await stopAlertSound();
    setAlertModalVisible(false);
    if (currentAlert && currentAlert.id) {
      try {
        const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
        const url = `${base}/alerts/${encodeURIComponent(currentAlert.id)}?key=${firebaseConfig.apiKey}`;
        // mark active:false so server stops resending
        await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ fields: { active: { booleanValue: false } } })
        });
      } catch (e) {
        // ignore errors
      }
    }
  };

  const getAlertColor = (type) => {
    switch(type) {
      case 'alert': return styles.tagCritical;
      case 'critical': return styles.tagCritical;
      case 'warning': return styles.tagWarning;
      case 'advisory': return styles.tagAdvisory;
      default: return styles.tagDefault;
    }
  };

  const getAlertBg = (type) => {
    switch(type) {
      case 'alert': return styles.alertCritical;
      case 'critical': return styles.alertCritical;
      case 'warning': return styles.alertWarning;
      case 'advisory': return styles.alertAdvisory;
      default: return styles.alertDefault;
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconButton}>
            <Text style={styles.iconText}>{'<'}</Text>
          </TouchableOpacity>
          <View>
            <Text style={styles.appTitle}>ALERTX</Text>
            <Text style={styles.appSubtitle}>Barangay Osmeña</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>Active Alerts</Text>
          <Text style={styles.pageSubtitle}>Stay informed about flood warnings in your area</Text>
        </View>

          {/* Warnings section (separate from alerts) */}
          {warnings.length > 0 && (
            <View style={[styles.alertsList, { marginBottom: 8 }]}> 
              <Text style={[styles.pageSubtitle, { fontWeight: '700', marginBottom: 8 }]}>Warnings</Text>
              {warnings.map(w => {
                const isExpanded = expandedAlertId === w.id;
                return (
                  <TouchableOpacity 
                    key={w.id} 
                    style={[styles.alertCard, getAlertBg(w.type)]}
                    onPress={() => setExpandedAlertId(isExpanded ? null : w.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.alertHeader}>
                      <Text style={[styles.alertTag, getAlertColor(w.tagKey || w.type)]}>{(w.tagKey || w.type).toUpperCase()}</Text>
                      <View style={styles.timeRow}>
                        <Feather name="clock" size={12} color="#6B7280" style={{ marginRight: 6 }} />
                        <Text style={styles.timeText}>{w.time}</Text>
                      </View>
                    </View>
                    <Text style={styles.alertTitle}>{w.title}</Text>
                    <Text style={styles.alertDesc}>{w.description}</Text>
                    <View style={styles.zoneRow}>
                      <Feather name="map-pin" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                      <Text style={styles.zoneText}>{w.zone}</Text>
                    </View>
                    {isExpanded && w.mapImageUrl && (
                      <View style={styles.mapImageContainer}>
                        <Text style={styles.mapImageLabel}>Alert Map:</Text>
                        <Image 
                          source={{ uri: w.mapImageUrl }} 
                          style={styles.mapImage}
                          resizeMode="contain"
                        />
                      </View>
                    )}
                    {w.mapImageUrl && (
                      <View style={styles.expandIndicator}>
                        <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                        <Text style={styles.expandText}>{isExpanded ? "Hide Map" : "View Map"}</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <View style={styles.alertsList}>
          {alerts.map(alert => {
            const isExpanded = expandedAlertId === alert.id;
            return (
              <TouchableOpacity 
                key={alert.id} 
                style={[styles.alertCard, getAlertBg(alert.tagKey || alert.type)]}
                onPress={() => setExpandedAlertId(isExpanded ? null : alert.id)}
                activeOpacity={0.7}
              >
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertTag, getAlertColor(alert.tagKey || alert.type)]}>{(alert.tagKey || alert.type).toUpperCase()}</Text>
                  <View style={styles.timeRow}>
                    <Feather name="clock" size={12} color="#6B7280" style={{ marginRight: 6 }} />
                    <Text style={styles.timeText}>{alert.time}</Text>
                  </View>
                </View>
                <Text style={styles.alertTitle}>{alert.title}</Text>
                <Text style={styles.alertDesc}>{alert.description}</Text>
                <View style={styles.zoneRow}>
                  <Feather name="map-pin" size={14} color="#6B7280" style={{ marginRight: 6 }} />
                  <Text style={styles.zoneText}>{alert.zone}</Text>
                </View>
                {isExpanded && alert.mapImageUrl && (
                  <View style={styles.mapImageContainer}>
                    <Text style={styles.mapImageLabel}>Alert Map:</Text>
                    <Image 
                      source={{ uri: alert.mapImageUrl }} 
                      style={styles.mapImage}
                      resizeMode="contain"
                    />
                  </View>
                )}
                {alert.mapImageUrl && (
                  <View style={styles.expandIndicator}>
                    <Feather name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color="#6B7280" />
                    <Text style={styles.expandText}>{isExpanded ? "Hide Map" : "View Map"}</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* In-app alert modal shown when user taps a push notification */}
      <Modal visible={alertModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{currentAlert ? currentAlert.title : 'Alert'}</Text>
            <Text style={styles.modalBody}>{currentAlert ? currentAlert.description : 'A new alert has been issued.'}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', marginTop: 16 }}>
              <TouchableOpacity onPress={async () => { await stopAlertSound(); setAlertModalVisible(false); }} style={[styles.modalBtn, { backgroundColor: '#ef4444' }]}>
                <Text style={{ color: '#fff', fontWeight: '700' }}>Stop Alert</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      {/* Bottom navigation moved to shared Tab Navigator in App.js */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F9FAFB' },
  header: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconButton: { padding: 6 },
  iconText: { fontSize: 16, color: '#374151' },
  appTitle: { fontWeight: '700', fontSize: 16, color: '#111827' },
  appSubtitle: { fontSize: 11, color: '#6B7280' },
  badge: { width: 8, height: 8, backgroundColor: '#ef4444', borderRadius: 4, position: 'absolute', top: 4, right: 4 },

  content: { paddingHorizontal: 16 },
  pageTitleWrap: { marginTop: 12, marginBottom: 8 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  pageSubtitle: { fontSize: 13, color: '#6B7280' },

  alertsList: { marginTop: 8, marginBottom: 12 },
  alertCard: { borderRadius: 16, padding: 12, marginBottom: 12, borderWidth: 1 },
  alertHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  alertTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, color: '#fff', fontSize: 11, fontWeight: '700' },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  timeText: { color: '#6B7280', fontSize: 12 },
  alertTitle: { fontSize: 16, fontWeight: '800', color: '#111827', marginBottom: 6 },
  alertDesc: { color: '#374151', fontSize: 14, marginBottom: 8 },
  zoneRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  zoneText: { color: '#6B7280', fontSize: 13 },
  
  mapImageContainer: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  mapImageLabel: { fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 },
  mapImage: { width: '100%', height: 200, borderRadius: 8, backgroundColor: '#F3F4F6' },
  expandIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  expandText: { fontSize: 12, color: '#6B7280', marginLeft: 4, fontWeight: '600' },

  // bottomNav and nav item styles removed — tab bar provided by navigator

  // tag/bg styles
  tagCritical: { backgroundColor: '#ef4444' },
  tagWarning: { backgroundColor: '#f59e0b' },
  tagAdvisory: { backgroundColor: '#3b82f6' },
  tagDefault: { backgroundColor: '#9ca3af' },
  alertCritical: { backgroundColor: '#fff1f2', borderColor: '#fecaca' },
  alertWarning: { backgroundColor: '#fffbeb', borderColor: '#fef3c7' },
  alertAdvisory: { backgroundColor: '#eff6ff', borderColor: '#dbeafe' },
  alertDefault: { backgroundColor: '#f8fafc', borderColor: '#e6eef7' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalCard: { width: '86%', backgroundColor: '#fff', borderRadius: 12, padding: 18, borderWidth: 1, borderColor: '#E5E7EB' },
  modalTitle: { fontSize: 18, fontWeight: '800', color: '#111827', marginBottom: 8 },
  modalBody: { fontSize: 14, color: '#374151' },
  modalBtn: { flex: 1, paddingVertical: 12, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginHorizontal: 4 }
});
