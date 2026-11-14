import React from 'react';
import { ShieldCheck, AlertTriangle, Wind, Compass, Zap, Flame, Radiation, Eye, CloudDrizzle, RefreshCw } from 'lucide-react';
import { SOL_TELEMETRY } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';

export const EVAStatusHUD = ({ activeRoute, selectedTarget, activeLayers, setActiveLayers, dustStorm, setDustStorm }) => {
  // Dynamic atmospheric calculations during dust storm
  const currentTau = dustStorm ? 2.85 : SOL_TELEMETRY.dustOpticalDepthTau;
  const currentWind = dustStorm ? 18.6 : SOL_TELEMETRY.windSpeedMs;
  const currentTemp = dustStorm ? -41.5 : SOL_TELEMETRY.airTempC; // Dust storms trap infrared heat!

  const toggleDustStorm = () => {
    sfx.click();
    if (!dustStorm) {
      sfx.hazardAlarm();
    }
    setDustStorm(!dustStorm);
  };

  return (
    <div className={`hud-glass hud-corner-tl hud-corner-br rounded-2xl p-4 space-y-3.5 transition-all duration-500 ${
      dustStorm ? 'border-amber-500/60 shadow-[0_0_25px_rgba(245,158,11,0.25)]' : 'border-cyan-500/30'
    }`}>
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center space-x-2">
          <span className={`w-2.5 h-2.5 rounded-full ${dustStorm ? 'bg-amber-500 animate-ping' : 'bg-emerald-400 animate-ping'}`} />
          <span className="font-heading text-xs font-bold tracking-widest text-slate-100 uppercase">
            ATMOSPHERIC TELEMETRY // MEDA
          </span>
        </div>
        <div className="text-[11px] font-mono-num font-bold text-cyan-300 bg-cyan-950/70 px-2 py-0.5 rounded border border-cyan-500/30">
          SOL {SOL_TELEMETRY.solNumber} // JEZERO
        </div>
      </div>

      {/* Atmospheric / Environment Gauges */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono-num">
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Flame className="w-3 h-3 text-cyan-400" /> AMBIENT
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1">
            {currentTemp}°C
          </div>
        </div>

        <div className={`border rounded-xl p-2.5 transition-all ${
          dustStorm ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Wind className="w-3 h-3 text-amber-400" /> ANEMO
          </div>
          <div className="text-sm font-bold mt-1">
            {currentWind} <span className="text-[10px] font-normal text-slate-400">m/s</span>
          </div>
        </div>

        <div className={`border rounded-xl p-2.5 transition-all ${
          dustStorm ? 'bg-amber-950/60 border-amber-500/50 text-amber-300' : 'bg-slate-950/80 border-slate-800 text-slate-200'
        }`}>
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <CloudDrizzle className="w-3 h-3 text-rose-400" /> DUST TAU
          </div>
          <div className="text-sm font-bold mt-1">
            {currentTau}
          </div>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-2.5">
          <div className="text-[10px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Radiation className="w-3 h-3 text-rose-400" /> RAD FLUX
          </div>
          <div className="text-sm font-bold text-rose-300 mt-1">
            {SOL_TELEMETRY.radiationMilliSievertsPerDay} <span className="text-[9px] text-slate-400">mSv</span>
          </div>
        </div>
      </div>

      {/* Emergency Dust Storm Trigger */}
      <button
        onClick={toggleDustStorm}
        className={`w-full py-2 px-3 rounded-xl text-xs font-mono font-bold flex items-center justify-center gap-2 transition-all cursor-pointer border ${
          dustStorm
            ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white border-amber-400 shadow-[0_0_20px_rgba(245,158,11,0.5)] animate-pulse'
            : 'bg-slate-950/80 hover:bg-amber-950/40 text-amber-400 border-amber-500/40 hover:border-amber-400'
        }`}
      >
        <AlertTriangle className="w-4 h-4" />
        {dustStorm ? '⚠️ DUST STORM ACTIVE // PURGE & RETURN TO HAB' : 'SIMULATE DUST STORM EMERGENCY'}
      </button>

      {/* NASA Science Layer Overlays Toggles */}
      <div className="space-y-2 pt-1 border-t border-slate-800/80">
        <div className="text-[11px] font-heading font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
          <span className="flex items-center gap-1.5 text-cyan-300">
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> NASA SCIENCE SENSOR OVERLAYS
          </span>
          <span className="text-[10px] text-slate-500 font-mono">3D SHADER</span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <button
            onClick={() => {
              sfx.click();
              setActiveLayers(prev => ({ ...prev, hazards: !prev.hazards }));
            }}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.hazards 
                ? 'bg-rose-950/40 border-rose-500/70 text-rose-200 shadow-sm shadow-rose-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>Hazard &gt;15° Zones</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.hazards ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => {
              sfx.click();
              setActiveLayers(prev => ({ ...prev, mineralogy: !prev.mineralogy }));
            }}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.mineralogy 
                ? 'bg-purple-950/40 border-purple-500/70 text-purple-200 shadow-sm shadow-purple-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>CRISM Mineralogy</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.mineralogy ? 'bg-purple-400 shadow-[0_0_8px_#c084fc]' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => {
              sfx.click();
              setActiveLayers(prev => ({ ...prev, topography: !prev.topography }));
            }}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.topography 
                ? 'bg-amber-950/40 border-amber-500/70 text-amber-200 shadow-sm shadow-amber-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>MOLA Topo Mesh</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.topography ? 'bg-amber-400 shadow-[0_0_8px_#f59e0b]' : 'bg-slate-800'}`} />
          </button>

          <button
            onClick={() => {
              sfx.click();
              setActiveLayers(prev => ({ ...prev, targets: !prev.targets }));
            }}
            className={`p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
              activeLayers.targets 
                ? 'bg-cyan-950/40 border-cyan-500/70 text-cyan-200 shadow-sm shadow-cyan-900/30' 
                : 'bg-slate-950/80 border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <span>Science Targets</span>
            <span className={`w-2 h-2 rounded-full ${activeLayers.targets ? 'bg-cyan-400 shadow-[0_0_8px_#00f0ff]' : 'bg-slate-800'}`} />
          </button>
        </div>
      </div>
    </div>
  );
};
