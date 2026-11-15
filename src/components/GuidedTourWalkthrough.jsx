/**
 * GuidedTourWalkthrough.jsx — Interactive Onboarding Tour for ARES-NAV
 *
 * Provides a guided 6-step walkthrough of the key mission planner features:
 * 1. 3D Tactical Canyon & Astronaut Visor
 * 2. NASA Mars Trek GIS Reconnaissance
 * 3. 3D Digital Twin Mars Globe & Exploration Dossiers
 * 4. Slope-Penalized A* Pathfinding Benchmark
 * 5. Life-Support Consumables & Sol 1328 Physics
 * 6. AI Mission Commander
 *
 * Can be skipped at any time via the prominent "SKIP TOUR" button or Escape key.
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
  ShieldCheck
} from 'lucide-react';

const TOUR_STEPS = [
  {
    id: 'canyon3d',
    title: '3D TACTICAL CANYON & ASTRONAUT VISOR',
    subtitle: 'Neretva Vallis & Jezero Crater Western Delta',
    viewMode: 'surface3d',
    icon: Box,
    iconColor: 'text-amber-400',
    borderColor: 'border-amber-500/40',
    glowColor: 'rgba(245, 158, 11, 0.3)',
    description:
      'Navigate the high-resolution 3D Martian terrain canvas with edge-to-edge WebGL controls. Switch into the First-Person Astronaut Visor POV to inspect elevation contours, slope hazards, and the elevated holographic waypoint pins.'
  },
  {
    id: 'gis',
    title: 'NASA MARS TREK MULTI-LAYER GIS',
    subtitle: 'Authentic JPL Tile Services & Remote Sensing',
    viewMode: 'gis',
    icon: Layers,
    iconColor: 'text-cyan-400',
    borderColor: 'border-cyan-500/40',
    glowColor: 'rgba(0, 240, 255, 0.3)',
    description:
      'Explore official NASA JPL planetary tile services including MGS MOLA elevation, Viking MDIM2.1 imagery, CRISM astrobiology mineral layers, and Perseverance rover traverse tracks with real-time coordinate inspection.'
  },
  {
    id: 'globe',
    title: '3D MARS DIGITAL TWIN GLOBE',
    subtitle: 'Planetary Exploration Sites & Wikipedia Dossiers',
    viewMode: 'globe',
    icon: Globe,
    iconColor: 'text-purple-400',
    borderColor: 'border-purple-500/40',
    glowColor: 'rgba(168, 85, 247, 0.3)',
    description:
      'Rotate the procedural 3D Martian globe to explore Valles Marineris, Olympus Mons, and northern polar ice caps. Click on 18+ historical landers and rovers to open comprehensive scientific mission dossiers.'
  },
  {
    id: 'astar',
    title: 'SLOPE-PENALIZED A* PATHFINDING',
    subtitle: '5-Algorithm Benchmark & Safety Corridors',
    viewMode: 'surface3d',
    icon: Compass,
    iconColor: 'text-emerald-400',
    borderColor: 'border-emerald-500/40',
    glowColor: 'rgba(16, 185, 129, 0.3)',
    description:
      'Compare 5 traversal algorithms (Safe A*, Dijkstra, Greedy, Bidirectional A*, and Direct Line). The algorithm penalizes steep terrain slopes (>15° rollover limit) and Séítah dune slip hazards to safeguard astronaut life.'
  },
  {
    id: 'lifesupport',
    title: 'ASTRONAUT LIFE-SUPPORT TELEMETRY',
    subtitle: 'Minetti Metabolic Physics & Sol 1328 Baselines',
    viewMode: 'surface3d',
    icon: Activity,
    iconColor: 'text-rose-400',
    borderColor: 'border-rose-500/40',
    glowColor: 'rgba(244, 63, 94, 0.3)',
    description:
      'Monitor real-time metabolic oxygen expenditure (scaling dynamically with terrain gradient), suit power reserves, and surface cosmic radiation calibrated against Mars 2020 Perseverance RAD Sol 1328 ground truth (0.62 mSv/day).'
  },
  {
    id: 'ai',
    title: 'AI MISSION COMMANDER (GEMINI FLASH)',
    subtitle: 'Tactical Advisory HUD & Abort Calculations',
    viewMode: 'surface3d',
    icon: Bot,
    iconColor: 'text-indigo-400',
    borderColor: 'border-indigo-500/40',
    glowColor: 'rgba(99, 102, 241, 0.3)',
    description:
      'Activate the integrated Gemini 1.5 Flash tactical advisor to receive military-brevity telemetry analysis, return-to-base abort deadlines, and geological sample prioritization directly within the mission HUD.'
  }
];

export function GuidedTourWalkthrough({ isOpen, onClose, onSwitchView }) {
  const [currentStep, setCurrentStep] = useState(0);

  // Switch the app's viewMode automatically to match the tour step
  useEffect(() => {
    if (isOpen && TOUR_STEPS[currentStep]) {
      const step = TOUR_STEPS[currentStep];
      if (onSwitchView && step.viewMode) {
        onSwitchView(step.viewMode);
      }
    }
  }, [isOpen, currentStep, onSwitchView]);

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
    onClose();
  };

  const handleComplete = () => {
    try {
      sfx.telemetry();
    } catch {}
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm select-none animate-in fade-in duration-200">
      {/* Tour Popup Card */}
      <div
        className={`relative w-full max-w-md bg-[#040816]/95 border ${step.borderColor} rounded-2xl p-5 md:p-6 shadow-2xl backdrop-blur-xl space-y-4`}
        style={{ boxShadow: `0 10px 40px ${step.glowColor}` }}
      >
        {/* Top Header: 1/N Step Badge & Skip Option */}
        <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
          <div className="flex items-center gap-2.5">
            <div className={`p-1.5 rounded-lg bg-slate-900 border ${step.borderColor}`}>
              <StepIcon className={`w-4 h-4 ${step.iconColor}`} />
            </div>
            {/* 1 / N Steps Indicator */}
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-500/60 text-cyan-300 font-mono font-bold text-xs tracking-wider shadow-[0_0_10px_rgba(0,240,255,0.3)]">
                {currentStep + 1} / {TOUR_STEPS.length}
              </span>
              <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase font-semibold hidden sm:inline">
                MISSION TOUR
              </span>
            </div>
          </div>

          {/* Skip Option (Top) */}
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
        <div className="space-y-2">
          <div className="space-y-0.5">
            <h2 className="text-base md:text-lg font-heading font-extrabold text-slate-100 tracking-wide">
              {step.title}
            </h2>
            <p className="text-xs font-mono text-cyan-300/80 font-medium">
              {step.subtitle}
            </p>
          </div>

          <p className="text-xs font-sans text-slate-300 leading-relaxed pt-1">
            {step.description}
          </p>
        </div>

        {/* Step Indicator Progress Dots */}
        <div className="flex items-center justify-center gap-1.5 pt-1">
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
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
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
