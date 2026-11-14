import React, { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, User, Heart, Battery, Radio } from 'lucide-react';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';

export const EVASimulator = ({ activeRoute, onProgressUpdate }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0); // 0 to 100%
  const [heartRate, setHeartRate] = useState(94);
  const [battery, setBattery] = useState(98);

  useEffect(() => {
    let timer;
    if (isPlaying) {
      timer = setInterval(() => {
        setProgress(prev => {
          if (prev >= 100) {
            setIsPlaying(false);
            sfx.scienceSuccess();
            confetti({
              particleCount: 120,
              spread: 70,
              origin: { y: 0.75 },
              colors: ['#38bdf8', '#a855f7', '#f97316', '#10b981']
            });
            return 100;
          }
          const next = prev + 1;
          if (onProgressUpdate) onProgressUpdate(next);

          // Biometrics
          const isSteep = activeRoute.safetyScore < 80 && next > 40 && next < 70;
          setHeartRate(isSteep ? Math.floor(138 + Math.random() * 14) : Math.floor(92 + Math.random() * 8));
          setBattery(b => Math.max(15, b - 0.08));

          if (isSteep && next % 10 === 0) {
            sfx.hazardAlarm();
          }

          return next;
        });
      }, 200);
    }
    return () => clearInterval(timer);
  }, [isPlaying, activeRoute, onProgressUpdate]);

  const togglePlay = () => {
    sfx.click();
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    sfx.click();
    setIsPlaying(false);
    setProgress(0);
    if (onProgressUpdate) onProgressUpdate(0);
    setHeartRate(94);
    setBattery(98);
  };

  const currentKm = ((progress / 100) * activeRoute.distanceKm).toFixed(2);

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 shadow-xl space-y-3">
      {/* Simulation Control Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
            EVA MARSWALK SIMULATOR
          </span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={togglePlay}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500 text-white shadow-lg shadow-amber-950'
                : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-lg shadow-emerald-950'
            }`}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'PAUSE' : 'SIMULATE 3D EVA'}
          </button>
          <button
            onClick={handleReset}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
            title="Reset Simulation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Traversal Progress Bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-[11px] font-mono text-slate-400">
          <span>PROGRESS: {progress}%</span>
          <span className="text-slate-200 font-semibold">{currentKm} / {activeRoute.distanceKm} KM</span>
        </div>
        <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-200 ${
              activeRoute.safetyScore < 80 ? 'bg-gradient-to-r from-amber-500 to-rose-500' : 'bg-gradient-to-r from-cyan-400 to-emerald-400'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Live Astronaut Biometrics */}
      <div className="grid grid-cols-3 gap-2 text-center font-mono">
        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
            <Heart className="w-2.5 h-2.5 text-rose-400 animate-pulse" /> HEART RATE
          </div>
          <div className={`text-xs font-bold mt-0.5 ${heartRate > 120 ? 'text-rose-400 animate-pulse' : 'text-slate-200'}`}>
            {heartRate} <span className="text-[9px] text-slate-500">BPM</span>
          </div>
        </div>

        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
            <Battery className="w-2.5 h-2.5 text-emerald-400" /> SUIT POWER
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">
            {battery.toFixed(0)}%
          </div>
        </div>

        <div className="bg-slate-950/80 p-1.5 rounded-lg border border-slate-800">
          <div className="text-[9px] text-slate-500 flex items-center justify-center gap-1">
            <Radio className="w-2.5 h-2.5 text-cyan-400" /> ASTRONAUT
          </div>
          <div className="text-xs font-bold text-cyan-400 mt-0.5">
            SHASWAT
          </div>
        </div>
      </div>
    </div>
  );
};
