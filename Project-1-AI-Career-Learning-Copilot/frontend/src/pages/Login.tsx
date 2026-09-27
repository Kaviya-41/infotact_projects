/**
 * Login.tsx – FleetDash Enterprise SaaS Authentication Experience
 * Split-Screen Layout (58% Left Visual Centerpiece / 42% Right Glassmorphism Form)
 * Inspired by futuristic AI/telemetry products with soft blue/indigo gradients,
 * animated Canvas telemetry visualizer, floating glass data cards, and accessible form controls.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, ArrowRight, Navigation, Radio, MapPin,
  Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2,
  ShieldCheck, Activity, X, Loader2
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

// Framer Motion Animation Variants
const pageVariants: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.5, when: 'beforeChildren', staggerChildren: 0.1 }
  }
};

const leftPanelVariants: Variants = {
  hidden: { opacity: 0, x: -24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut' }
  }
};

const formPanelVariants: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.1 }
  }
};

const floatingBadgeVariants: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.94 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' }
  }
};

const Login: React.FC = () => {
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot Password Modal State
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Canvas Reference for Futuristic Telemetry Visualization
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Animated Telemetry Canvas Simulation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 580);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 320);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Telemetry Route Waypoints
    const routeA = [
      { x: width * 0.12, y: height * 0.72 },
      { x: width * 0.32, y: height * 0.48 },
      { x: width * 0.62, y: height * 0.55 },
      { x: width * 0.88, y: height * 0.28 }
    ];

    const routeB = [
      { x: width * 0.22, y: height * 0.2 },
      { x: width * 0.48, y: height * 0.38 },
      { x: width * 0.74, y: height * 0.78 }
    ];

    const routeC = [
      { x: width * 0.45, y: height * 0.85 },
      { x: width * 0.55, y: height * 0.5 },
      { x: width * 0.82, y: height * 0.65 }
    ];

    // Vehicles / Telemetry Nodes
    const nodes = [
      { id: 'FLT-001', x: width * 0.32, y: height * 0.48, speed: 68, status: 'Online', color: '#2563EB' },
      { id: 'FLT-004', x: width * 0.62, y: height * 0.55, speed: 54, status: 'En Route', color: '#10B981' },
      { id: 'FLT-007', x: width * 0.48, y: height * 0.38, speed: 0, status: 'Idle', color: '#F59E0B' },
      { id: 'FLT-010', x: width * 0.82, y: height * 0.65, speed: 0, status: 'Depot', color: '#7C3AED' }
    ];

    // Particle Pulses Moving Along Routes
    const particles = [
      { progress: 0.1, speed: 0.0035, route: routeA, color: '#2563EB' },
      { progress: 0.55, speed: 0.004, route: routeA, color: '#0EA5E9' },
      { progress: 0.3, speed: 0.003, route: routeB, color: '#10B981' },
      { progress: 0.7, speed: 0.0045, route: routeC, color: '#7C3AED' }
    ];

    let time = 0;

    // Helper: Quadratic Bezier Point
    const getBezierPoint = (p0: { x: number; y: number }, p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
      const oneMinusT = 1 - t;
      return {
        x: oneMinusT * oneMinusT * p0.x + 2 * oneMinusT * t * p1.x + t * t * p2.x,
        y: oneMinusT * oneMinusT * p0.y + 2 * oneMinusT * t * p1.y + t * t * p2.y
      };
    };

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      // 1. Subtle Coordinate Grid
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 0.75;
      const gridSize = 32;

      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw Vector Highway Route Corridors
      // Route A
      ctx.beginPath();
      ctx.moveTo(routeA[0].x, routeA[0].y);
      ctx.quadraticCurveTo(routeA[1].x, routeA[1].y, routeA[2].x, routeA[2].y);
      ctx.quadraticCurveTo(width * 0.75, height * 0.42, routeA[3].x, routeA[3].y);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.stroke();

      // Route A Dashed Inner Track
      ctx.beginPath();
      ctx.moveTo(routeA[0].x, routeA[0].y);
      ctx.quadraticCurveTo(routeA[1].x, routeA[1].y, routeA[2].x, routeA[2].y);
      ctx.quadraticCurveTo(width * 0.75, height * 0.42, routeA[3].x, routeA[3].y);
      ctx.strokeStyle = '#2563EB';
      ctx.lineWidth = 1.8;
      ctx.setLineDash([6, 5]);
      ctx.lineDashOffset = -time * 15;
      ctx.stroke();
      ctx.setLineDash([]);

      // Route B
      ctx.beginPath();
      ctx.moveTo(routeB[0].x, routeB[0].y);
      ctx.quadraticCurveTo(routeB[1].x, routeB[1].y, routeB[2].x, routeB[2].y);
      ctx.strokeStyle = 'rgba(16, 185, 129, 0.2)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Route C
      ctx.beginPath();
      ctx.moveTo(routeC[0].x, routeC[0].y);
      ctx.quadraticCurveTo(routeC[1].x, routeC[1].y, routeC[2].x, routeC[2].y);
      ctx.strokeStyle = 'rgba(124, 58, 237, 0.18)';
      ctx.lineWidth = 3;
      ctx.stroke();

      // 3. Draw Moving Telemetry Pulses / Particles
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;

        const pt = getBezierPoint(p.route[0], p.route[1], p.route[2] || p.route[1], p.progress);

        // Glowing Particle Aura
        const grad = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, 12);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2);
        ctx.fill();

        // Inner Solid Dot
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fill();
      });

      // 4. Draw Telemetry Nodes with Pulsing Radar Rings
      nodes.forEach((node) => {
        // Radar Pulse Wave
        const pulseRadius = 12 + ((Math.sin(time * 3 + node.x) + 1) * 6);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.arc(node.x, node.y, pulseRadius, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = 1;

        // Outer Ring
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(node.x, node.y, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Center Core
        ctx.fillStyle = node.color;
        ctx.beginPath();
        ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2);
        ctx.fill();

        // Node ID Pill Label
        ctx.font = '600 10.5px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#0F172A';
        ctx.fillText(node.id, node.x + 10, node.y - 4);

        ctx.font = '500 9px Inter, -apple-system, sans-serif';
        ctx.fillStyle = '#64748B';
        ctx.fillText(node.speed > 0 ? `${node.speed} km/h` : node.status, node.x + 10, node.y + 7);
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  // Form Submission Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanEmail = email.trim();
    if (!cleanEmail || !password) {
      setError('Please enter both your work email and password.');
      return;
    }

    // Basic email format check
    if (!/\S+@\S+\.\S+/.test(cleanEmail)) {
      setError('Please enter a valid work email address.');
      return;
    }

    setIsLoading(true);

    try {
      const res = await login(cleanEmail, password);
      setIsLoading(false);

      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setError(res.error || 'Invalid credentials. Please verify your email and password.');
      }
    } catch {
      setIsLoading(false);
      setError('Unable to connect to the server. Please try again.');
    }
  };

  // Forgot Password Submit
  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!forgotEmail.trim()) return;
    setForgotSuccess(true);
    setTimeout(() => {
      setIsForgotModalOpen(false);
      setForgotSuccess(false);
      setForgotEmail('');
    }, 2200);
  };

  return (
    <motion.div
      className="auth-page"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Soft Ambient Radial Background Glows */}
      <div className="auth-ambient-glow-1" aria-hidden="true" />
      <div className="auth-ambient-glow-2" aria-hidden="true" />
      <div className="auth-grid-overlay" aria-hidden="true" />

      <main className="auth-container">
        {/* ============================================================
            LEFT VISUAL SECTION — FleetDash Branding & Live Telemetry
            ============================================================ */}
        <motion.section
          className="auth-visual-panel"
          variants={leftPanelVariants}
          aria-label="FleetDash Brand Overview"
        >
          <div>
            {/* FleetDash Brand Logo */}
            <div className="auth-logo-header">
              <div className="auth-logo-icon">
                <Truck size={22} />
              </div>
              <span className="auth-logo-text">
                Fleet<span>Dash</span>
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="auth-hero-h1">
              Real-Time Fleet<br />
              Intelligence Platform
            </h1>

            {/* Supporting Text */}
            <p className="auth-hero-p">
              Monitor vehicle telemetry, delivery routes and fleet operations in real time.
            </p>

            {/* Sophisticated Fleet Telemetry Visual Centerpiece */}
            <div className="auth-stage-card">
              <canvas ref={canvasRef} className="auth-stage-canvas" aria-hidden="true" />

              {/* Floating Glassmorphism Data Card: Top Left */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--top-left"
                variants={floatingBadgeVariants}
                whileHover={{ y: -2 }}
              >
                <Navigation size={13} color="#2563EB" />
                <span>42 Vehicles Tracked</span>
              </motion.div>

              {/* Floating Glassmorphism Data Card: Top Right */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--top-right"
                variants={floatingBadgeVariants}
                whileHover={{ y: -2 }}
              >
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  backgroundColor: '#10B981', display: 'inline-block',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.2)'
                }} />
                <Radio size={12} />
                <span>Live Telemetry Active</span>
              </motion.div>

              {/* Floating Center Vehicle Live Badge */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--center"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MapPin size={14} color="#2563EB" />
                <span>FLT-004 En Route</span>
                <span style={{ color: '#2563EB', fontFamily: 'var(--fd-font-mono)', marginLeft: '4px' }}>
                  68 km/h
                </span>
              </motion.div>

              {/* Floating Glassmorphism Data Card: Bottom Left */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--bottom-left"
                variants={floatingBadgeVariants}
                whileHover={{ y: -2 }}
              >
                <span style={{ color: '#10B981', fontWeight: 700 }}>35 Online</span>
                <span style={{ color: '#94A3B8' }}>·</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>0 Active Alerts</span>
              </motion.div>

              {/* Floating Glassmorphism Data Card: Bottom Right */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--bottom-right"
                variants={floatingBadgeVariants}
              >
                <Activity size={11} color="#2563EB" />
                <span>14 ms sync</span>
              </motion.div>
            </div>
          </div>

          {/* Visual Panel Footer */}
          <div className="auth-visual-footer">
            <span>© 2026 FleetDash Telemetry Systems.</span>
            <span>Enterprise Operations Mode</span>
          </div>
        </motion.section>

        {/* ============================================================
            RIGHT LOGIN SECTION — Translucent Glass Authentication Form
            ============================================================ */}
        <motion.section
          className="auth-form-panel"
          variants={formPanelVariants}
          aria-label="Sign In"
        >
          <div className="auth-glass-card">
            {/* Header */}
            <div className="auth-form-header">
              <h2 className="auth-form-h2">Welcome Back</h2>
              <p className="auth-form-sub">
                Sign in to access your fleet operations dashboard.
              </p>
            </div>

            {/* Error Banner */}
            <AnimatePresence>
              {error && (
                <motion.div
                  className="auth-error-banner"
                  role="alert"
                  aria-live="polite"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{error}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="auth-form-body" noValidate>
              {/* Work Email Field */}
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="login-email">
                  Work Email
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="auth-input-control"
                    placeholder="dispatcher@fleetdash.io"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    aria-required="true"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="auth-input-group">
                <div className="auth-label">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="auth-link-forgot"
                    onClick={() => setIsForgotModalOpen(true)}
                    tabIndex={0}
                  >
                    Forgot password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={16} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    className="auth-input-control"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (error) setError('');
                    }}
                    required
                    aria-required="true"
                    disabled={isLoading}
                    style={{ paddingRight: '46px' }}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    title={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={0}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me Checkbox */}
              <div className="auth-checkbox-row">
                <label className="auth-checkbox-label" htmlFor="login-remember">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox-input"
                    disabled={isLoading}
                  />
                  <span>Remember me for 30 days</span>
                </label>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                id="btn-sign-in"
                className="auth-btn-primary"
                disabled={isLoading}
                whileHover={isLoading ? {} : { scale: 1.01 }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Bottom Register Navigation Link */}
            <div className="auth-footer-nav">
              <span>Don't have an account?</span>
              <Link to="/signup" className="auth-footer-link" id="link-create-account">
                Create account
              </Link>
            </div>
          </div>
        </motion.section>
      </main>

      {/* ── Forgot Password Helper Modal ─────────────────────────── */}
      {isForgotModalOpen && (
        <div className="auth-forgot-modal" role="presentation" onClick={() => setIsForgotModalOpen(false)}>
          <div
            className="auth-forgot-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby="forgot-password-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <ShieldCheck size={20} color="#2563EB" />
                <h3 id="forgot-password-title" style={{ fontSize: '17px', fontWeight: 700, color: '#0F172A', margin: 0 }}>
                  Reset Access Password
                </h3>
              </div>
              <button
                onClick={() => setIsForgotModalOpen(false)}
                style={{ background: 'none', border: 'none', color: '#64748B', cursor: 'pointer', padding: '4px' }}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            {forgotSuccess ? (
              <div style={{ padding: '16px 0', textAlign: 'center' }}>
                <CheckCircle2 size={36} color="#10B981" style={{ margin: '0 auto 10px' }} />
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#0F172A' }}>Password Reset Link Sent</div>
                <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '4px' }}>
                  Instructions have been dispatched to {forgotEmail || 'your email'}.
                </p>
              </div>
            ) : (
              <form onSubmit={handleForgotSubmit}>
                <p style={{ fontSize: '13px', color: '#64748B', lineHeight: 1.5, margin: '0 0 16px' }}>
                  Enter your organization work email address and we'll send you an access link to securely reset your credentials.
                </p>

                <div className="auth-input-group" style={{ marginBottom: '18px' }}>
                  <label className="auth-label" htmlFor="forgot-email-input">Work Email</label>
                  <div className="auth-input-wrapper">
                    <Mail size={16} className="auth-input-icon" />
                    <input
                      id="forgot-email-input"
                      type="email"
                      className="auth-input-control"
                      placeholder="dispatcher@fleetdash.io"
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setIsForgotModalOpen(false)}
                    className="btn-modal-cancel"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-modal-submit"
                  >
                    Send Reset Link
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Login;
