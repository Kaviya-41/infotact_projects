/**
 * ActiveTripsCard.tsx – Trips currently in progress
 * Positioned below the main Live Fleet Map beside Live Alerts (1fr 1fr grid).
 *
 * Phase 9: Connected to GET /api/dashboard/recent-trips for real data.
 */

import React, { memo, useState, useEffect } from 'react';
import { motion, type Variants } from 'framer-motion';
import { Route as RouteIcon, ArrowRight, ChevronRight, User, Clock, MapPin } from 'lucide-react';
import type { BackendTrip, BackendVehicleFull } from '../../types/api';
import { fetchRecentTrips } from '../../api/dashboardApi';
import { socket } from '../../services/socket';
import '../../styles/dashboard.css';

interface TripItem {
  id: string;
  vehicleId: string;
  driver: string;
  origin: string;
  destination: string;
  speed: number;
  progress: number;
  eta: string;
  remainingDistance: string;
}

/**
 * Map a backend trip to the TripItem shape used by the card.
 */
function mapBackendTrip(trip: BackendTrip): TripItem {
  const vehicle = typeof trip.vehicle === 'object' ? (trip.vehicle as BackendVehicleFull) : null;
  const vehicleId = vehicle?.vehicleId || 'Unknown';
  const speed = vehicle?.currentSpeed ?? vehicle?.speed ?? 0;

  // Calculate rough progress based on status
  let progress = 0;
  if (trip.status === 'completed') progress = 100;
  else if (trip.status === 'active') progress = 50;
  else if (trip.status === 'planned') progress = 0;

  // Format ETA
  let eta = '—';
  if (trip.estimatedArrival) {
    const d = new Date(trip.estimatedArrival);
    eta = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  // Remaining distance estimate
  const remainingDistance = trip.distance > 0
    ? `${Math.round(trip.distance * (1 - progress / 100))} km remaining`
    : 'Distance N/A';

  return {
    id: trip._id,
    vehicleId,
    driver: trip.driverName,
    origin: trip.origin,
    destination: trip.destination,
    speed,
    progress,
    eta,
    remainingDistance,
  };
}

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.35, ease: 'easeOut' },
  },
};

export const ActiveTripsCard: React.FC = () => {
  const [trips, setTrips] = useState<TripItem[]>([]);
  const [totalActive, setTotalActive] = useState(0);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const data = await fetchRecentTrips(5);
        if (!cancelled) {
          const mapped = data.map(mapBackendTrip);
          setTrips(mapped);
          setTotalActive(data.filter(t => t.status === 'active').length);
        }
      } catch {
        // Failed — show empty state
      }
    };
    load();

    const handleUpdate = () => {
      load();
    };

    socket.on('dashboardUpdate', handleUpdate);

    return () => {
      cancelled = true;
      socket.off('dashboardUpdate', handleUpdate);
    };
  }, []);

  return (
    <motion.div
      className="fd-card fd-card--no-hover active-trips-card"
      id="active-trips-card"
      initial="hidden"
      animate="visible"
      variants={cardVariants}
    >
      <div className="fd-card__header">
        <div>
          <h3 className="fd-card__title">
            <span className="icon-badge-blue">
              <RouteIcon size={14} />
            </span>
            <span>Active Trips</span>
          </h3>
          <p className="fd-card__subtitle">
            Trips currently in progress
          </p>
        </div>

        <span className="badge-pill-blue">
          {totalActive} Active
        </span>
      </div>

      {/* Trips list */}
      <div className="trips-stream">
        {trips.length === 0 ? (
          <div style={{
            padding: '32px 16px',
            textAlign: 'center',
            color: 'var(--fd-text-secondary)',
            fontSize: '13px',
          }}>
            No recent trips found.
          </div>
        ) : (
          trips.map((trip) => (
            <div key={trip.id} className="trip-card-item">
              {/* Header: ID + Route + Speed */}
              <div className="trip-item-top">
                <div className="trip-route-info">
                  <span className="trip-vehicle-id">{trip.vehicleId}</span>
                  <span className="trip-route-text">
                    <span>{trip.origin}</span>
                    <ArrowRight size={12} color="#2563EB" />
                    <span>{trip.destination}</span>
                  </span>
                </div>

                <span className="trip-speed-badge tabular-nums">
                  {trip.speed} km/h
                </span>
              </div>

              {/* Sub-info: Driver, ETA, Remaining Distance */}
              <div className="trip-item-meta">
                <span className="trip-meta-item">
                  <User size={12} /> Driver: <strong>{trip.driver}</strong>
                </span>
                <span className="trip-meta-item">
                  <Clock size={12} /> ETA: <strong>{trip.eta}</strong>
                </span>
                <span className="trip-meta-item">
                  <MapPin size={12} /> {trip.remainingDistance}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="trip-progress-container">
                <div className="trip-progress-labels">
                  <span className="progress-label-text">{trip.progress}% complete</span>
                  <span className="progress-pct tabular-nums">{trip.progress}%</span>
                </div>
                <div className="progress-bar-track">
                  <motion.div
                    className="progress-bar-fill progress-bar-fill--blue"
                    initial={{ width: 0 }}
                    animate={{ width: `${trip.progress}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                  />
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer Link */}
      <div className="card-footer-link">
        <a href="#trips" onClick={(e) => e.preventDefault()} className="action-link">
          <span>View All Trips</span>
          <ChevronRight size={13} />
        </a>
      </div>
    </motion.div>
  );
};

export default memo(ActiveTripsCard);
