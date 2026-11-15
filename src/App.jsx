import React, { useState, useEffect } from 'react';
import { Mars3DView } from './components/Mars3DView';
import { MarsTrekGISView } from './components/MarsTrekGISView';
import { GoogleMarsEarthView } from './components/GoogleMarsEarthView';
import { EVAStatusHUD } from './components/EVAStatusHUD';
import { EVASimulator } from './components/EVASimulator';
import { ScienceInspector } from './components/ScienceInspector';
import { ElevationDrawer } from './components/ElevationDrawer';
import { DataSpecsModal } from './components/DataSpecsModal';
import { MissionExportModal } from './components/MissionExportModal';
import { AstrobiologyLabModal } from './components/AstrobiologyLabModal';
import { EVAMissionConfig } from './components/EVAMissionConfig';
import { EVALifeSupportCalc } from './components/EVALifeSupportCalc';
import { RouteComparison } from './components/RouteComparison';
import { MissionSimulator } from './components/MissionSimulator';
import { ScienceTargetPanel } from './components/ScienceTargetPanel';
import { DataExplorer } from './components/DataExplorer';
import { AIMissionCommander } from './components/AIMissionCommander';
import { SolarSystemLoadingScreen } from './components/SolarSystemLoadingScreen';
import { GuidedTourWalkthrough } from './components/GuidedTourWalkthrough';
import { PRECOMPUTED_ROUTES, SCIENCE_TARGETS } from './data/jezeroData';
import { computeCustomAStarRoute } from './utils/astarEngine';
import { compareAllRoutes } from './utils/pathfindingEngine';
import { sfx } from './utils/soundFX';
import {
  Rocket,
  ShieldAlert,
  Navigation,
  Layers,
  Box,
  Globe,
  Microscope,
  FileDown,
  Database,
  Eye,
  EyeOff,
  Radio,
  Target,
  User,
  Activity,
  Play,
  Sliders,
  Sparkles,
  BarChart3,
  Bot,
  Compass
} from 'lucide-react';

function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState('surface3d');
  const [activeSite, setActiveSite] = useState('jezero');
  const [routeType, setRouteType] = useState('safe');
  const [customRoute, setCustomRoute] = useState(null);
  const [customTarget, setCustomTarget] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [dustStorm, setDustStorm] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [isFirstPerson, setIsFirstPerson] = useState(false); // Visor POV Camera

  // EVA Mission Config State
  const [evaConfig, setEvaConfig] = useState({
    crewSize: 2,
    walkSpeedKmh: 3.0,
    o2CapacityL: 862,
    o2ConsumptionLmin: 0.84,
    batteryCapacityWh: 45000,
    batteryDrainWh: 85,
    missionDurationMin: 480,
    safetyReservePercent: 25,
    maxSlopeDeg: 15,
    thermalLimitC: -60,
    radiationLimitMsv: 1.0,
    returnToBase: true
  });
  const [evaElapsedSeconds, setEvaElapsedSeconds] = useState(0);
  const [evaRunning, setEvaRunning] = useState(false);

  // Pathfinding Benchmark State
  const [comparedRoutes, setComparedRoutes] = useState(null);
  const [isRouteCompareOpen, setIsRouteCompareOpen] = useState(false);

  // Mobile Tactical HUD Panel Toggle ('none' | 'routes' | 'telemetry')
  const [mobilePanel, setMobilePanel] = useState('none');

  // Modals State
  const [isTourOpen, setIsTourOpen] = useState(true);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);
  const [isMissionSimOpen, setIsMissionSimOpen] = useState(false);
  const [isSciencePanelOpen, setIsSciencePanelOpen] = useState(false);
  const [isDataExplorerOpen, setIsDataExplorerOpen] = useState(false);
  const [isAIOpen, setIsAIOpen] = useState(false);

  // 3D Terrain Overlays
  const [activeLayers, setActiveLayers] = useState({
    topography: true,
    mineralogy: true,
    hazards: true,
    targets: true
  });

  const activeRoute =
    dustStorm && routeType === 'direct'
      ? PRECOMPUTED_ROUTES.emergency
      : routeType === 'custom' && customRoute
      ? customRoute
      : PRECOMPUTED_ROUTES[routeType];

  // Live Timer for EVA Simulation
  useEffect(() => {
    let interval = null;
    if (simulationProgress > 0 && simulationProgress < 100) {
      setEvaRunning(true);
      interval = setInterval(() => {
        setEvaElapsedSeconds((sec) => sec + 1);
      }, 1000);
    } else {
      setEvaRunning(false);
    }
    return () => clearInterval(interval);
  }, [simulationProgress]);

  const handleRouteSwitch = (type) => {
    sfx.click();
    setRouteType(type);
    if (type === 'direct') {
      sfx.hazardAlarm();
    }
  };

  const handleTerrainClick = (targetX, targetZ) => {
    setCustomTarget({ x: targetX, z: targetZ });
    const computed = computeCustomAStarRoute(0, 0, targetX, targetZ, evaConfig.maxSlopeDeg);
    setCustomRoute(computed);
    setRouteType('custom');
    setSimulationProgress(0);
    sfx.scienceSuccess();
  };

  const toggleFirstPerson = () => {
    sfx.click();
    setIsFirstPerson(!isFirstPerson);
  };

  const handleOpenBenchmark = () => {
    sfx.click();
    const targetX = customTarget?.x ?? 12.0;
    const targetZ = customTarget?.z ?? -14.0;
    const results = compareAllRoutes(0, 0, targetX, targetZ);
    setComparedRoutes(results);
    setIsRouteCompareOpen(true);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#010206] select-none">
      {/* 🌌 Cinematic Heliocentric Solar System Transit Loading Screen */}
      {isLoading && (
        <SolarSystemLoadingScreen
          onComplete={() => {
            setIsLoading(false);
            setIsTourOpen(true);
          }}
        />
      )}

      {/* ============================================================== */}
      {/* 1. FULL-BLEED EDGE-TO-EDGE 3D VIEWPORT CANVAS (100vw x 100vh) */}
      {/* ============================================================== */}
      <div className="absolute inset-0 z-0 w-full h-full">
        {viewMode === 'surface3d' ? (
          <Mars3DView
            activeLayers={activeLayers}
            activeRoute={activeRoute}
            onSelectTarget={(t) => setSelectedTarget(t)}
            onTerrainClick={handleTerrainClick}
            customTarget={customTarget}
            simulationProgress={simulationProgress}
            dustStorm={dustStorm}
            showLabels={showLabels}
            isFirstPerson={isFirstPerson}
          />
        ) : viewMode === 'gis' ? (
          <MarsTrekGISView />
        ) : (
          <GoogleMarsEarthView
            onSiteSelect={(site) => {
              setActiveSite(site);
              setViewMode('surface3d');
            }}
            activeSite={activeSite}
          />
        )}
      </div>

      {/* ============================================================== */}
      {/* 2. FLOATING AEROSPACE COMMAND HEADER (TOP)                      */}
      {/* ============================================================== */}
      <header className="absolute top-2 sm:top-3 left-2 right-2 sm:left-4 sm:right-4 z-20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        {/* Top-Left Branding */}
        <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl px-3 py-1.5 sm:px-4 sm:py-2 flex items-center justify-between md:justify-start space-x-2.5 sm:space-x-3 pointer-events-auto border-cyan-500/30">
          <div className="flex items-center space-x-2.5 sm:space-x-3">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-cyan-300/40 shrink-0">
              <Rocket className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-950 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="font-heading font-extrabold text-xs sm:text-sm md:text-base tracking-widest text-slate-100 uppercase">
                  ARES-NAV <span className="text-cyan-400 text-[9px] sm:text-[10px] font-mono-num px-1 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/40 font-bold">TACTICAL HUD</span>
                </h1>
                <span className="text-[9px] sm:text-[10px] bg-slate-950/90 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold hidden sm:flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SHASWAT SINHA (SURAT)
                </span>
              </div>
              <p className="text-[9px] sm:text-[10px] font-mono text-slate-400 hidden xs:block truncate max-w-[280px] sm:max-w-none">
                NASA SPACE APPS CHALLENGE 2026 // MARTIAN MAP
              </p>
            </div>
          </div>

          {/* Mobile Astronaut Badge */}
          <span className="text-[9px] bg-slate-950/90 text-emerald-400 border border-emerald-500/40 px-1.5 py-0.5 rounded font-mono font-bold sm:hidden flex items-center gap-1 shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            SURAT
          </span>
        </div>

        {/* Top-Right Mission Tools & Navigation (Horizontal scrolling on mobile) */}
        <div className="flex items-center gap-1.5 pointer-events-auto overflow-x-auto no-scrollbar max-w-full py-0.5 px-0.5 shrink-0">
          {/* 🥽 FIRST-PERSON VISOR POV TOGGLE BUTTON (Only for 3D Canyon View) */}
          {viewMode === 'surface3d' && (
            <button
              onClick={toggleFirstPerson}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border shrink-0 ${
                isFirstPerson
                  ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.7)] animate-pulse'
                  : 'hud-glass text-cyan-300 border-cyan-500/40 hover:border-cyan-300'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              {isFirstPerson ? '🥽 VISOR: ON' : 'VISOR POV'}
            </button>
          )}

          {/* Mode Switcher */}
          <div className="hud-glass rounded-xl p-1 flex items-center border-cyan-500/30">
            <button
              onClick={() => {
                sfx.click();
                setViewMode('surface3d');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'surface3d'
                  ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.5)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Box className="w-3.5 h-3.5" />
              3D CANYON
            </button>
            <button
              onClick={() => {
                sfx.click();
                setViewMode('gis');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'gis'
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              NASA GIS
            </button>
            <button
              onClick={() => {
                sfx.click();
                setViewMode('globe');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'globe'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              3D GLOBE
            </button>
          </div>

          {/* 🧭 Guided Mission Tour (Skipable) */}
          <button
            onClick={() => {
              sfx.click();
              setIsTourOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-300 hover:text-amber-100 border-amber-500/40 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.25)] hover:border-amber-300 hover:shadow-[0_0_20px_rgba(245,158,11,0.5)] transition-all"
            title="Take a quick interactive guided tour of ARES-NAV (can be skipped anytime)"
          >
            <Compass className="w-3.5 h-3.5 text-amber-400" />
            TOUR
          </button>

          {/* 🤖 AI Mission Commander */}
          <button
            onClick={() => {
              sfx.click();
              setIsAIOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-indigo-300 hover:text-indigo-100 border-indigo-500/40 flex items-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:border-indigo-300 hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all"
          >
            <Bot className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            ASK AI
          </button>

          {/* 🚀 Mission Simulation Demo (Judges Special) */}
          <button
            onClick={() => {
              sfx.click();
              setIsMissionSimOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-amber-300 hover:text-amber-100 border-amber-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-amber-400"
          >
            <Play className="w-3.5 h-3.5 text-amber-400" />
            SIMULATE EVA
          </button>

          {/* ⚡ Pathfinding Benchmark 5 Algorithms */}
          <button
            onClick={handleOpenBenchmark}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-emerald-300 hover:text-emerald-100 border-emerald-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-emerald-400"
          >
            <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
            BENCHMARK
          </button>

          {/* 🔬 Science Target Explorer */}
          <button
            onClick={() => {
              sfx.click();
              setIsSciencePanelOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-purple-300 hover:text-purple-100 border-purple-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-purple-400"
          >
            <Microscope className="w-3.5 h-3.5 text-purple-400" />
            SCIENCE
          </button>

          {/* 📊 NASA Data Explorer */}
          <button
            onClick={() => {
              sfx.click();
              setIsDataExplorerOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-300 hover:text-white border-cyan-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-cyan-400"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            DATASETS
          </button>

          {/* Labels Toggle */}
          <button
            onClick={() => {
              sfx.click();
              setShowLabels(!showLabels);
            }}
            className="hud-glass px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-cyan-300 border-cyan-500/30 flex items-center gap-1 cursor-pointer"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>{showLabels ? 'LABELS ON' : 'LABELS OFF'}</span>
          </button>

          {/* Data Specs Modal */}
          <button
            onClick={() => {
              sfx.click();
              setIsSpecsOpen(true);
            }}
            className="hud-glass px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white border-slate-700 flex items-center gap-1 cursor-pointer"
          >
            SPECS
          </button>

          {/* Astrobiology Lab */}
          <button
            onClick={() => {
              sfx.click();
              setIsLabOpen(true);
            }}
            className="hud-glass px-2.5 py-1.5 rounded-xl text-xs font-mono font-bold text-purple-300 hover:text-purple-100 border-purple-500/30 flex items-center gap-1 cursor-pointer"
          >
            LAB
          </button>

          {/* Export Flight Plan */}
          <button
            onClick={() => {
              sfx.click();
              setIsExportOpen(true);
            }}
            className="px-3 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/50 flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            FLIGHT ORDER
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3 & 4. FLOATING TACTICAL PANELS (SURFACE 3D CANYON MODE ONLY)   */}
      {/* ============================================================== */}
      {viewMode === 'surface3d' && (
        <>
          {/* 3. FLOATING LEFT PANEL: ALGORITHM SELECTOR & EVA CONFIG */}
          <div className={`absolute top-20 left-2 right-2 md:right-auto md:left-4 z-20 w-auto md:w-80 space-y-2.5 pointer-events-auto max-h-[75vh] md:max-h-[85vh] overflow-y-auto pr-1 ${
            mobilePanel === 'routes' ? 'block' : 'hidden md:block'
          }`}>
        {/* Route Selector Card */}
        <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl p-3.5 border-cyan-500/30 space-y-2.5">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
            <span className="font-heading font-bold text-xs text-cyan-300 uppercase tracking-wider">
              PATHFINDING COST ENGINE
            </span>
            <span className="text-[10px] font-mono text-slate-400">A* ALGORITHM</span>
          </div>

          <div className="space-y-1.5">
            <button
              onClick={() => handleRouteSwitch('safe')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer font-mono ${
                routeType === 'safe'
                  ? 'bg-emerald-950/70 border-emerald-500/60 text-emerald-300 shadow-[0_0_15px_rgba(0,255,136,0.3)]'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-emerald-400" /> A* Safe Corridor
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Max: 8.4° (Traversability Optimal)</div>
              </div>
              <span className="text-xs font-bold text-emerald-400">96%</span>
            </button>

            <button
              onClick={() => handleRouteSwitch('direct')}
              className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer font-mono ${
                routeType === 'direct'
                  ? 'bg-rose-950/80 border-rose-500/80 text-rose-300 shadow-[0_0_20px_rgba(244,63,94,0.4)] animate-pulse'
                  : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="text-xs font-bold flex items-center gap-1.5">
                  <ShieldAlert className="w-3.5 h-3.5 text-rose-400" /> Direct Unconstrained
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">Max: 26.2° (Critical Hazard)</div>
              </div>
              <span className="text-xs font-bold text-rose-400">42%</span>
            </button>

            {customRoute && (
              <button
                onClick={() => handleRouteSwitch('custom')}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer font-mono ${
                  routeType === 'custom'
                    ? 'bg-amber-950/70 border-amber-500/70 text-amber-300 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                    : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div>
                  <div className="text-xs font-bold flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-amber-400" /> Custom Clicked Path
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">
                    {customRoute.distanceKm} km // {customRoute.maxSlopeDeg}°
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-400">{customRoute.safetyScore}%</span>
              </button>
            )}
          </div>
        </div>

        {/* EVA Mission Parameters Config (Collapsible) */}
        <EVAMissionConfig config={evaConfig} onChange={setEvaConfig} />

        {/* Selected Science Target Info Card */}
        {selectedTarget && (
          <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl p-3.5 border-purple-500/30 space-y-2 font-mono text-xs">
            <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
              <span className="font-heading font-bold text-purple-300 text-xs truncate">
                🔬 {selectedTarget.name}
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                BIO: {selectedTarget.biosignaturePotential}
              </span>
            </div>

            <div className="text-[11px] text-slate-300 line-clamp-2">
              {selectedTarget.description}
            </div>

            <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
              <div className="bg-slate-950/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">MINERAL:</span>
                <div className="text-purple-300 font-bold mt-0.5">{selectedTarget.targetMineral}</div>
              </div>
              <div className="bg-slate-950/90 p-2 rounded-lg border border-slate-800">
                <span className="text-slate-500">INSTRUMENT:</span>
                <div className="text-cyan-300 font-bold mt-0.5">{selectedTarget.instrument}</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================== */}
      {/* 4. FLOATING RIGHT PANEL: TELEMETRY & LIVE LIFE SUPPORT CALC    */}
      {/* ============================================================== */}
      <div className={`absolute top-20 left-2 right-2 md:left-auto md:right-4 z-20 w-auto md:w-96 space-y-2.5 pointer-events-auto max-h-[75vh] md:max-h-[85vh] overflow-y-auto pr-1 ${
        mobilePanel === 'telemetry' ? 'block' : 'hidden md:block'
      }`}>
        {/* Core Walk Simulator */}
        <EVASimulator
          activeRoute={activeRoute}
          onProgressUpdate={(prog) => setSimulationProgress(prog)}
          dustStorm={dustStorm}
        />

        {/* Live Mathematical Life Support Calculations */}
        <EVALifeSupportCalc
          config={evaConfig}
          activeRoute={activeRoute}
          dustStorm={dustStorm}
          elapsedSeconds={evaElapsedSeconds}
          running={evaRunning}
        />

        {/* Environmental Telemetry & Dynamic Shader Toggles */}
        <EVAStatusHUD
          activeRoute={activeRoute}
          selectedTarget={selectedTarget}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          dustStorm={dustStorm}
          setDustStorm={setDustStorm}
        />
      </div>

      {/* 📱 MOBILE TACTICAL HUD NAVIGATION BAR (Only on phones in 3D Canyon Mode) */}
      <div className="md:hidden absolute bottom-3 left-2 right-2 z-30 flex items-center justify-center pointer-events-auto">
        <div className="hud-glass rounded-2xl p-1 flex items-center gap-1 border-cyan-500/40 shadow-2xl backdrop-blur-xl">
          <button
            onClick={() => {
              sfx.click();
              setMobilePanel(p => p === 'routes' ? 'none' : 'routes');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
              mobilePanel === 'routes'
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                : 'text-cyan-300 hover:text-white'
            }`}
          >
            <Navigation className="w-3 h-3" />
            <span>{mobilePanel === 'routes' ? '✕ CLOSE' : 'ROUTES'}</span>
          </button>

          <button
            onClick={() => {
              sfx.click();
              setMobilePanel('none');
            }}
            className={`px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all ${
              mobilePanel === 'none' ? 'text-amber-400 bg-slate-900 border border-amber-500/30' : 'text-slate-400'
            }`}
          >
            <span>3D CANYON</span>
          </button>

          <button
            onClick={() => {
              sfx.click();
              setMobilePanel(p => p === 'telemetry' ? 'none' : 'telemetry');
            }}
            className={`px-2.5 py-1.5 rounded-xl text-[11px] font-mono font-bold transition-all flex items-center gap-1 ${
              mobilePanel === 'telemetry'
                ? 'bg-rose-500 text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                : 'text-rose-300 hover:text-white'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>{mobilePanel === 'telemetry' ? '✕ CLOSE' : 'TELEMETRY'}</span>
          </button>
        </div>
      </div>

      {/* COLLAPSIBLE BOTTOM DRAWER: ELEVATION & SLOPE PROFILE (Desktop only or collapsed) */}
      <div className="hidden sm:block">
        <ElevationDrawer activeRoute={activeRoute} />
      </div>
    </>
  )}

      {/* ============================================================== */}
      {/* 5. FLOATING BENCHMARK COMPARISON MODAL                          */}
      {/* ============================================================== */}
      {isRouteCompareOpen && comparedRoutes && (
        <div className="absolute bottom-16 sm:bottom-20 left-2 right-2 sm:right-auto sm:left-4 z-30 sm:w-[480px] max-w-full">
          <RouteComparison
            routes={comparedRoutes}
            activeAlgorithm={routeType}
            onSelectAlgorithm={(route) => {
              setCustomRoute(route);
              setRouteType('custom');
              setIsRouteCompareOpen(false);
            }}
            onClose={() => setIsRouteCompareOpen(false)}
          />
        </div>
      )}

      {/* ============================================================== */}
      {/* 7. MODALS                                                      */}
      {/* ============================================================== */}
      <DataSpecsModal isOpen={isSpecsOpen} onClose={() => setIsSpecsOpen(false)} />

      <AstrobiologyLabModal
        isOpen={isLabOpen}
        onClose={() => setIsLabOpen(false)}
        selectedTarget={selectedTarget}
      />

      <MissionExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeRoute={activeRoute}
        selectedTarget={selectedTarget}
      />

      <MissionSimulator
        isOpen={isMissionSimOpen}
        onClose={() => setIsMissionSimOpen(false)}
        onSimComplete={() => {
          sfx.scienceSuccess();
          setIsMissionSimOpen(false);
        }}
      />

      <ScienceTargetPanel
        isOpen={isSciencePanelOpen}
        onClose={() => setIsSciencePanelOpen(false)}
        onSelectTarget={(t) => {
          setSelectedTarget(t);
          setIsSciencePanelOpen(false);
        }}
        currentTarget={selectedTarget}
      />

      <DataExplorer
        isOpen={isDataExplorerOpen}
        onClose={() => setIsDataExplorerOpen(false)}
      />

      {/* Guided Tour Walkthrough (Entry Popup & Non-blocking Real Explorer) */}
      <GuidedTourWalkthrough
        isOpen={isTourOpen}
        onClose={() => setIsTourOpen(false)}
        onSwitchView={(mode) => setViewMode(mode)}
        onToggleFirstPerson={toggleFirstPerson}
        isFirstPerson={isFirstPerson}
        onOpenBenchmark={handleOpenBenchmark}
        onCloseBenchmark={() => setIsRouteCompareOpen(false)}
        onOpenAI={() => setIsAIOpen(true)}
        onCloseAI={() => setIsAIOpen(false)}
        onStartEVA={() => {
          setSimulationProgress((p) => (p > 0 ? 0 : 5));
          sfx.telemetry();
        }}
      />

      {/* ============================================================== */}
      {/* 8. FLOATING AI MISSION COMMANDER PANEL                          */}
      {/* ============================================================== */}
      {isAIOpen && (
        <div className="absolute bottom-16 sm:bottom-24 right-2 sm:right-4 z-40 max-w-[calc(100vw-1rem)]">
          <AIMissionCommander
            routeType={routeType}
            activeRoute={activeRoute}
            evaConfig={evaConfig}
            evaElapsedSeconds={evaElapsedSeconds}
            dustStorm={dustStorm}
            selectedTarget={selectedTarget}
            viewMode={viewMode}
            comparedRoutes={comparedRoutes}
            onClose={() => setIsAIOpen(false)}
          />
        </div>
      )}
    </div>
  );
}

export default App;
