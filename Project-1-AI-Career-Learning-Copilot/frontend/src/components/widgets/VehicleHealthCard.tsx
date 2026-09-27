/**
 * VehicleHealthCard.tsx – System & Fleet Status Overview Card
 */

import React from 'react';
import GlassCard from '../ui/GlassCard';

export interface VehicleHealthCardProps {
  vehicleId?: string;
  className?: string;
}

export const VehicleHealthCard: React.FC<VehicleHealthCardProps> = ({ className = '' }) => {
  return (
    <GlassCard className={`flex flex-col gap-3 ${className}`} id="vehicle-health-card">
      <div className="flex justify-between items-center border-b border-white/10 pb-2">
        <span className="text-xs font-semibold text-gray-200">Fleet Status</span>
        <span className="text-[10px] text-emerald-400 font-mono font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          98.4% Active
        </span>
      </div>
      <div className="space-y-2 mt-1">
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Active Trucks</span>
          <span className="font-mono text-white font-bold">4,982</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Idle in Hub</span>
          <span className="font-mono text-amber-400 font-bold">12</span>
        </div>
        <div className="flex justify-between items-center text-xs">
          <span className="text-gray-400">Offline / Repair</span>
          <span className="font-mono text-rose-400 font-bold">6</span>
        </div>
      </div>
    </GlassCard>
  );
};

export default VehicleHealthCard;
