
import React, { useState } from 'react';
import { ExternalHospital } from '../types';

interface HospitalGISMapProps {
  hospitals: ExternalHospital[];
  userLocation: { lat: number; lng: number } | null;
  onSelectHospital: (h: ExternalHospital) => void;
  selectedId?: string;
}

const HospitalGISMap: React.FC<HospitalGISMapProps> = ({ hospitals, userLocation, onSelectHospital, selectedId }) => {
  // Simulated coordinate mapping for a high-fidelity visual experience
  const mapWidth = 800;
  const mapHeight = 450;

  // Scale factors based on mock city boundaries
  const getX = (lng: number) => (lng - 77.57) * 15000;
  const getY = (lat: number) => (lat - 12.94) * 15000;

  return (
    <div className="relative w-full h-[450px] bg-slate-950 rounded-[2.5rem] overflow-hidden border border-slate-800 shadow-2xl group">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ 
        backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)', 
        backgroundSize: '30px 30px' 
      }}></div>
      
      {/* Scanning Line Animation */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-500/5 to-transparent h-1/2 w-full animate-[scan_4s_linear_infinite] pointer-events-none"></div>

      <svg width="100%" height="100%" viewBox={`0 0 ${mapWidth} ${mapHeight}`} className="relative z-10">
        {/* Simulated Road Connections */}
        <g opacity="0.2">
          {hospitals.map((h, i) => (
            <line 
              key={`road-${i}`}
              x1={mapWidth/2} y1={mapHeight/2} 
              x2={getX(h.location.lng)} y2={getY(h.location.lat)} 
              stroke="#3b82f6" strokeWidth="1" strokeDasharray="4 4"
            />
          ))}
        </g>

        {/* User Location Pulse */}
        {userLocation && (
          <g transform={`translate(${mapWidth/2}, ${mapHeight/2})`}>
            <circle r="12" fill="#3b82f6" className="animate-ping opacity-30" />
            <circle r="6" fill="#3b82f6" stroke="white" strokeWidth="2" />
            <text y="20" textAnchor="middle" className="text-[8px] fill-blue-400 font-black uppercase">Tactical Origin</text>
          </g>
        )}

        {/* Hospital Markers */}
        {hospitals.map(h => {
          const x = getX(h.location.lng);
          const y = getY(h.location.lat);
          const isSelected = h.id === selectedId;
          const statusColor = h.loadScore > 80 ? '#e11d48' : h.loadScore > 50 ? '#f59e0b' : '#10b981';

          return (
            <g 
              key={h.id} 
              transform={`translate(${x}, ${y})`} 
              className="cursor-pointer group/marker"
              onClick={() => onSelectHospital(h)}
            >
              <circle r={isSelected ? 16 : 10} fill={statusColor} className={`transition-all duration-300 ${isSelected ? 'opacity-30' : 'opacity-20'}`} />
              <circle r={isSelected ? 8 : 5} fill={statusColor} className="transition-all duration-300" />
              {isSelected && <circle r="20" fill="none" stroke={statusColor} strokeWidth="1" className="animate-ping opacity-20" />}
              
              <text y="-25" textAnchor="middle" className={`text-[10px] font-black uppercase tracking-widest transition-all ${isSelected ? 'fill-white' : 'fill-slate-500 group-hover/marker:fill-slate-300'}`}>
                {h.name}
              </text>
              <text y="-14" textAnchor="middle" className="text-[7px] font-bold fill-slate-400 opacity-0 group-hover/marker:opacity-100 uppercase">
                {h.travelTimeMins}m Arrival
              </text>
            </g>
          );
        })}
      </svg>

      {/* Compass Overlay */}
      <div className="absolute top-6 left-6 p-4 bg-black/40 backdrop-blur-md rounded-2xl border border-white/10">
        <div className="w-8 h-8 rounded-full border border-white/20 flex items-center justify-center text-[10px] font-black text-white/40">N</div>
      </div>

      {/* Map Legend */}
      <div className="absolute bottom-6 right-6 p-4 bg-black/60 backdrop-blur-md rounded-2xl border border-white/10 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">High Availability</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Resource Ceiling</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">Diversion Alert</span>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(200%); }
        }
      `}} />
    </div>
  );
};

export default HospitalGISMap;
