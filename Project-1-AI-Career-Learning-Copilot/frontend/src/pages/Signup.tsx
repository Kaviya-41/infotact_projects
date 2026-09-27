/**
 * Signup.tsx – FleetDash Enterprise SaaS Registration Experience
 * Split-Screen Layout matching the Login page design system:
 * Left (~55%): FleetDash branding, headline, Canvas telemetry visual, feature checklist
 * Right (~45%): Translucent glassmorphism registration card with accessible form controls
 *
 * Preserves existing: useAuth().signup(), validation, redirect, and routing.
 */

import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Truck, ArrowRight, Navigation, Radio, MapPin,
  Mail, Lock, Eye, EyeOff, AlertCircle, Activity,
  User, Building2, CheckCircle2, Loader2
} from 'lucide-react';
import { motion, AnimatePresence, type Variants } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import '../styles/dashboard.css';

/* ── Framer Motion Variants (matching Login.tsx) ────────────── */
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

const featureRowVariants: Variants = {
  hidden: { opacity: 0, x: -12 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.4, ease: 'easeOut' }
  }
};

/* ── Component ──────────────────────────────────────────────── */
const Signup: React.FC = () => {
  /* Form State */
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isLoading, setIsLoading] = useState(false);

  /* Auth & Navigation (existing) */
  const { signup } = useAuth();
  const navigate = useNavigate();

  /* Canvas Ref */
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  /* ── Canvas Telemetry Visualization (reused from Login.tsx) ── */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let width = (canvas.width = canvas.parentElement?.clientWidth || 580);
    let height = (canvas.height = canvas.parentElement?.clientHeight || 280);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };
    window.addEventListener('resize', handleResize);

    /* Telemetry Route Waypoints */
    const routeA = [
      { x: width * 0.1, y: height * 0.7 },
      { x: width * 0.35, y: height * 0.45 },
      { x: width * 0.65, y: height * 0.52 },
      { x: width * 0.9, y: height * 0.25 }
    ];
    const routeB = [
      { x: width * 0.2, y: height * 0.18 },
      { x: width * 0.5, y: height * 0.4 },
      { x: width * 0.78, y: height * 0.75 }
    ];
    const routeC = [
      { x: width * 0.42, y: height * 0.82 },
      { x: width * 0.55, y: height * 0.48 },
      { x: width * 0.85, y: height * 0.62 }
    ];

    /* Vehicle Nodes */
    const nodes = [
      { id: 'FLT-001', x: width * 0.35, y: height * 0.45, speed: 68, status: 'Online', color: '#2563EB' },
      { id: 'FLT-004', x: width * 0.65, y: height * 0.52, speed: 54, status: 'En Route', color: '#10B981' },
      { id: 'FLT-007', x: width * 0.5, y: height * 0.4, speed: 0, status: 'Idle', color: '#F59E0B' },
      { id: 'FLT-010', x: width * 0.85, y: height * 0.62, speed: 0, status: 'Depot', color: '#7C3AED' }
    ];

    /* Moving Particles */
    const particles = [
      { progress: 0.15, speed: 0.0035, route: routeA, color: '#2563EB' },
      { progress: 0.6, speed: 0.004, route: routeA, color: '#0EA5E9' },
      { progress: 0.35, speed: 0.003, route: routeB, color: '#10B981' },
      { progress: 0.75, speed: 0.0045, route: routeC, color: '#7C3AED' }
    ];

    let time = 0;

    const getBezierPoint = (
      p0: { x: number; y: number },
      p1: { x: number; y: number },
      p2: { x: number; y: number },
      t: number
    ) => ({
      x: (1 - t) * (1 - t) * p0.x + 2 * (1 - t) * t * p1.x + t * t * p2.x,
      y: (1 - t) * (1 - t) * p0.y + 2 * (1 - t) * t * p1.y + t * t * p2.y
    });

    const render = () => {
      time += 0.02;
      ctx.clearRect(0, 0, width, height);

      /* 1. Grid */
      ctx.strokeStyle = 'rgba(226, 232, 240, 0.45)';
      ctx.lineWidth = 0.75;
      for (let gx = 0; gx < width; gx += 32) {
        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, height); ctx.stroke();
      }
      for (let gy = 0; gy < height; gy += 32) {
        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(width, gy); ctx.stroke();
      }

      /* 2. Route corridors */
      ctx.lineCap = 'round';

      // Route A solid
      ctx.beginPath();
      ctx.moveTo(routeA[0].x, routeA[0].y);
      ctx.quadraticCurveTo(routeA[1].x, routeA[1].y, routeA[2].x, routeA[2].y);
      ctx.quadraticCurveTo(width * 0.78, height * 0.38, routeA[3].x, routeA[3].y);
      ctx.strokeStyle = 'rgba(37, 99, 235, 0.22)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // Route A dashed
      ctx.beginPath();
      ctx.moveTo(routeA[0].x, routeA[0].y);
      ctx.quadraticCurveTo(routeA[1].x, routeA[1].y, routeA[2].x, routeA[2].y);
      ctx.quadraticCurveTo(width * 0.78, height * 0.38, routeA[3].x, routeA[3].y);
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

      /* 3. Moving particles */
      particles.forEach((p) => {
        p.progress += p.speed;
        if (p.progress > 1) p.progress = 0;
        const pt = getBezierPoint(p.route[0], p.route[1], p.route[2] || p.route[1], p.progress);

        const grad = ctx.createRadialGradient(pt.x, pt.y, 1, pt.x, pt.y, 12);
        grad.addColorStop(0, p.color);
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 12, 0, Math.PI * 2); ctx.fill();

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2); ctx.fill();
      });

      /* 4. Vehicle Nodes */
      nodes.forEach((node) => {
        const pulseR = 12 + ((Math.sin(time * 3 + node.x) + 1) * 6);
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 1.2;
        ctx.globalAlpha = 0.35;
        ctx.beginPath(); ctx.arc(node.x, node.y, pulseR, 0, Math.PI * 2); ctx.stroke();
        ctx.globalAlpha = 1;

        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath(); ctx.arc(node.x, node.y, 7, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = node.color;
        ctx.lineWidth = 2.5;
        ctx.stroke();

        ctx.fillStyle = node.color;
        ctx.beginPath(); ctx.arc(node.x, node.y, 3.5, 0, Math.PI * 2); ctx.fill();

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

  /* ── Existing Validation Logic (preserved) ───────────────── */
  const validate = () => {
    const errs: { [key: string]: string } = {};
    if (!fullName.trim()) errs.fullName = 'Full Name is required';
    if (!email.trim()) {
      errs.email = 'Email address is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      errs.email = 'Please enter a valid email address';
    }
    if (!password) {
      errs.password = 'Password is required';
    } else if (password.length < 6) {
      errs.password = 'Min 6 characters required';
    }
    if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  /* ── Existing Submit Handler (connected to backend) ──────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsLoading(true);
    try {
      const res = await signup(fullName, email, password, company);
      setIsLoading(false);
      if (res.success) {
        navigate('/dashboard', { replace: true });
      } else {
        setErrors({ form: res.error || 'Unable to create account. Please check your information and try again.' });
      }
    } catch {
      setIsLoading(false);
      setErrors({ form: 'Unable to connect to the server. Please try again.' });
    }
  };

  /* Helper to clear field error on type */
  const clearFieldError = (field: string) => {
    if (errors[field]) {
      setErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  /* ── Compact Feature List Items ───────────────────────────── */
  const features = [
    'Real-time vehicle monitoring',
    'Live route and telemetry tracking',
    'Instant operational alerts'
  ];

  return (
    <motion.div
      className="auth-page"
      initial="hidden"
      animate="visible"
      variants={pageVariants}
    >
      {/* Ambient Background Glows */}
      <div className="auth-ambient-glow-1" aria-hidden="true" />
      <div className="auth-ambient-glow-2" aria-hidden="true" />
      <div className="auth-grid-overlay" aria-hidden="true" />

      <main className="auth-container">
        {/* ============================================================
            LEFT VISUAL SECTION — FleetDash Branding & Telemetry Visual
            ============================================================ */}
        <motion.section
          className="auth-visual-panel"
          variants={leftPanelVariants}
          aria-label="FleetDash Brand Overview"
        >
          <div>
            {/* Logo */}
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
              Get Started with<br />
              Enterprise Fleet Intelligence
            </h1>

            {/* Supporting Text */}
            <p className="auth-hero-p">
              Create your organization account and start monitoring vehicles, trips, telemetry and operational alerts in real time.
            </p>

            {/* Fleet Telemetry Canvas Visual */}
            <div className="auth-stage-card" style={{ height: '280px' }}>
              <canvas ref={canvasRef} className="auth-stage-canvas" aria-hidden="true" />

              {/* Floating Data Badges */}
              <motion.div
                className="auth-floating-badge auth-floating-badge--top-left"
                variants={floatingBadgeVariants}
                whileHover={{ y: -2 }}
              >
                <Navigation size={13} color="#2563EB" />
                <span>42 Vehicles Tracked</span>
              </motion.div>

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

              <motion.div
                className="auth-floating-badge auth-floating-badge--center"
                animate={{ y: [0, -3, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                <MapPin size={14} color="#2563EB" />
                <span>FLT-004 En Route</span>
                <span style={{ color: '#2563EB', fontFamily: 'var(--fd-font-mono)', marginLeft: '4px' }}>
                  54 km/h
                </span>
              </motion.div>

              <motion.div
                className="auth-floating-badge auth-floating-badge--bottom-left"
                variants={floatingBadgeVariants}
                whileHover={{ y: -2 }}
              >
                <span style={{ color: '#10B981', fontWeight: 700 }}>35 Online</span>
                <span style={{ color: '#94A3B8' }}>·</span>
                <span style={{ color: '#10B981', fontWeight: 700 }}>0 Active Alerts</span>
              </motion.div>

              <motion.div
                className="auth-floating-badge auth-floating-badge--bottom-right"
                variants={floatingBadgeVariants}
              >
                <Activity size={11} color="#2563EB" />
                <span>14 ms sync</span>
              </motion.div>
            </div>

            {/* Compact Feature Checklist (replaces the huge Enterprise Telemetry Suite card) */}
            <motion.div
              style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              initial="hidden"
              animate="visible"
              variants={{ visible: { transition: { staggerChildren: 0.12, delayChildren: 0.5 } } } as Variants}
            >
              {features.map((feat) => (
                <motion.div
                  key={feat}
                  variants={featureRowVariants}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '13.5px', fontWeight: 500, color: '#334155'
                  }}
                >
                  <CheckCircle2 size={16} color="#10B981" style={{ flexShrink: 0 }} />
                  <span>{feat}</span>
                </motion.div>
              ))}
            </motion.div>
          </div>

          {/* Footer */}
          <div className="auth-visual-footer">
            <span>© 2026 FleetDash Telemetry Systems.</span>
            <span>Enterprise Operations Mode</span>
          </div>
        </motion.section>

        {/* ============================================================
            RIGHT SECTION — Translucent Glass Registration Form
            ============================================================ */}
        <motion.section
          className="auth-form-panel"
          variants={formPanelVariants}
          aria-label="Create Account"
        >
          <div className="auth-glass-card">
            {/* Header */}
            <div className="auth-form-header">
              <h2 className="auth-form-h2">Create Account</h2>
              <p className="auth-form-sub">
                Start monitoring your fleet in real time.
              </p>
            </div>

            {/* Global Error Banner */}
            <AnimatePresence>
              {errors.form && (
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
                  <span>{errors.form}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Registration Form */}
            <form onSubmit={handleSubmit} className="auth-form-body" noValidate>
              {/* Full Name */}
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="signup-name">Full Name</label>
                <div className="auth-input-wrapper">
                  <User size={16} className="auth-input-icon" />
                  <input
                    id="signup-name"
                    type="text"
                    name="name"
                    autoComplete="name"
                    className="auth-input-control"
                    placeholder="Enter your full name"
                    value={fullName}
                    onChange={(e) => { setFullName(e.target.value); clearFieldError('fullName'); }}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.fullName}
                    aria-describedby={errors.fullName ? 'signup-name-error' : undefined}
                    disabled={isLoading}
                    style={{ borderColor: errors.fullName ? '#DC2626' : undefined }}
                  />
                </div>
                {errors.fullName && (
                  <span id="signup-name-error" style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {errors.fullName}
                  </span>
                )}
              </div>

              {/* Work Email */}
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="signup-email">Work Email</label>
                <div className="auth-input-wrapper">
                  <Mail size={16} className="auth-input-icon" />
                  <input
                    id="signup-email"
                    type="email"
                    name="email"
                    autoComplete="email"
                    className="auth-input-control"
                    placeholder="Enter your work email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); clearFieldError('email'); }}
                    required
                    aria-required="true"
                    aria-invalid={!!errors.email}
                    aria-describedby={errors.email ? 'signup-email-error' : undefined}
                    disabled={isLoading}
                    style={{ borderColor: errors.email ? '#DC2626' : undefined }}
                  />
                </div>
                {errors.email && (
                  <span id="signup-email-error" style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                    {errors.email}
                  </span>
                )}
              </div>

              {/* Company / Organization */}
              <div className="auth-input-group">
                <label className="auth-label" htmlFor="signup-company">Company / Organization</label>
                <div className="auth-input-wrapper">
                  <Building2 size={16} className="auth-input-icon" />
                  <input
                    id="signup-company"
                    type="text"
                    name="organization"
                    autoComplete="organization"
                    className="auth-input-control"
                    placeholder="Enter your organization"
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Password + Confirm Password — 2-column on desktop */}
              <div className="auth-password-row">
                {/* Password */}
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="signup-password">Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      name="new-password"
                      autoComplete="new-password"
                      className="auth-input-control"
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); clearFieldError('password'); }}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.password}
                      aria-describedby={errors.password ? 'signup-pw-error' : undefined}
                      disabled={isLoading}
                      style={{ paddingRight: '46px', borderColor: errors.password ? '#DC2626' : undefined }}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      tabIndex={0}
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.password && (
                    <span id="signup-pw-error" style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                      {errors.password}
                    </span>
                  )}
                </div>

                {/* Confirm Password */}
                <div className="auth-input-group">
                  <label className="auth-label" htmlFor="signup-confirm">Confirm Password</label>
                  <div className="auth-input-wrapper">
                    <Lock size={16} className="auth-input-icon" />
                    <input
                      id="signup-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirm-password"
                      autoComplete="new-password"
                      className="auth-input-control"
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => { setConfirmPassword(e.target.value); clearFieldError('confirmPassword'); }}
                      required
                      aria-required="true"
                      aria-invalid={!!errors.confirmPassword}
                      aria-describedby={errors.confirmPassword ? 'signup-cpw-error' : undefined}
                      disabled={isLoading}
                      style={{ paddingRight: '46px', borderColor: errors.confirmPassword ? '#DC2626' : undefined }}
                    />
                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() => setShowConfirmPassword((v) => !v)}
                      aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                      tabIndex={0}
                    >
                      {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <span id="signup-cpw-error" style={{ fontSize: '11.5px', color: '#DC2626', fontWeight: 600, marginTop: '2px', display: 'block' }}>
                      {errors.confirmPassword}
                    </span>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <motion.button
                type="submit"
                id="btn-create-account"
                className="auth-btn-primary"
                disabled={isLoading}
                whileHover={isLoading ? {} : { scale: 1.01 }}
                whileTap={isLoading ? {} : { scale: 0.98 }}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Create Account</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </motion.button>
            </form>

            {/* Login Navigation Link */}
            <div className="auth-footer-nav">
              <span>Already have an account?</span>
              <Link to="/login" className="auth-footer-link" id="link-sign-in">
                Sign In
              </Link>
            </div>
          </div>
        </motion.section>
      </main>
    </motion.div>
  );
};

export default Signup;
