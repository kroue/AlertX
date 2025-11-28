import React, { useState } from 'react';
import { AlertTriangle, Bell, Send, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './controlcenter.css';

export default function ControlCenter() {
  const navigate = useNavigate();
  const [showEmergencyModal, setShowEmergencyModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [emergencyMessage, setEmergencyMessage] = useState('');
  const [warningMessage, setWarningMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [notification, setNotification] = useState(null);

  const showNotification = (type, message) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
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
