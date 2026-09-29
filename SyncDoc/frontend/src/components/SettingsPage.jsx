import React, { useState, useEffect } from 'react';
import { updateProfile, changePassword } from '../api/authApi.js';

const SETTINGS_SECTIONS = [
  { id: 'profile', icon: '👤', label: 'Profile' },
  { id: 'account', icon: '🔐', label: 'Account' },
  { id: 'appearance', icon: '🎨', label: 'Appearance' },
  { id: 'notifications', icon: '🔔', label: 'Notifications' },
  { id: 'privacy', icon: '🛡', label: 'Privacy & Security' },
  { id: 'language', icon: '🌐', label: 'Language & Region' },
  { id: 'preferences', icon: '⚙', label: 'Preferences' },
  { id: 'help', icon: '❓', label: 'Help & Support' },
  { id: 'about', icon: 'ℹ', label: 'About' },
];

export default function SettingsPage({ user, token, onUpdateUser, onLogout, onBackToWorkspace }) {
  const [activeSection, setActiveSection] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Clear messages when switching sections
  useEffect(() => {
    setMessage({ text: '', type: '' });
  }, [activeSection]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  // 1. Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    username: user?.username || '',
    phone: user?.phone || '',
  });

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await updateProfile({
        name: profileData.name,
        phone: profileData.phone,
        username: profileData.username,
      }, token);
      
      onUpdateUser(res.data);
      setIsEditingProfile(false);
      showMessage('Profile updated successfully.');
    } catch (err) {
      showMessage(err.message || 'Failed to update profile', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 2. Account State (Password)
  const [pwdData, setPwdData] = useState({ current: '', new: '', confirm: '' });
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (pwdData.new !== pwdData.confirm) {
      showMessage('New passwords do not match.', 'error');
      return;
    }
    try {
      setLoading(true);
      await changePassword(pwdData.current, pwdData.new, token);
      showMessage('Password updated successfully.');
      setPwdData({ current: '', new: '', confirm: '' });
    } catch (err) {
      showMessage(err.message || 'Failed to update password', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 3. Appearance State
  const [theme, setTheme] = useState(() => localStorage.getItem('syncdoc_theme') || 'light');
  const [fontSize, setFontSize] = useState(() => localStorage.getItem('syncdoc_fontsize') || 'medium');

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    localStorage.setItem('syncdoc_theme', newTheme);
    if (newTheme === 'dark') {
      document.documentElement.setAttribute('data-theme-mode', 'dark');
    } else if (newTheme === 'light') {
      document.documentElement.removeAttribute('data-theme-mode');
    } else {
      // system
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        document.documentElement.setAttribute('data-theme-mode', 'dark');
      } else {
        document.documentElement.removeAttribute('data-theme-mode');
      }
    }
  };

  // 4. Notifications State
  const [notifs, setNotifs] = useState({ email: true, push: false, alerts: true, marketing: false });

  // 8. Help State
  const [faqExpanded, setFaqExpanded] = useState(null);

  return (
    <div className="settings-page-layout">
      {/* Settings Navigation Sidebar */}
      <aside className="settings-sidebar">
        <div className="settings-sidebar-header">
          <button className="btn-back-workspace" onClick={onBackToWorkspace}>
            ← Workspace
          </button>
          <h2>Settings</h2>
        </div>
        
        <nav className="settings-nav">
          {SETTINGS_SECTIONS.map(sec => (
            <button
              key={sec.id}
              className={`settings-nav-item ${activeSection === sec.id ? 'active' : ''}`}
              onClick={() => setActiveSection(sec.id)}
            >
              <span className="settings-nav-icon">{sec.icon}</span>
              <span>{sec.label}</span>
            </button>
          ))}
          
          <div className="settings-nav-divider"></div>
          
          <button className="settings-nav-item logout-item" onClick={onLogout}>
            <span className="settings-nav-icon">🚪</span>
            <span>Logout</span>
          </button>
        </nav>
      </aside>

      {/* Settings Content Area */}
      <main className="settings-main">
        <div className="settings-content-wrapper">
          <header className="settings-header">
            <h1>{SETTINGS_SECTIONS.find(s => s.id === activeSection)?.label}</h1>
            <div className="settings-profile-badge">
              <span>{user?.name || 'User'}</span>
            </div>
          </header>

          {message.text && (
            <div className={`settings-alert settings-alert-${message.type}`}>
              {message.text}
            </div>
          )}

          <div className="settings-scroll-area">
            
            {/* 1. PROFILE SETTINGS */}
            {activeSection === 'profile' && (
              <div className="settings-section">
                <div className="settings-card profile-card">
                  <div className="profile-photo-section">
                    <div className="profile-photo-preview">
                      {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <button className="btn-secondary" disabled>Change Photo</button>
                    <span className="setting-hint">Local preview only for demo</span>
                  </div>
                  
                  <form onSubmit={handleProfileSave} className="settings-form">
                    <div className="form-group">
                      <label>Name</label>
                      <input 
                        type="text" 
                        value={profileData.name} 
                        onChange={e => setProfileData({...profileData, name: e.target.value})}
                        disabled={!isEditingProfile || loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Username</label>
                      <input 
                        type="text" 
                        value={profileData.username} 
                        onChange={e => setProfileData({...profileData, username: e.target.value})}
                        disabled={!isEditingProfile || loading}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Email</label>
                      <input 
                        type="email" 
                        value={profileData.email} 
                        disabled={true} 
                        title="Email cannot be changed"
                      />
                    </div>
                    
                    <div className="form-group">
                      <label>Phone Number</label>
                      <input 
                        type="tel" 
                        value={profileData.phone} 
                        onChange={e => setProfileData({...profileData, phone: e.target.value})}
                        disabled={!isEditingProfile || loading}
                        placeholder="Not provided"
                      />
                    </div>
                    
                    <div className="settings-actions">
                      {isEditingProfile ? (
                        <>
                          <button type="button" className="btn-secondary" onClick={() => {
                            setIsEditingProfile(false);
                            setProfileData({
                              name: user?.name || '',
                              email: user?.email || '',
                              username: user?.username || '',
                              phone: user?.phone || '',
                            });
                          }}>Cancel</button>
                          <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Saving...' : 'Save Changes'}
                          </button>
                        </>
                      ) : (
                        <button type="button" className="btn-primary" onClick={() => setIsEditingProfile(true)}>
                          Edit Profile
                        </button>
                      )}
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* 2. ACCOUNT SETTINGS */}
            {activeSection === 'account' && (
              <div className="settings-section">
                <h3>Change Password</h3>
                <div className="settings-card">
                  <form onSubmit={handlePasswordUpdate} className="settings-form">
                    <div className="form-group">
                      <label>Current Password</label>
                      <input 
                        type="password" 
                        required 
                        value={pwdData.current}
                        onChange={e => setPwdData({...pwdData, current: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>New Password</label>
                      <input 
                        type="password" 
                        required minLength={6}
                        value={pwdData.new}
                        onChange={e => setPwdData({...pwdData, new: e.target.value})}
                      />
                    </div>
                    <div className="form-group">
                      <label>Confirm New Password</label>
                      <input 
                        type="password" 
                        required minLength={6}
                        value={pwdData.confirm}
                        onChange={e => setPwdData({...pwdData, confirm: e.target.value})}
                      />
                    </div>
                    <button type="submit" className="btn-primary" disabled={loading}>Update Password</button>
                  </form>
                </div>

                <h3>Account Information</h3>
                <div className="settings-card info-card">
                  <div className="info-row">
                    <span>Account Status</span>
                    <span className="badge-active">Active</span>
                  </div>
                  <div className="info-row">
                    <span>Member Since</span>
                    <span>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Today'}</span>
                  </div>
                </div>

                <h3>Danger Zone</h3>
                <div className="settings-card danger-card">
                  <p>Once you deactivate your account, there is no going back. Please be certain.</p>
                  <button className="btn-danger" onClick={() => {
                    if (window.confirm("Are you sure you want to deactivate your account? This action cannot be undone.")) {
                      showMessage("Account deactivated (demo simulation).", "error");
                    }
                  }}>Deactivate Account</button>
                </div>
              </div>
            )}

            {/* 3. APPEARANCE */}
            {activeSection === 'appearance' && (
              <div className="settings-section">
                <h3>Theme Options</h3>
                <div className="settings-card">
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="theme" checked={theme === 'light'} onChange={() => handleThemeChange('light')} />
                      <span>Light</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="theme" checked={theme === 'dark'} onChange={() => handleThemeChange('dark')} />
                      <span>Dark</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="theme" checked={theme === 'system'} onChange={() => handleThemeChange('system')} />
                      <span>System</span>
                    </label>
                  </div>
                </div>

                <h3>Font Size</h3>
                <div className="settings-card">
                  <div className="radio-group">
                    <label className="radio-label">
                      <input type="radio" name="fontsize" checked={fontSize === 'small'} onChange={() => setFontSize('small')} />
                      <span>Small</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="fontsize" checked={fontSize === 'medium'} onChange={() => setFontSize('medium')} />
                      <span>Medium</span>
                    </label>
                    <label className="radio-label">
                      <input type="radio" name="fontsize" checked={fontSize === 'large'} onChange={() => setFontSize('large')} />
                      <span>Large</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 4. NOTIFICATIONS */}
            {activeSection === 'notifications' && (
              <div className="settings-section">
                <div className="settings-card">
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Email Notifications</h4>
                      <p>Receive daily summaries and updates.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={notifs.email} onChange={e => setNotifs({...notifs, email: e.target.checked})} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Push Notifications</h4>
                      <p>Get notified instantly when someone shares a doc.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={notifs.push} onChange={e => setNotifs({...notifs, push: e.target.checked})} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Alerts</h4>
                      <p>In-app critical alerts and reminders.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={notifs.alerts} onChange={e => setNotifs({...notifs, alerts: e.target.checked})} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Marketing</h4>
                      <p>Receive offers and SyncDoc news.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" checked={notifs.marketing} onChange={e => setNotifs({...notifs, marketing: e.target.checked})} />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 5. PRIVACY & SECURITY */}
            {activeSection === 'privacy' && (
              <div className="settings-section">
                <h3>Two-Factor Authentication</h3>
                <div className="settings-card">
                  <p className="setting-hint">Add an extra layer of security to your account.</p>
                  <button className="btn-secondary" onClick={() => showMessage('2FA setup requires mobile app confirmation (demo).')}>Enable 2FA</button>
                </div>

                <h3>Active Sessions</h3>
                <div className="settings-card info-card">
                  <div className="session-row">
                    <div className="session-icon">💻</div>
                    <div className="session-details">
                      <strong>Current Session (This device)</strong>
                      <span>Windows • Chrome</span>
                      <span>Active now</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 6. LANGUAGE & REGION */}
            {activeSection === 'language' && (
              <div className="settings-section">
                <div className="settings-card">
                  <div className="form-group">
                    <label>Language</label>
                    <select className="settings-select" defaultValue="en">
                      <option value="en">English (US)</option>
                      <option value="en-gb">English (UK)</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Time Zone</label>
                    <select className="settings-select" defaultValue="ist">
                      <option value="est">Eastern Standard Time (EST)</option>
                      <option value="pst">Pacific Standard Time (PST)</option>
                      <option value="utc">UTC</option>
                      <option value="ist">India Standard Time (IST)</option>
                    </select>
                  </div>
                  
                  <div className="form-group">
                    <label>Date Format</label>
                    <select className="settings-select" defaultValue="ddmm">
                      <option value="ddmm">DD/MM/YYYY</option>
                      <option value="mmdd">MM/DD/YYYY</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* 7. PREFERENCES */}
            {activeSection === 'preferences' && (
              <div className="settings-section">
                <div className="settings-card">
                  <div className="form-group">
                    <label>Default Landing Page</label>
                    <div className="radio-group">
                      <label className="radio-label"><input type="radio" name="landing" defaultChecked /> Workspace</label>
                      <label className="radio-label"><input type="radio" name="landing" /> Recent Documents</label>
                    </div>
                  </div>
                  
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Auto-save Indicator</h4>
                      <p>Show visual feedback when documents save.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                  </div>
                  
                  <div className="toggle-row">
                    <div className="toggle-info">
                      <h4>Confirm Before Deleting</h4>
                      <p>Always ask for confirmation before deleting documents.</p>
                    </div>
                    <label className="switch">
                      <input type="checkbox" defaultChecked />
                      <span className="slider round"></span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* 8. HELP & SUPPORT */}
            {activeSection === 'help' && (
              <div className="settings-section">
                <h3>Frequently Asked Questions</h3>
                <div className="settings-card faq-card">
                  <div className="faq-item">
                    <button className="faq-question" onClick={() => setFaqExpanded(faqExpanded === 1 ? null : 1)}>
                      <span>What is SyncDoc?</span>
                      <span>{faqExpanded === 1 ? '−' : '+'}</span>
                    </button>
                    {faqExpanded === 1 && <div className="faq-answer">SyncDoc is a real-time collaborative document engine using AST blocks and Yjs for synchronization.</div>}
                  </div>
                  <div className="faq-item">
                    <button className="faq-question" onClick={() => setFaqExpanded(faqExpanded === 2 ? null : 2)}>
                      <span>How does real-time collaboration work?</span>
                      <span>{faqExpanded === 2 ? '−' : '+'}</span>
                    </button>
                    {faqExpanded === 2 && <div className="faq-answer">We use WebSockets and CRDTs (Conflict-free Replicated Data Types) via Yjs to merge edits instantly without conflicts.</div>}
                  </div>
                  <div className="faq-item">
                    <button className="faq-question" onClick={() => setFaqExpanded(faqExpanded === 3 ? null : 3)}>
                      <span>How do I export a document?</span>
                      <span>{faqExpanded === 3 ? '−' : '+'}</span>
                    </button>
                    {faqExpanded === 3 && <div className="faq-answer">Click the Export HTML or Export PDF buttons in the document editor header.</div>}
                  </div>
                </div>

                <h3>Contact Support</h3>
                <div className="settings-card">
                  <form onSubmit={e => {
                    e.preventDefault();
                    showMessage('Support form ready for backend integration.');
                    e.target.reset();
                  }} className="settings-form">
                    <div className="form-group">
                      <label>Subject</label>
                      <input type="text" required />
                    </div>
                    <div className="form-group">
                      <label>Message</label>
                      <textarea rows="4" required className="settings-textarea"></textarea>
                    </div>
                    <button type="submit" className="btn-primary">Send Message</button>
                  </form>
                </div>
              </div>
            )}

            {/* 9. ABOUT */}
            {activeSection === 'about' && (
              <div className="settings-section about-section">
                <div className="settings-card about-card">
                  <div className="brand-logo-tile-large" style={{ margin: '0 auto 16px' }}>
                    <span>N</span>
                  </div>
                  <h2>SyncDoc</h2>
                  <p>Write · Collaborate · Create</p>
                  <p className="version-text">Version 1.0.0</p>
                  
                  <div className="about-links">
                    <button className="btn-link">Terms & Conditions</button>
                    <button className="btn-link">Privacy Policy</button>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
