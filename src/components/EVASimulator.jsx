import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Heart, Battery, Radio, Compass, ShieldAlert } from 'lucide-react';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';

export const EVASimulator = ({ activeRoute, onProgressUpdate, dustStorm }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [heartRate, setHeartRate] = useState(88);
  const [battery, setBattery] = useState(99.4);
  const [suitPressurePsi, setSuitPressurePsi] = useState(4.3);

  // Faster battery/O2 drain during dust storm
  const drainRate = dustStorm ? 0.28 : 0.08;

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            sfx.scienceSuccess();
            confetti({
              particleCount: 130,
              spread: 75,
              origin: { y: 0.75 },
              colors: ['#00f0ff', '#ff9900', '#00ff88']
            });
            return 100;
          }
          const next = prev + 1;
          if (onProgressUpdate) onProgressUpdate(next);

          const isSteep = activeRoute.safetyScore < 80 && next > 35 && next < 70;
          setHeartRate(isSteep ? Math.floor(145 + Math.random() * 15) : Math.floor(86 + Math.random() * 8));
          setBattery(b => Math.max(8, b - drainRate));

          if (isSteep && next % 8 === 0) {
            sfx.hazardAlarm();
          }

          return next;
        });
      }, 160);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeRoute, onProgressUpdate, drainRate]);

  const togglePlay = () => {
    sfx.click();
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    sfx.click();
    setIsPlaying(false);
    setProgress(0);
    if (onProgressUpdate) onProgressUpdate(0);
    setHeartRate(88);
    setBattery(99.4);
  };

  const currentKm = ((progress / 100) * activeRoute.distanceKm).toFixed(2);
  const isDanger = activeRoute.safetyScore < 80;

  return (
    <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl p-4 space-y-3.5 border-cyan-500/30">
      {/* Simulation Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center space-x-2">
          <span className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
          </span>
          <span className="font-heading text-xs font-bold tracking-wider text-cyan-300">
            EVA TACTICAL LIFE-SUPPORT // SIMULATOR
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-lg shadow-cyan-500/30'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'HOLD' : 'EXECUTE EVA'}
          </button>
          <button
            onClick={handleReset}
            className="p-1 rounded-lg bg-slate-900 border border-slate-700 hover:border-slate-500 text-slate-400 hover:text-white transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Traversal Distance Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono-num">
          <span className="text-slate-400 font-sans">DISPLACEMENT:</span>
          <span className="text-cyan-300 font-bold">{currentKm} / {activeRoute.distanceKm} KM ({progress}%)</span>
        </div>
        <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
          <div
            className={`h-full rounded-full transition-all duration-150 ${
              isDanger 
                ? 'bg-gradient-to-r from-amber-500 to-rose-600 shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                : 'bg-gradient-to-r from-cyan-400 to-emerald-400 shadow-[0_0_10px_rgba(0,240,255,0.5)]'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Real-time Astronaut Biometric HUD Sensors */}
      <div className="grid grid-cols-4 gap-2 text-center font-mono-num">
        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Heart className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> METABOLIC
          </div>
          <div className={`text-sm font-bold mt-1 ${heartRate > 120 ? 'text-rose-400 animate-pulse glow-amber' : 'text-slate-100'}`}>
            {heartRate} <span className="text-[9px] text-slate-500">BPM</span>
          </div>
        </div>

        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Battery className="w-2.5 h-2.5 text-emerald-400" /> EMU POWER
          </div>
          <div className={`text-sm font-bold mt-1 ${battery < 25 ? 'text-rose-400 animate-pulse' : 'text-emerald-300'}`}>
            {battery.toFixed(1)}%
          </div>
        </div>

        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Compass className="w-2.5 h-2.5 text-cyan-400" /> SUIT O₂
          </div>
          <div className="text-sm font-bold text-cyan-300 mt-1">
            {suitPressurePsi} <span className="text-[9px] text-slate-500">PSI</span>
          </div>
        </div>

        <div className="bg-slate-950/90 p-2.5 rounded-xl border border-slate-800">
          <div className="text-[9px] text-slate-400 flex items-center justify-center gap-1 font-sans">
            <Radio className="w-2.5 h-2.5 text-amber-400" /> CREW
          </div>
          <div className="text-sm font-bold text-amber-300 mt-1 truncate">
            SHASWAT
          </div>
        </div>
      </div>
    </div>
  );
};
