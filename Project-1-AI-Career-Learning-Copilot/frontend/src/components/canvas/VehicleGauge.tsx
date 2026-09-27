/**
 * VehicleGauge.tsx – Radial Fleet Speed & Velocity Telemetry Gauge
 */

import React from 'react';
import GlassCard from '../ui/GlassCard';
import type { VehicleSpeed } from '../../types/telemetry';

export interface VehicleGaugeProps {
  data?: VehicleSpeed;
}

const DEFAULT_SPEED: VehicleSpeed = {
  value: 58,
  rpm: 2100,
  fuelEfficiency: 12.4,
  tripDistance: 142,
  updated: 'Just now',
};

export const VehicleGauge: React.FC<VehicleGaugeProps> = ({ data = DEFAULT_SPEED }) => {
  return (
    <GlassCard className="flex flex-col items-center justify-center relative overflow-hidden text-white" id="vehicle-speed-gauge">
      <div className="w-full flex items-center justify-between text-xs font-semibold text-gray-400 mb-2">
        <span>Fleet Velocity</span>
        <span className="text-[10px] text-[#FF8A00] font-mono font-medium">REALTIME</span>
      </div>

      <div className="my-3 flex flex-col items-center">
        <span className="text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_15px_rgba(255,138,0,0.35)]">
          {data.value} <span className="text-sm font-normal text-gray-400">km/h</span>
        </span>
        <span className="text-[11px] text-[#FF8A00] font-medium mt-1">Average Fleet Speed</span>
      </div>

      <div className="w-full bg-gray-800/80 rounded-full h-1.5 overflow-hidden mt-1">
        <div
          className="bg-[#FF8A00] h-full rounded-full transition-all duration-500 shadow-[0_0_8px_#FF8A00]"
          style={{ width: `${Math.min((data.value / 120) * 100, 100)}%` }}
        />
      </div>
    </GlassCard>
  );
};

export default VehicleGauge;

