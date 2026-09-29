import React, { useState, useEffect } from 'react';
import { registerUser, loginUser } from '../api/authApi.js';

export default function LoginPage({ onLogin }) {
  const [page, setPage] = useState('login'); // 'login' | 'register'
  
  // Register state
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  
  // Login state
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  
  // Common state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Clear messages on page switch
  useEffect(() => {
    setError('');
    if (page === 'register') setSuccess('');
  }, [page]);

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!regName.trim() || !regEmail.trim() || !regUsername.trim() || !regPassword) {
      setError('Please fill in all required fields.');
      return;
    }
    
    if (regPassword !== regConfirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await registerUser({
        name: regName,
        email: regEmail,
        username: regUsername,
        phone: regPhone,
        password: regPassword,
      });
      
      setSuccess(res.message || 'Account created successfully. Please log in.');
      setPage('login');
      // Pre-fill login identifier with email
      setLoginIdentifier(regEmail);
      setLoginPassword('');
      
      // Clear form
      setRegName('');
      setRegEmail('');
      setRegUsername('');
      setRegPhone('');
      setRegPassword('');
      setRegConfirmPassword('');
    } catch (err) {
      setError(err.message || 'Failed to register.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    if (!loginIdentifier.trim() || !loginPassword) {
      setError('Please fill in all fields.');
      return;
    }
    
    try {
      setIsLoading(true);
      const res = await loginUser(loginIdentifier, loginPassword);
      if (res.success && res.data) {
        onLogin(res.data.user, res.data.token);
      }
    } catch (err) {
      setError(err.message || 'Failed to login.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = (e) => {
    e.preventDefault();
    setError('Please contact an administrator to reset your password.');
  };

  return (
    <div className="auth-page-container">
      {/* Ambient background mesh */}
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="blob blob-1"></div>
        <div className="blob blob-2"></div>
        <div className="blob blob-3"></div>
      </div>

      <div className="auth-content-wrapper">
        <div className="auth-brand-header">
          <div className="brand-logo-tile">
            <span>N</span>
          </div>
          <h1 className="auth-brand-title">SyncDoc</h1>
          <p className="auth-brand-sub">Write · Collaborate · Create</p>
        </div>

        <div className="auth-card">
          {page === 'register' ? (
            <div className="auth-panel auth-panel-register">
              <h2>Create Account</h2>
              
              {error && <div className="auth-alert auth-alert-error">{error}</div>}
              
              <form onSubmit={handleRegisterSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="reg-name">Full Name *</label>
                  <input
                    id="reg-name"
                    type="text"
                    placeholder="Jane Doe"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="reg-email">Email *</label>
                  <input
                    id="reg-email"
                    type="email"
                    placeholder="name@example.com"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="reg-username">Username *</label>
                  <input
                    id="reg-username"
                    type="text"
                    placeholder="janedoe"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="reg-phone">Phone Number</label>
                  <input
                    id="reg-phone"
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="reg-password">Password *</label>
                  <input
                    id="reg-password"
                    type="password"
                    placeholder="••••••••"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>
                
                <div className="input-group">
                  <label htmlFor="reg-confirm-password">Confirm Password *</label>
                  <input
                    id="reg-confirm-password"
                    type="password"
                    placeholder="••••••••"
                    value={regConfirmPassword}
                    onChange={(e) => setRegConfirmPassword(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                    minLength={6}
                  />
                </div>

                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                  {isLoading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
              
              <div className="auth-switch-link">
                <span>Already have an account? </span>
                <button type="button" className="btn-link" onClick={() => setPage('login')}>
                  Login
                </button>
              </div>
            </div>
          ) : (
            <div className="auth-panel auth-panel-login">
              <h2>Welcome Back</h2>
              
              {success && <div className="auth-alert auth-alert-success">{success}</div>}
              {error && <div className="auth-alert auth-alert-error">{error}</div>}
              
              <form onSubmit={handleLoginSubmit} className="auth-form">
                <div className="input-group">
                  <label htmlFor="login-identifier">Email / Username *</label>
                  <input
                    id="login-identifier"
                    type="text"
                    placeholder="name@example.com or janedoe"
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                  />
                </div>

                <div className="input-group">
                  <label htmlFor="login-password">Password *</label>
                  <input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="auth-input"
                    disabled={isLoading}
                    required
                  />
                </div>
                
                <div className="forgot-password-link">
                  <button type="button" className="btn-link-subtle" onClick={handleForgotPassword}>
                    Forgot password?
                  </button>
                </div>

                <button type="submit" className="btn-auth-submit" disabled={isLoading}>
                  {isLoading ? 'Signing in...' : 'Login'}
                </button>
              </form>
              
              <div className="auth-switch-link">
                <span>Don't have an account? </span>
                <button type="button" className="btn-link" onClick={() => setPage('register')}>
                  Create Account
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
