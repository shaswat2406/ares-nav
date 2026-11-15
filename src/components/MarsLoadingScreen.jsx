/**
 * MarsLoadingScreen.jsx — Cinematic Mars Orbital Insertion Loading Experience
 * Features an animated glowing Mars with rotating surface albedo, orbiting satellite radar sweep,
 * a Martian topography progress bar with an advancing astronaut walker, and authentic mission telemetry.
 */

import React, { useState, useEffect } from 'react';
import { sfx } from '../utils/soundFX';
import { Rocket, Satellite, Radio, Compass, ShieldCheck } from 'lucide-react';

const TELEMETRY_STAGES = [
  { pct: 0, text: 'ESTABLISHING DSN UPLINK // CANBERRA - GOLDSTONE - MADRID...' },
  { pct: 18, text: 'STREAMING MGS MOLA GLOBAL ELEVATION DATUM (JEZERO: -2570m)...' },
  { pct: 38, text: 'CALIBRATING MRO CRISM SPECTRAL REFLECTANCE CUBES (SMECTITE & CARBONATES)...' },
  { pct: 58, text: 'INGESTING PERSEVERANCE SOL 1328 MEDA & RAD GROUND TRUTH (-48.2°C, 0.62 mSv)...' },
  { pct: 78, text: 'SOLVING 8-DIRECTIONAL SLOPE-PENALIZED A* TRAVERSAL COST MATRIX...' },
  { pct: 92, text: 'CALIBRATING ISRO-NASA ARTEMIS EVA SUIT LIFE-SUPPORT SYSTEMS...' },
  { pct: 100, text: 'MISSION READY // DEPLOYING ARES-NAV TACTICAL COMMAND HUD' }
];

export function MarsLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState(TELEMETRY_STAGES[0].text);
  const [isFadingOut, setIsFadingOut] = useState(false);

  useEffect(() => {
    // Smooth progress increment over 2.4 seconds
    const startTime = Date.now();
    const duration = 2400; // 2.4s

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPct);

      // Find appropriate telemetry stage text
      for (let i = TELEMETRY_STAGES.length - 1; i >= 0; i--) {
        if (currentPct >= TELEMETRY_STAGES[i].pct) {
          setStageText(TELEMETRY_STAGES[i].text);
          break;
        }
      }

      if (currentPct >= 100) {
        clearInterval(timer);
        try {
          sfx.telemetry();
        } catch {}
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            onComplete();
          }, 450);
        }, 300);
      }
    }, 28);

    return () => clearInterval(timer);
  }, [onComplete]);

  const handleSkip = () => {
    sfx.click();
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#02050e] flex flex-col items-center justify-center select-none overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ── Background Deep Space & Starfield Glow ── */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_45%,rgba(194,65,12,0.18)_0%,rgba(4,8,22,0.95)_60%,#010206_100%)] pointer-events-none" />

      {/* Subtle Grid Scanning Lines */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(#00f0ff 1px, transparent 1px), linear-gradient(90deg, #00f0ff 1px, transparent 1px)',
          backgroundSize: '40px 40px'
        }}
      />

      {/* ── Centerpiece: Animated Martian Globe with Orbiting Satellite ── */}
      <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-8">
        {/* Outer Atmospheric Rayleigh Scattering Glow */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-600/30 via-rose-500/20 to-cyan-400/20 blur-2xl animate-pulse" />

        {/* Orbiting Satellite Path Ring */}
        <div className="absolute inset-[-24px] md:inset-[-36px] rounded-full border border-cyan-500/20 border-dashed animate-spin" style={{ animationDuration: '22s' }}>
          {/* Orbiting Satellite Icon */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-slate-950/90 border border-cyan-400/60 px-2 py-0.5 rounded-full text-[9px] font-mono text-cyan-300 shadow-[0_0_15px_rgba(0,240,255,0.5)]">
            <Satellite className="w-3 h-3 text-cyan-400 animate-pulse" />
            <span>MRO // ORBIT: 380 KM</span>
          </div>
        </div>

        {/* Realistic Martian Planet Sphere */}
        <div className="relative w-48 h-48 md:w-56 md:h-56 rounded-full overflow-hidden shadow-[inset_-30px_-30px_60px_rgba(0,0,0,0.9),0_0_40px_rgba(234,88,12,0.45)] border border-orange-500/30">
          {/* Base Mars Rust & Basalt Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#d97706] via-[#c2410c] to-[#451a03]" />

          {/* Animated Surface Dark Albedo Provinces (Syrtis Major, Sinus Sabaeus, Valles Marineris) */}
          <div
            className="absolute inset-0 opacity-70 mix-blend-multiply animate-pulse"
            style={{
              backgroundImage: `radial-gradient(ellipse at 35% 45%, #1c0a04 0%, transparent 45%),
                                radial-gradient(ellipse at 65% 55%, #180702 0%, transparent 40%),
                                radial-gradient(ellipse at 50% 70%, #260a03 0%, transparent 50%)`
            }}
          />

          {/* Northern Polar Ice Cap (Planum Boreum) */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-10 bg-gradient-to-b from-white via-slate-100 to-transparent rounded-full opacity-90 blur-[1px] shadow-[0_0_12px_rgba(255,255,255,0.7)]" />

          {/* Jezero Crater Target Reticle */}
          <div className="absolute top-[38%] left-[44%] w-6 h-6 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center pointer-events-none">
            <span className="w-4 h-4 rounded-full border border-cyan-400 animate-ping absolute" />
            <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_10px_#00f0ff]" />
            <div className="absolute left-4 -top-3 bg-slate-950/90 border border-cyan-500/60 px-1.5 py-0.2 rounded text-[8px] font-mono text-cyan-300 whitespace-nowrap shadow-lg">
              JEZERO CRATER [18.4°N]
            </div>
          </div>

          {/* Planet Spherical 3D Shading & Specular Limb Rim */}
          <div className="absolute inset-0 rounded-full shadow-[inset_15px_15px_30px_rgba(255,255,255,0.25),inset_-25px_-25px_45px_rgba(0,0,0,0.85)] pointer-events-none" />
        </div>
      </div>

      {/* ── Brand Header ── */}
      <div className="text-center space-y-1 mb-6 px-4 z-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/50 border border-cyan-500/40 text-cyan-300 text-[11px] font-mono tracking-widest uppercase mb-1 shadow-[0_0_15px_rgba(0,240,255,0.2)]">
          <Rocket className="w-3.5 h-3.5 text-cyan-400 transform -rotate-45" />
          <span>ARES-NAV // MARTIAN MISSION CONTROL</span>
        </div>
        <h1 className="text-xl md:text-2xl font-heading font-extrabold text-slate-100 tracking-wider">
          INITIALIZING MARTIAN EVA TACTICAL PLANNER
        </h1>
        <p className="text-xs font-mono text-slate-400 max-w-md">
          NASA Space Apps Challenge 2026 // Team Singular Anomaly (Surat Hub)
        </p>
      </div>

      {/* ── Martian Topography Progress Bar ── */}
      <div className="w-full max-w-md md:max-w-lg px-6 z-10 space-y-2.5">
        {/* Top Progress Info */}
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-amber-400 font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: '8s' }} />
            <span>ORBITAL DE-ORBIT // DESCENT</span>
          </span>
          <span className="text-cyan-300 font-bold font-mono text-sm tracking-wider">
            {progress}%
          </span>
        </div>

        {/* Custom Martian Terrain Progress Bar */}
        <div className="relative w-full h-3.5 bg-slate-900/90 rounded-full border border-cyan-500/30 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.8),0_0_15px_rgba(0,240,255,0.15)]">
          {/* Active Gradient Fill */}
          <div
            className="h-full bg-gradient-to-r from-orange-600 via-amber-500 to-cyan-400 transition-all duration-75 ease-out shadow-[0_0_15px_rgba(0,240,255,0.7)]"
            style={{ width: `${progress}%` }}
          />

          {/* Striped scanline pattern */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.3) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0.3) 75%, transparent 75%, transparent)',
              backgroundSize: '12px 12px'
            }}
          />
        </div>

        {/* Dynamic Telemetry Status Line */}
        <div className="min-h-[20px] flex items-center justify-between text-[11px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <Radio className="w-3 h-3 text-cyan-400 shrink-0 animate-pulse" />
            <span className="text-slate-300 truncate">{stageText}</span>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-2">
            [SOL 1328]
          </span>
        </div>
      </div>

      {/* ── Bottom Skip Recon Button ── */}
      <div className="mt-8 z-10 flex items-center gap-3">
        <button
          onClick={handleSkip}
          className="px-4 py-1.5 rounded-xl border border-slate-700 hover:border-cyan-400 bg-slate-900/80 hover:bg-cyan-950/60 text-slate-400 hover:text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-lg flex items-center gap-1.5 group"
        >
          <span>ENTER JEZERO CRATER</span>
          <span className="text-[10px] text-slate-500 group-hover:text-cyan-400 font-bold">➔</span>
        </button>
      </div>

      {/* Coordinate Telemetry Watermark */}
      <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between text-[9px] font-mono text-slate-600 pointer-events-none">
        <span>DATUM: MARS AERIOD 2000 // IAU 2015 CRS</span>
        <span>ARES-NAV // ISRO-NASA EVA TACTICAL SUITE v4.0</span>
      </div>
    </div>
  );
}
