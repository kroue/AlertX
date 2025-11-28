import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ProfilePage({ navigation }) {
  const [activeTab, setActiveTab] = useState('profile');
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [emergencyAlerts, setEmergencyAlerts] = useState(true);
  const [locationSharing, setLocationSharing] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [userInfo, setUserInfo] = useState({
    name: 'Juan dela Cruz',
    email: 'juan.delacruz@email.com',
    phone: '+63 912 345 6789',
    address: 'Zone 5-C, Barangay Osmeña, Davao City',
    emergencyContact: '+63 912 987 6543',
  });

  const [editedInfo, setEditedInfo] = useState({ ...userInfo });

  const handleSave = () => {
    setUserInfo(editedInfo);
    setEditing(false);
  };

  const handleCancel = () => {
    setEditedInfo(userInfo);
    setEditing(false);
  };

  const recentReports = [
    { id: 1, type: 'Flooding', date: '2024-11-20', status: 'Resolved' },
    { id: 2, type: 'Road Damage', date: '2024-11-15', status: 'In Progress' },
  ];

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.headerWrap}>
        <View style={styles.headerRow}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
            <Feather name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowLogoutModal(true)} style={styles.iconBtn}>
            <Feather name="log-out" size={18} color="#fff" />
          </TouchableOpacity>
        </View>

        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            <Feather name="user" size={36} color="#fff" />
          </View>
          <TouchableOpacity style={styles.cameraBtn}>
            <Feather name="camera" size={14} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.userName}>{userInfo.name}</Text>
          <Text style={styles.userSubtitle}>Resident, Barangay Osmeña</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Personal Information Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Personal Information</Text>
            {!editing ? (
              <TouchableOpacity style={styles.editBtn} onPress={() => setEditing(true)}>
                <Feather name="edit-2" size={14} color="#2563EB" />
                <Text style={styles.editText}> Edit</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.cardBody}>
            <Text style={styles.label}>Full Name</Text>
            {editing ? (
              <TextInput value={editedInfo.name} onChangeText={(t) => setEditedInfo({ ...editedInfo, name: t })} style={styles.input} />
            ) : (
              <View style={styles.infoRow}>
                <Feather name="user" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{userInfo.name}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Email</Text>
            {editing ? (
              <TextInput value={editedInfo.email} onChangeText={(t) => setEditedInfo({ ...editedInfo, email: t })} style={styles.input} keyboardType="email-address" />
            ) : (
              <View style={styles.infoRow}>
                <Feather name="mail" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{userInfo.email}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Phone Number</Text>
            {editing ? (
              <TextInput value={editedInfo.phone} onChangeText={(t) => setEditedInfo({ ...editedInfo, phone: t })} style={styles.input} keyboardType="phone-pad" />
            ) : (
              <View style={styles.infoRow}>
                <Feather name="phone" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{userInfo.phone}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Address</Text>
            {editing ? (
              <TextInput value={editedInfo.address} onChangeText={(t) => setEditedInfo({ ...editedInfo, address: t })} style={styles.input} />
            ) : (
              <View style={styles.infoRow}>
                <Feather name="map-pin" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{userInfo.address}</Text>
              </View>
            )}

            <Text style={[styles.label, { marginTop: 12 }]}>Emergency Contact</Text>
            {editing ? (
              <TextInput value={editedInfo.emergencyContact} onChangeText={(t) => setEditedInfo({ ...editedInfo, emergencyContact: t })} style={styles.input} keyboardType="phone-pad" />
            ) : (
              <View style={styles.infoRow}>
                <Feather name="phone" size={16} color="#9CA3AF" style={{ marginRight: 8 }} />
                <Text style={styles.infoText}>{userInfo.emergencyContact}</Text>
              </View>
            )}

            {editing && (
              <View style={styles.editActions}>
                <TouchableOpacity style={styles.cancelBtn} onPress={handleCancel}>
                  <Text style={styles.cancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                  <Text style={styles.saveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* Settings Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Settings</Text>
          </View>
          <View style={styles.settingsList}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#DBEAFE' }]}>
                  <Feather name="bell" size={16} color="#2563EB" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Notifications</Text>
                  <Text style={styles.settingSubtitle}>Push notifications</Text>
                </View>
              </View>
              <Switch value={notificationsEnabled} onValueChange={setNotificationsEnabled} thumbColor="#fff" trackColor={{ false: '#D1D5DB', true: '#60A5FA' }} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#FEE2E2' }]}>
                  <Feather name="shield" size={16} color="#DC2626" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Emergency Alerts</Text>
                  <Text style={styles.settingSubtitle}>Critical notifications</Text>
                </View>
              </View>
              <Switch value={emergencyAlerts} onValueChange={setEmergencyAlerts} thumbColor="#fff" trackColor={{ false: '#D1D5DB', true: '#F87171' }} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#DCFCE7' }]}>
                  <Feather name="globe" size={16} color="#16A34A" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Location Sharing</Text>
                  <Text style={styles.settingSubtitle}>Share location in reports</Text>
                </View>
              </View>
              <Switch value={locationSharing} onValueChange={setLocationSharing} thumbColor="#fff" trackColor={{ false: '#D1D5DB', true: '#4ADE80' }} />
            </View>

            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <View style={[styles.iconBox, { backgroundColor: '#111827' }]}>
                  <Feather name="moon" size={16} color="#fff" />
                </View>
                <View>
                  <Text style={styles.settingTitle}>Dark Mode</Text>
                  <Text style={styles.settingSubtitle}>Coming soon</Text>
                </View>
              </View>
              <Switch value={darkMode} onValueChange={setDarkMode} disabled thumbColor="#fff" trackColor={{ false: '#D1D5DB', true: '#111827' }} />
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>Recent Reports</Text>
          </View>
          <View>
            {recentReports.map((report) => (
              <View key={report.id} style={styles.reportRow}>
                <View style={styles.reportLeft}>
                  <View style={[styles.statusDot, { backgroundColor: report.status === 'Resolved' ? '#10B981' : '#F59E0B' }]} />
                  <View>
                    <Text style={styles.reportType}>{report.type}</Text>
                    <Text style={styles.reportDate}>{report.date}</Text>
                  </View>
                </View>
                <View style={[styles.reportBadge, { backgroundColor: report.status === 'Resolved' ? '#ECFDF5' : '#FFFBEB' }]}> 
                  <Text style={{ color: report.status === 'Resolved' ? '#065F46' : '#92400E', fontWeight: '600' }}>{report.status}</Text>
                </View>
              </View>
            ))}
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={() => setShowLogoutModal(true)}>
          <Feather name="log-out" size={16} color="#DC2626" />
          <Text style={styles.logoutText}> Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.version}>AlertX v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 Senior High School</Text>
      </View>

      {/* Logout Modal */}
      <Modal visible={showLogoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalContent}>
              <View style={styles.modalIcon}><Feather name="log-out" size={22} color="#DC2626" /></View>
              <Text style={styles.modalTitle}>Log Out?</Text>
              <Text style={styles.modalSubtitle}>Are you sure you want to log out of your account?</Text>
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setShowLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => { setShowLogoutModal(false); /* handle logout */ }}>
                <Text style={styles.modalConfirmText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 120 },
  headerWrap: { backgroundColor: '#06b6d4', paddingBottom: 24, paddingTop: 24 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 },
  iconBtn: { padding: 8 },
  avatarWrap: { alignItems: 'center', marginTop: 12 },
  avatarCircle: { width: 96, height: 96, borderRadius: 48, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(255,255,255,0.25)' },
  cameraBtn: { position: 'absolute', right: 110, top: 64, width: 36, height: 36, borderRadius: 18, backgroundColor: '#06b6d4', alignItems: 'center', justifyContent: 'center' },
  userName: { marginTop: 12, color: '#fff', fontSize: 20, fontWeight: '700' },
  userSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12 },

  content: { padding: 16, marginTop: -48 },
  card: { backgroundColor: '#fff', borderRadius: 16, marginBottom: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB' },
  cardHeader: { backgroundColor: '#F9FAFB', padding: 12, borderBottomWidth: 1, borderBottomColor: '#E5E7EB', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  editBtn: { flexDirection: 'row', alignItems: 'center' },
  editText: { color: '#2563EB', fontWeight: '600' },
  cardBody: { padding: 12 },
  label: { fontSize: 12, color: '#6B7280', marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB', padding: 10, borderRadius: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center' },
  infoText: { color: '#111827' },
  editActions: { flexDirection: 'row', marginTop: 12 },
  cancelBtn: { flex: 1, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 8, alignItems: 'center', marginRight: 8 },
  cancelText: { color: '#374151', fontWeight: '600' },
  saveBtn: { flex: 1, backgroundColor: '#2563EB', padding: 12, borderRadius: 8, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: '700' },

  settingsList: { padding: 12 },
  settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  settingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconBox: { width: 40, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  settingTitle: { fontWeight: '600' },
  settingSubtitle: { fontSize: 12, color: '#6B7280' },

  reportRow: { padding: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reportLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  reportType: { fontWeight: '700' },
  reportDate: { fontSize: 12, color: '#6B7280' },
  reportBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12 },

  logoutBtn: { marginTop: 12, backgroundColor: '#FEF2F2', padding: 12, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  logoutText: { color: '#DC2626', fontWeight: '700' },
  version: { textAlign: 'center', marginTop: 12, color: '#6B7280', fontSize: 12 },
  copyright: { textAlign: 'center', color: '#9CA3AF', fontSize: 12, marginTop: 4 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#fff', borderRadius: 20, padding: 16, width: '100%', maxWidth: 420 },
  modalContent: { alignItems: 'center', marginBottom: 12 },
  modalIcon: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#FEE2E2', alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSubtitle: { color: '#6B7280', textAlign: 'center', marginTop: 6 },
  modalActions: { flexDirection: 'row', gap: 8 },
  modalCancel: { flex: 1, backgroundColor: '#F3F4F6', padding: 12, borderRadius: 12, alignItems: 'center' },
  modalCancelText: { color: '#374151', fontWeight: '600' },
  modalConfirm: { flex: 1, backgroundColor: '#DC2626', padding: 12, borderRadius: 12, alignItems: 'center' },
  modalConfirmText: { color: '#fff', fontWeight: '700' },
});
