import React, { useState, useEffect } from 'react';
import { AlertTriangle, Plus, X, Send, ArrowLeft, MapPin, CheckCircle2 } from 'lucide-react';
import './controlcenter.css';
import Map from './Map';
import MapGoogle from './MapGoogle';
import { useNavigate } from 'react-router-dom';
import { auth } from './firebase-config';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';

export default function EmergencyAlertPage() {
  const navigate = useNavigate();
  const [emergencyType] = useState('Flood');
  const [message, setMessage] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);

  const db = getFirestore();

  const defaultTypes = ['Flood'];
  const zones = ['Zone 1', 'Zone 2', 'Zone 3'];

  // custom types removed - emergency type is fixed to 'Flood'

  const toggleZone = (zone) => {
    setSelectedZones(prev => 
      prev.includes(zone) 
        ? prev.filter(z => z !== zone)
        : [...prev, zone]
    );
  };

  const clearSelections = () => setSelectedZones([]);
  const clearMessage = () => setMessage('');

  const handleSend = async () => {
    if (!message.trim() || selectedZones.length === 0) return;
    setSending(true);
    try {
      // create alert document in Firestore so backend/clients can broadcast
      await addDoc(collection(db, 'alerts'), {
        type: emergencyType,
        zones: selectedZones,
        message,
        mapPoints,
        createdAt: serverTimestamp(),
        sentBy: auth?.currentUser?.uid || null,
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
              <div style={{marginTop:18}}>
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
              <button onClick={handleSend} disabled={sending || !message.trim() || selectedZones.length === 0} className="cc-send-btn">
                {sending ? <div className="cc-spinner" /> : <><Send /><span>Send message</span></>}
              </button>
            </div>
            {selectedZones.length === 0 && <p className="cc-warning-note">Please select at least one zone to send the alert</p>}
          </div>
        </div>

        {showSuccess && <div className="cc-toast cc-toast--success"><CheckCircle2 /><span>Emergency alert sent successfully!</span></div>}
      </div>
    </div>
  );
}
