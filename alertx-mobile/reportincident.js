import React, { useState, useRef } from 'react';
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
import { Image, Pressable } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { captureRef } from 'react-native-view-shot';
import * as ImageManipulator from 'expo-image-manipulator';
import firebaseConfig from './firebase-config';

export default function ReportIncidentModern({ navigation }) {
  const [activeTab, setActiveTab] = useState('report');
  const [selectedType, setSelectedType] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  // Image-map state: we'll use a static map image for brgy_26 and track marker as pixel coords
  const [imageLayout, setImageLayout] = useState({ width: 0, height: 0 });
  const [pressableLayout, setPressableLayout] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [markerCoord, setMarkerCoord] = useState(null); // { x, y } in pixels relative to image
  const [detectedZone, setDetectedZone] = useState(null); // Which zone (1-4) the pin is in
  const [photoUri, setPhotoUri] = useState(null);
  const [photoBase64, setPhotoBase64] = useState(null);
  const mapRef = useRef(null);
  const pressableRef = useRef(null);
  const [markUrgent, setMarkUrgent] = useState(false);
  const [photoAdded, setPhotoAdded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Zone boundaries as percentages of the map image (approximate from your map)
  const zoneBoundaries = {
    1: { minX: 55, maxX: 100, minY: 0, maxY: 65 },    // Zone 1 (top-right)
    2: { minX: 30, maxX: 70, minY: 40, maxY: 100 },  // Zone 2 (center-bottom)
    3: { minX: 0, maxX: 40, minY: 30, maxY: 100 },   // Zone 3 (left)
    4: { minX: 45, maxX: 95, minY: 0, maxY: 50 },    // Zone 4 (top-center)
  };

  // Fixed bounds for coordinate conversion [lat, lng]
  const fixedBounds = [[8.452, 124.636], [8.466, 124.650]];

  const detectZone = (xPercent, yPercent) => {
    for (let zoneNum = 1; zoneNum <= 4; zoneNum++) {
      const zone = zoneBoundaries[zoneNum];
      if (xPercent >= zone.minX && xPercent <= zone.maxX && 
          yPercent >= zone.minY && yPercent <= zone.maxY) {
        return zoneNum;
      }
    }
    return null;
  };

  const pixelToLatLng = (x, y) => {
    if (!pressableLayout.width || !pressableLayout.height) return null;
    const fracX = x / pressableLayout.width;
    const fracY = y / pressableLayout.height;
    const lat = fixedBounds[0][0] + fracY * (fixedBounds[1][0] - fixedBounds[0][0]);
    const lng = fixedBounds[0][1] + fracX * (fixedBounds[1][1] - fixedBounds[0][1]);
    return { lat, lng };
  };

  const incidentTypes = [
    'Rising Water',
    'Blocked Drainage',
    'Person Needing Rescue',
    'Damaged Infrastructure',
    'Other',
  ];

  

  const handleUseLocation = () => {
    // Place the pin in the center of the image map and set the location text as percent coords
    if (imageLayout.width && imageLayout.height) {
      const cx = imageLayout.width / 2;
      const cy = imageLayout.height / 2;
      setMarkerCoord({ x: cx, y: cy });
      const px = (cx / imageLayout.width) * 100;
      const py = (cy / imageLayout.height) * 100;
      const zone = detectZone(px, py);
      setDetectedZone(zone);
      const latLng = pixelToLatLng(cx, cy);
      if (zone && latLng) {
        setLocation(`Brgy 26, Zone ${zone} (${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)})`);
      } else if (latLng) {
        setLocation(`Brgy 26 (${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)})`);
      } else {
        setLocation('Brgy 26 (center)');
      }
    } else {
      setLocation('Brgy 26 (center)');
    }
  };

  const onImagePress = (e) => {
    const { pageX, pageY } = e.nativeEvent;
    
    // Measure the pressable to get its screen position
    if (pressableRef.current) {
      pressableRef.current.measure((x, y, width, height, pageXPos, pageYPos) => {
        // Calculate relative position within the Pressable
        const relX = pageX - pageXPos;
        const relY = pageY - pageYPos;
        
        console.log('Touch - pageX:', pageX, 'pageY:', pageY, 'Pressable pageX:', pageXPos, 'pageY:', pageYPos, 'Relative x:', relX, 'y:', relY);
        
        // Ensure coordinates are within bounds
        if (relX < 0 || relY < 0 || relX > width || relY > height) {
          console.warn('Touch outside bounds');
          return;
        }
        
        setMarkerCoord({ x: relX, y: relY });
        if (width && height) {
          const px = (relX / width) * 100;
          const py = (relY / height) * 100;
          const zone = detectZone(px, py);
          setDetectedZone(zone);
          const latLng = pixelToLatLngWithDimensions(relX, relY, width, height);
          if (zone && latLng) {
            setLocation(`Brgy 26, Zone ${zone} (${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)})`);
          } else if (latLng) {
            setLocation(`Brgy 26 (${latLng.lat.toFixed(5)}, ${latLng.lng.toFixed(5)})`);
          } else {
            setLocation(`brgy_26 (x:${Math.round(relX)}, y:${Math.round(relY)})`);
          }
        }
      });
    }
  };

  const pixelToLatLngWithDimensions = (x, y, width, height) => {
    if (!width || !height) return null;
    const fracX = x / width;
    const fracY = y / height;
    const lat = fixedBounds[0][0] + fracY * (fixedBounds[1][0] - fixedBounds[0][0]);
    const lng = fixedBounds[0][1] + fracX * (fixedBounds[1][1] - fixedBounds[0][1]);
    return { lat, lng };
  };

  const onImageLayout = (e) => {
    const { width, height } = e.nativeEvent.layout;
    console.log('Layout updated:', width, height);
    setImageLayout({ width, height });
  };

  const pickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access photo library is required.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ quality: 0.9, base64: false, allowsEditing: true });
      if (!result.cancelled) {
        // support both legacy (result.uri) and new assets array (result.assets[0].uri)
        const pickedUri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
        if (!pickedUri || typeof pickedUri !== 'string') {
          console.error('pickImage: no uri found on result', result);
          alert('Failed to pick image (no uri)');
          return;
        }
        setPhotoUri(pickedUri);
        setPhotoBase64(null); // Will upload to Cloudinary instead
      }
    } catch (e) {
      console.error('pickImage error', e);
      alert('Failed to pick image');
    }
  };

  const takePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to use camera is required.');
        return;
      }
      const result = await ImagePicker.launchCameraAsync({ quality: 0.9, base64: false, allowsEditing: true });
      if (!result.cancelled) {
        const takenUri = result.uri || (result.assets && result.assets[0] && result.assets[0].uri);
        if (!takenUri || typeof takenUri !== 'string') {
          console.error('takePhoto: no uri found on result', result);
          alert('Failed to take photo (no uri)');
          return;
        }
        setPhotoUri(takenUri);
        setPhotoBase64(null); // Will upload to Cloudinary instead
      }
    } catch (e) {
      console.error('takePhoto error', e);
      alert('Failed to take photo');
    }
  };

  const uploadToCloudinary = async (imageUri) => {
    try {
      console.log('Starting Cloudinary upload for:', imageUri);
      
      // Compress and prepare the image
      const manipulated = await ImageManipulator.manipulateAsync(
        imageUri,
        [{ resize: { width: 1200 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
      );

      console.log('Image manipulated:', manipulated.uri);

      // For web, we need to fetch the image as a blob
      const response = await fetch(manipulated.uri);
      const blob = await response.blob();
      
      const formData = new FormData();
      formData.append('file', blob, 'upload.jpg');
      formData.append('upload_preset', 'alertx_maps');

      console.log('Uploading to Cloudinary...');
      const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dfejxqixw/image/upload', {
        method: 'POST',
        body: formData,
      });

      console.log('Cloudinary response status:', uploadResponse.status);

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error('Cloudinary upload failed:', uploadResponse.status, errorText);
        throw new Error(`Cloudinary upload failed: ${uploadResponse.status} - ${errorText}`);
      }

      const data = await uploadResponse.json();
      console.log('Cloudinary upload success:', data.secure_url);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      return null;
    }
  };

  const saveReportToFirestore = async (payloadFields) => {
    const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
    const url = `${base}/incidents?key=${firebaseConfig.apiKey}`;
    const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fields: payloadFields }) });
    return res;
  };

  const handleSubmitReport = async () => {
    if (!selectedType || !description || !location) return;
    setSubmitting(true);
    try {
      // Upload incident photo to Cloudinary if available
      let photoUrl = null;
      if (photoUri) {
        console.log('Uploading photo:', photoUri);
        photoUrl = await uploadToCloudinary(photoUri);
        if (!photoUrl) {
          console.warn('Failed to upload photo to Cloudinary');
        } else {
          console.log('Photo uploaded successfully:', photoUrl);
        }
      }

      // Capture and upload map image to Cloudinary
      let mapImageUrl = null;
      if (mapRef.current && markerCoord) {
        try {
          console.log('Capturing map...');
          
          // Check if we're on web (captureRef may not work well on web)
          if (typeof window !== 'undefined' && window.document) {
            // For web, convert the element to canvas using html2canvas or similar
            // Since we're on web, we can use the DOM element directly
            const canvas = document.createElement('canvas');
            const mapElement = mapRef.current;
            
            // Get the actual DOM element (may be wrapped)
            let domElement = mapElement;
            if (mapElement._touchableNode) {
              domElement = mapElement._touchableNode;
            } else if (mapElement._nativeTag) {
              domElement = document.querySelector(`[data-tag="${mapElement._nativeTag}"]`);
            }
            
            if (domElement && domElement instanceof HTMLElement) {
              const rect = domElement.getBoundingClientRect();
              canvas.width = rect.width;
              canvas.height = rect.height;
              
              const ctx = canvas.getContext('2d');
              
              // Draw background
              ctx.fillStyle = '#F3F4F6';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Find and draw the image
              const imgElement = domElement.querySelector('img');
              if (imgElement) {
                ctx.drawImage(imgElement, 0, 0, canvas.width, canvas.height);
                
                // Draw the marker if present
                if (markerCoord) {
                  ctx.fillStyle = '#ef4444';
                  ctx.strokeStyle = '#fff';
                  ctx.lineWidth = 2;
                  ctx.beginPath();
                  ctx.arc(markerCoord.x, markerCoord.y, 12, 0, 2 * Math.PI);
                  ctx.fill();
                  ctx.stroke();
                }
              }
              
              // Convert canvas to blob
              const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png', 0.9));
              
              // Upload the blob
              if (blob) {
                const formData = new FormData();
                formData.append('file', blob, 'map.png');
                formData.append('upload_preset', 'alertx_maps');
                
                const uploadResponse = await fetch('https://api.cloudinary.com/v1_1/dfejxqixw/image/upload', {
                  method: 'POST',
                  body: formData,
                });
                
                if (uploadResponse.ok) {
                  const data = await uploadResponse.json();
                  mapImageUrl = data.secure_url;
                  console.log('Map uploaded successfully:', mapImageUrl);
                } else {
                  console.error('Map upload failed:', await uploadResponse.text());
                }
              }
            }
          } else {
            // For native mobile, use captureRef
            const tmpMapUri = await captureRef(mapRef.current, { format: 'png', quality: 0.9, result: 'tmpfile' });
            if (tmpMapUri) {
              mapImageUrl = await uploadToCloudinary(tmpMapUri);
              console.log('Map uploaded successfully:', mapImageUrl);
            }
          }
        } catch (e) {
          console.error('Failed to capture/upload map image', e);
        }
      }

      // build Firestore fields
      const reporterRaw = await AsyncStorage.getItem('mobileUser');
      const reporter = reporterRaw ? JSON.parse(reporterRaw) : { username: 'anonymous' };
      const now = new Date().toISOString();
      const fields = {
        incidentType: { stringValue: selectedType },
        description: { stringValue: description },
        locationText: { stringValue: location },
        urgent: { booleanValue: !!markUrgent },
        reporter: { stringValue: reporter.username || reporter.user || 'mobile' },
        createdAt: { timestampValue: now }
      };

      if (detectedZone) {
        fields.zone = { integerValue: detectedZone };
      }

      if (markerCoord && imageLayout.width && imageLayout.height) {
        const latLng = pixelToLatLng(markerCoord.x, markerCoord.y);
        if (latLng) {
          fields.latitude = { doubleValue: latLng.lat };
          fields.longitude = { doubleValue: latLng.lng };
        }
      }

      if (photoUrl) {
        fields.photoUrl = { stringValue: photoUrl };
        console.log('Added photoUrl to fields:', photoUrl);
      }

      if (mapImageUrl) {
        fields.mapImageUrl = { stringValue: mapImageUrl };
        console.log('Added mapImageUrl to fields:', mapImageUrl);
      }

      console.log('Submitting to Firestore with fields:', fields);
      const res = await saveReportToFirestore(fields);
      if (!res.ok) {
        const text = await res.text();
        console.error('Failed to save report', res.status, text);
        alert('Failed to submit report. Try again later.');
      } else {
        // success
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 1600);
        // reset form
        setSelectedType('');
        setDescription('');
        setLocation('');
        setMarkerCoord(null);
        setDetectedZone(null);
        setPhotoUri(null);
        setPhotoBase64(null);
        setMarkUrgent(false);
      }
    } catch (e) {
      console.error('submit report error', e);
      alert('An error occurred while submitting the report');
    } finally {
      setSubmitting(false);
    }
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
            placeholder="Enter location or tap map to set"
            style={styles.input}
          />

          {/* Image map for placing a pin on brgy_26. Tap to place. */}
          <View style={styles.mapContainer}>
            <Pressable 
              ref={pressableRef}
              onPress={onImagePress} 
              onLayout={onImageLayout}
              style={{ position: 'relative', width: '100%', height: 220 }}
            >
              <View ref={(r) => { mapRef.current = r; }} style={{ width: '100%', height: '100%' }}>
                <Image 
                  source={require('./assets/brgy26_map.png')} 
                  style={{ width: '100%', height: '100%' }} 
                  resizeMode="cover"
                />
              </View>
              {/* marker overlay */}
              {markerCoord ? (
                <View pointerEvents="none" style={[styles.marker, { position: 'absolute', left: markerCoord.x - 12, top: markerCoord.y - 12 }]} />
              ) : null}
            </Pressable>
            <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 12, color: '#6B7280' }}>Tap map to place pin</Text>
              {detectedZone && (
                <View style={{ backgroundColor: '#06b6d4', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 }}>
                  <Text style={{ fontSize: 12, color: '#fff', fontWeight: '700' }}>Zone {detectedZone}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Photo (Optional)</Text>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TouchableOpacity onPress={takePhoto} style={[styles.photoBtn, photoUri ? styles.photoBtnAdded : styles.photoBtnDefault]}>
              <Feather name="camera" size={16} color={photoUri ? '#065F46' : '#374151'} />
              <Text style={[styles.photoBtnText, photoUri ? styles.photoBtnTextAdded : null]}>{photoUri ? ' Photo Selected' : ' Take Photo'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={pickImage} style={[styles.photoBtn, photoUri ? styles.photoBtnAdded : styles.photoBtnDefault]}>
              <Feather name="image" size={16} color={photoUri ? '#065F46' : '#374151'} />
              <Text style={[styles.photoBtnText, photoUri ? styles.photoBtnTextAdded : null]}>{photoUri ? ' Replace' : ' Choose from Gallery'}</Text>
            </TouchableOpacity>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={{ width: 56, height: 56, borderRadius: 8, marginLeft: 8 }} />
            ) : null}
          </View>
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
          onPress={handleSubmitReport}
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

  mapContainer: { marginTop: 12, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F3F4F6' },
  map: { flex: 1, width: '100%' },
  marker: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ef4444', borderWidth: 2, borderColor: '#fff' },

  // bottomNav and nav item styles removed — tab bar provided by navigator
});
