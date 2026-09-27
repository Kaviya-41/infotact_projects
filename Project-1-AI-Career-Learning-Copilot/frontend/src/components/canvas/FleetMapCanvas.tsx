/**
 * FleetMapCanvas.tsx – Live Fleet Map / Vehicle Telemetry Canvas Stage
 * @deprecated This dark-themed canvas map is superseded by the light-theme
 * MapPlaceholder.tsx used in the Dashboard. Retained as the base reference
 * for Week 3 Canvas API integration work.
 */

import React, { useState } from 'react';
import { Compass, ZoomIn, ZoomOut, Truck } from 'lucide-react';
import ActiveRouteCard from '../widgets/ActiveRouteCard';
import VehicleAlertBanner from '../widgets/VehicleAlertBanner';

interface VehicleMarker {
  id: string;
  name: string;
  driver: string;
  status: 'Moving' | 'Stopped' | 'Offline';
  speed: number;
  x: number; // percentage
  y: number; // percentage
}

const SAMPLE_MARKERS: VehicleMarker[] = [
  { id: 'FLT-024', name: 'Cascadia #24', driver: 'Arjun Kumar', status: 'Moving', speed: 68, x: 42, y: 38 },
  { id: 'FLT-012', name: 'Sprinter Van #12', driver: 'Sarah Chen', status: 'Moving', speed: 54, x: 28, y: 62 },
  { id: 'FLT-007', name: 'Volvo FH16 #07', driver: 'Marcus Vance', status: 'Moving', speed: 72, x: 68, y: 25 },
  { id: 'FLT-031', name: 'Ford Transit #31', driver: 'Elena Rostova', status: 'Stopped', speed: 0, x: 55, y: 70 },
  { id: 'FLT-018', name: 'Kenworth T680 #18', driver: 'David Miller', status: 'Offline', speed: 0, x: 78, y: 52 },
  { id: 'FLT-005', name: 'Isuzu NPR #05', driver: 'Kenji Sato', status: 'Moving', speed: 48, x: 18, y: 45 },
];

export const FleetMapCanvas: React.FC = () => {
  const [selectedId, setSelectedId] = useState('FLT-024');
  const [zoomLevel, setZoomLevel] = useState(12);

  return (
    <div className="center-stage relative bg-[#13161F]/40 border border-white/10 rounded-3xl overflow-hidden flex flex-col justify-between p-6 h-full min-h-[620px]" id="fleet-map-stage">
      {/* Background Grid Pattern representing map viewport environment */}
      <div className="absolute inset-0 bg-[radial-gradient(#1e2638_1px,transparent_1px)] [background-size:16px_16px] opacity-40 pointer-events-none" />

      {/* Top Floating Overlays */}
      <div className="relative z-10 flex justify-between items-start w-full">
        <ActiveRouteCard />
        <VehicleAlertBanner />
      </div>

      {/* Main Map Visualizer Stage */}
      <div className="absolute inset-0 w-full h-full">
        {/* Preserved Canvas Element for HTML5 Canvas Node Viewport */}
        <canvas
          id="fleet-map-canvas"
          className="absolute inset-0 w-full h-full pointer-events-none z-10"
        ></canvas>

        {/* Vector SVG Dark Map Grid & Road Network */}
        <svg width="100%" height="100%" className="absolute inset-0 bg-[#0E1118]">
          <defs>
            <pattern id="dark-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dark-map-grid)" />

          {/* Primary Dark Arterial Road Lines */}
          <path d="M -50 200 Q 350 240 700 180 T 1300 320" fill="none" stroke="#1E2638" strokeWidth="8" strokeLinecap="round" />
          <path d="M 240 -50 Q 270 280 440 680" fill="none" stroke="#1E2638" strokeWidth="8" strokeLinecap="round" />
          <path d="M -50 460 Q 550 420 1200 520" fill="none" stroke="#171F30" strokeWidth="5" />
          <path d="M 720 -50 Q 640 340 820 680" fill="none" stroke="#171F30" strokeWidth="5" />

          {/* Active Fleet Route (Highlight Cyan/Orange Line) */}
          <path
            d="M 200 480 Q 300 640 440 400 T 700 280"
            fill="none"
            stroke="#FF8A00"
            strokeWidth="3.5"
            strokeDasharray="8 5"
          />

          {/* Geofence Overlay Region */}
          <polygon
            points="340,190 540,200 600,340 400,360"
            fill="rgba(6, 182, 212, 0.08)"
            stroke="#06B6D4"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text x="360" y="220" fill="#06B6D4" fontSize="11" fontWeight="700" letterSpacing="0.5">
            GEOFENCE REGION ALPHA
          </text>
        </svg>

        {/* Canvas Placeholder Node Label */}
        <div className="absolute inset-0 flex items-center justify-center text-white/20 font-mono text-sm pointer-events-none z-10">
          [ HTML5 Canvas Node Viewport — 5000+ Vehicles Map Layer ]
        </div>

        {/* Interactive Vehicle Markers */}
        <div className="absolute inset-0 z-20">
          {SAMPLE_MARKERS.map((v) => {
            const isSelected = selectedId === v.id;
            const statusColor = v.status === 'Moving' ? '#10B981' : v.status === 'Stopped' ? '#FF8A00' : '#EF4444';

            return (
              <div
                key={v.id}
                onClick={() => setSelectedId(v.id)}
                className="absolute cursor-pointer flex flex-col items-center gap-1 transition-transform hover:scale-110"
                style={{
                  left: `${v.x}%`,
                  top: `${v.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
              >
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold shadow-lg backdrop-blur-md border ${
                  isSelected ? 'bg-slate-900 text-white border-[#FF8A00]' : 'bg-[#161B26]/90 text-gray-200 border-white/10'
                }`}>
                  <span className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColor }}></span>
                  <Truck size={12} />
                  <span>{v.id}</span>
                  {v.status === 'Moving' && (
                    <span className="text-[10px] text-[#FF8A00] font-mono font-bold">
                      {v.speed} km/h
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Right Map Zoom Controls */}
        <div className="absolute bottom-16 right-6 z-20 flex items-center gap-2">
          <div className="flex gap-1">
            <button
              onClick={() => setZoomLevel(prev => Math.min(prev + 1, 18))}
              className="p-2 rounded-lg border border-white/10 bg-[#161B26]/80 text-white hover:bg-white/10 cursor-pointer"
            >
              <ZoomIn size={14} />
            </button>
            <button
              onClick={() => setZoomLevel(prev => Math.max(prev - 1, 6))}
              className="p-2 rounded-lg border border-white/10 bg-[#161B26]/80 text-white hover:bg-white/10 cursor-pointer"
            >
              <ZoomOut size={14} />
            </button>
          </div>
          <div className="bg-[#161B26]/80 backdrop-blur-md border border-white/10 rounded-lg px-3 py-1.5 text-xs text-gray-400 font-mono">
            {zoomLevel}x
          </div>
          <div className="w-8 h-8 rounded-full bg-[#161B26]/80 border border-white/10 flex items-center justify-center text-cyan-400">
            <Compass size={18} />
          </div>
        </div>
      </div>

      {/* Bottom Bar Info Telemetry Stream */}
      <div className="relative z-20 flex justify-between items-center bg-[#161B26]/80 backdrop-blur-md border border-white/10 rounded-xl px-4 py-2 text-xs text-gray-400 mt-auto">
        <span>Engine: <strong className="text-emerald-400 font-mono">Canvas 2D / RAF (60 FPS)</strong></span>
        <span>WebSocket Stream: <strong className="text-cyan-400 font-mono">Connected (5,000 evt/s)</strong></span>
      </div>
    </div>
  );
};

export default FleetMapCanvas;

