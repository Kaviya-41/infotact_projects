/**
 * VehicleList.tsx – Enterprise Fleet Vehicle Telemetry Table
 *
 * Phase 9: Accepts vehicles as props from parent (real API data).
 * Removed SAMPLE_VEHICLES hardcoded array.
 * Preserves all existing table design, filters, pagination UI.
 */

import React, { useState, useMemo } from 'react';
import { Search, Filter, ChevronLeft, ChevronRight, Truck, Wifi } from 'lucide-react';
import type { Vehicle } from '../types/fleet';
import '../styles/dashboard.css';

interface VehicleListProps {
  vehicles?: Vehicle[];
  loading?: boolean;
  error?: string | null;
  onSelectVehicle?: (vehicle: Vehicle) => void;
  selectedVehicleId?: string;
}

const VehicleList: React.FC<VehicleListProps> = ({
  vehicles = [],
  loading = false,
  error = null,
  onSelectVehicle,
  selectedVehicleId,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  const filteredVehicles = useMemo(() => {
    return vehicles.filter((v) => {
      const matchesSearch =
        v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.driver.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.name.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus = statusFilter === 'ALL' || v.status.toUpperCase() === statusFilter.toUpperCase();

      return matchesSearch && matchesStatus;
    });
  }, [vehicles, searchTerm, statusFilter]);

  return (
    <div className="table-card" id="vehicle-fleet-table">
      {/* Table Toolbar */}
      <div className="table-toolbar">
        <div>
          <h3 className="fleet-card__title">Vehicle Fleet Telemetry</h3>
          <p style={{ fontSize: '12px', color: 'var(--fd-text-secondary)', marginTop: '2px' }}>
            Live status metrics across all connected satellite nodes
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Filter size={14} color="var(--fd-text-secondary)" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-select"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: '1px solid var(--fd-border-color)',
                backgroundColor: 'var(--fd-bg-input)',
                fontSize: '13px',
                color: 'var(--fd-text-primary)',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="ALL">All Statuses ({vehicles.length})</option>
              <option value="MOVING">Moving</option>
              <option value="STOPPED">Stopped</option>
              <option value="OFFLINE">Offline</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="table-toolbar__search">
            <Search size={14} className="header__search-icon" />
            <input
              type="search"
              className="table-toolbar__search-input"
              placeholder="Filter by vehicle, driver..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Table Content */}
      <div className="fleet-table-wrapper">
        {loading ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--fd-text-secondary)', fontSize: '13px' }}>
            Loading fleet vehicles...
          </div>
        ) : error ? (
          <div style={{ padding: '48px 24px', textAlign: 'center', color: '#EF4444', fontSize: '13px' }}>
            {error}
          </div>
        ) : (
          <table className="fleet-table">
            <thead>
              <tr>
                <th>Vehicle ID</th>
                <th>Driver Name</th>
                <th>Status</th>
                <th>Velocity</th>
                <th>Fuel Level</th>
                <th>GPS Signal</th>
                <th>Current Location</th>
                <th>Last Update</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '32px', color: 'var(--fd-text-secondary)' }}>
                    {vehicles.length === 0
                      ? 'No vehicles found. Add vehicles to your fleet to see them here.'
                      : 'No vehicles matched your search filter criteria.'}
                  </td>
                </tr>
              ) : (
                filteredVehicles.map((v) => {
                  const isSelected = selectedVehicleId === v.id;
                  return (
                    <tr
                      key={v.id}
                      onClick={() => onSelectVehicle && onSelectVehicle(v)}
                      style={{
                        cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.12)' : undefined
                      }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Truck size={16} color="var(--fd-color-primary)" />
                          <div>
                            <div style={{ fontWeight: 700, color: 'var(--fd-text-primary)' }}>{v.id}</div>
                            <div style={{ fontSize: '11px', color: 'var(--fd-text-secondary)' }}>{v.name}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontWeight: 600, color: 'var(--fd-text-secondary)' }}>{v.driver}</td>
                      <td>
                        <span className={`status-badge status-badge--${v.status.toLowerCase()}`}>
                          <span className="status-badge__dot" />
                          {v.status}
                        </span>
                      </td>
                      <td className="tabular-nums" style={{ fontWeight: 700 }}>
                        {v.telemetry.speed > 0 ? `${v.telemetry.speed} km/h` : '0 km/h'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <div style={{ width: '60px', height: '6px', backgroundColor: 'var(--fd-border-subtle)', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                height: '100%',
                                width: `${v.telemetry.fuelLevel}%`,
                                backgroundColor: v.telemetry.fuelLevel > 25 ? '#10B981' : '#EF4444'
                              }}
                            />
                          </div>
                          <span className="tabular-nums" style={{ fontSize: '12px', fontWeight: 600 }}>{v.telemetry.fuelLevel}%</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: v.telemetry.gpsConnected === null ? 'var(--fd-text-secondary)' : v.telemetry.gpsConnected ? '#10B981' : '#EF4444' }}>
                          <Wifi size={14} /> {v.telemetry.gpsConnected === null ? '—' : v.telemetry.gpsConnected ? 'Online' : 'Lost'}
                        </div>
                      </td>
                      <td style={{ color: 'var(--fd-text-secondary)', fontSize: '12px' }}>{v.location}</td>
                      <td className="tabular-nums" style={{ color: 'var(--fd-text-muted)', fontSize: '12px' }}>{v.telemetry.lastUpdate}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        backgroundColor: 'var(--fd-bg-surface)',
        borderTop: '1px solid var(--fd-border-subtle)',
        fontSize: '12px',
        color: 'var(--fd-text-secondary)'
      }}>
        <div>Showing {filteredVehicles.length > 0 ? 1 : 0}-{filteredVehicles.length} of {vehicles.length} vehicles</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button style={{ padding: '4px 8px', border: '1px solid var(--fd-border-color)', borderRadius: '6px', background: 'var(--fd-bg-card)', color: 'var(--fd-text-secondary)', cursor: 'pointer' }} disabled>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontWeight: 600, color: 'var(--fd-text-primary)' }}>Page 1 of 1</span>
          <button style={{ padding: '4px 8px', border: '1px solid var(--fd-border-color)', borderRadius: '6px', background: 'var(--fd-bg-card)', color: 'var(--fd-text-secondary)', cursor: 'pointer' }} disabled>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default VehicleList;
