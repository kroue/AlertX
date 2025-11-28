import React, { useState } from 'react';
import { AlertCircle, Plus, X, Send, ArrowLeft, MapPin, CheckCircle2, ChevronDown } from 'lucide-react';
import './controlcenter.css';
import { useNavigate } from 'react-router-dom';
import Map from './Map';
import MapGoogle from './MapGoogle';

export default function WarningPage() {
  const navigate = useNavigate();
  const [warningType, setWarningType] = useState('Weather');
  const [customTypes, setCustomTypes] = useState([]);
  const [newType, setNewType] = useState('');
  const [message, setMessage] = useState('');
  const [selectedZones, setSelectedZones] = useState([]);
  const [selectedPaths, setSelectedPaths] = useState([]);
  const [sending, setSending] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [mapPoints, setMapPoints] = useState([]);

  const defaultTypes = ['Weather', 'Maintenance', 'Traffic', 'Event', 'Advisory', 'Update'];
  const zones = [
    { id: 'zone1', name: 'Zone 1', paths: ['Zone 1 - Path A', 'Zone 1 - Path B', 'Zone 1 - Path C'] },
    { id: 'zone2', name: 'Zone 2', paths: ['Zone 2 - Path A', 'Zone 2 - Path B'] },
    { id: 'zone3', name: 'Zone 3', paths: ['Zone 3 - Path A', 'Zone 3 - Path B', 'Zone 3 - Path C'] }
  ];

  const addCustomType = () => {
    if (newType.trim() && !customTypes.includes(newType.trim())) { setCustomTypes([...customTypes, newType.trim()]); setNewType(''); }
  };
  const removeCustomType = (type) => setCustomTypes(customTypes.filter(t => t !== type));

  const toggleZone = (zoneId) => {
    const zone = zones.find(z => z.id === zoneId);
    if (selectedZones.includes(zoneId)) {
      setSelectedZones(selectedZones.filter(z => z !== zoneId));
      setSelectedPaths(selectedPaths.filter(p => !zone.paths.includes(p)));
    } else {
      setSelectedZones([...selectedZones, zoneId]);
    }
  };

  const togglePath = (zonePath) => setSelectedPaths(prev => prev.includes(zonePath) ? prev.filter(p => p !== zonePath) : [...prev, zonePath]);
  const clearSelections = () => { setSelectedZones([]); setSelectedPaths([]); };
  const clearMessage = () => setMessage('');

  const handleSend = () => {
    if (!message.trim() || (selectedZones.length === 0 && selectedPaths.length === 0)) return;
    setSending(true);
    setTimeout(() => { setSending(false); setShowSuccess(true); setTimeout(() => setShowSuccess(false), 3000); }, 1500);
  };

  const allTypes = [...defaultTypes, ...customTypes];

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

              <select value={warningType} onChange={(e) => setWarningType(e.target.value)} className="cc-select">
                {allTypes.map(type => <option key={type} value={type}>{type}</option>)}
              </select>

              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Add a Custom Type:</label>
                <input value={newType} onChange={(e) => setNewType(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && addCustomType()} placeholder="Enter custom warning type..." className="cc-input" />
              </div>

              <div className="cc-add-row">
                <button onClick={() => setNewType('')} className="cc-button-clear">Clear</button>
                <button onClick={addCustomType} className="cc-button-add"><Plus />Add</button>
              </div>

              {customTypes.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-semibold">Custom Types:</p>
                  <div className="cc-custom-types">
                    {customTypes.map(type => (
                      <div key={type} className="cc-chip cc-chip--warn">
                        <span>{type}</span>
                        <button onClick={() => removeCustomType(type)} className="cc-chip-remove"><X /></button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="cc-card-inner">
              <div className="flex items-center gap-3 mb-4"><MapPin className="w-6 h-6 text-yellow-500" /><h3 className="text-xl font-bold">Select Zones & Paths:</h3></div>
              <div className="cc-zone-list">
                {zones.map(zone => {
                  const isZoneSelected = selectedZones.includes(zone.id);
                  const selectedPathsInZone = selectedPaths.filter(p => zone.paths.includes(p)).length;
                  return (
                    <div key={zone.id} className="cc-zone-card">
                      <label className="cc-zone-row">
                        <input type="checkbox" checked={isZoneSelected} onChange={() => toggleZone(zone.id)} className="cc-zone-checkbox" />
                        <span className="cc-zone-label">{zone.name}</span>
                        {isZoneSelected && <CheckCircle2 className="cc-zone-check" />}
                        {selectedPathsInZone > 0 && !isZoneSelected && <span className="cc-path-count">{selectedPathsInZone} path{selectedPathsInZone > 1 ? 's' : ''}</span>}
                      </label>
                      <div className="cc-path-list">
                        {zone.paths.map(path => (
                          <label key={path} className="cc-path-row">
                            <input type="checkbox" checked={selectedPaths.includes(path) || isZoneSelected} onChange={() => !isZoneSelected && togglePath(path)} disabled={isZoneSelected} className="cc-path-checkbox" />
                            <span className="cc-path-label">{path}</span>
                            {(selectedPaths.includes(path) || isZoneSelected) && <CheckCircle2 className="cc-path-check" />}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
              <button onClick={clearSelections} className="cc-button-clear-selections">Clear Selections</button>

              {(selectedZones.length > 0 || selectedPaths.length > 0) && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-sm font-semibold text-yellow-700 mb-2">Summary:</p>
                  {selectedZones.length > 0 && <p className="text-xs text-yellow-600">• Zones: {selectedZones.map(z => zones.find(zone => zone.id === z).name).join(', ')}</p>}
                  {selectedPaths.length > 0 && <p className="text-xs text-yellow-600">• Individual Paths: {selectedPaths.length}</p>}
                </div>
              )}
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
            <div className="cc-message-header"><span className="cc-live-dot cc-live-dot--warn" /> <h3>Warning Message:</h3></div>
            <div className="cc-alert-preview cc-alert-preview--warn"><p>{warningType.toUpperCase()} - {selectedZones.length + selectedPaths.length > 0 ? `Affecting ${selectedZones.length} zone${selectedZones.length !== 1 ? 's' : ''} and ${selectedPaths.length} path${selectedPaths.length !== 1 ? 's' : ''}` : 'No areas selected'}</p></div>
            <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder="Enter warning message details..." rows={12} className="cc-textarea" />
            <p className="cc-char-count">{message.length}/1000 characters</p>
            <div className="cc-send-grid">
              <button onClick={clearMessage} className="cc-clear-text">Clear Text</button>
              <button onClick={handleSend} disabled={sending || !message.trim() || (selectedZones.length === 0 && selectedPaths.length === 0)} className="cc-send-btn">
                {sending ? <div className="cc-spinner" /> : <><Send /><span>Send message</span></>}
              </button>
            </div>
            {selectedZones.length === 0 && selectedPaths.length === 0 && <p className="cc-warning-note">Please select at least one zone or path to send the warning</p>}
          </div>
        </div>

        {showSuccess && <div className="cc-toast cc-toast--success"><CheckCircle2 /><span>Warning sent successfully!</span></div>}
      </div>
    </div>
  );
}
