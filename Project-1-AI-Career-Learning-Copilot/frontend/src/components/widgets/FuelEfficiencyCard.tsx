/**
 * FuelEfficiencyCard.tsx – Fleet Load & Speed Distribution Metrics Card
 */

import React from 'react';
import GlassCard from '../ui/GlassCard';

export interface FuelEfficiencyCardProps {
  className?: string;
}

export const FuelEfficiencyCard: React.FC<FuelEfficiencyCardProps> = ({ className = '' }) => {
  return (
    <GlassCard className={`flex flex-col gap-2 flex-1 justify-between ${className}`} id="fuel-efficiency-card">
      <span className="text-xs font-semibold text-gray-200">Load Distribution</span>
      <div className="space-y-3 my-2">
        <div>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Long Haul</span>
            <span className="text-white font-mono font-bold">65%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-cyan-500 h-full rounded-full w-[65%]" />
          </div>
        </div>
        <div>
          <div className="flex justify-between text-[11px] text-gray-400 mb-1">
            <span>Last-Mile Delivery</span>
            <span className="text-white font-mono font-bold">25%</span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div className="bg-emerald-500 h-full rounded-full w-[25%]" />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

export default FuelEfficiencyCard;

