/**
 * SolarSystemLoadingScreen.jsx — Cinematic Solar System Loading Experience
 *
 * Renders an authentic, high-performance heliocentric Solar System with orbiting planets,
 * the Asteroid Belt, a glowing Earth-to-Mars Hohmann transfer trajectory, and active
 * mission transit telemetry. Designed specifically as a sleek loading screen, not a project dashboard.
 */

import React, { useState, useEffect, useRef } from 'react';
import { sfx } from '../utils/soundFX';
import { Rocket, Radio, Compass, Orbit, ArrowRight } from 'lucide-react';

const TELEMETRY_STAGES = [
  { pct: 0, text: 'INITIALIZING DSN DEEP SPACE NETWORK // CANBERRA - GOLDSTONE - MADRID...' },
  { pct: 18, text: 'COMPUTING HELIOCENTRIC HOHMANN TRANSFER TRAJECTORY (EARTH ➔ MARS)...' },
  { pct: 38, text: 'CALIBRATING JPL DE440 PLANETARY EPHEMERIS & GRAVITY ASSIST VECTORS...' },
  { pct: 58, text: 'STREAMING MGS MOLA ELEVATION & MRO CRISM MINERALOGY DATA CUBES...' },
  { pct: 78, text: 'APPROACHING MARS ORBITAL INSERTION (MOI) // JEZERO CRATER RETICLE LOCK...' },
  { pct: 92, text: 'SYNCHRONIZING TACTICAL EVA LIFE-SUPPORT ENGINE & TRAVERSAL MATRICES...' },
  { pct: 100, text: 'SYSTEMS NOMINAL // LAUNCHING ARES-NAV TACTICAL MISSION PLANNER' }
];

// Planet orbital configurations (scaled for visual clarity on screen)
const PLANETS = [
  { name: 'Mercury', color: '#94a3b8', size: 3, radiusRatio: 0.16, speed: 4.1, glow: 'rgba(148,163,184,0.4)' },
  { name: 'Venus',   color: '#fbbf24', size: 4.5, radiusRatio: 0.24, speed: 1.6, glow: 'rgba(251,191,36,0.4)' },
  { name: 'Earth',   color: '#38bdf8', size: 5, radiusRatio: 0.33, speed: 1.0, glow: 'rgba(56,189,248,0.5)', hasMoon: true },
  { name: 'Mars',    color: '#ef4444', size: 4.2, radiusRatio: 0.43, speed: 0.53, glow: 'rgba(239,68,68,0.8)', isTarget: true },
  { name: 'Jupiter', color: '#f59e0b', size: 9, radiusRatio: 0.60, speed: 0.24, glow: 'rgba(245,158,11,0.3)', hasBands: true },
  { name: 'Saturn',  color: '#e2e8f0', size: 7.5, radiusRatio: 0.74, speed: 0.14, glow: 'rgba(226,232,240,0.3)', hasRings: true },
  { name: 'Uranus',  color: '#67e8f9', size: 6, radiusRatio: 0.86, speed: 0.08, glow: 'rgba(103,232,249,0.3)' },
  { name: 'Neptune', color: '#3b82f6', size: 5.8, radiusRatio: 0.96, speed: 0.05, glow: 'rgba(59,130,246,0.3)' }
];

export function SolarSystemLoadingScreen({ onComplete }) {
  const [progress, setProgress] = useState(0);
  const [stageText, setStageText] = useState(TELEMETRY_STAGES[0].text);
  const [dots, setDots] = useState('...');
  const [isFadingOut, setIsFadingOut] = useState(false);
  const canvasRef = useRef(null);

  // Animated cycling dots: . -> .. -> ... -> ....
  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => (prev.length >= 4 ? '.' : prev + '.'));
    }, 320);
    return () => clearInterval(dotInterval);
  }, []);

  // Handle loading progress bar timer (2.6s total for silky smooth transit)
  useEffect(() => {
    const startTime = Date.now();
    const duration = 2600;

    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const currentPct = Math.min(100, Math.floor((elapsed / duration) * 100));
      setProgress(currentPct);

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
        }, 350);
      }
    }, 25);

    return () => clearInterval(timer);
  }, [onComplete]);

  // High-performance canvas animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let baseAngle = 0;

    // Generate static stars once
    const starCount = 180;
    const stars = Array.from({ length: starCount }, () => ({
      x: Math.random(),
      y: Math.random(),
      radius: Math.random() * 1.4 + 0.3,
      alpha: Math.random() * 0.8 + 0.2,
      twinkleSpeed: Math.random() * 0.02 + 0.005
    }));

    // Generate asteroid belt particles once
    const asteroidCount = 90;
    const asteroids = Array.from({ length: asteroidCount }, () => ({
      radiusOffset: (Math.random() - 0.5) * 0.05,
      angle: Math.random() * Math.PI * 2,
      speed: 0.35 + Math.random() * 0.1,
      size: Math.random() * 1.5 + 0.5,
      alpha: Math.random() * 0.6 + 0.2
    }));

    const render = () => {
      const width = (canvas.width = canvas.parentElement?.clientWidth || window.innerWidth);
      const height = (canvas.height = canvas.parentElement?.clientHeight || window.innerHeight);

      // Clear frame with deep cosmic black
      ctx.fillStyle = '#02040b';
      ctx.fillRect(0, 0, width, height);

      // ── Draw Twinkling Starfield ──
      stars.forEach(star => {
        star.alpha += Math.sin(Date.now() * star.twinkleSpeed) * 0.01;
        const boundedAlpha = Math.max(0.15, Math.min(0.9, star.alpha));
        ctx.fillStyle = `rgba(255, 255, 255, ${boundedAlpha})`;
        ctx.beginPath();
        ctx.arc(star.x * width, star.y * height, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });

      // Heliocentric center coordinates (centered, slightly raised for bottom progress UI)
      const cx = width / 2;
      const cy = height * 0.44;
      const maxOrbitRadius = Math.min(width, height) * 0.42;

      // ── Deep Sun Radial Corona Backdrop ──
      const sunBackdrop = ctx.createRadialGradient(cx, cy, 2, cx, cy, maxOrbitRadius * 0.5);
      sunBackdrop.addColorStop(0, 'rgba(249, 115, 22, 0.18)');
      sunBackdrop.addColorStop(0.5, 'rgba(234, 88, 12, 0.06)');
      sunBackdrop.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = sunBackdrop;
      ctx.fillRect(0, 0, width, height);

      // ── Draw Orbital Rings ──
      PLANETS.forEach(p => {
        const r = p.radiusRatio * maxOrbitRadius;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (p.isTarget) {
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
          ctx.lineWidth = 1.5;
          ctx.setLineDash([4, 4]);
        } else {
          ctx.strokeStyle = 'rgba(148, 163, 184, 0.12)';
          ctx.lineWidth = 1;
          ctx.setLineDash([]);
        }
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // ── Draw Asteroid Belt (Between Mars 0.43 and Jupiter 0.60) ──
      const beltBaseR = 0.515 * maxOrbitRadius;
      asteroids.forEach(a => {
        a.angle += a.speed * 0.002;
        const ar = beltBaseR + a.radiusOffset * maxOrbitRadius;
        const ax = cx + Math.cos(a.angle) * ar;
        const ay = cy + Math.sin(a.angle) * ar;
        ctx.fillStyle = `rgba(203, 213, 225, ${a.alpha})`;
        ctx.beginPath();
        ctx.arc(ax, ay, a.size, 0, Math.PI * 2);
        ctx.fill();
      });

      // ── Calculate Positions for Earth and Mars for Hohmann Transfer Arc ──
      let earthPos = null;
      let marsPos = null;

      baseAngle += 0.003;

      // ── Draw Planets & Features ──
      PLANETS.forEach(p => {
        const orbitR = p.radiusRatio * maxOrbitRadius;
        // Mars has a fixed aesthetic angle offset so transfer arc looks picturesque
        const planetAngle = baseAngle * p.speed + (p.isTarget ? 0.9 : p.name === 'Earth' ? 2.1 : p.radiusRatio * 4);
        const px = cx + Math.cos(planetAngle) * orbitR;
        const py = cy + Math.sin(planetAngle) * orbitR;

        if (p.name === 'Earth') earthPos = { x: px, y: py, r: orbitR, angle: planetAngle };
        if (p.isTarget) marsPos = { x: px, y: py, r: orbitR, angle: planetAngle };

        // Planet Outer Atmospheric Aura Glow
        const aura = ctx.createRadialGradient(px, py, p.size * 0.4, px, py, p.size * 2.8);
        aura.addColorStop(0, p.glow);
        aura.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = aura;
        ctx.beginPath();
        ctx.arc(px, py, p.size * 2.8, 0, Math.PI * 2);
        ctx.fill();

        // Planet Solid Sphere Body
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(px, py, p.size, 0, Math.PI * 2);
        ctx.fill();

        // Special Planet Features
        if (p.hasMoon) {
          // Earth's orbiting Moon
          const moonR = 11;
          const moonAngle = baseAngle * 14;
          const mx = px + Math.cos(moonAngle) * moonR;
          const my = py + Math.sin(moonAngle) * moonR;
          ctx.fillStyle = '#cbd5e1';
          ctx.beginPath();
          ctx.arc(mx, my, 1.4, 0, Math.PI * 2);
          ctx.fill();
        }

        if (p.hasRings) {
          // Saturn's Iconic Rings
          ctx.save();
          ctx.translate(px, py);
          ctx.rotate(-0.35);
          ctx.strokeStyle = 'rgba(226, 232, 240, 0.7)';
          ctx.lineWidth = 2.4;
          ctx.beginPath();
          ctx.ellipse(0, 0, p.size * 2.2, p.size * 0.7, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }

        if (p.isTarget) {
          // ── Pulsating Tactical Targeting Reticle on Mars ──
          const pingR = p.size * 2.5 + (Math.sin(Date.now() * 0.006) + 1) * 4;
          ctx.strokeStyle = '#ef4444';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(px, py, pingR, 0, Math.PI * 2);
          ctx.stroke();

          // Reticle crosshairs
          ctx.strokeStyle = 'rgba(239, 68, 68, 0.8)';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(px - pingR - 4, py);
          ctx.lineTo(px - pingR + 2, py);
          ctx.moveTo(px + pingR - 2, py);
          ctx.lineTo(px + pingR + 4, py);
          ctx.moveTo(px, py - pingR - 4);
          ctx.lineTo(px, py - pingR + 2);
          ctx.moveTo(px, py + pingR - 2);
          ctx.lineTo(px, py + pingR + 4);
          ctx.stroke();

          // Target Callout Label
          ctx.font = 'bold 9px "JetBrains Mono", monospace';
          ctx.fillStyle = '#f87171';
          ctx.fillText('TARGET: MARS', px + pingR + 8, py - 4);
          ctx.font = '8px "JetBrains Mono", monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText('JEZERO CRATER // 18.4°N', px + pingR + 8, py + 7);
        }
      });

      // ── Draw Animated Hohmann Transfer Orbit (Earth -> Mars) ──
      if (earthPos && marsPos) {
        ctx.save();
        ctx.beginPath();
        // Elliptic transfer path connecting Earth to Mars
        ctx.moveTo(earthPos.x, earthPos.y);
        const midX = (earthPos.x + marsPos.x) / 2 + (marsPos.y - earthPos.y) * 0.25;
        const midY = (earthPos.y + marsPos.y) / 2 - (marsPos.x - earthPos.x) * 0.25;
        ctx.quadraticCurveTo(midX, midY, marsPos.x, marsPos.y);

        ctx.strokeStyle = 'rgba(6, 182, 212, 0.65)';
        ctx.lineWidth = 1.8;
        ctx.setLineDash([5, 5]);
        ctx.lineDashOffset = -Date.now() * 0.02;
        ctx.stroke();

        // Animated Transit Spacecraft Position along the curve
        // Quadratic bezier formula: B(t) = (1-t)^2 P0 + 2(1-t)t P1 + t^2 P2
        const t = Math.min(1, Math.max(0, progress / 100));
        const shipX = (1 - t) * (1 - t) * earthPos.x + 2 * (1 - t) * t * midX + t * t * marsPos.x;
        const shipY = (1 - t) * (1 - t) * earthPos.y + 2 * (1 - t) * t * midY + t * t * marsPos.y;

        // Spacecraft Beacon Flare
        ctx.setLineDash([]);
        const shipGlow = ctx.createRadialGradient(shipX, shipY, 1, shipX, shipY, 9);
        shipGlow.addColorStop(0, '#00f0ff');
        shipGlow.addColorStop(0.5, 'rgba(0, 240, 255, 0.4)');
        shipGlow.addColorStop(1, 'rgba(0, 240, 255, 0)');
        ctx.fillStyle = shipGlow;
        ctx.beginPath();
        ctx.arc(shipX, shipY, 9, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(shipX, shipY, 2.5, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      // ── Central Glowing Sun ──
      const sunRadius = 14;
      const sunPulse = Math.sin(Date.now() * 0.004) * 1.5;

      // Coronal Flare
      const corona = ctx.createRadialGradient(cx, cy, sunRadius * 0.8, cx, cy, (sunRadius + 20) + sunPulse);
      corona.addColorStop(0, '#fef08a');
      corona.addColorStop(0.3, '#f59e0b');
      corona.addColorStop(0.7, 'rgba(234, 88, 12, 0.4)');
      corona.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = corona;
      ctx.beginPath();
      ctx.arc(cx, cy, (sunRadius + 20) + sunPulse, 0, Math.PI * 2);
      ctx.fill();

      // Sun Core
      const sunCore = ctx.createRadialGradient(cx, cy, 0, cx, cy, sunRadius);
      sunCore.addColorStop(0, '#ffffff');
      sunCore.addColorStop(0.6, '#fef08a');
      sunCore.addColorStop(1, '#f59e0b');
      ctx.fillStyle = sunCore;
      ctx.beginPath();
      ctx.arc(cx, cy, sunRadius, 0, Math.PI * 2);
      ctx.fill();

      // Subtle Sun Label
      ctx.font = '8px "JetBrains Mono", monospace';
      ctx.fillStyle = 'rgba(254, 240, 138, 0.6)';
      ctx.textAlign = 'center';
      ctx.fillText('SOL', cx, cy + sunRadius + 12);
      ctx.textAlign = 'left';

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
    };
  }, [progress]);

  const handleSkip = () => {
    try {
      sfx.click();
    } catch {}
    setIsFadingOut(true);
    setTimeout(() => {
      onComplete();
    }, 250);
  };

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-[#02040b] flex flex-col justify-between select-none overflow-hidden transition-opacity duration-500 ${
        isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* ── Interactive Solar System Canvas (Occupies entire background) ── */}
      <div className="absolute inset-0">
        <canvas ref={canvasRef} className="w-full h-full block" />
      </div>

      {/* ── Top Header: Mission & System Identity (Unobtrusive & Clean) ── */}
      <header className="relative z-10 pt-6 px-6 md:px-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-950/70 border border-cyan-400/50 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]">
            <Orbit className="w-5 h-5 animate-spin" style={{ animationDuration: '18s' }} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold tracking-widest text-cyan-400 uppercase">
                ARES-NAV
              </span>
              <span className="text-[10px] font-mono text-slate-500">//</span>
              <span className="text-[10px] font-mono text-slate-400 tracking-wider">
                HELIOCENTRIC TRANSIT
              </span>
            </div>
            <h1 className="text-sm md:text-base font-heading font-extrabold text-slate-100 tracking-wide">
              SOLAR SYSTEM EPHEMERIS CALIBRATION
            </h1>
          </div>
        </div>

        {/* Quick Skip Button in Header */}
        <button
          onClick={handleSkip}
          className="pointer-events-auto px-3.5 py-1.5 rounded-lg border border-slate-800 hover:border-cyan-400/70 bg-slate-950/80 hover:bg-cyan-950/40 text-slate-400 hover:text-cyan-300 text-xs font-mono transition-all cursor-pointer shadow-md flex items-center gap-1.5 group backdrop-blur-sm"
        >
          <span>SKIP TO MISSION</span>
          <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-cyan-400 transition-transform group-hover:translate-x-0.5" />
        </button>
      </header>

      {/* ── Center subtle focal prompt ── */}
      <div className="relative z-10 pointer-events-none flex justify-center">
        <div className="px-3 py-1 rounded-full bg-slate-950/70 border border-slate-800/80 text-[10px] font-mono text-slate-400 tracking-widest uppercase flex items-center gap-2 backdrop-blur-sm">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
          <span>DESTINATION LOCK // MARS (JEZERO CRATER // 1.524 AU)</span>
        </div>
      </div>

      {/* ── Bottom Section: Loading Progress & Real-time Transit Telemetry ── */}
      <footer className="relative z-10 pb-8 px-6 md:px-12 flex flex-col items-center">
        {/* Animated Loading Text Banner */}
        <div className="flex items-center gap-2 mb-2.5 px-3.5 py-1 rounded-full bg-slate-950/80 border border-cyan-500/40 text-cyan-300 font-mono text-xs tracking-widest uppercase shadow-[0_0_20px_rgba(0,240,255,0.25)] backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-bold">LOADING MISSION DATA{dots}</span>
        </div>

        <div className="w-full max-w-xl space-y-2.5 bg-slate-950/80 border border-slate-800/80 rounded-2xl p-4 md:p-5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-md">
          {/* Progress Header */}
          <div className="flex items-center justify-between text-xs font-mono">
            <div className="flex items-center gap-2 text-slate-300">
              <Compass className="w-3.5 h-3.5 text-cyan-400 animate-spin" style={{ animationDuration: '6s' }} />
              <span className="font-semibold text-slate-200">INTERPLANETARY TRANSIT // LOADING{dots}</span>
            </div>
            <div className="flex items-baseline gap-1.5 font-mono">
              <span className="text-[11px] text-slate-400">
                {(progress * 2.25).toFixed(1)}M / 225.4M KM
              </span>
              <span className="text-cyan-300 font-bold text-sm tracking-wider ml-1">
                {progress}%
              </span>
            </div>
          </div>

          {/* Clean Segmented High-Tech Progress Bar */}
          <div className="relative w-full h-2.5 bg-slate-900 rounded-full border border-cyan-500/30 overflow-hidden shadow-[inset_0_2px_4px_rgba(0,0,0,0.9)]">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-sky-400 to-red-500 transition-all duration-75 ease-out shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
            />
            {/* Moving light beam on progress bar */}
            <div
              className="absolute top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/50 to-transparent -skew-x-12 animate-pulse"
              style={{ left: `${Math.max(0, progress - 8)}%` }}
            />
          </div>

          {/* Telemetry Stage Readout */}
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-0.5">
            <div className="flex items-center gap-2 truncate">
              <Radio className="w-3.5 h-3.5 text-cyan-400 shrink-0 animate-pulse" />
              <span className="text-slate-300 truncate tracking-tight">{stageText}</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-bold shrink-0 ml-3">
              [DSN LIVE]
            </span>
          </div>
        </div>

        {/* Footer Meta Details */}
        <div className="w-full max-w-xl mt-3 flex items-center justify-between text-[9px] font-mono text-slate-500 px-1 pointer-events-none">
          <span>EPHEMERIS: JPL DE440 / IAU 2015</span>
          <span>NASA SPACE APPS CHALLENGE 2026 // SINGULAR ANOMALY</span>
        </div>
      </footer>
    </div>
  );
}

export default SolarSystemLoadingScreen;
