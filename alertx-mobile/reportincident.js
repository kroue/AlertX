import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Feather } from '@expo/vector-icons';

export default function ReportIncidentModern({ navigation }) {
  const [activeTab, setActiveTab] = useState('report');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [markUrgent, setMarkUrgent] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const incidentTypes = [
    'Rising Water',
    'Blocked Drainage',
    'Person Needing Rescue',
    'Damaged Infrastructure',
    'Other',
  ];

  const handleSubmit = () => {
    if (!selectedType || !description || !location) return;
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setShowSuccess(true);
      setTimeout(() => {
        setShowSuccess(false);
        // Reset form
        setSelectedType('');
        setDescription('');
        setLocation('');
        setMarkUrgent(false);
        setPhotoAdded(false);
      }, 1700);
    }, 1200);
  };

  const handleUseLocation = () => {
    setLocation('Current GPS Location');
  };

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => navigation?.goBack?.()}>
            <Feather name="arrow-left" size={18} color="#374151" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Report Incident</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="globe" size={18} color="#374151" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn}>
            <Feather name="sun" size={18} color="#374151" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.section}>
          <Text style={styles.label}>Incident Type</Text>
          <View style={styles.typesGrid}>
            {incidentTypes.map((t) => (
              <TouchableOpacity
                key={t}
                onPress={() => setSelectedType(t)}
                style={[
                  styles.typeBtn,
                  selectedType === t ? styles.typeBtnSelected : styles.typeBtnDefault,
                ]}
              >
                <Text style={selectedType === t ? styles.typeTextSelected : styles.typeTextDefault}>{t}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Description</Text>
          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="Describe the incident in detail..."
            multiline
            numberOfLines={4}
            style={styles.textarea}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location or use GPS"
            style={styles.input}
          />
          <TouchableOpacity style={styles.btnGhost} onPress={handleUseLocation}>
            <Feather name="map-pin" size={14} color="#0ea5a4" />
            <Text style={styles.btnGhostText}> Use Current Location</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo (Optional)</Text>
          <TouchableOpacity
            onPress={() => setPhotoAdded(!photoAdded)}
            style={[styles.photoBtn, photoAdded ? styles.photoBtnAdded : styles.photoBtnDefault]}
          >
            <Feather name="camera" size={16} color={photoAdded ? '#065F46' : '#374151'} />
            <Text style={[styles.photoBtnText, photoAdded ? styles.photoBtnTextAdded : null]}>{photoAdded ? ' Photo Added' : ' Take or Upload Photo'}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <TouchableOpacity
            onPress={() => setMarkUrgent(!markUrgent)}
            style={[styles.urgentBtn, markUrgent ? styles.urgentBtnOn : styles.urgentBtnOff]}
          >
            <Feather name="alert-triangle" size={16} color={markUrgent ? '#fff' : '#ef4444'} />
            <View style={{ marginLeft: 10 }}>
              <Text style={markUrgent ? styles.urgentTextOn : styles.urgentTextOff}>Mark as Urgent</Text>
              <Text style={markUrgent ? styles.urgentSubOn : styles.urgentSubOff}>Requires immediate attention</Text>
            </View>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, (!selectedType || !description || !location) ? styles.submitBtnDisabled : null]}
          disabled={submitting || !selectedType || !description || !location}
          onPress={handleSubmit}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>Submit Report</Text>
          )}
        </TouchableOpacity>

        <Text style={styles.spacer} />
      </ScrollView>

      {/* Success Modal */}
      <Modal visible={showSuccess} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIcon}><Feather name="check-circle" size={36} color="#16A34A" /></View>
            <Text style={styles.modalTitle}>Report Submitted!</Text>
            <Text style={styles.modalSub}>Authorities have been notified and will respond shortly.</Text>
          </View>
        </View>
      </Modal>

      {/* Bottom navigation moved to shared Tab Navigator in App.js */}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#E5E7EB' },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: { padding: 6 },

  container: { padding: 16, paddingBottom: 140 },
  section: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '700', color: '#111827', marginBottom: 8 },
  typesGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  typeBtn: { paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, marginRight: 8, marginBottom: 8 },
  typeBtnDefault: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  typeBtnSelected: { backgroundColor: '#06b6d4' },
  typeTextDefault: { color: '#374151' },
  typeTextSelected: { color: '#fff', fontWeight: '700' },

  textarea: { minHeight: 96, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', padding: 12, borderRadius: 12, textAlignVertical: 'top' },
  input: { borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#fff', padding: 12, borderRadius: 12 },
  btnGhost: { marginTop: 10, flexDirection: 'row', alignItems: 'center', padding: 12, borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, backgroundColor: '#fff' },
  btnGhostText: { color: '#065F46', fontWeight: '600' },

  photoBtn: { padding: 14, borderRadius: 12, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' },
  photoBtnDefault: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#E5E7EB' },
  photoBtnAdded: { backgroundColor: '#ECFDF5', borderWidth: 1, borderColor: '#10B981' },
  photoBtnText: { color: '#374151' },
  photoBtnTextAdded: { color: '#065F46' },

  urgentBtn: { padding: 12, borderRadius: 12, flexDirection: 'row', alignItems: 'center' },
  urgentBtnOff: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#FECACA' },
  urgentBtnOn: { backgroundColor: '#ef4444' },
  urgentTextOff: { color: '#111827', fontWeight: '700' },
  urgentTextOn: { color: '#fff', fontWeight: '700' },
  urgentSubOff: { color: '#6B7280', fontSize: 12 },
  urgentSubOn: { color: '#fee2e2', fontSize: 12 },

  submitBtn: { marginTop: 8, padding: 14, borderRadius: 12, backgroundColor: '#06b6d4', alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitText: { color: '#fff', fontWeight: '700' },

  spacer: { height: 20 },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center' },
  modalCard: { backgroundColor: '#fff', padding: 20, borderRadius: 16, alignItems: 'center', width: '90%' },
  modalIcon: { marginBottom: 12 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  modalSub: { color: '#6B7280', textAlign: 'center', marginTop: 6 },

  // bottomNav and nav item styles removed — tab bar provided by navigator
});
