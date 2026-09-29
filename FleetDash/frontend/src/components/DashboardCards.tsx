/**
 * DashboardCards.tsx – Compact Light KPI Statistics Cards
 * 4 concise cards (120-130px height) with sparklines:
 * 1. Total Vehicles
 * 2. Online Vehicles
 * 3. Active Trips
 * 4. Active Alerts
 *
 * Phase 9: Connected to GET /api/dashboard/summary for real data.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Truck, Navigation, Route, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import { fetchDashboardSummary } from '../api/dashboardApi';
import { socket } from '../services/socket';
import type { DashboardSummary } from '../types/api';
import '../styles/dashboard.css';

interface KPIData {
  id: string;
  label: string;
  value: string | number;
  icon: React.ReactNode;
  iconVariant: string;
  trend: { direction: 'up' | 'down'; value: string };
  subtitle: string;
  valueColor?: string;
  sparklinePoints?: string;
  sparklineColor?: string;
}

/**
 * Build KPI card data from real dashboard summary.
 */
function buildKPIData(summary: DashboardSummary | null): KPIData[] {
  const totalVehicles = summary?.totalVehicles ?? 0;
  const onlineVehicles = summary?.onlineVehicles ?? 0;
  const activeTrips = summary?.activeTrips ?? 0;
  const activeAlerts = summary?.activeAlerts ?? 0;
  const criticalAlerts = summary?.criticalAlerts ?? 0;
  const onlinePct = totalVehicles > 0 ? ((onlineVehicles / totalVehicles) * 100).toFixed(1) : '0';

  return [
    {
      id: 'total-vehicles',
      label: 'TOTAL VEHICLES',
      value: totalVehicles,
      icon: <Truck size={17} />,
      iconVariant: 'blue',
      trend: { direction: 'up', value: `${totalVehicles} registered` },
      subtitle: 'Registered fleet units',
      sparklinePoints: '0,25 20,20 40,22 60,14 80,18 100,8 120,12',
      sparklineColor: '#2563EB',
    },
    {
      id: 'online-vehicles',
      label: 'ONLINE VEHICLES',
      value: onlineVehicles,
      icon: <Navigation size={17} />,
      iconVariant: 'green',
      trend: { direction: 'up', value: `${onlinePct}% operational` },
      subtitle: 'Actively transmitting',
      valueColor: '#10B981',
      sparklinePoints: '0,28 20,24 40,18 60,20 80,12 100,10 120,6',
      sparklineColor: '#10B981',
    },
    {
      id: 'active-trips',
      label: 'ACTIVE TRIPS',
      value: activeTrips,
      icon: <Route size={17} />,
      iconVariant: 'purple',
      trend: { direction: activeTrips > 0 ? 'up' : 'down', value: `${summary?.totalTrips ?? 0} total trips` },
      subtitle: 'Dispatches in progress',
      valueColor: '#7C3AED',
      sparklinePoints: '0,30 20,28 40,22 60,24 80,16 100,14 120,10',
      sparklineColor: '#7C3AED',
    },
    {
      id: 'active-alerts',
      label: 'ACTIVE ALERTS',
      value: activeAlerts,
      icon: <AlertTriangle size={17} />,
      iconVariant: activeAlerts > 0 ? (criticalAlerts > 0 ? 'red' : 'amber') : 'green',
      trend: {
        direction: activeAlerts > 0 ? 'up' : 'down',
        value: criticalAlerts > 0 ? `${criticalAlerts} Critical` : '0 Critical',
      },
      subtitle: activeAlerts === 0 ? 'All systems operational' : 'Requires attention',
      valueColor: activeAlerts > 0 ? (criticalAlerts > 0 ? '#EF4444' : '#F59E0B') : '#10B981',
    },
  ];
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: 'easeOut',
    },
  },
};

export const DashboardCards: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchDashboardSummary();
        if (!cancelled) setSummary(data);
      } catch {
        // Failed to load — cards will show 0 values
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    const handleUpdate = () => {
      load();
    };

    socket.on('dashboardUpdate', handleUpdate);
    socket.on('alertGenerated', handleUpdate);

    // Also poll every 10 seconds as fallback
    const interval = setInterval(load, 10000);

    return () => {
      cancelled = true;
      clearInterval(interval);
      socket.off('dashboardUpdate', handleUpdate);
      socket.off('alertGenerated', handleUpdate);
    };
  }, []);

  const kpiData = buildKPIData(summary);

  return (
    <div className="stats-grid" id="kpi-overview-row">
      {kpiData.map((kpi) => (
        <motion.div
          key={kpi.id}
          className="stat-card"
          initial="hidden"
          animate="visible"
          variants={cardVariants}
        >
          {/* Top Row: Icon + Trend Badge */}
          <div className="stat-card__top">
            <div className={`stat-card__icon-box stat-card__icon-box--${kpi.iconVariant}`}>
              {kpi.icon}
            </div>
            <span className={`stat-card__trend stat-card__trend--${kpi.trend.direction}`}>
              {kpi.trend.direction === 'up' ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              <span>{kpi.trend.value}</span>
            </span>
          </div>

          {/* Center: Large KPI Number */}
          <div
            className="stat-card__value tabular-nums"
            style={kpi.valueColor ? { color: kpi.valueColor } : undefined}
          >
            {loading ? '—' : kpi.value}
          </div>

          {/* Bottom Row: Label & Sparkline */}
          <div className="stat-card__bottom">
            <div>
              <div className="stat-card__label">{kpi.label}</div>
              <div className="stat-card__sub">{kpi.subtitle}</div>
            </div>

            {/* Sparkline Graphic */}
            {kpi.sparklinePoints && (
              <svg width="56" height="22" viewBox="0 0 120 32" style={{ overflow: 'visible', flexShrink: 0 }}>
                <polyline
                  fill="none"
                  stroke={kpi.sparklineColor}
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points={kpi.sparklinePoints}
                />
              </svg>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default memo(DashboardCards);
