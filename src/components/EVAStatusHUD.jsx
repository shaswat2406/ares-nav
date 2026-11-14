import React from 'react';
import { ShieldCheck, AlertTriangle, Wind, Compass, Zap, Flame, Radiation, Eye } from 'lucide-react';
import { SOL_TELEMETRY } from '../data/jezeroData';

export const EVAStatusHUD = ({ activeRoute, selectedTarget, activeLayers, setActiveLayers }) => {
  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl space-y-4">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono tracking-widest text-emerald-400 font-semibold uppercase">
            EVA HUD // LIVE TELEMETRY
          </span>
        </div>
        <div className="text-xs font-mono text-slate-400">
          SOL {SOL_TELEMETRY.solNumber} | JEZERO CRATER
        </div>
      </div>

      {/* Atmospheric / Environment Gauges */}
      <div className="grid grid-cols-4 gap-2 text-center">
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Flame className="w-3 h-3 text-cyan-400" /> TEMP
          </div>
          <div className="text-sm font-bold font-mono text-cyan-300 mt-1">
            {SOL_TELEMETRY.airTempC}°C
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Wind className="w-3 h-3 text-amber-400" /> WIND
          </div>
          <div className="text-sm font-bold font-mono text-amber-300 mt-1">
            {SOL_TELEMETRY.windSpeedMs} m/s
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Radiation className="w-3 h-3 text-rose-400" /> RAD
          </div>
          <div className="text-sm font-bold font-mono text-rose-300 mt-1">
            {SOL_TELEMETRY.radiationMilliSievertsPerDay} mSv
          </div>
        </div>
        <div className="bg-slate-950/70 border border-slate-800/80 rounded-lg p-2">
          <div className="text-[10px] text-slate-400 font-mono flex items-center justify-center gap-1">
            <Compass className="w-3 h-3 text-purple-400" /> PRESS
          </div>
          <div className="text-sm font-bold font-mono text-purple-300 mt-1">
            {SOL_TELEMETRY.pressurePa} Pa
          </div>
        </div>
      </div>

      {/* Route Traversal Analytics */}
      <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-mono text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-yellow-400" /> Route Profile:
          </span>
          <span className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
            activeRoute.safetyScore > 80 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/50' 
              : 'bg-rose-950 text-rose-400 border border-rose-700/50'
          }`}>
            Safety Score: {activeRoute.safetyScore}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div>
            <div className="text-[10px] text-slate-500">TRAVERSE</div>
            <div className="text-xs font-semibold text-slate-200">{activeRoute.distanceKm} km</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">EST. DURATION</div>
            <div className="text-xs font-semibold text-slate-200">{activeRoute.estimatedMinutes} min</div>
          </div>
          <div>
            <div className="text-[10px] text-slate-500">MAX INCLINE</div>
            <div className={`text-xs font-semibold ${activeRoute.maxSlopeDeg > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {activeRoute.maxSlopeDeg}° {activeRoute.maxSlopeDeg > 15 ? '(HAZARD)' : '(SAFE)'}
            </div>
          </div>
        </div>

        {/* Oxygen & Caloric Load Bars */}
        <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">EVA Suit O₂ Expended:</span>
            <span className="text-cyan-400 font-bold">{activeRoute.oxygenUsedPercent}%</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                activeRoute.oxygenUsedPercent > 50 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${activeRoute.oxygenUsedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="space-y-2">
        <div className="text-[11px] font-mono uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Eye className="w-3.5 h-3.5 text-blue-400" /> Multi-Mission NASA Layers
          </span>
          <span className="text-[10px] text-slate-500">TOGGLE ON/OFF</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, topography: !prev.topography }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
              activeLayers.topography 
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-900/30' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span>Topography / Slope</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.topography ? 'bg-amber-400' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, mineralogy: !prev.mineralogy }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
              activeLayers.mineralogy 
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-900/30' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span>CRISM Mineralogy</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.mineralogy ? 'bg-purple-400' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, hazards: !prev.hazards }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
              activeLayers.hazards 
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-sm shadow-rose-900/30' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span>Hazards & Cliffs</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.hazards ? 'bg-rose-400' : 'bg-slate-700'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, targets: !prev.targets }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all ${
              activeLayers.targets 
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm shadow-cyan-900/30' 
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <span>Science Targets</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.targets ? 'bg-cyan-400' : 'bg-slate-700'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
