/**
 * VehicleTelemetry.tsx – Vehicle Live Telemetry Panel Component
 */

import React from 'react';
import { User, Fuel, Activity, Wifi, MapPin, Clock } from 'lucide-react';
import type { Vehicle } from '../../types/fleet';
import '../../styles/dashboard.css';

interface VehicleTelemetryProps {
  vehicle?: Vehicle;
}

const DEFAULT_VEHICLE: Vehicle = {
  id: 'FLT-024',
  name: 'Freightliner Cascadia #24',
  type: 'Heavy Truck',
  driver: 'Arjun Kumar',
  status: 'Moving',
  location: 'I-95 North, Mile Marker 142',
  telemetry: {
    speed: 68,
    fuelLevel: 72,
    engineHealth: 'Healthy',
    gpsConnected: true,
    tripDistance: 142,
    lastUpdate: '2 sec ago',
    latitude: 38.8951,
    longitude: -77.0364,
  }
};

const VehicleTelemetry: React.FC<VehicleTelemetryProps> = ({ vehicle = DEFAULT_VEHICLE }) => {
  const { id, name, driver, status, location, telemetry } = vehicle;

  return (
    <div className="telemetry-panel" id="selected-vehicle-panel">
      {/* Panel Header */}
      <div className="telemetry-panel__header">
        <div>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Selected Telemetry Stream
          </div>
          <div className="telemetry-panel__id">{id}</div>
          <div style={{ fontSize: '12px', color: 'var(--fd-text-secondary)' }}>{name}</div>
        </div>

        <span className={`status-badge status-badge--${status.toLowerCase()}`}>
          <span className="status-badge__dot" />
          {status.toUpperCase()}
        </span>
      </div>

      {/* Hero Speed Display */}
      <div className="telemetry-hero-speed">
        <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--fd-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>
          Current Velocity
        </div>
        <div className="telemetry-hero-speed__value">{telemetry.speed}</div>
        <div className="telemetry-hero-speed__unit">Kilometers / Hour</div>
      </div>

      {/* Primary Metrics Grid */}
      <div className="telemetry-grid">
        {/* Driver */}
        <div className="telemetry-item">
          <div className="telemetry-item__label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <User size={12} color="var(--fd-text-secondary)" /> Driver
          </div>
          <div className="telemetry-item__val">{driver}</div>
        </div>

        {/* Engine Health */}
        <div className="telemetry-item">
          <div className="telemetry-item__label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Activity size={12} color="#10B981" /> Engine
          </div>
          <div className="telemetry-item__val" style={{ color: '#10B981', fontWeight: 700 }}>
            {telemetry.engineHealth}
          </div>
        </div>

        {/* GPS */}
        <div className="telemetry-item">
          <div className="telemetry-item__label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Wifi size={12} color="var(--fd-color-primary)" /> GPS Signal
          </div>
          <div className="telemetry-item__val" style={{ color: 'var(--fd-color-primary)' }}>
            {telemetry.gpsConnected ? 'Connected' : 'Searching'}
          </div>
        </div>

        {/* Trip Distance */}
        <div className="telemetry-item">
          <div className="telemetry-item__label" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} color="var(--fd-text-secondary)" /> Trip Distance
          </div>
          <div className="telemetry-item__val">{telemetry.tripDistance} km</div>
        </div>
      </div>

      {/* Fuel Level Progress */}
      <div style={{ backgroundColor: 'var(--fd-bg-surface)', padding: '12px', borderRadius: '10px', border: '1px solid var(--fd-border-subtle)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--fd-text-secondary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Fuel size={14} color="#F59E0B" /> Fuel Level
          </span>
          <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--fd-text-primary)' }} className="tabular-nums">
            {telemetry.fuelLevel}%
          </span>
        </div>
        <div style={{ height: '6px', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              height: '100%',
              width: `${telemetry.fuelLevel}%`,
              backgroundColor: telemetry.fuelLevel > 25 ? '#10B981' : '#EF4444',
              borderRadius: '3px',
              transition: 'width 0.5s ease'
            }}
          />
        </div>
      </div>

      {/* Footer Location & Last Update */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '8px', borderTop: '1px solid var(--fd-border-subtle)', fontSize: '11px', color: 'var(--fd-text-secondary)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <MapPin size={12} /> {location}
        </span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <Clock size={12} /> {telemetry.lastUpdate}
        </span>
      </div>
    </div>
  );
};

export default VehicleTelemetry;
