import React, { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Plus, X, Send, ArrowLeft, MapPin, CheckCircle2 } from 'lucide-react';
import './controlcenter.css';
import Map from './Map';
import MapGoogle from './MapGoogle';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase-config';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import html2canvas from 'html2canvas';

export default function EmergencyAlertPage() {
  const navigate = useNavigate();
  const [emergencyType] = useState('Flood');
  const [message, setMessage] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);
  const mapContainerRef = useRef(null);

  const db = getFirestore();

  const defaultTypes = ['Flood'];
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];

  // Zone center coordinates based on the map image
  const zoneCoordinates = {
    'Zone 1': { lat: 8.4585, lng: 124.6475 },
    'Zone 2': { lat: 8.4555, lng: 124.6445 },
    'Zone 3': { lat: 8.4580, lng: 124.6400 },
    'Zone 4': { lat: 8.4600, lng: 124.6435 }
  };

  // custom types removed - emergency type is fixed to 'Flood'

  const toggleZone = (zone) => {
    const isCurrentlySelected = selectedZones.includes(zone);
    
    if (isCurrentlySelected) {
      // Remove zone and its map pin
      setSelectedZones(prev => prev.filter(z => z !== zone));
      const coords = zoneCoordinates[zone];
      setMapPoints(points => points.filter(p => 
        !(Math.abs(p.lat - coords.lat) < 0.0001 && Math.abs(p.lng - coords.lng) < 0.0001)
      ));
    } else {
      // Add zone and its map pin (check if already exists to prevent duplicates)
      setSelectedZones(prev => [...prev, zone]);
      const coords = zoneCoordinates[zone];
      setMapPoints(points => {
        const exists = points.some(p => 
          Math.abs(p.lat - coords.lat) < 0.0001 && Math.abs(p.lng - coords.lng) < 0.0001
        );
        return exists ? points : [...points, coords];
      });
    }
  };

  const clearSelections = () => {
    setSelectedZones([]);
    setMapPoints([]);
  };
  const clearMessage = () => setMessage('');

  const handleSend = async () => {
    if (!message.trim() || selectedZones.length === 0) return;
    // Require an authenticated user before attempting Firestore writes. If
    // the client isn't signed in, Firestore rules (see FIRESTORE_RULES.md)
    // will reject the write with "Missing or insufficient permissions".
    if (!auth || !auth.currentUser) {
      // Improve operator feedback instead of sending and logging a rules error.
      // You can replace this with a nicer UI/modal if desired.
      alert('You must be signed in to send alerts. Please sign in and try again.');
      return;
    }
    // Signed-in users are allowed to send alerts per Firestore rules.
    setSending(true);
    try {
      let mapImageUrl = null;
      
      // Capture map screenshot if there are pins
      if (mapPoints.length > 0 && mapContainerRef.current) {
        try {
          const canvas = await html2canvas(mapContainerRef.current, {
            backgroundColor: '#ffffff',
            scale: 2,
            logging: false
          });
          
          // Convert canvas to blob
          const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
          
          // Upload to Cloudinary
          const formData = new FormData();
          formData.append('file', blob);
          formData.append('upload_preset', 'alertx_maps');
          
          const cloudName = 'dfejxqixw';
          console.log('Uploading to Cloudinary:', cloudName);
          console.log('Upload preset:', 'alertx_maps');
          
          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData
            }
          );
          
          console.log('Cloudinary response status:', cloudinaryResponse.status);
          
          if (cloudinaryResponse.ok) {
            const data = await cloudinaryResponse.json();
            mapImageUrl = data.secure_url;
            console.log('Upload successful:', mapImageUrl);
          } else {
            const errorData = await cloudinaryResponse.text();
            console.error('Cloudinary error:', errorData);
          }
        } catch (mapError) {
          // eslint-disable-next-line no-console
          console.error('Failed to capture/upload map:', mapError);
          // Continue without map image
        }
      }
      
      // create alert document in Firestore so backend/clients can broadcast
      await addDoc(collection(db, 'alerts'), {
        type: emergencyType,
        zones: selectedZones,
        message,
        mapPoints,
        mapImageUrl,
        createdAt: serverTimestamp(),
        // auth.currentUser is guaranteed above, use its uid directly so
        // security rules can validate request.auth on the server side.
        sentBy: auth.currentUser.uid,
        status: 'queued'
      });

      // small UX delay to mimic previous behaviour
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // surface error for developer / operator
      // eslint-disable-next-line no-console
      console.error('Failed to write alert to Firestore', err);
      // simple user feedback — you can replace with a nicer UI notification
      alert('Failed to send alert. Check console for details.');
    } finally {
      setSending(false);
    }
  };

  const allTypes = [...defaultTypes];

  // auto-generate the emergency message when zones or type change
  useEffect(() => {
    const generated = `${emergencyType.toUpperCase()} WARNING for: ${selectedZones.length > 0 ? selectedZones.join(', ') : 'No zones selected'}. Evacuate immediately.`;
    setMessage(generated);
  }, [selectedZones, emergencyType]);

  // Track auth state and whether the current user has an operator claim. This
  // Note: we rely on Firestore rules to allow authenticated users to write.

  return (
    <div className="cc-background">
      <div className="cc-main">
        <button onClick={() => navigate(-1)} className="cc-return-btn">
          <ArrowLeft />
          <span>Return</span>
        </button>

        <div className="cc-grid">
          <div className="cc-column">
            <div className="cc-card-inner">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 cc-card-icon cc-card-icon--danger"><AlertTriangle /></div>
                <h2 className="text-2xl font-bold cc-card-sub">Type of Emergency:</h2>
              </div>

              <div className="cc-select">{emergencyType}</div>
            </div>

            <div className="cc-card-inner">
              <div className="flex items-center gap-3 mb-4"><MapPin className="w-6 h-6 text-red-500" /><h3 className="text-xl font-bold">Select Zones:</h3></div>
              <div className="cc-zone-list">
                {zones.map(zone => (
                  <label key={zone} className="cc-zone-row">
                    <input type="checkbox" checked={selectedZones.includes(zone)} onChange={() => toggleZone(zone)} className="cc-zone-checkbox" />
                    <span className="cc-zone-label">{zone}</span>
                    {selectedZones.includes(zone) && <CheckCircle2 className="cc-zone-check" />}
                  </label>
                ))}
              </div>
              <button onClick={clearSelections} className="cc-button-clear-selections">Clear Selections</button>
              {selectedZones.length > 0 && <div className="cc-summary"><p>Selected: {selectedZones.join(', ')}</p></div>}

              {/* map integration */}
              <div ref={mapContainerRef} style={{marginTop:18}}>
        {/* fixedBounds: approximate bbox for Brgy 26, Cagayan de Oro (southWest, northEast)
          Adjust coordinates if you have a more accurate polygon */}
                  {process.env.REACT_APP_GOOGLE_MAPS_API_KEY ? (
                    <MapGoogle markers={mapPoints} setMarkers={setMapPoints} center={[8.459,124.643]} zoom={16} fixedBounds={[[8.452,124.636],[8.466,124.650]]} />
                  ) : (
                    <Map markers={mapPoints} setMarkers={setMapPoints} center={[8.459,124.643]} zoom={15} allowClick={true} fixedBounds={[[8.452,124.636],[8.466,124.650]]} />
                  )}
                {mapPoints.length > 0 && <div className="cc-summary" style={{marginTop:8}}><p>Map points: {mapPoints.length}</p></div>}
              </div>
            </div>
          </div>

          <div className="cc-card-inner">
            <div className="cc-message-header"><span className="cc-live-dot" /> <h3>Emergency Message:</h3></div>
            <div className="cc-alert-preview"><p>{emergencyType.toUpperCase()} WARNING for: {selectedZones.length > 0 ? selectedZones.join(', ') : 'No zones selected'}. Evacuate immediately.</p></div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter detailed emergency message..." rows={12} className="cc-textarea" />
            <p className="cc-char-count">{message.length}/1000 characters</p>
              <div className="cc-send-grid">
                <button onClick={clearMessage} className="cc-clear-text">Clear Text</button>
                <button
                  onClick={handleSend}
                  disabled={sending || !message.trim() || selectedZones.length === 0 || !auth?.currentUser}
                  className="cc-send-btn"
                >
                  {sending ? <div className="cc-spinner" /> : <><Send /><span>Send message</span></>}
                </button>
              </div>
              {selectedZones.length === 0 && <p className="cc-warning-note">Please select at least one zone to send the alert</p>}
              {!auth?.currentUser && <p className="cc-warning-note">You must be signed in to send an alert</p>}
              { /* No operator-claim required: authenticated users can send alerts per rules */ }
          </div>
        </div>

        {showSuccess && <div className="cc-toast cc-toast--success"><CheckCircle2 /><span>Emergency alert sent successfully!</span></div>}
      </div>
    </div>
  );
}
