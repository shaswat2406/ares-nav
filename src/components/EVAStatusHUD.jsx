import React from 'react';
import { ShieldCheck, AlertTriangle, Wind, Compass, Zap, Flame, Radiation, Eye } from 'lucide-react';
import { SOL_TELEMETRY } from '../data/jezeroData';

export const EVAStatusHUD = ({ activeRoute, selectedTarget, activeLayers, setActiveLayers }) => {
  return (
    <div className="hud-panel hud-corner-tl hud-corner-br rounded-xl p-3.5 space-y-3 border-cyan-500/30">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-heading text-xs font-bold tracking-widest text-emerald-400">
            ATMOSPHERIC TELEMETRY // MEDA
          </span>
        </div>
        <div className="text-[11px] font-mono text-cyan-300 font-bold bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-500/30">
          SOL {SOL_TELEMETRY.solNumber} // JEZERO
        </div>
      </div>

      {/* Atmospheric / Environment Gauges */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono">
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
            <Flame className="w-2.5 h-2.5 text-cyan-400" /> AMBIENT
          </div>
          <div className="text-xs font-bold text-cyan-300 mt-1">
            {SOL_TELEMETRY.airTempC}°C
          </div>
        </div>
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
            <Wind className="w-2.5 h-2.5 text-amber-400" /> ANEMOMETER
          </div>
          <div className="text-xs font-bold text-amber-300 mt-1">
            {SOL_TELEMETRY.windSpeedMs} m/s
          </div>
        </div>
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
            <Radiation className="w-2.5 h-2.5 text-rose-400" /> RAD FLUX
          </div>
          <div className="text-xs font-bold text-rose-300 mt-1">
            {SOL_TELEMETRY.radiationMilliSievertsPerDay} mSv
          </div>
        </div>
        <div className="bg-slate-950/90 border border-slate-800 rounded-lg p-2">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1">
            <Compass className="w-2.5 h-2.5 text-purple-400" /> BAROMETER
          </div>
          <div className="text-xs font-bold text-purple-300 mt-1">
            {SOL_TELEMETRY.pressurePa} Pa
          </div>
        </div>
      </div>

      {/* Route Traversal Analytics */}
      <div className="bg-slate-950/90 border border-cyan-500/20 rounded-lg p-3 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> Traversal Status:
          </span>
          <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
            activeRoute.safetyScore > 80 
              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/50 hud-glow-green' 
              : 'bg-rose-950 text-rose-400 border border-rose-500/50 animate-pulse'
          }`}>
            Safety Integrity: {activeRoute.safetyScore}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono">
          <div>
            <div className="text-[9px] text-slate-500 uppercase">Total Track</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{activeRoute.distanceKm} km</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">Est. MET Time</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{activeRoute.estimatedMinutes} min</div>
          </div>
          <div>
            <div className="text-[9px] text-slate-500 uppercase">Max Incline</div>
            <div className={`text-xs font-bold mt-0.5 ${activeRoute.maxSlopeDeg > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
              {activeRoute.maxSlopeDeg}°
            </div>
          </div>
        </div>

        {/* Oxygen Load Bar */}
        <div className="space-y-1 pt-2 border-t border-slate-800">
          <div className="flex justify-between text-[11px] font-mono">
            <span className="text-slate-400">EVA Suit O₂ Expended:</span>
            <span className="text-cyan-400 font-bold">{activeRoute.oxygenUsedPercent}%</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden border border-slate-800">
            <div 
              className={`h-full rounded-full transition-all duration-500 ${
                activeRoute.oxygenUsedPercent > 50 ? 'bg-amber-400' : 'bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.7)]'
              }`}
              style={{ width: `${activeRoute.oxygenUsedPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Layer Visibility Toggles */}
      <div className="space-y-2">
        <div className="text-[10px] font-heading font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> NASA SCIENCE SENSOR OVERLAYS
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, topography: !prev.topography }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.topography 
                ? 'bg-amber-950/40 border-amber-500/60 text-amber-200 shadow-sm shadow-amber-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>MOLA Topo Mesh</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.topography ? 'bg-amber-400 animate-pulse' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, mineralogy: !prev.mineralogy }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.mineralogy 
                ? 'bg-purple-950/40 border-purple-500/60 text-purple-200 shadow-sm shadow-purple-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>CRISM Mineralogy</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.mineralogy ? 'bg-purple-400 animate-pulse' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, hazards: !prev.hazards }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.hazards 
                ? 'bg-rose-950/40 border-rose-500/60 text-rose-200 shadow-sm shadow-rose-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>Hazard &gt;15° Zones</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.hazards ? 'bg-rose-400 animate-pulse' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => setActiveLayers(prev => ({ ...prev, targets: !prev.targets }))}
            className={`p-2 rounded-lg border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.targets 
                ? 'bg-cyan-950/40 border-cyan-500/60 text-cyan-200 shadow-sm shadow-cyan-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>Science Targets</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.targets ? 'bg-cyan-400 animate-pulse' : 'bg-slate-800'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
