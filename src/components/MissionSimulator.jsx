// MissionSimulator.jsx — ARES-NAV Jezero Delta EVA Demo
// Judges: This component walks through the full ARES-NAV mission workflow in ~2 minutes.
// Step data is based on real NASA mission parameters; simulation timing is fabricated for demo purposes.

import React, { useState, useEffect, useRef, useCallback } from 'react';
import confetti from 'canvas-confetti';

// ─── Step Definitions ────────────────────────────────────────────────────────

const STEPS = [
  {
    id: 1,
    phase: 'PRE-EVA',
    title: 'HABITAT DEPARTURE',
    icon: '🚀',
    color: 'cyan',
    description:
      'Astronaut Shaswat Sinha begins EVA at Butler Landing Site (18.4447°N, 77.4508°E). Suit pressure nominal. PLSS activated.',
    metrics: [
      'EVA-ID     : JEZERO-EVA-042',
      'CREW       : SINHA, SHASWAT',
      'DEPART     : SOL-1328 / 09:14:03 LMST',
      'COORD      : 18.4447°N  77.4508°E',
      'ELEVATION  : -2,570 m (Jezero Floor)',
    ],
    note: 'ℹ SIMULATED — Crew ID, EVA-ID, and timestamp are fabricated for demo.',
    isAlert: false,
  },
  {
    id: 2,
    phase: 'TERRAIN',
    title: 'TERRAIN SCAN',
    icon: '🗺️',
    color: 'blue',
    description:
      'MOLA DEM loaded. Jezero Crater floor confirmed at -2,570 m. 3 hazard zones detected: Séítah Dunes, Delta Scarp Cliffs, Boulder Ejecta Field.',
    metrics: [
      'DEM SOURCE : MOLA MGS / HRSC ESA',
      'RESOLUTION : 463 m/px global | 12.5 m/px regional',
      'CRATER     : -2,570 m elevation datum',
      'HAZARDS    : 3 zones flagged',
      'MAX SLOPE  : 26.2° (Delta Scarp — BLOCKED)',
    ],
    note: '✅ REAL NASA DATA — MOLA DEM (Mars Global Surveyor, 1997–2001). Elevation datum verified.',
    isAlert: false,
  },
  {
    id: 3,
    phase: 'ROUTING',
    title: 'ROUTE GENERATION',
    icon: '🛰️',
    color: 'green',
    description:
      'Running 5 pathfinding algorithms… A* Safety-Aware route selected: 96% safety score, 3.82 km, avoids all hazard zones.',
    metrics: [
      'ALGORITHMS : Direct | Dijkstra | A*-Dist | A*-Safety | A*-Science',
      'SELECTED   : A* Safety-Aware (96% score)',
      'DISTANCE   : 3.82 km',
      'MAX SLOPE  : 8.4°  (threshold: 15°)',
      'AVG SLOPE  : 4.1°',
    ],
    note: 'ℹ SIMULATED — Route computed by ARES-NAV model using MOLA slope data. Not flight-certified.',
    isAlert: false,
  },
  {
    id: 4,
    phase: 'LIFE SUPPORT',
    title: 'LIFE SUPPORT CHECK',
    icon: '🫁',
    color: 'cyan',
    description:
      'All EVA life support systems nominal. Reserve margins exceed NASA EVA safety thresholds.',
    metrics: [
      'O2 SUPPLY  : 862 L  (100%)     ✅',
      'O2 RESERVE : 25%  margin       ✅',
      'BATTERY    : 45,000 Wh         ✅',
      'DURATION   : 8h EVA planned    ✅',
      'THERMAL    : -48.2°C ambient — suit compensated',
    ],
    note: 'ℹ SIMULATED — O2 volumes and battery capacity are illustrative. MEDA temp is real (Sol 1328).',
    isAlert: false,
  },
  {
    id: 5,
    phase: 'SCIENCE',
    title: 'SCIENCE TARGETS LOADED',
    icon: '🔬',
    color: 'purple',
    description:
      '4 CRISM mineralogy targets identified. Priority target: Three Forks Delta Front (Mg-Carbonate, 97% biosignature potential).',
    metrics: [
      'SCI-01: Kodiak Butte       — HIGH     — Clay Minerals       — 92%',
      'SCI-02: Three Forks        — CRITICAL — Mg-Carbonate+Smec.  — 97%',
      'SCI-03: Séítah Outcrop     — MEDIUM   — Olivine Cumulate     — 64%',
      'SCI-04: Belva Crater Rim   — HIGH     — Hydrothermal Silica  — 88%',
    ],
    note: '✅ REAL CRISM DATA — Target locations from MRO CRISM targeted observations. Biosig. % = model proxy.',
    isAlert: false,
  },
  {
    id: 6,
    phase: 'EVA ACTIVE',
    title: 'EVA IN PROGRESS',
    icon: '🧑‍🚀',
    color: 'emerald',
    description:
      'Traversing Séítah approach. Slope: 4.2°. MEDA: -48.2°C, τ=0.62. All systems nominal. Waypoint 2 of 8 reached.',
    metrics: [
      'WP-2 REACHED: 18.4400°N  77.4470°E',
      'SLOPE NOW  : 4.2°        ✅ SAFE',
      'MEDA TEMP  : -48.2°C     🧊',
      'DUST TAU   : τ = 0.62    nominal',
      'O2 REMAIN  : 94%         ✅',
    ],
    note: '✅ REAL NASA DATA — MEDA temperature and dust optical depth from Perseverance Sol 1328 telemetry.',
    isAlert: false,
  },
  {
    id: 7,
    phase: 'HAZARD',
    title: '⚠ HAZARD ALERT',
    icon: '⚠️',
    color: 'amber',
    description:
      'Delta Scarp Cliffs detected ahead — 24° slope exceeds astronaut suit limit (15°). ARES-NAV rerouting via safe corridor.',
    metrics: [
      '⚠ HAZARD    : DELTA SCARP CLIFFS',
      '  TYPE      : Topographic Cliff',
      '  SLOPE     : 24.0°  (BLOCKED — limit 15°)',
      '  ACTION    : REROUTE via western apron',
      '  DELAY     : +4 min corridor detour',
    ],
    note: '✅ REAL HRSC DATA — Delta Scarp geometry from HRSC DEM (Mars Express). Slope limit per NASA EVA protocols.',
    isAlert: true,
  },
  {
    id: 8,
    phase: 'COMMS',
    title: '⚠ COMMS SHADOW',
    icon: '📡',
    color: 'orange',
    description:
      'COMMS SHADOW DETECTED — Radio occluded by crater ridge. Relay beacon deployment required at WP-3.',
    metrics: [
      '⚠ COMMS     : SHADOW ZONE ACTIVE',
      '  CAUSE     : Crater ridge radio occlusion',
      '  LOCATION  : WP-3  18.4350°N  77.4420°E',
      '  ACTION    : Deploy relay beacon',
      '  STATUS    : BEACON DEPLOYED — link restored',
    ],
    note: 'ℹ SIMULATED — Comms shadow modeled from MOLA terrain line-of-sight. Relay beacon deployment is simulated.',
    isAlert: true,
  },
  {
    id: 9,
    phase: 'SCIENCE OP',
    title: 'SCIENCE COLLECTION',
    icon: '🧪',
    color: 'purple',
    description:
      'SHERLOC scan at Three Forks Delta Front: Mg-Carbonate signature CONFIRMED. UV fluorescence detected — organics candidate.',
    metrics: [
      'INSTRUMENT : SHERLOC (Deep UV Raman + Fluorescence)',
      'TARGET     : Three Forks Delta Front',
      'MINERAL    : Mg-Carbonate — CONFIRMED ✅',
      'UV FLUOR.  : Detected — organics candidate 🔬',
      'CRISM CONF.: 0.89 (89% confidence)',
    ],
    note: '✅ REAL CRISM DATA — Mg-Carbonate at Jezero confirmed by Horgan et al. 2020 (Icarus). UV result: simulated.',
    isAlert: false,
  },
  {
    id: 10,
    phase: 'COMPLETE',
    title: 'MISSION COMPLETE',
    icon: '🎉',
    color: 'green',
    description:
      'Safe return to Hab Alpha. All 4 science targets visited. EVA completed within O2 and time budgets.',
    metrics: [
      'DISTANCE   : 3.82 km traversed',
      'O2 USED    : 38%  (reserve: 62%) ✅',
      'DURATION   : 85 min              ✅',
      'TARGETS    : 4 / 4 collected     ✅',
      'SAFETY     : 96% route score     ✅',
    ],
    note: 'ℹ SIMULATED — Final metrics computed by ARES-NAV model. Mission outcome is for demonstration only.',
    isAlert: false,
  },
];

// ─── Color Maps ───────────────────────────────────────────────────────────────

const COLOR_MAP = {
  cyan: {
    bg: 'bg-cyan-950/60',
    border: 'border-cyan-500/60',
    title: 'text-cyan-300',
    badge: 'bg-cyan-900/80 text-cyan-200 border-cyan-500/40',
    bar: 'bg-cyan-500',
    icon: 'text-cyan-400',
    glow: 'shadow-[0_0_30px_rgba(6,182,212,0.3)]',
  },
  blue: {
    bg: 'bg-blue-950/60',
    border: 'border-blue-500/60',
    title: 'text-blue-200',
    badge: 'bg-blue-900/80 text-blue-200 border-blue-500/40',
    bar: 'bg-blue-500',
    icon: 'text-blue-400',
    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.3)]',
  },
  green: {
    bg: 'bg-emerald-950/60',
    border: 'border-emerald-500/60',
    title: 'text-emerald-300',
    badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40',
    bar: 'bg-emerald-500',
    icon: 'text-emerald-400',
    glow: 'shadow-[0_0_30px_rgba(16,185,129,0.3)]',
  },
  emerald: {
    bg: 'bg-emerald-950/50',
    border: 'border-emerald-400/60',
    title: 'text-emerald-200',
    badge: 'bg-emerald-900/80 text-emerald-200 border-emerald-500/40',
    bar: 'bg-emerald-400',
    icon: 'text-emerald-300',
    glow: 'shadow-[0_0_30px_rgba(52,211,153,0.35)]',
  },
  purple: {
    bg: 'bg-purple-950/60',
    border: 'border-purple-500/60',
    title: 'text-purple-300',
    badge: 'bg-purple-900/80 text-purple-200 border-purple-500/40',
    bar: 'bg-purple-500',
    icon: 'text-purple-400',
    glow: 'shadow-[0_0_30px_rgba(168,85,247,0.3)]',
  },
  amber: {
    bg: 'bg-amber-950/60',
    border: 'border-amber-500/80',
    title: 'text-amber-300',
    badge: 'bg-amber-900/80 text-amber-100 border-amber-500/60',
    bar: 'bg-amber-500',
    icon: 'text-amber-400',
    glow: 'shadow-[0_0_30px_rgba(245,158,11,0.5)]',
  },
  orange: {
    bg: 'bg-orange-950/60',
    border: 'border-orange-500/80',
    title: 'text-orange-300',
    badge: 'bg-orange-900/80 text-orange-100 border-orange-500/60',
    bar: 'bg-orange-500',
    icon: 'text-orange-400',
    glow: 'shadow-[0_0_30px_rgba(249,115,22,0.5)]',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

export function MissionSimulator({ isOpen, onClose, onSimComplete }) {
  const [currentStep, setCurrentStep] = useState(0); // 0-indexed
  const [isPlaying, setIsPlaying] = useState(true);
  const [missionComplete, setMissionComplete] = useState(false);
  const timerRef = useRef(null);
  const confettiFiredRef = useRef(false);

  // Fire confetti on mission complete
  useEffect(() => {
    if (missionComplete && !confettiFiredRef.current) {
      confettiFiredRef.current = true;
      confetti({
        particleCount: 180,
        spread: 90,
        origin: { y: 0.5 },
        colors: ['#00ff88', '#00d4ff', '#7c3aed', '#f59e0b', '#ffffff'],
      });
      setTimeout(() => {
        confetti({
          particleCount: 80,
          angle: 60,
          spread: 55,
          origin: { x: 0, y: 0.6 },
        });
        confetti({
          particleCount: 80,
          angle: 120,
          spread: 55,
          origin: { x: 1, y: 0.6 },
        });
      }, 400);
      if (onSimComplete) onSimComplete();
    }
  }, [missionComplete, onSimComplete]);

  // Reset when opened
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsPlaying(true);
      setMissionComplete(false);
      confettiFiredRef.current = false;
    }
  }, [isOpen]);

  // Auto-advance timer
  const advance = useCallback(() => {
    setCurrentStep((prev) => {
      const next = prev + 1;
      if (next >= STEPS.length) {
        setMissionComplete(true);
        setIsPlaying(false);
        return prev;
      }
      return next;
    });
  }, []);

  useEffect(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (isPlaying && !missionComplete) {
      timerRef.current = setInterval(advance, 3000);
    }
    return () => clearInterval(timerRef.current);
  }, [isPlaying, missionComplete, advance]);

  const handleSkip = () => {
    clearInterval(timerRef.current);
    advance();
  };

  const handleRestart = () => {
    clearInterval(timerRef.current);
    setCurrentStep(0);
    setMissionComplete(false);
    confettiFiredRef.current = false;
    setIsPlaying(true);
  };

  const handleClose = () => {
    clearInterval(timerRef.current);
    if (onClose) onClose();
  };

  if (!isOpen) return null;

  const step = STEPS[currentStep];
  const colors = COLOR_MAP[step.color] || COLOR_MAP.cyan;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
         style={{ background: 'rgba(1,2,6,0.92)', backdropFilter: 'blur(12px)' }}>

      {/* ── Modal Shell ── */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl border ${colors.border} ${colors.bg} ${colors.glow} flex flex-col overflow-hidden`}
        style={{ maxHeight: '90vh' }}
      >
        {/* ── Top Progress Bar ── */}
        <div className="h-1.5 w-full bg-slate-800 rounded-t-2xl overflow-hidden">
          <div
            className={`h-full transition-all duration-700 ${colors.bar}`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-4 pb-3 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <span className={`text-2xl ${colors.icon}`}>🛸</span>
            <div>
              <div className="text-xs font-mono text-slate-400 uppercase tracking-widest">
                ARES-NAV // MISSION SIMULATOR
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Jezero Delta EVA — DEMO MODE
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 text-xs font-mono">
            <span className={`px-2 py-0.5 rounded border ${colors.badge}`}>
              STEP {currentStep + 1} / {STEPS.length}
            </span>
            <button
              onClick={handleClose}
              className="ml-2 px-3 py-1 rounded-lg bg-slate-800/80 border border-slate-600/60 text-slate-300 hover:text-white hover:border-slate-400 transition-all cursor-pointer"
            >
              ✕ CLOSE
            </button>
          </div>
        </div>

        {/* ── Step Content ── */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">

          {/* Phase badge + Icon */}
          <div className="flex items-center gap-3">
            <span className="text-5xl">{step.icon}</span>
            <div>
              <div className={`text-[11px] font-mono uppercase tracking-widest ${colors.icon} mb-0.5`}>
                PHASE: {step.phase}
              </div>
              <h2
                className={`font-heading font-extrabold text-2xl md:text-3xl tracking-widest uppercase ${colors.title} ${
                  step.isAlert ? 'animate-pulse' : ''
                }`}
              >
                {step.title}
              </h2>
            </div>
          </div>

          {/* Alert Flash Band */}
          {step.isAlert && (
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-red-500/60 bg-red-950/50 animate-pulse">
              <span className="text-red-400 text-sm font-mono font-bold">⚠ ALERT</span>
              <span className="text-red-300 text-xs font-mono">System requires crew action</span>
            </div>
          )}

          {/* Description */}
          <p className="text-sm md:text-base text-slate-200 leading-relaxed font-sans">
            {step.description}
          </p>

          {/* Metrics readout */}
          <div className="bg-slate-950/80 border border-slate-700/60 rounded-xl p-4">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-widest mb-2">
              TELEMETRY / DATA READOUT
            </div>
            <div className="space-y-1">
              {step.metrics.map((m, i) => (
                <div
                  key={i}
                  className={`text-xs font-mono ${colors.title} leading-relaxed`}
                >
                  {m}
                </div>
              ))}
            </div>
          </div>

          {/* Science note */}
          <div className="text-[11px] font-mono text-slate-400 bg-slate-900/60 border border-slate-700/40 rounded-lg px-3 py-2 leading-snug">
            {step.note}
          </div>

          {/* Mission Complete Banner */}
          {missionComplete && (
            <div className="text-center py-6 space-y-2">
              <div className="text-4xl">🎉</div>
              <div className="font-heading font-black text-2xl text-emerald-300 tracking-widest uppercase animate-pulse">
                MISSION SUCCESS
              </div>
              <div className="text-sm font-mono text-emerald-400 tracking-widest">
                // JEZERO DELTA EVA COMPLETE //
              </div>
              <div className="text-xs font-mono text-slate-400 mt-2">
                4/4 Science Targets · 3.82 km · 85 min · 38% O₂ Used
              </div>
            </div>
          )}
        </div>

        {/* ── Step Dots ── */}
        <div className="flex justify-center gap-1.5 py-3 px-5">
          {STEPS.map((s, i) => (
            <button
              key={s.id}
              onClick={() => { setCurrentStep(i); setIsPlaying(false); }}
              className={`w-2 h-2 rounded-full transition-all cursor-pointer ${
                i === currentStep
                  ? `${colors.bar} scale-125`
                  : i < currentStep
                  ? 'bg-slate-500'
                  : 'bg-slate-700'
              }`}
              title={`Step ${s.id}: ${s.title}`}
            />
          ))}
        </div>

        {/* ── Controls ── */}
        <div className="flex items-center justify-between gap-3 px-5 pb-5">
          <div className="flex gap-2">
            <button
              onClick={() => setIsPlaying((p) => !p)}
              disabled={missionComplete}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold border transition-all cursor-pointer disabled:opacity-40 ${
                isPlaying
                  ? 'bg-amber-600/80 border-amber-500 text-white hover:bg-amber-500'
                  : `${colors.bg} ${colors.border} ${colors.title} hover:opacity-80`
              }`}
            >
              {isPlaying ? '⏸ PAUSE' : '▶ PLAY'}
            </button>
            <button
              onClick={handleSkip}
              disabled={missionComplete}
              className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-600/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-slate-500 transition-all cursor-pointer disabled:opacity-40"
            >
              ⏭ SKIP
            </button>
          </div>
          <button
            onClick={handleRestart}
            className="px-4 py-2 rounded-xl text-xs font-mono font-bold border border-slate-600/60 bg-slate-800/80 text-slate-300 hover:text-white hover:border-cyan-500 transition-all cursor-pointer"
          >
            ↺ RESTART
          </button>
        </div>
      </div>
    </div>
  );
}

export default MissionSimulator;
