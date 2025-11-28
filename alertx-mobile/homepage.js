import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';

export default function ActiveAlertsPage({ navigation }) {
  const [activeTab, setActiveTab] = useState('home');

  const alerts = [
    {
      id: 1,
      type: 'critical',
      title: 'EVACUATE IMMEDIATELY',
      description: 'Severe flooding imminent in your area. Proceed to nearest evacuation center NOW',
      zone: 'Zone 5-C',
      time: 'Just now',
      icon: null
    },
    {
      id: 2,
      type: 'warning',
      title: 'Rising Water Levels',
      description: 'Creek water levels rising rapidly. Prepare emergency supplies and be ready to evacuate.',
      zone: 'Zone 2-B',
      time: '10 mins ago',
      icon: null
    },
    {
      id: 3,
      type: 'advisory',
      title: 'Creek Monitoring Active',
      description: 'Barangay officials are monitoring creek water levels. Stay tuned for updates.',
      zone: 'All Zones',
      time: '1 hour ago',
      icon: null
    }
  ];

  const getAlertColor = (type) => {
    switch(type) {
      case 'critical': return styles.tagCritical;
      case 'warning': return styles.tagWarning;
      case 'advisory': return styles.tagAdvisory;
      default: return styles.tagDefault;
    }
  };

  const getAlertBg = (type) => {
    switch(type) {
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
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="bell" size={18} color="#374151" />
            <View style={styles.badge} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="globe" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton}>
            <Feather name="sun" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={styles.pageTitleWrap}>
          <Text style={styles.pageTitle}>Active Alerts</Text>
          <Text style={styles.pageSubtitle}>Stay informed about flood warnings in your area</Text>
        </View>

        <View style={styles.alertsList}>
          {alerts.map(alert => (
            <View key={alert.id} style={[styles.alertCard, getAlertBg(alert.type)]}>
              <View style={styles.alertHeader}>
                <Text style={[styles.alertTag, getAlertColor(alert.type)]}>{alert.type.toUpperCase()}</Text>
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
            </View>
          ))}
        </View>

        <View style={styles.quickActions}>
          <Text style={styles.quickTitle}>Quick Actions</Text>
          <View style={styles.quickGrid}>
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnReport]}>
              <Feather name="plus" size={16} color="#fff" />
              <Text style={styles.quickBtnText}>Report Incident</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.quickBtn, styles.quickBtnInfo]}>
              <Feather name="phone" size={16} color="#fff" />
              <Text style={styles.quickBtnText}>Emergency Info</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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

  quickActions: { backgroundColor: '#fff', borderRadius: 16, padding: 12, borderWidth: 1, borderColor: '#E5E7EB', marginBottom: 24 },
  quickTitle: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  quickGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  quickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12 },
  quickBtnReport: { backgroundColor: '#06b6d4', marginRight: 8 },
  quickBtnInfo: { backgroundColor: '#2563eb', marginLeft: 8 },
  quickBtnText: { color: '#fff', marginLeft: 8, fontWeight: '700' },

  

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
});
