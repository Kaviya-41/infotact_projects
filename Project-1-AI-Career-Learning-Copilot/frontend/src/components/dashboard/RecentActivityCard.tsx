/**
 * RecentActivityCard.tsx – Timeline stream of real-time fleet events
 * Positioned at the bottom of the dashboard.
 */

import React, { memo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, type Variants } from 'framer-motion';
import { Clock, CheckCircle2, ShieldAlert, AlertTriangle, PlayCircle, WifiOff, ChevronRight } from 'lucide-react';
import '../../styles/dashboard.css';

interface ActivityItem {
  id: string;
  time: string;
  vehicleId: string;
  title: string;
  subtitle: string;
  type: 'completed' | 'geofence' | 'alert' | 'started' | 'offline';
}

const ACTIVITIES: ActivityItem[] = [
  {
    id: 'act-1',
    time: '10:42 AM',
    vehicleId: 'FLT-001',
    title: 'FLT-001 completed Bengaluru → Hosur',
    subtitle: 'Trip completed on schedule without incidents',
    type: 'completed',
  },
  {
    id: 'act-2',
    time: '10:38 AM',
    vehicleId: 'FLT-007',
    title: 'FLT-007 entered Bengaluru Hub',
    subtitle: 'Geofence entry detected at Zone Alpha checkpoint',
    type: 'geofence',
  },
  {
    id: 'act-3',
    time: '10:31 AM',
    vehicleId: 'FLT-003',
    title: 'FLT-003 generated high engine temperature alert',
    subtitle: 'Engine coolant temperature reached 112°C threshold',
    type: 'alert',
  },
  {
    id: 'act-4',
    time: '10:25 AM',
    vehicleId: 'FLT-004',
    title: 'FLT-004 started Bengaluru → Chennai',
    subtitle: 'Route initiated by driver Karthik S',
    type: 'started',
  },
  {
    id: 'act-5',
    time: '10:18 AM',
    vehicleId: 'FLT-010',
    title: 'FLT-010 went offline',
    subtitle: 'GPS telemetry disconnected at Vadodara Bypass',
    type: 'offline',
  },
];

const typeConfig = {
  completed: { color: '#10B981', bg: 'rgba(16, 185, 129, 0.08)', Icon: CheckCircle2 },
  geofence:  { color: '#0EA5E9', bg: 'rgba(14, 165, 233, 0.08)', Icon: ShieldAlert },
  alert:     { color: '#EF4444', bg: 'rgba(239, 68, 68, 0.08)', Icon: AlertTriangle },
  started:   { color: '#2563EB', bg: 'rgba(37, 99, 235, 0.08)', Icon: PlayCircle },
  offline:   { color: '#F59E0B', bg: 'rgba(245, 158, 11, 0.08)', Icon: WifiOff },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const RecentActivityCard: React.FC = () => {
  const navigate = useNavigate();

  return (
    <motion.div
      className="fd-card fd-card--no-hover activity-stream-card"
      id="recent-activity-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className="fd-card__header">
        <div>
          <h3 className="fd-card__title">
            <span className="icon-badge-blue">
              <Clock size={14} />
            </span>
            <span>Recent Activity</span>
          </h3>
          <p className="fd-card__subtitle">
            Real-time event stream from active vehicles
          </p>
        </div>

        <span className="activity-today-badge">
          Today
        </span>
      </div>

      {/* Timeline Stream List */}
      <div className="activity-list">
        {ACTIVITIES.map((act, idx) => {
          const config = typeConfig[act.type];
          const ActIcon = config.Icon;

          return (
            <motion.div
              key={act.id}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.2 }}
              className="activity-item-row"
              onClick={() => navigate('/alerts')}
              style={{ cursor: 'pointer' }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navigate('/alerts'); } }}
            >
              <div className="activity-left">
                <span
                  className="activity-icon-badge"
                  style={{
                    backgroundColor: config.bg,
                    color: config.color,
                  }}
                >
                  <ActIcon size={14} />
                </span>

                <div className="activity-text-group">
                  <div className="activity-item-title">
                    {act.title}
                  </div>
                  <div className="activity-item-subtitle">
                    {act.subtitle}
                  </div>
                </div>
              </div>

              <div className="activity-time tabular-nums">
                {act.time}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Footer Action */}
      <div className="card-footer-link">
        <Link to="/alerts" className="action-link" id="link-view-full-activity">
          <span>View Full Activity Stream</span>
          <ChevronRight size={13} />
        </Link>
      </div>
    </motion.div>
  );
};

export default memo(RecentActivityCard);

