/**
 * GuidedTourWalkthrough.jsx — Interactive Onboarding Tour for ARES-NAV
 *
 * Provides a guided 6-step interactive walkthrough that actively demonstrates
 * key mission planner features by changing views and triggering live modules:
 * 1. 3D Tactical Canyon & Astronaut Visor (switches to surface3d)
 * 2. NASA Mars Trek Multi-Layer GIS (switches to gis)
 * 3. 3D Digital Twin Mars Globe & Structures (switches to globe)
 * 4. Slope-Penalized A* Pathfinding Benchmark (opens live benchmark)
 * 5. Life-Support Consumables & Sol 1328 Physics
 * 6. AI Mission Commander (opens Gemini 1.5 Flash panel)
 *
 * Designed as a non-blocking floating tour guide popup card with:
 * - "1 / 6" step counter
 * - "Next" and "Back" navigation
 * - Dedicated "Skip" option
 */

import React, { useState, useEffect } from 'react';
import { sfx } from '../utils/soundFX';
import {
  Compass,
  Rocket,
  Layers,
  Box,
  Globe,
  Bot,
  Activity,
  X,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  Sparkles,
  User,
  Play,
  BarChart3
} from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'canyon3d',
    title: '3D TACTICAL CANYON & VISOR',
    subtitle: 'Neretva Vallis & Jezero Crater Western Delta',
    viewMode: 'surface3d',
    icon: Box,
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowColor: 'rgba(245, 158, 11, 0.35)',
    description:
      'Welcome to ARES-NAV! Explore high-resolution 3D Martian terrain with orbital controls. You can inspect elevation contours, slope hazards, and elevated waypoint pins.',
    actionLabel: 'Toggle Astronaut Visor POV',
    actionType: 'visor'
  },
  {
    id: 'gis',
    title: 'NASA MARS TREK MULTI-LAYER GIS',
    subtitle: 'Authentic JPL Tile Services & Remote Sensing',
    viewMode: 'gis',
    icon: Layers,
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(0, 240, 255, 0.35)',
    description:
      'You are now live in NASA JPL Mars Trek GIS! Streaming official planetary tiles: MGS MOLA elevation, Viking MDIM2.1 mosaic, CRISM astrobiology mineralogy, and Perseverance rover traverse tracks.',
    actionLabel: 'Zoom to Western Delta',
    actionType: 'gis_delta'
  },
  {
    id: 'globe',
    title: '3D MARS DIGITAL TWIN GLOBE',
    subtitle: 'Planetary Exploration Sites & Wikipedia Dossiers',
    viewMode: 'globe',
    icon: Globe,
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(168, 85, 247, 0.35)',
    description:
      'Welcome to the 3D Mars Digital Twin Globe! Rotate the planetary sphere to inspect Olympus Mons and Valles Marineris. Click on any historical lander or rover pin to open comprehensive scientific dossiers.',
    actionLabel: 'Explore Planetary Sites',
    actionType: 'globe_info'
  },
  {
    id: 'astar',
    title: 'SLOPE-PENALIZED A* BENCHMARK',
    subtitle: '5 Autonomous Pathfinding Algorithms Compared',
    viewMode: 'surface3d',
    icon: Compass,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowColor: 'rgba(16, 185, 129, 0.35)',
    description:
      'We benchmark 5 traversal algorithms in real time! Our Safe A* algorithm applies heavy exponential penalties to steep terrain slopes (>15° rollover hazard) and Séítah dune slip zones to safeguard astronauts.',
    actionLabel: 'View Benchmark Matrix',
    actionType: 'benchmark'
  },
  {
    id: 'lifesupport',
    title: 'ASTRONAUT LIFE-SUPPORT TELEMETRY',
    subtitle: 'Minetti Metabolic Physics & Sol 1328 Ground Truth',
    viewMode: 'surface3d',
    icon: Activity,
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    glowColor: 'rgba(244, 63, 94, 0.35)',
    description:
      'Notice the EVA telemetry HUD: Metabolic oxygen consumption scales dynamically with terrain gradient using Minetti metabolic physics. Surface cosmic radiation is calibrated to Mars 2020 Perseverance RAD Sol 1328 ground truth (0.62 mSv/day).',
    actionLabel: 'Start EVA Walking Simulation',
    actionType: 'simulate_eva'
  },
  {
    id: 'ai',
    title: 'AI MISSION COMMANDER (GEMINI 1.5 FLASH)',
    subtitle: 'Tactical Advisory HUD & Abort Calculations',
    viewMode: 'surface3d',
    icon: Bot,
    iconColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    glowColor: 'rgba(99, 102, 241, 0.35)',
    description:
      'AI Mission Commander is online powered by Google Gemini 1.5 Flash! It reads live mission telemetry, monitors dust storms, and calculates return-to-base abort deadlines with military brevity.',
    actionLabel: 'Open AI Mission Commander',
    actionType: 'open_ai'
  }
];

export function GuidedTourWalkthrough({
  isOpen,
  onClose,
  onSwitchView,
  onToggleFirstPerson,
  isFirstPerson,
  onOpenBenchmark,
  onCloseBenchmark,
  onOpenAI,
  onCloseAI,
  onStartEVA
}) {
  const [currentStep, setCurrentStep] = useState(0);

  // Actively drive app view & components as step changes
  useEffect(() => {
    if (!isOpen) return;
    const step = TOUR_STEPS[currentStep];
    if (!step) return;

    // Switch view mode
    if (onSwitchView && step.viewMode) {
      onSwitchView(step.viewMode);
    }

    // Step-specific live explorations
    if (currentStep === 3) {
      // Step 4: Open Benchmark
      onOpenBenchmark?.();
      onCloseAI?.();
    } else if (currentStep === 5) {
      // Step 6: Open AI Commander
      onCloseBenchmark?.();
      onOpenAI?.();
    } else {
      onCloseBenchmark?.();
      if (currentStep !== 5) {
        onCloseAI?.();
      }
    }
  }, [isOpen, currentStep]);

  // Handle keyboard escape or arrow navigation
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleSkip();
      } else if (e.key === 'ArrowRight') {
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        handlePrev();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const StepIcon = step.icon;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    sfx.click();
    if (isLast) {
      handleComplete();
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    sfx.click();
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSkip = () => {
    try {
      sfx.click();
    } catch {}
    onCloseBenchmark?.();
    onClose();
  };

  const handleComplete = () => {
    try {
      sfx.telemetry();
    } catch {}
    onCloseBenchmark?.();
    onClose();
  };

  const handleActionClick = () => {
    sfx.click();
    switch (step.actionType) {
      case 'visor':
        onToggleFirstPerson?.();
        break;
      case 'benchmark':
        onOpenBenchmark?.();
        break;
      case 'simulate_eva':
        onStartEVA?.();
        break;
      case 'open_ai':
        onOpenAI?.();
        break;
      default:
        break;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-8 z-50 max-w-sm md:max-w-md w-full select-none pointer-events-auto animate-in slide-in-from-bottom-5 duration-300">
      {/* Tour Popup Card */}
      <div
        className={`relative w-full bg-[#040816]/95 border ${step.borderColor} rounded-2xl p-5 shadow-[0_12px_45px_rgba(0,0,0,0.85)] backdrop-blur-xl space-y-3.5`}
        style={{ boxShadow: `0 10px 40px ${step.glowColor}` }}
      >
        {/* Top Header: 1/N Step Badge, Title & Skip Option */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg bg-slate-900 border ${step.borderColor}`}>
              <StepIcon className={`w-4 h-4 ${step.iconColor}`} />
            </div>
            {/* 1 / N Steps Indicator */}
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-400/60 text-cyan-300 font-mono font-bold text-xs tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.3)]">
              {currentStep + 1} / {TOUR_STEPS.length}
            </span>
            <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold">
              MISSION TOUR
            </span>
          </div>

          {/* Skip Option (Top-Right) */}
          <button
            onClick={handleSkip}
            className="px-2 py-1 rounded-lg bg-slate-900/80 hover:bg-rose-950/60 border border-slate-700/80 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1 shadow"
            title="Skip tour (Esc)"
          >
            <span>Skip</span>
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Step Content */}
        <div className="space-y-1.5">
          <div>
            <h2 className="text-sm md:text-base font-heading font-extrabold text-slate-100 tracking-wide">
              {step.title}
            </h2>
            <p className="text-[11px] font-mono text-cyan-300/85 font-medium">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs font-sans text-slate-300 leading-relaxed">
            {step.description}
          </p>

          {/* Interactive Action Button for this step */}
          <div className="pt-1">
            {step.actionType === 'visor' ? (
              <button
                onClick={handleActionClick}
                className="w-full py-1.5 px-3 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <User className="w-3.5 h-3.5" />
                <span>{isFirstPerson ? 'Exit Visor POV' : '🥽 Try Astronaut Visor POV'}</span>
              </button>
            ) : step.actionType === 'benchmark' ? (
              <button
                onClick={handleActionClick}
                className="w-full py-1.5 px-3 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <BarChart3 className="w-3.5 h-3.5" />
                <span>Open 5-Algorithm Benchmark</span>
              </button>
            ) : step.actionType === 'simulate_eva' ? (
              <button
                onClick={handleActionClick}
                className="w-full py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/40 text-rose-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Simulate EVA Walking Traversal</span>
              </button>
            ) : step.actionType === 'open_ai' ? (
              <button
                onClick={handleActionClick}
                className="w-full py-1.5 px-3 rounded-xl bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/40 text-indigo-300 text-xs font-mono font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow"
              >
                <Bot className="w-3.5 h-3.5" />
                <span>Ask AI Mission Commander</span>
              </button>
            ) : (
              <div className="py-1 px-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[10px] font-mono text-cyan-400/90 flex items-center gap-1.5">
                <Sparkles className="w-3 h-3 text-cyan-400 animate-pulse" />
                <span>LIVE SYSTEM ACTIVE // VIEW UPDATED IN BACKGROUND</span>
              </div>
            )}
          </div>
        </div>

        {/* Step Indicator Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-0.5">
          {TOUR_STEPS.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => {
                sfx.click();
                setCurrentStep(idx);
              }}
              className={`h-1.5 rounded-full transition-all cursor-pointer ${
                idx === currentStep
                  ? 'w-6 bg-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.8)]'
                  : 'w-1.5 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Bottom Actions: Skip Option on Left | Back & Next on Right */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
          <button
            onClick={handleSkip}
            className="px-3 py-1.5 rounded-xl border border-slate-800 hover:border-rose-500/60 text-slate-400 hover:text-rose-300 text-xs font-mono transition-all cursor-pointer flex items-center gap-1 hover:bg-rose-950/30"
          >
            <span>Skip</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrev}
              disabled={currentStep === 0}
              className={`px-3 py-1.5 rounded-xl border text-xs font-mono flex items-center gap-1 transition-all ${
                currentStep === 0
                  ? 'opacity-30 border-slate-800 text-slate-600 pointer-events-none'
                  : 'border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white bg-slate-900 cursor-pointer'
              }`}
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Back</span>
            </button>

            <button
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-mono font-bold text-xs flex items-center gap-1.5 shadow-[0_0_15px_rgba(0,240,255,0.4)] transition-all cursor-pointer"
            >
              <span>{isLast ? 'Finish' : 'Next'}</span>
              {isLast ? (
                <CheckCircle className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default GuidedTourWalkthrough;
