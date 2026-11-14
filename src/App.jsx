import React, { useState } from 'react';
import { MarsMapView } from './components/MarsMapView';
import { Mars3DView } from './components/Mars3DView';
import { EVAStatusHUD } from './components/EVAStatusHUD';
import { ScienceInspector } from './components/ScienceInspector';
import { ElevationProfile } from './components/ElevationProfile';
import { EVASimulator } from './components/EVASimulator';
import { MissionExportModal } from './components/MissionExportModal';
import { PRECOMPUTED_ROUTES, SCIENCE_TARGETS } from './data/jezeroData';
import { sfx } from './utils/soundFX';
import { Rocket, ShieldAlert, Navigation, Layers, Box, Map as MapIcon, Crosshair, FileDown, Radio } from 'lucide-react';

function App() {
  const [viewMode, setViewMode] = useState('3d'); // '3d' or '2d'
  const [routeType, setRouteType] = useState('safe'); // 'safe' or 'direct'
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]); // Three Forks Delta Front
  const [simulationProgress, setSimulationProgress] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    topography: true,
    mineralogy: true,
    hazards: true,
    targets: true
  });

  const activeRoute = PRECOMPUTED_ROUTES[routeType];

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

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-orange-500 selection:text-black">
      {/* Top Tactical Mission Control Bar */}
      <header className="border-b border-slate-800/80 bg-slate-950/95 backdrop-blur-md sticky top-0 z-50 px-6 py-2.5">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-600 via-rose-600 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-950/50 border border-orange-400/40">
              <Rocket className="w-5 h-5 text-white transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-extrabold text-lg tracking-wider text-slate-100 uppercase">
                  ARES-NAV <span className="text-orange-400 text-xs font-mono px-2 py-0.5 rounded border border-orange-500/40 bg-orange-950/40">TACTICAL 3D</span>
                </h1>
                <span className="text-[11px] bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 px-2 py-0.5 rounded font-mono font-semibold flex items-center gap-1">
                  <Radio className="w-3 h-3 text-emerald-400 animate-pulse" />
                  SHASWAT SINHA // SURAT
                </span>
              </div>
              <p className="text-xs text-slate-400">
                NASA Space Apps Challenge 2026 // Team Singular Anomaly
              </p>
            </div>
          </div>

          {/* Mode Switchers: 3D/2D View & Route Pathfinding */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleViewSwitch('3d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewMode === '3d'
                    ? 'bg-gradient-to-r from-orange-600 to-amber-600 text-white shadow-md shadow-orange-950/50 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Box className="w-3.5 h-3.5" />
                3D Terrain Orbit
              </button>
              <button
                onClick={() => handleViewSwitch('2d')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  viewMode === '2d'
                    ? 'bg-slate-700 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                2D Map
              </button>
            </div>

            {/* Pathfinding Toggle */}
            <div className="flex items-center bg-slate-900 border border-slate-800 p-1 rounded-xl">
              <button
                onClick={() => handleRouteSwitch('safe')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  routeType === 'safe'
                    ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Navigation className="w-3.5 h-3.5" />
                A* Safe Path
              </button>
              <button
                onClick={() => handleRouteSwitch('direct')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all cursor-pointer ${
                  routeType === 'direct'
                    ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Direct Line (Hazard)
              </button>
            </div>

            {/* Export Mission Button */}
            <button
              onClick={() => {
                sfx.click();
                setIsExportOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-mono font-bold bg-slate-900 border border-orange-500/50 text-orange-400 hover:bg-orange-950/40 transition-all cursor-pointer shadow-lg shadow-orange-950/40"
            >
              <FileDown className="w-3.5 h-3.5" />
              EXPORT EVA PLAN
            </button>
          </div>
        </div>
      </header>

      {/* Main Mission Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 3D/2D Viewport + Elevation Profile (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div className="flex items-center space-x-2 text-xs font-mono">
              <Layers className="w-4 h-4 text-orange-400" />
              <span className="text-slate-300 font-semibold">TARGET:</span>
              <span className="text-orange-400 font-bold">JEZERO CRATER RIVER DELTA</span>
            </div>
            <div className="flex items-center space-x-3 text-xs font-mono text-slate-400">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span> Hab Alpha
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-purple-400"></span> 4 Science Sites
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> Obstacle Zones
              </span>
            </div>
          </div>

          {/* Interactive 3D / 2D Viewport */}
          <div className="flex-1 relative">
            {viewMode === '3d' ? (
              <Mars3DView
                activeLayers={activeLayers}
                activeRoute={activeRoute}
                onSelectTarget={handleSelectTarget}
                simulationProgress={simulationProgress}
              />
            ) : (
              <MarsMapView
                activeLayers={activeLayers}
                activeRoute={activeRoute}
                onSelectTarget={handleSelectTarget}
              />
            )}
          </div>

          {/* Dynamic Elevation Cross-Section Profile */}
          <ElevationProfile activeRoute={activeRoute} />

          {/* NASA Datasets Attribution Bar */}
          <div className="bg-slate-900/50 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-400 flex flex-wrap items-center justify-between gap-2 font-mono">
            <span className="text-slate-500 font-bold flex items-center gap-1">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" /> NASA TELEMETRY INTEGRATIONS:
            </span>
            <span className="text-slate-300">🛰️ HiRISE Optical</span>
            <span className="text-slate-300">🏔️ MOLA/HRSC DEM (3D Mesh)</span>
            <span className="text-slate-300">🧪 CRISM Spectral Clays</span>
            <span className="text-slate-300">🌡️ MEDA/RAD Sol 1320</span>
          </div>
        </div>

        {/* Right Column: Astronaut Telemetry HUD, Simulator & Science Inspector (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
          {/* EVA Marswalk Simulation */}
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

          <ScienceInspector
            target={selectedTarget}
            onClose={() => setSelectedTarget(null)}
          />
        </div>
      </main>

      {/* Mission Export Plan Modal */}
      <MissionExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        activeRoute={activeRoute}
        selectedTarget={selectedTarget}
      />

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-3 px-6 text-center text-xs text-slate-500 font-mono">
        NASA Space Apps Challenge 2026 // Shaswat Sinha // Team Singular Anomaly (Surat Hub)
      </footer>
    </div>
  );
}

export default App;
