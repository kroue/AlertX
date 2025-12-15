import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, Filter, ArrowLeft } from 'lucide-react';
import firebaseConfig from './firebase-config';
import './residents.css';

// Cache residents data with timestamp
let residentsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export default function Residents() {
  const navigate = useNavigate();
  const [residents, setResidents] = useState([]);
  const [filteredResidents, setFilteredResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedZone, setSelectedZone] = useState('all');

  useEffect(() => {
    // Use cache if available and not expired
    const now = Date.now();
    if (residentsCache && cacheTimestamp && (now - cacheTimestamp) < CACHE_DURATION) {
      setResidents(residentsCache);
      setFilteredResidents(residentsCache);
      setLoading(false);
    } else {
      fetchResidents();
    }
  }, []);

  useEffect(() => {
    filterResidents();
  }, [searchTerm, selectedZone, residents]);

  const fetchResidents = async () => {
    try {
      setLoading(true);
      const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
      const url = `${base}/mobileUsers?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url);
      
      if (res.ok) {
        const data = await res.json();
        if (data.documents) {
          const residentsList = data.documents.map((doc) => {
            const fields = doc.fields || {};
            const firstName = fields.firstName?.stringValue || '';
            const lastName = fields.lastName?.stringValue || '';
            const fullName = `${firstName} ${lastName}`.trim() || fields.username?.stringValue || 'Unknown';
            
            // Extract zone number from "Zone X" format
            const zoneValue = fields.zone?.stringValue || fields.zone?.integerValue || 'N/A';
            const zoneNumber = typeof zoneValue === 'string' ? zoneValue.replace(/[^0-9]/g, '') : zoneValue;
            
            return {
              id: doc.name.split('/').pop(),
              name: fullName,
              username: fields.username?.stringValue || '',
              email: fields.email?.stringValue || '',
              zone: zoneNumber || 'N/A',
              phoneNumber: fields.contactNumber?.stringValue || '',
              emergencyContact: fields.emergencyContact?.stringValue || '',
              address: fields.address?.stringValue || '',
              createdAt: fields.createdAt?.timestampValue || new Date().toISOString(),
            };
          });
          setResidents(residentsList);
          setFilteredResidents(residentsList);
          // Cache the data
          residentsCache = residentsList;
          cacheTimestamp = Date.now();
        }
      }
    } catch (error) {
      console.error('Error fetching residents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterResidents = () => {
    let filtered = [...residents];

    // Filter by zone
    if (selectedZone !== 'all') {
      filtered = filtered.filter(resident => 
        String(resident.zone) === String(selectedZone)
      );
    }

    // Filter by search term
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(resident =>
        resident.name.toLowerCase().includes(term) ||
        resident.email.toLowerCase().includes(term) ||
        resident.username.toLowerCase().includes(term) ||
        (resident.address && resident.address.toLowerCase().includes(term)) ||
        (resident.phoneNumber && resident.phoneNumber.includes(term))
      );
    }

    setFilteredResidents(filtered);
  };

  return (
    <div className="residents-background">
      <header className="residents-header">
        <div className="residents-header-inner">
          <button className="back-btn" onClick={() => navigate('/controlcenter')}>
            <ArrowLeft size={20} />
          </button>
          <div className="residents-logo-box">
            <Users className="residents-logo-icon" />
          </div>
          <div>
            <h1 className="residents-title">Residents</h1>
            <p className="residents-sub">Manage registered residents</p>
          </div>
        </div>
      </header>

      <main className="residents-main">
        {/* Filters Section */}
        <div className="residents-filters">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, username, email, phone, or address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="zone-filters">
            <Filter size={18} />
            <button
              className={`zone-btn ${selectedZone === 'all' ? 'active' : ''}`}
              onClick={() => setSelectedZone('all')}
            >
              All Zones
            </button>
            {[1, 2, 3, 4].map((zone) => (
              <button
                key={zone}
                className={`zone-btn ${selectedZone === String(zone) ? 'active' : ''}`}
                onClick={() => setSelectedZone(String(zone))}
              >
                Zone {zone}
              </button>
            ))}
          </div>
        </div>

        {/* Results Summary */}
        <div className="results-summary">
          <p>
            Showing <strong>{filteredResidents.length}</strong> of <strong>{residents.length}</strong> residents
            {selectedZone !== 'all' && ` in Zone ${selectedZone}`}
            {searchTerm && ` matching "${searchTerm}"`}
          </p>
        </div>

        {/* Residents List */}
        {loading ? (
          <div className="loading-container">
            <div className="spinner"></div>
            <p>Loading residents...</p>
          </div>
        ) : filteredResidents.length === 0 ? (
          <div className="empty-state">
            <Users size={48} color="#9CA3AF" />
            <h3>No residents found</h3>
            <p>
              {searchTerm || selectedZone !== 'all'
                ? 'Try adjusting your filters or search term'
                : 'No residents have registered yet'}
            </p>
          </div>
        ) : (
          <div className="residents-grid">
            {filteredResidents.map((resident) => (
              <div key={resident.id} className="resident-card">
                <div className="resident-header">
                  <div className="resident-avatar">
                    {resident.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="resident-info">
                    <h3 className="resident-name">{resident.name}</h3>
                    <span className={`zone-badge zone-${resident.zone}`}>
                      Zone {resident.zone}
                    </span>
                  </div>
                </div>
                <div className="resident-details">
                  <div className="detail-row">
                    <span className="detail-label">Username:</span>
                    <span className="detail-value">{resident.username || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{resident.email || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">{resident.phoneNumber || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Emergency:</span>
                    <span className="detail-value">{resident.emergencyContact || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">{resident.address || 'N/A'}</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Registered:</span>
                    <span className="detail-value">
                      {new Date(resident.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
