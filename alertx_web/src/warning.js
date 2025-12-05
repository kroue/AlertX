import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Plus, X, Send, ArrowLeft, MapPin, CheckCircle2, ChevronDown } from 'lucide-react';
import './controlcenter.css';
import { useNavigate } from 'react-router-dom';
import Map from './Map';
import MapGoogle from './MapGoogle';
import { auth } from './firebase-config';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import html2canvas from 'html2canvas';

export default function WarningPage() {
  const navigate = useNavigate();
  const [warningType] = useState('Flood');
  const [message, setMessage] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);
  const mapContainerRef = useRef(null);

  const db = getFirestore();

  // warning type is fixed to Flood (same as emergency page)
  const zones = ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4'];

  // Zone center coordinates based on the map image
  const zoneCoordinates = {
    'Zone 1': { lat: 8.4585, lng: 124.6475 },
    'Zone 2': { lat: 8.4555, lng: 124.6445 },
    'Zone 3': { lat: 8.4580, lng: 124.6400 },
    'Zone 4': { lat: 8.4600, lng: 124.6435 }
  };

  // no custom types for warnings; type is fixed

  const toggleZone = (zone) => {
    const isCurrentlySelected = selectedZones.includes(zone);
    
    if (isCurrentlySelected) {
      // Remove zone and its map pin
      setSelectedZones(selectedZones.filter(z => z !== zone));
      const coords = zoneCoordinates[zone];
      setMapPoints(points => points.filter(p => 
        !(Math.abs(p.lat - coords.lat) < 0.0001 && Math.abs(p.lng - coords.lng) < 0.0001)
      ));
    } else {
      // Add zone and its map pin (check if already exists to prevent duplicates)
      setSelectedZones([...selectedZones, zone]);
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
          const cloudinaryResponse = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            {
              method: 'POST',
              body: formData
            }
          );
          
          if (cloudinaryResponse.ok) {
            const data = await cloudinaryResponse.json();
            mapImageUrl = data.secure_url;
          }
        } catch (mapError) {
          // eslint-disable-next-line no-console
          console.error('Failed to capture/upload map:', mapError);
          // Continue without map image
        }
      }
      
      await addDoc(collection(db, 'warnings'), {
        type: warningType,
        zones: selectedZones,
        message,
        mapPoints,
        mapImageUrl,
        createdAt: serverTimestamp(),
        // allow missing auth during development; store uid when available
        sentBy: auth?.currentUser?.uid || null,
        status: 'queued'
      });

      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error('Failed to write warning to Firestore', err);
      alert('Failed to send warning. Check console for details.');
    } finally {
      setSending(false);
    }
  };

  // auto-generate the warning message when zones or type change
  useEffect(() => {
    const generated = `${warningType.toUpperCase()} WARNING for: ${selectedZones.length > 0 ? selectedZones.join(', ') : 'No zones selected'}. Evacuate immediately.`;
    setMessage(generated);
  }, [selectedZones, warningType]);

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
                <div className="w-12 h-12 cc-card-icon cc-card-icon--warn"><AlertCircle /></div>
                <h2 className="text-2xl font-bold cc-card-sub">Type of Warning:</h2>
              </div>

              <div className="cc-select">{warningType}</div>
            </div>

            <div className="cc-card-inner">
              <div className="flex items-center gap-3 mb-4"><MapPin className="w-6 h-6 text-yellow-500" /><h3 className="text-xl font-bold">Select Zones:</h3></div>
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
            <div className="cc-message-header"><span className="cc-live-dot cc-live-dot--warn" /> <h3>Warning Message:</h3></div>
            <div className="cc-alert-preview cc-alert-preview--warn"><p>{warningType.toUpperCase()} WARNING for: {selectedZones.length > 0 ? selectedZones.join(', ') : 'No zones selected'}. Evacuate immediately.</p></div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter warning message details..." rows={12} className="cc-textarea" />
            <p className="cc-char-count">{message.length}/1000 characters</p>
              <div className="cc-send-grid">
                <button onClick={clearMessage} className="cc-clear-text">Clear Text</button>
                <button onClick={handleSend} disabled={sending || !message.trim() || selectedZones.length === 0 || !auth?.currentUser} className="cc-send-btn">
                  {sending ? <div className="cc-spinner" /> : <><Send /><span>Send message</span></>}
                </button>
              </div>
              {selectedZones.length === 0 && <p className="cc-warning-note">Please select at least one zone to send the warning</p>}
              {!auth?.currentUser && <p className="cc-warning-note">You must be signed in to send a warning</p>}
          </div>
        </div>

        {showSuccess && <div className="cc-toast cc-toast--success"><CheckCircle2 /><span>Warning sent successfully!</span></div>}
      </div>
    </div>
  );
}
