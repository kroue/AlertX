import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bell, Send, AlertCircle, CheckCircle2, X, FileText, History, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from './firebase-config';
import firebaseConfig from './firebase-config';
import './controlcenter.css';

export default function ControlCenter() {
  const navigate = useNavigate();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showReportsModal, setShowReportsModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyTab, setHistoryTab] = useState('alerts'); // 'alerts' or 'warnings'
  const [reportsTab, setReportsTab] = useState('all'); // 'all', 'urgent', or 'normal'
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);
  const [reports, setReports] = useState([]);
  const [reportCount, setReportCount] = useState(0);
  const [alerts, setAlerts] = useState([]);
  const [warnings, setWarnings] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchReports();
    fetchHistory();
    const interval = setInterval(() => {
      fetchReports();
      fetchHistory();
    }, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchReports = async () => {
    try {
      const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
      const url = `${base}/incidents?key=${firebaseConfig.apiKey}`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        const incidentDocs = data.documents || [];
        const parsed = incidentDocs.map(doc => {
          const fields = doc.fields || {};
          return {
            id: doc.name.split('/').pop(),
            incidentType: fields.incidentType?.stringValue || '',
            description: fields.description?.stringValue || '',
            locationText: fields.locationText?.stringValue || '',
            urgent: fields.urgent?.booleanValue || false,
            reporter: fields.reporter?.stringValue || 'Unknown',
            createdAt: fields.createdAt?.timestampValue || '',
            zone: fields.zone?.integerValue || null,
            latitude: fields.latitude?.doubleValue || null,
            longitude: fields.longitude?.doubleValue || null,
            photoUrl: fields.photoUrl?.stringValue || null,
            mapImageUrl: fields.mapImageUrl?.stringValue || null,
            is_read: fields.is_read?.booleanValue || false,
          };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        setReports(parsed);
        const unreadCount = parsed.filter(r => !r.is_read).length;
        setReportCount(unreadCount);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
    }
  };

  const markReportAsRead = async (reportId) => {
    try {
      // Get the current user's ID token for authentication
      const user = auth.currentUser;
      if (!user) {
        console.error('No authenticated user');
        return;
      }
      
      const idToken = await user.getIdToken();
      const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
      const docUrl = `${base}/incidents/${reportId}?key=${firebaseConfig.apiKey}`;
      
      const updatePayload = {
        fields: {
          is_read: { booleanValue: true }
        }
      };
      
      const res = await fetch(docUrl + '&updateMask.fieldPaths=is_read', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify(updatePayload)
      });
      
      if (res.ok) {
        // Update local state
        setReports(prevReports => {
          const updated = prevReports.map(r => 
            r.id === reportId ? { ...r, is_read: true } : r
          );
          const unreadCount = updated.filter(r => !r.is_read).length;
          setReportCount(unreadCount);
          return updated;
        });
      } else {
        console.error('Failed to mark report as read:', await res.text());
      }
    } catch (error) {
      console.error('Error marking report as read:', error);
    }
  };

  const fetchHistory = async () => {
    try {
      const base = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/(default)/documents`;
      
      // Fetch alerts
      const alertsUrl = `${base}/alerts?key=${firebaseConfig.apiKey}`;
      console.log('Fetching alerts from:', alertsUrl);
      const alertsRes = await fetch(alertsUrl);
      console.log('Alerts response status:', alertsRes.status);
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        console.log('Alerts data:', data);
        const alertDocs = data.documents || [];
        console.log('Alert documents count:', alertDocs.length);
        const parsed = alertDocs.map(doc => {
          const fields = doc.fields || {};
          console.log('Parsing alert doc:', doc.name, fields);
          return {
            id: doc.name.split('/').pop(),
            type: fields.type?.stringValue || 'emergency',
            message: fields.message?.stringValue || '',
            zones: fields.zones?.arrayValue?.values?.map(v => v.integerValue || v.stringValue) || [],
            createdAt: fields.createdAt?.timestampValue || '',
            sentBy: fields.sentBy?.stringValue || 'System',
            mapImageUrl: fields.mapImageUrl?.stringValue || null,
          };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('Parsed alerts:', parsed);
        setAlerts(parsed);
      } else {
        console.error('Failed to fetch alerts:', await alertsRes.text());
      }

      // Fetch warnings
      const warningsUrl = `${base}/warnings?key=${firebaseConfig.apiKey}`;
      console.log('Fetching warnings from:', warningsUrl);
      const warningsRes = await fetch(warningsUrl);
      console.log('Warnings response status:', warningsRes.status);
      if (warningsRes.ok) {
        const data = await warningsRes.json();
        console.log('Warnings data:', data);
        const warningDocs = data.documents || [];
        console.log('Warning documents count:', warningDocs.length);
        const parsed = warningDocs.map(doc => {
          const fields = doc.fields || {};
          console.log('Parsing warning doc:', doc.name, fields);
          return {
            id: doc.name.split('/').pop(),
            type: fields.type?.stringValue || 'warning',
            message: fields.message?.stringValue || '',
            zones: fields.zones?.arrayValue?.values?.map(v => v.integerValue || v.stringValue) || [],
            createdAt: fields.createdAt?.timestampValue || '',
            sentBy: fields.sentBy?.stringValue || 'System',
            mapImageUrl: fields.mapImageUrl?.stringValue || null,
          };
        }).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        console.log('Parsed warnings:', parsed);
        setWarnings(parsed);
      } else {
        console.error('Failed to fetch warnings:', await warningsRes.text());
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  // logout: clear storage and route to login
  const handleLogout = async () => {
    try { localStorage.clear(); sessionStorage.clear(); } catch (e) {}
    try {
      // Sign out from Firebase so auth.currentUser becomes null and rules
      // will block writes until the user signs back in.
      await signOut(auth);
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Sign-out failed', e);
    }
    // navigate back to the login route (Login is mounted at `/`)
    navigate('/');
  };

  const handleSendEmergency = () => {
    if (!emergencyMessage.trim()) {
      showNotification('error', 'Please enter an emergency message');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setShowEmergencyModal(false);
      setEmergencyMessage('');
      showNotification('success', 'Emergency alert sent successfully!');
    }, 1500);
  };

  const handleSendWarning = () => {
    if (!warningMessage.trim()) {
      showNotification('error', 'Please enter a warning message');
      return;
    }
    setSending(true);
    setTimeout(() => {
      setSending(false);
      setShowWarningModal(false);
      setWarningMessage('');
      showNotification('success', 'Warning sent successfully!');
    }, 1500);
  };

  return (
    <div className="cc-background">
      <header className="cc-header">
        <div className="cc-header-inner">
          <div className="cc-logo-box"><Bell className="cc-logo-icon" /></div>
          <div>
            <h1 className="cc-title">AlertX Control Center</h1>
            <p className="cc-sub">Emergency notification system</p>
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <button className="cc-btn" onClick={() => navigate('/residents')}>
              <Users size={16} style={{ marginRight: '6px' }} />
              Residents
            </button>
            <button className="cc-btn" onClick={() => setShowHistoryModal(true)}>
              <History size={16} style={{ marginRight: '6px' }} />
              History
            </button>
            <button className="cc-btn" onClick={() => {
              setShowReportsModal(true);
              setReportCount(0);
            }} style={{ position: 'relative' }}>
              <FileText size={16} style={{ marginRight: '6px' }} />
              Reports
              {reportCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-8px',
                  right: '-8px',
                  backgroundColor: '#ef4444',
                  color: 'white',
                  borderRadius: '12px',
                  padding: '2px 8px',
                  fontSize: '12px',
                  fontWeight: '700'
                }}>
                  {reportCount}
                </span>
              )}
            </button>
            <button className="cc-btn" onClick={handleLogout}>Logout</button>
          </div>
        </div>
      </header>

      <main className="cc-main">
        <div className="cc-grid">
          <section className="cc-card cc-card--danger">
            <div className="cc-card-inner">
              <div className="cc-card-top">
                <div className="cc-card-icon cc-card-icon--danger"><AlertTriangle /></div>
                <div>
                  <h2 className="cc-card-title">Send An Alert</h2>
                  <p className="cc-card-sub">(Emergency Alert)</p>
                </div>
              </div>

              <p className="cc-paragraph">Trigger an urgent emergency alert that will be sent immediately to all registered recipients. Use only for critical situations.</p>

              <ul className="cc-list">
                <li>High priority notification</li>
                <li>Instant delivery to all contacts</li>
                <li>Sound and visual alert enabled</li>
              </ul>

              <button className="cc-cta cc-cta--danger" onClick={() => navigate('/emergency')}>
                <AlertTriangle className="cc-cta-icon" /> Urgent Alert ONLY
              </button>
            </div>
          </section>

          <section className="cc-card cc-card--warn">
            <div className="cc-card-inner">
              <div className="cc-card-top">
                <div className="cc-card-icon cc-card-icon--warn"><AlertCircle /></div>
                <div>
                  <h2 className="cc-card-title">Send a Warning</h2>
                  <p className="cc-card-sub">(System Notification)</p>
                </div>
              </div>

              <p className="cc-paragraph">Send a general warning or informational message to the system. Appropriate for non-critical updates and advisories.</p>

              <ul className="cc-list">
                <li>Standard priority notification</li>
                <li>Scheduled delivery option</li>
                <li>Silent notification mode</li>
              </ul>

              <button className="cc-cta cc-cta--warn" onClick={() => navigate('/warning')}>
                <Send className="cc-cta-icon" /> WARNING System
              </button>
            </div>
          </section>
        </div>

        <section className="cc-info">
          <div className="cc-info-inner">
            <div className="cc-info-icon"><AlertCircle /></div>
            <div>
              <h3>Important Guidelines</h3>
              <ul className="cc-guidelines">
                <li>Emergency alerts should only be used for life-threatening situations or critical emergencies</li>
                <li>Warning notifications are suitable for weather updates, system maintenance, or general advisories</li>
                <li>All messages are logged and timestamped for accountability and record-keeping</li>
                <li>Ensure your message is clear, concise, and provides actionable information</li>
              </ul>
            </div>
          </div>
        </section>
      </main>

      {/* Emergency Modal */}
      {showEmergencyModal && (
        <div className="cc-modal-overlay">
          <div className="cc-modal">
            <button className="cc-modal-close" onClick={() => setShowEmergencyModal(false)}><X /></button>
            <div className="cc-modal-top"><div className="cc-modal-icon"><AlertTriangle /></div>
              <div>
                <h3>Emergency Alert</h3>
                <p className="cc-text-danger">This is a critical notification</p>
              </div>
            </div>

            <label className="cc-label">Emergency Message</label>
            <textarea className="cc-textarea" rows={5} value={emergencyMessage} onChange={(e) => setEmergencyMessage(e.target.value)} placeholder="Enter your emergency message here..." />
            <p className="cc-char-count">{emergencyMessage.length}/500 characters</p>

            <div className="cc-modal-actions">
              <button className="cc-btn">Cancel</button>
              <button className="cc-btn cc-btn--danger" onClick={handleSendEmergency} disabled={sending}>{sending ? 'Sending...' : 'Send Alert'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Warning Modal */}
      {showWarningModal && (
        <div className="cc-modal-overlay">
          <div className="cc-modal">
            <button className="cc-modal-close" onClick={() => setShowWarningModal(false)}><X /></button>
            <div className="cc-modal-top"><div className="cc-modal-icon cc-modal-icon--warn"><AlertCircle /></div>
              <div>
                <h3>Send Warning</h3>
                <p className="cc-text-warn">System notification</p>
              </div>
            </div>

            <label className="cc-label">Warning Message</label>
            <textarea className="cc-textarea" rows={5} value={warningMessage} onChange={(e) => setWarningMessage(e.target.value)} placeholder="Enter your warning message here..." />
            <p className="cc-char-count">{warningMessage.length}/500 characters</p>

            <div className="cc-modal-actions">
              <button className="cc-btn">Cancel</button>
              <button className="cc-btn cc-btn--warn" onClick={handleSendWarning} disabled={sending}>{sending ? 'Sending...' : 'Send Warning'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Reports Modal */}
      {showReportsModal && (
        <div className="cc-modal-overlay" onClick={() => !selectedReport && setShowReportsModal(false)}>
          <div className="cc-modal" style={{ maxWidth: selectedReport ? '900px' : '800px' }} onClick={(e) => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => {
              setSelectedReport(null);
              setShowReportsModal(false);
            }}><X /></button>
            
            {!selectedReport ? (
              <>
                <div className="cc-modal-top">
                  <div className="cc-modal-icon"><FileText /></div>
                  <div>
                    <h3>Incident Reports</h3>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>User-submitted incident reports</p>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderBottom: '2px solid #E5E7EB' }}>
                  <button
                    onClick={() => setReportsTab('all')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: reportsTab === 'all' ? '#06b6d4' : '#6B7280',
                      borderBottom: reportsTab === 'all' ? '2px solid #06b6d4' : 'none',
                      marginBottom: '-2px'
                    }}
                  >
                    All ({reports.length})
                  </button>
                  <button
                    onClick={() => setReportsTab('urgent')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: reportsTab === 'urgent' ? '#ef4444' : '#6B7280',
                      borderBottom: reportsTab === 'urgent' ? '2px solid #ef4444' : 'none',
                      marginBottom: '-2px'
                    }}
                  >
                    <AlertTriangle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Urgent ({reports.filter(r => r.urgent).length})
                  </button>
                  <button
                    onClick={() => setReportsTab('normal')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: reportsTab === 'normal' ? '#06b6d4' : '#6B7280',
                      borderBottom: reportsTab === 'normal' ? '2px solid #06b6d4' : 'none',
                      marginBottom: '-2px'
                    }}
                  >
                    Normal ({reports.filter(r => !r.urgent).length})
                  </button>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '20px' }}>
                  {reports.filter(report => {
                    if (reportsTab === 'urgent') return report.urgent;
                    if (reportsTab === 'normal') return !report.urgent;
                    return true;
                  }).length === 0 ? (
                    <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>
                      No {reportsTab === 'urgent' ? 'urgent' : reportsTab === 'normal' ? 'normal' : ''} reports available
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {reports.filter(report => {
                        if (reportsTab === 'urgent') return report.urgent;
                        if (reportsTab === 'normal') return !report.urgent;
                        return true;
                      }).map((report) => (
                        <div 
                          key={report.id}
                          style={{
                            border: '1px solid #E5E7EB',
                            borderRadius: '12px',
                            padding: '16px',
                            cursor: 'pointer',
                            transition: 'all 0.2s',
                            backgroundColor: report.urgent ? '#FEF2F2' : '#fff',
                            opacity: report.is_read ? 0.6 : 1,
                            position: 'relative'
                          }}
                          onClick={() => {
                            setSelectedReport(report);
                            if (!report.is_read) {
                              markReportAsRead(report.id);
                            }
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.borderColor = '#06b6d4'}
                          onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}
                        >
                          {!report.is_read && (
                            <div style={{
                              position: 'absolute',
                              top: '16px',
                              right: '16px',
                              width: '10px',
                              height: '10px',
                              backgroundColor: '#06b6d4',
                              borderRadius: '50%'
                            }} />
                          )}
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                            <div>
                              <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#111827', marginBottom: '4px' }}>
                                {report.incidentType}
                                {report.urgent && (
                                  <span style={{
                                    marginLeft: '8px',
                                    backgroundColor: '#ef4444',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>URGENT</span>
                                )}
                                {!report.is_read && (
                                  <span style={{
                                    marginLeft: '8px',
                                    backgroundColor: '#06b6d4',
                                    color: 'white',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    fontSize: '11px',
                                    fontWeight: '700'
                                  }}>NEW</span>
                                )}
                              </h4>
                              <p style={{ fontSize: '14px', color: '#6B7280' }}>{report.locationText}</p>
                            </div>
                            <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                              {new Date(report.createdAt).toLocaleString()}
                            </span>
                          </div>
                          <p style={{ fontSize: '14px', color: '#374151', marginBottom: '8px' }}>
                            {report.description.length > 100 ? report.description.substring(0, 100) + '...' : report.description}
                          </p>
                          <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#6B7280' }}>
                            <span>Reporter: {report.reporter}</span>
                            {report.zone && <span>• Zone {report.zone}</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="cc-modal-top">
                  <button 
                    onClick={() => setSelectedReport(null)}
                    style={{ 
                      marginRight: '12px',
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <div className="cc-modal-icon"><FileText /></div>
                  <div>
                    <h3>{selectedReport.incidentType}</h3>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>
                      Reported by {selectedReport.reporter} • {new Date(selectedReport.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '20px' }}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Details */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Description</h4>
                      <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{selectedReport.description}</p>
                    </div>

                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Location</h4>
                      <p style={{ fontSize: '14px', color: '#374151' }}>{selectedReport.locationText}</p>
                      {selectedReport.zone && (
                        <span style={{
                          display: 'inline-block',
                          marginTop: '8px',
                          backgroundColor: '#06b6d4',
                          color: 'white',
                          padding: '4px 12px',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: '700'
                        }}>
                          Zone {selectedReport.zone}
                        </span>
                      )}
                      {selectedReport.latitude && selectedReport.longitude && (
                        <p style={{ fontSize: '12px', color: '#6B7280', marginTop: '4px' }}>
                          Coordinates: {selectedReport.latitude.toFixed(5)}, {selectedReport.longitude.toFixed(5)}
                        </p>
                      )}
                    </div>

                    {/* Map Image */}
                    {selectedReport.mapImageUrl && (
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Location Map</h4>
                        <img 
                          src={selectedReport.mapImageUrl} 
                          alt="Location map"
                          style={{
                            width: '100%',
                            maxHeight: '300px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                      </div>
                    )}

                    {/* Photo */}
                    {selectedReport.photoUrl && (
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Incident Photo</h4>
                        <img 
                          src={selectedReport.photoUrl} 
                          alt="Incident"
                          style={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                      </div>
                    )}

                    {/* Status */}
                    <div style={{
                      padding: '12px',
                      backgroundColor: selectedReport.urgent ? '#FEF2F2' : '#F9FAFB',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedReport.urgent ? '#FECACA' : '#E5E7EB'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedReport.urgent ? (
                          <>
                            <AlertTriangle size={18} color="#ef4444" />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>URGENT REPORT</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} color="#6B7280" />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#374151' }}>Standard Report</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="cc-modal-overlay" onClick={() => !selectedHistoryItem && setShowHistoryModal(false)}>
          <div className="cc-modal" style={{ maxWidth: selectedHistoryItem ? '900px' : '800px' }} onClick={(e) => e.stopPropagation()}>
            <button className="cc-modal-close" onClick={() => {
              setSelectedHistoryItem(null);
              setShowHistoryModal(false);
            }}><X /></button>
            
            {!selectedHistoryItem ? (
              <>
                <div className="cc-modal-top">
                  <div className="cc-modal-icon"><History /></div>
                  <div>
                    <h3>Alert & Warning History</h3>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>View sent alerts and warnings</p>
                  </div>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '12px', marginTop: '20px', borderBottom: '2px solid #E5E7EB' }}>
                  <button
                    onClick={() => setHistoryTab('alerts')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: historyTab === 'alerts' ? '#ef4444' : '#6B7280',
                      borderBottom: historyTab === 'alerts' ? '2px solid #ef4444' : 'none',
                      marginBottom: '-2px'
                    }}
                  >
                    <AlertTriangle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Alerts ({alerts.length})
                  </button>
                  <button
                    onClick={() => setHistoryTab('warnings')}
                    style={{
                      padding: '12px 24px',
                      border: 'none',
                      background: 'none',
                      cursor: 'pointer',
                      fontWeight: '700',
                      fontSize: '14px',
                      color: historyTab === 'warnings' ? '#f59e0b' : '#6B7280',
                      borderBottom: historyTab === 'warnings' ? '2px solid #f59e0b' : 'none',
                      marginBottom: '-2px'
                    }}
                  >
                    <AlertCircle size={16} style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                    Warnings ({warnings.length})
                  </button>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '20px' }}>
                  {historyTab === 'alerts' ? (
                    alerts.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>No alerts sent yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {alerts.map((alert) => (
                          <div 
                            key={alert.id}
                            style={{
                              border: '1px solid #FECACA',
                              borderRadius: '12px',
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: '#FEF2F2'
                            }}
                            onClick={() => setSelectedHistoryItem(alert)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#ef4444'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FECACA'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle size={20} color="#ef4444" />
                                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#991B1B' }}>
                                  Emergency Alert
                                </h4>
                              </div>
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                {new Date(alert.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#991B1B', marginBottom: '8px' }}>
                              {alert.message.length > 100 ? alert.message.substring(0, 100) + '...' : alert.message}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#991B1B' }}>
                              <span>Sent by: {alert.sentBy}</span>
                              {alert.zones.length > 0 && <span>• Zones: {alert.zones.join(', ')}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    warnings.length === 0 ? (
                      <p style={{ textAlign: 'center', color: '#6B7280', padding: '40px' }}>No warnings sent yet</p>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {warnings.map((warning) => (
                          <div 
                            key={warning.id}
                            style={{
                              border: '1px solid #FED7AA',
                              borderRadius: '12px',
                              padding: '16px',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                              backgroundColor: '#FFFBEB'
                            }}
                            onClick={() => setSelectedHistoryItem(warning)}
                            onMouseEnter={(e) => e.currentTarget.style.borderColor = '#f59e0b'}
                            onMouseLeave={(e) => e.currentTarget.style.borderColor = '#FED7AA'}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '8px' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertCircle size={20} color="#f59e0b" />
                                <h4 style={{ fontSize: '16px', fontWeight: '700', color: '#92400E' }}>
                                  Warning
                                </h4>
                              </div>
                              <span style={{ fontSize: '12px', color: '#9CA3AF' }}>
                                {new Date(warning.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p style={{ fontSize: '14px', color: '#92400E', marginBottom: '8px' }}>
                              {warning.message.length > 100 ? warning.message.substring(0, 100) + '...' : warning.message}
                            </p>
                            <div style={{ display: 'flex', gap: '8px', fontSize: '12px', color: '#92400E' }}>
                              <span>Sent by: {warning.sentBy}</span>
                              {warning.zones.length > 0 && <span>• Zones: {warning.zones.join(', ')}</span>}
                            </div>
                          </div>
                        ))}
                      </div>
                    )
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="cc-modal-top">
                  <button 
                    onClick={() => setSelectedHistoryItem(null)}
                    style={{ 
                      marginRight: '12px',
                      padding: '8px',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    ← Back
                  </button>
                  <div className="cc-modal-icon">
                    {selectedHistoryItem.type === 'emergency' ? <AlertTriangle /> : <AlertCircle />}
                  </div>
                  <div>
                    <h3>{selectedHistoryItem.type === 'emergency' ? 'Emergency Alert' : 'Warning'}</h3>
                    <p style={{ color: '#6B7280', fontSize: '14px' }}>
                      Sent by {selectedHistoryItem.sentBy} • {new Date(selectedHistoryItem.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>

                <div style={{ maxHeight: '500px', overflowY: 'auto', marginTop: '20px' }}>
                  <div style={{ display: 'grid', gap: '20px' }}>
                    {/* Message */}
                    <div>
                      <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Message</h4>
                      <p style={{ fontSize: '14px', color: '#374151', lineHeight: '1.6' }}>{selectedHistoryItem.message}</p>
                    </div>

                    {/* Zones */}
                    {selectedHistoryItem.zones.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Affected Zones</h4>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {selectedHistoryItem.zones.map((zone, idx) => (
                            <span key={idx} style={{
                              backgroundColor: '#06b6d4',
                              color: 'white',
                              padding: '4px 12px',
                              borderRadius: '12px',
                              fontSize: '12px',
                              fontWeight: '700'
                            }}>
                              {zone}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Map Image */}
                    {selectedHistoryItem.mapImageUrl && (
                      <div>
                        <h4 style={{ fontSize: '14px', fontWeight: '700', color: '#111827', marginBottom: '8px' }}>Coverage Map</h4>
                        <img 
                          src={selectedHistoryItem.mapImageUrl} 
                          alt="Coverage map"
                          style={{
                            width: '100%',
                            maxHeight: '400px',
                            objectFit: 'contain',
                            borderRadius: '8px',
                            border: '1px solid #E5E7EB'
                          }}
                        />
                      </div>
                    )}

                    {/* Type Badge */}
                    <div style={{
                      padding: '12px',
                      backgroundColor: selectedHistoryItem.type === 'emergency' ? '#FEF2F2' : '#FFFBEB',
                      borderRadius: '8px',
                      border: '1px solid',
                      borderColor: selectedHistoryItem.type === 'emergency' ? '#FECACA' : '#FED7AA'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {selectedHistoryItem.type === 'emergency' ? (
                          <>
                            <AlertTriangle size={18} color="#ef4444" />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#991B1B' }}>EMERGENCY ALERT</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle size={18} color="#f59e0b" />
                            <span style={{ fontSize: '14px', fontWeight: '700', color: '#92400E' }}>WARNING NOTIFICATION</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Notification Toast */}
      {notification && (
        <div className={`cc-toast ${notification.type === 'success' ? 'cc-toast--success' : 'cc-toast--error'}`}>
          {notification.type === 'success' ? <CheckCircle2 /> : <AlertCircle />}
          <span>{notification.message}</span>
        </div>
      )}

    </div>
  );
}
