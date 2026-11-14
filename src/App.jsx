import React, { useState } from 'react';
import { MarsTrekGISView } from './components/MarsTrekGISView';
import { Mars3DView } from './components/Mars3DView';
import { GoogleMarsEarthView } from './components/GoogleMarsEarthView';
import { EVAStatusHUD } from './components/EVAStatusHUD';
import { ElevationProfile } from './components/ElevationProfile';
import { EVASimulator } from './components/EVASimulator';
import { MissionExportModal } from './components/MissionExportModal';
import { AstrobiologyLabModal } from './components/AstrobiologyLabModal';
import { PRECOMPUTED_ROUTES, SCIENCE_TARGETS } from './data/jezeroData';
import { computeCustomAStarRoute } from './utils/astarEngine';
import { sfx } from './utils/soundFX';
import { Rocket, ShieldAlert, Navigation, Layers, Box, Globe, Map as MapIcon, Crosshair, FileDown, Radio, Activity, Microscope, Target } from 'lucide-react';

function App() {
  // 3 Distinct Visualization Modes:
  // 1. 'gis' -> Official NASA JPL Mars Trek MOLA Satellite Elevation
  // 2. 'surface3d' -> 3D Surface Canyon & Delta Orbit (with click-to-pathfind)
  // 3. 'globe' -> Full 3D Planetary Mars Globe in Deep Space
  const [viewMode, setViewMode] = useState('gis');
  const [activeSite, setActiveSite] = useState('jezero');
  const [routeType, setRouteType] = useState('safe');
  const [customRoute, setCustomRoute] = useState(null);
  const [customTarget, setCustomTarget] = useState(null);
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    topography: true,
    mineralogy: true,
    hazards: true,
    targets: true
  });

  const activeRoute = routeType === 'custom' && customRoute ? customRoute : PRECOMPUTED_ROUTES[routeType];

  const handleRouteSwitch = (type) => {
    sfx.click();
    setRouteType(type);
    if (type === 'direct') {
      sfx.hazardAlarm();
    }
  };

  const handleViewSwitch = (mode) => {
    sfx.click();
    setViewMode(mode);
  };

  const handleSelectTarget = (target) => {
    sfx.click();
    setSelectedTarget(target);
  };

  const handleTerrainClick = (targetX, targetZ) => {
    setCustomTarget({ x: targetX, z: targetZ });
    const computed = computeCustomAStarRoute(0, 0, targetX, targetZ, 15.0);
    setCustomRoute(computed);
    setRouteType('custom');
    setSimulationProgress(0);
    sfx.scienceSuccess();
  };

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. Aerospace Mil-Spec Command Header */}
      <header className="border-b border-cyan-500/20 bg-[#040816]/95 backdrop-blur-xl sticky top-0 z-50 px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] border border-cyan-300/40">
              <Rocket className="w-5 h-5 text-slate-950 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading font-extrabold text-base md:text-lg tracking-widest text-slate-100 uppercase">
                  ARES-NAV <span className="text-cyan-400 text-[11px] font-mono px-2 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/40 font-bold hud-glow-cyan">TACTICAL SUITE // v3.2</span>
                </h1>
                <span className="text-[10px] bg-slate-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SHASWAT SINHA (SURAT)
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 tracking-wider">
                NASA SPACE APPS CHALLENGE // INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP
              </p>
            </div>
          </div>

          {/* Mode Switchers: 3 Views (NASA GIS / 3D Canyon / 3D Globe) */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center bg-slate-950/90 border border-cyan-500/30 p-1 rounded-lg">
              <button
                onClick={() => handleViewSwitch('gis')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'gis'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                NASA GIS SATELLITE
              </button>
              <button
                onClick={() => handleViewSwitch('surface3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'surface3d'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                3D CANYON ORBIT
              </button>
              <button
                onClick={() => handleViewSwitch('globe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'globe'
                    ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                3D GLOBE
              </button>
            </div>

            {/* Astrobiology Raman Lab Button */}
            <button
              onClick={() => {
                sfx.click();
                setIsLabOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-purple-950/60 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
            >
              <Microscope className="w-3.5 h-3.5 text-purple-400" />
              ASTROBIOLOGY LAB
            </button>

            {/* Export Dispatch Order */}
            <button
              onClick={() => {
                sfx.click();
                setIsExportOpen(true);
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/40"
            >
              <FileDown className="w-3.5 h-3.5" />
              FLIGHT ORDER
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Viewport + Elevation Profile */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          {/* Target Region Tactical Strip */}
          <div className="hud-panel rounded-lg px-4 py-2.5 flex items-center justify-between border-cyan-500/20 text-xs font-mono">
            <div className="flex items-center space-x-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">ACTIVE VIEWPORT:</span>
              <span className="font-heading text-cyan-300 font-bold tracking-wider uppercase">
                {viewMode === 'gis'
                  ? 'NASA JPL MARS TREK // REAL SATELLITE MOLA TOPOGRAPHY'
                  : viewMode === 'surface3d'
                  ? '3D JEZERO CANYON SURFACE // CLICK-TO-PATHFIND ACTIVE'
                  : '3D MARS PLANETARY TWIN // SPACE ORBIT'}
              </span>
            </div>
            <div className="flex items-center space-x-4 text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_6px_#00f0ff]"></span> Hab Alpha
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400 shadow-[0_0_6px_#c084fc]"></span> 4 CRISM Targets
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#f43f5e]"></span> 3 Hazard Zones
              </span>
            </div>
          </div>

          {/* Interactive Multi-View Container */}
          <div className="flex-1 relative min-h-[600px]">
            {viewMode === 'gis' ? (
              <MarsTrekGISView />
            ) : viewMode === 'surface3d' ? (
              <Mars3DView
                activeLayers={activeLayers}
                activeRoute={activeRoute}
                onSelectTarget={handleSelectTarget}
                onTerrainClick={handleTerrainClick}
                customTarget={customTarget}
                simulationProgress={simulationProgress}
              />
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

          {/* Dynamic Elevation Cross-Section Profile */}
          <ElevationProfile activeRoute={activeRoute} />

          {/* NASA Data Telemetry Bar */}
          <div className="hud-panel rounded-lg px-4 py-2.5 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono border-cyan-500/20">
            <span className="text-cyan-400 font-bold flex items-center gap-1.5 font-heading">
              <Activity className="w-3.5 h-3.5 text-cyan-400" /> NASA SCIENCE TELEMETRY STACK:
            </span>
            <span className="text-slate-300">🛰️ HiRISE Optical</span>
            <span className="text-slate-300">🏔️ MOLA/HRSC DEM</span>
            <span className="text-slate-300">🧪 CRISM Mineralogy</span>
            <span className="text-slate-300">🌡️ MEDA/RAD Sol 1320</span>
          </div>
        </div>

        {/* Right Column (4 Cols): Life Support Simulator, HUD & Science Inspector */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          <EVASimulator
            activeRoute={activeRoute}
            onProgressUpdate={(prog) => setSimulationProgress(prog)}
          />

          <EVAStatusHUD
            activeRoute={activeRoute}
            selectedTarget={selectedTarget}
            activeLayers={activeLayers}
            setActiveLayers={setActiveLayers}
          />
        </div>
      </main>

      {/* Modals */}
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

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-[#02040a] py-3.5 px-6 text-center text-xs text-slate-500 font-mono">
        NASA Space Apps Challenge 2026 // Shaswat Sinha // Team Singular Anomaly (Surat Hub)
      </footer>
    </div>
  );
}

export default App;
