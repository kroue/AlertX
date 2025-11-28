import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Platform } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Feather } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export default function EmergencyInfoModern({ navigation }) {
  const [activeTab, setActiveTab] = useState('contacts');
  const [copiedNumber, setCopiedNumber] = useState('');

  const emergencyHotlines = [
    { name: 'Barangay Hotline', number: '(032) 123-4567', icon: '🏠', color: '#EFF6FF' },
    { name: 'Police Station', number: '(032) 234-5678', icon: '🚔', color: '#EFF6FF' },
    { name: 'Fire Department', number: '(032) 345-6789', icon: '🚒', color: '#EFF6FF' },
  ];

  const evacuationCenters = [
    { name: 'Barangay Osmeña Covered Court', address: 'Main Road, Brgy. Osmeña', capacity: '500 persons', distance: '0.5 km' },
    { name: 'Osmeña Elementary School', address: 'School Street, Brgy. Osmeña', capacity: '800 persons', distance: '1.2 km' },
    { name: 'Community Sports Complex', address: 'Sports Ave, Brgy. Osmeña', capacity: '1000 persons', distance: '1.8 km' },
  ];

  const safetyTips = [
    'Keep your phone charged at all times',
    'Know the location of nearest evacuation center',
    'Prepare an emergency kit with essentials',
    'Follow official instructions during emergencies',
    'Share your location with family members',
    'Save emergency numbers in your contacts',
  ];

  const handleCopy = async (number) => {
    try {
      await Clipboard.setStringAsync(number);
      setCopiedNumber(number);
      setTimeout(() => setCopiedNumber(''), 2000);
    } catch (e) {
      // ignore
    }
  };

  const handleCall = async (number) => {
    const tel = `tel:${number.replace(/[^+0-9]/g, '')}`;
    try {
      const supported = await Linking.canOpenURL(tel);
      if (supported) await Linking.openURL(tel);
      else alert('Calling is not supported on this device');
    } catch (e) {
      alert('Unable to start call');
    }
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => (navigation && navigation.goBack ? navigation.goBack() : null)} style={styles.iconBtn}>
            <Feather name="arrow-left" size={20} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.title}>Emergency Info</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}><Feather name="globe" size={18} color="#374151" /></TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}><Feather name="sun" size={18} color="#374151" /></TouchableOpacity>
        </View>
      </View>

      {/* Tabs */}
      <View style={styles.tabsWrap}>
        <View style={styles.tabsRow}>
          <TouchableOpacity onPress={() => setActiveTab('contacts')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'contacts' ? styles.tabActive : null]}>Contacts</Text>
            {activeTab === 'contacts' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('centers')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'centers' ? styles.tabActive : null]}>Centers</Text>
            {activeTab === 'centers' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setActiveTab('safety')} style={styles.tabBtn}>
            <Text style={[styles.tabText, activeTab === 'safety' ? styles.tabActive : null]}>Safety</Text>
            {activeTab === 'safety' && <View style={styles.tabUnderline} />}
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === 'contacts' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Emergency Hotlines</Text>
            {emergencyHotlines.map((hotline, idx) => (
              <View key={idx} style={styles.card}>
                <View style={styles.cardTop}>
                  <View style={[styles.avatar, { backgroundColor: hotline.color }]}>
                    <Text style={{ fontSize: 18 }}>{hotline.icon}</Text>
                  </View>
                  <View style={styles.cardInfo}>
                    <Text style={styles.cardTitle}>{hotline.name}</Text>
                    <Text style={styles.cardNumber}>{hotline.number}</Text>
                  </View>
                </View>
                <View style={styles.cardActions}>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#06b6d4' }]} onPress={() => handleCall(hotline.number)}>
                    <Feather name="phone" size={16} color="#fff" />
                    <Text style={styles.btnText}> Call Now</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btnOutline]} onPress={() => handleCopy(hotline.number)}>
                    <MaterialCommunityIcons name="content-copy" size={16} color="#374151" />
                    <Text style={styles.btnOutlineText}> Copy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}

            {copiedNumber ? (
              <View style={styles.toast}><MaterialCommunityIcons name="check-circle" size={16} color="#fff" /><Text style={styles.toastText}> Number copied!</Text></View>
            ) : null}
          </View>
        )}

        {activeTab === 'centers' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Evacuation Centers</Text>
            {evacuationCenters.map((center, idx) => (
              <View key={idx} style={styles.card}>
                <View>
                  <Text style={styles.cardTitle}>{center.name}</Text>
                  <View style={styles.centerMeta}>
                    <Feather name="map-pin" size={14} color="#6B7280" />
                    <Text style={styles.centerText}>{center.address}</Text>
                  </View>
                  <View style={styles.centerMetaSmall}>
                    <Text style={styles.smallText}>Capacity: {center.capacity}</Text>
                    <Text style={styles.smallText}>Distance: {center.distance}</Text>
                  </View>
                </View>
                <View style={styles.cardActionsRow}>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#2563eb' }]}>
                    <Feather name="navigation" size={16} color="#fff" />
                    <Text style={styles.btnText}> Directions</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.btn, { backgroundColor: '#16a34a' }]} onPress={() => handleCall('911')}>
                    <Feather name="phone" size={16} color="#fff" />
                    <Text style={styles.btnText}> Call</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === 'safety' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Safety Tips</Text>
            <View style={styles.cardPadded}>
              {safetyTips.map((tip, idx) => (
                <View key={idx} style={styles.tipRow}>
                  <View style={styles.tipIcon}><MaterialCommunityIcons name="check-circle" size={18} color="#06b6d4" /></View>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={[styles.cardPadded, { marginTop: 16, backgroundColor: '#FEF3F2', borderLeftWidth: 4, borderLeftColor: '#DC2626' }]}>
              <View style={styles.iconRow}><Feather name="shield" size={18} color="#DC2626" /></View>
              <Text style={[styles.cardTitle, { marginTop: 6 }]}>Emergency Preparedness</Text>
              <Text style={styles.smallText}>Being prepared can save lives. Have a plan and stay informed.</Text>
            </View>

            <View style={[styles.cardPadded, { marginTop: 16, backgroundColor: '#ECFEFF' }]}>
              <View style={styles.emergencyBlock}> 
                <View style={styles.emergencyIcon}><Feather name="phone" size={24} color="#fff" /></View>
                <Text style={styles.cardTitle}>Emergency Hotline</Text>
                <Text style={styles.smallText}>Available 24/7</Text>
                <TouchableOpacity style={[styles.btnBig]} onPress={() => handleCall('911')}>
                  <Text style={styles.btnBigText}>CALL 911</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Bottom navigation moved to shared Tab Navigator in App.js */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerRight: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: '700', marginLeft: 8, color: '#111827' },
  tabsWrap: { backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  tabsRow: { flexDirection: 'row', paddingHorizontal: 12 },
  tabBtn: { paddingVertical: 12, paddingRight: 18, paddingLeft: 0, position: 'relative' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '600' },
  tabActive: { color: '#06b6d4' },
  tabUnderline: { position: 'absolute', left: 0, right: 0, bottom: 0, height: 3, backgroundColor: '#06b6d4', borderRadius: 2 },
  content: { padding: 12, paddingBottom: 96 },
  section: { marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827', marginBottom: 8 },
  card: { backgroundColor: '#fff', borderRadius: 14, padding: 12, marginBottom: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 14, fontWeight: '700', color: '#111827' },
  cardNumber: { fontSize: 14, fontWeight: '700', color: '#374151' },
  cardActions: { flexDirection: 'row', marginTop: 10, gap: 8 },
  btn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10 },
  btnText: { color: '#fff', fontWeight: '700', marginLeft: 8 },
  btnOutline: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', marginLeft: 8 },
  btnOutlineText: { color: '#374151', fontWeight: '700', marginLeft: 8 },
  toast: { position: 'absolute', top: 80, left: '50%', transform: [{ translateX: -100 }], width: 200, backgroundColor: '#111827', padding: 8, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  toastText: { color: '#fff', marginLeft: 6 },
  centerMeta: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  centerText: { color: '#6B7280', marginLeft: 6 },
  centerMetaSmall: { flexDirection: 'row', gap: 12, marginTop: 8 },
  smallText: { fontSize: 12, color: '#6B7280' },
  cardActionsRow: { flexDirection: 'row', marginTop: 10, justifyContent: 'space-between', gap: 8 },
  cardPadded: { backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  tipRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 10 },
  tipIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ECFEFF', alignItems: 'center', justifyContent: 'center' },
  tipText: { color: '#374151', flex: 1 },
  emergencyBlock: { alignItems: 'center' },
  emergencyIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  btnBig: { marginTop: 12, backgroundColor: '#DC2626', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  btnBigText: { color: '#fff', fontWeight: '800' },
  // bottomNav and nav item styles removed — tab bar provided by navigator
});
