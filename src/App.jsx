import React, { useState } from 'react';
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
import { PRECOMPUTED_ROUTES, SCIENCE_TARGETS } from './data/jezeroData';
import { computeCustomAStarRoute } from './utils/astarEngine';
import { sfx } from './utils/soundFX';
import { Rocket, ShieldAlert, Navigation, Layers, Box, Globe, Microscope, FileDown, Database, Eye, EyeOff, Radio, Target, User } from 'lucide-react';

function App() {
  const [viewMode, setViewMode] = useState('surface3d');
  const [activeSite, setActiveSite] = useState('jezero');
  const [routeType, setRouteType] = useState('safe');
  const [customRoute, setCustomRoute] = useState(null);
  const [customTarget, setCustomTarget] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [dustStorm, setDustStorm] = useState(false);
  const [showLabels, setShowLabels] = useState(true);
  const [isFirstPerson, setIsFirstPerson] = useState(false); // Visor POV Camera!

  // Modals
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [isSpecsOpen, setIsSpecsOpen] = useState(false);

  const [activeLayers, setActiveLayers] = useState({
    topography: true,
    mineralogy: true,
    hazards: true,
    targets: true
  });

  const activeRoute = dustStorm && routeType === 'direct' 
    ? PRECOMPUTED_ROUTES.emergency 
    : (routeType === 'custom' && customRoute ? customRoute : PRECOMPUTED_ROUTES[routeType]);

  const handleRouteSwitch = (type) => {
    sfx.click();
    setRouteType(type);
    if (type === 'direct') {
      sfx.hazardAlarm();
    }
  };

  const handleTerrainClick = (targetX, targetZ) => {
    setCustomTarget({ x: targetX, z: targetZ });
    const computed = computeCustomAStarRoute(0, 0, targetX, targetZ, 15.0);
    setCustomRoute(computed);
    setRouteType('custom');
    setSimulationProgress(0);
    sfx.scienceSuccess();
  };

  const toggleFirstPerson = () => {
    sfx.click();
    setIsFirstPerson(!isFirstPerson);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#010206] select-none">
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
      <header className="absolute top-4 left-4 right-4 z-20 flex flex-col md:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Top-Left Branding */}
        <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl px-4 py-2.5 flex items-center space-x-3 pointer-events-auto border-cyan-500/30">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,255,0.4)] border border-cyan-300/40">
            <Rocket className="w-5 h-5 text-slate-950 transform -rotate-45" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-heading font-extrabold text-sm md:text-base tracking-widest text-slate-100 uppercase">
                ARES-NAV <span className="text-cyan-400 text-[10px] font-mono-num px-1.5 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/40 font-bold">TACTICAL HUD // v3.8</span>
              </h1>
              <span className="text-[10px] bg-slate-950/90 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                SHASWAT SINHA (SURAT)
              </span>
            </div>
            <p className="text-[10px] font-mono text-slate-400">
              NASA SPACE APPS CHALLENGE // INTERPLANETARY SURVIVAL: MARTIAN MAP
            </p>
          </div>
        </div>

        {/* Top-Right Tools */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* 🥽 FIRST-PERSON VISOR POV TOGGLE BUTTON */}
          <button
            onClick={toggleFirstPerson}
            className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 cursor-pointer transition-all border ${
              isFirstPerson
                ? 'bg-cyan-500 text-slate-950 border-cyan-300 shadow-[0_0_20px_rgba(0,240,255,0.7)] animate-pulse'
                : 'hud-glass text-cyan-300 border-cyan-500/40 hover:border-cyan-300'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            {isFirstPerson ? '🥽 VISOR POV: ACTIVE' : 'SWITCH TO VISOR POV'}
          </button>

          {/* Mode Switcher */}
          <div className="hud-glass rounded-xl p-1 flex items-center border-cyan-500/30">
            <button
              onClick={() => {
                sfx.click();
                setViewMode('surface3d');
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
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
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                viewMode === 'globe'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              3D GLOBE
            </button>
          </div>

          {/* Labels Toggle */}
          <button
            onClick={() => {
              sfx.click();
              setShowLabels(!showLabels);
            }}
            className="hud-glass px-2.5 py-1.5 rounded-xl text-xs font-mono text-slate-300 hover:text-cyan-300 border-cyan-500/30 flex items-center gap-1 cursor-pointer"
          >
            {showLabels ? <Eye className="w-3.5 h-3.5 text-cyan-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-500" />}
            <span>LABELS: {showLabels ? 'ON' : 'OFF'}</span>
          </button>

          {/* Data Specs Modal */}
          <button
            onClick={() => {
              sfx.click();
              setIsSpecsOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-cyan-300 hover:text-white border-cyan-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-cyan-400"
          >
            <Database className="w-3.5 h-3.5 text-cyan-400" />
            SPECS
          </button>

          {/* Astrobiology Lab */}
          <button
            onClick={() => {
              sfx.click();
              setIsLabOpen(true);
            }}
            className="hud-glass px-3 py-1.5 rounded-xl text-xs font-mono font-bold text-purple-300 hover:text-purple-100 border-purple-500/40 flex items-center gap-1.5 cursor-pointer shadow-lg hover:border-purple-400"
          >
            <Microscope className="w-3.5 h-3.5 text-purple-400" />
            LAB
          </button>

          {/* Export Flight Plan */}
          <button
            onClick={() => {
              sfx.click();
              setIsExportOpen(true);
            }}
            className="px-3.5 py-1.5 rounded-xl text-xs font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/50 flex items-center gap-1.5"
          >
            <FileDown className="w-3.5 h-3.5" />
            FLIGHT ORDER
          </button>
        </div>
      </header>

      {/* ============================================================== */}
      {/* 3. FLOATING LEFT PANEL: ALGORITHM ROUTE SELECTOR               */}
      {/* ============================================================== */}
      <div className="absolute top-24 left-4 z-20 w-80 space-y-3 pointer-events-auto">
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
                  <div className="text-[10px] text-slate-400 mt-0.5">{customRoute.distanceKm} km // {customRoute.maxSlopeDeg}°</div>
                </div>
                <span className="text-xs font-bold text-amber-400">{customRoute.safetyScore}%</span>
              </button>
            )}
          </div>
        </div>

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
      {/* 4. FLOATING RIGHT PANEL: TELEMETRY HUD & LIFE SUPPORT           */}
      {/* ============================================================== */}
      <div className="absolute top-24 right-4 z-20 w-96 space-y-3 pointer-events-auto max-h-[85vh] overflow-y-auto pr-1">
        <EVASimulator
          activeRoute={activeRoute}
          onProgressUpdate={(prog) => setSimulationProgress(prog)}
          dustStorm={dustStorm}
        />

        <EVAStatusHUD
          activeRoute={activeRoute}
          selectedTarget={selectedTarget}
          activeLayers={activeLayers}
          setActiveLayers={setActiveLayers}
          dustStorm={dustStorm}
          setDustStorm={setDustStorm}
        />
      </div>

      {/* ============================================================== */}
      {/* 5. COLLAPSIBLE BOTTOM DRAWER: ELEVATION & SLOPE PROFILE       */}
      {/* ============================================================== */}
      <ElevationDrawer activeRoute={activeRoute} />

      {/* ============================================================== */}
      {/* 6. MODALS                                                      */}
      {/* ============================================================== */}
      <DataSpecsModal
        isOpen={isSpecsOpen}
        onClose={() => setIsSpecsOpen(false)}
      />

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
    </div>
  );
}

export default App;
