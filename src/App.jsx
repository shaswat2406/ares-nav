import React, { useState } from 'react';
import { MarsTrekGISView } from './components/MarsTrekGISView';
import { GoogleMarsEarthView } from './components/GoogleMarsEarthView';
import { EVAStatusHUD } from './components/EVAStatusHUD';
import { ElevationProfile } from './components/ElevationProfile';
import { MissionExportModal } from './components/MissionExportModal';
import { AstrobiologyLabModal } from './components/AstrobiologyLabModal';
import { PRECOMPUTED_ROUTES, SCIENCE_TARGETS } from './data/jezeroData';
import { sfx } from './utils/soundFX';
import { Rocket, ShieldAlert, Navigation, Layers, Box, Globe, Crosshair, FileDown, Radio, Activity, Microscope } from 'lucide-react';

function App() {
  const [viewMode, setViewMode] = useState('gis'); // 'gis' (real NASA Mars Trek) or 'globe' (Planetary 3D)
  const [activeSite, setActiveSite] = useState('jezero');
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isLabOpen, setIsLabOpen] = useState(false);
  const [activeLayers, setActiveLayers] = useState({
    topography: true,
    mineralogy: true,
    hazards: true,
    targets: true
  });

  const activeRoute = PRECOMPUTED_ROUTES.safe;

  return (
    <div className="min-h-screen bg-[#02040a] text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      {/* 1. Ultra-Clean Professional Aerospace Header */}
      <header className="border-b border-cyan-500/20 bg-[#040816]/95 backdrop-blur-xl sticky top-0 z-50 px-6 py-3 shadow-[0_4px_30px_rgba(0,0,0,0.8)]">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 via-sky-600 to-blue-700 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,255,0.4)] border border-cyan-300/40">
              <Rocket className="w-5 h-5 text-slate-950 transform -rotate-45" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-heading font-extrabold text-base md:text-lg tracking-widest text-slate-100 uppercase">
                  ARES-NAV <span className="text-cyan-400 text-[11px] font-mono px-2 py-0.5 rounded border border-cyan-500/50 bg-cyan-950/40 font-bold hud-glow-cyan">NASA MARS TREK GIS</span>
                </h1>
                <span className="text-[10px] bg-slate-950 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded font-mono font-bold flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,255,136,0.2)]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  SHASWAT SINHA // SURAT
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 tracking-wider">
                NASA SPACE APPS CHALLENGE // INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP
              </p>
            </div>
          </div>

          {/* Mode Switchers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center bg-slate-950/90 border border-cyan-500/30 p-1 rounded-lg">
              <button
                onClick={() => {
                  sfx.click();
                  setViewMode('gis');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'gis'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                NASA MARS TREK (REAL GIS)
              </button>
              <button
                onClick={() => {
                  sfx.click();
                  setViewMode('globe');
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-mono font-bold transition-all cursor-pointer ${
                  viewMode === 'globe'
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-slate-950 shadow-[0_0_15px_rgba(249,115,22,0.4)]'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                3D PLANETARY GLOBE
              </button>
            </div>

            {/* Astrobiology Raman Lab Button */}
            <button
              onClick={() => {
                sfx.click();
                setIsLabOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-purple-950/60 border border-purple-500/50 text-purple-300 hover:bg-purple-900/60 transition-all cursor-pointer shadow-[0_0_15px_rgba(168,85,247,0.3)]"
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
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-mono font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white transition-all cursor-pointer shadow-[0_0_20px_rgba(249,115,22,0.4)] border border-orange-400/40"
            >
              <FileDown className="w-3.5 h-3.5" />
              FLIGHT ORDER
            </button>
          </div>
        </div>
      </header>

      {/* Main Command Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 Cols): Real Mars Map Viewer + Elevation Chart */}
        <div className="lg:col-span-8 flex flex-col space-y-4">
          <div className="flex-1 relative min-h-[600px]">
            {viewMode === 'gis' ? (
              <MarsTrekGISView />
            ) : (
              <GoogleMarsEarthView
                onSiteSelect={(site) => {
                  setActiveSite(site);
                  setViewMode('gis');
                }}
                activeSite={activeSite}
              />
            )}
          </div>

          <ElevationProfile activeRoute={activeRoute} />
        </div>

        {/* Right Column (4 Cols): Life Support Telemetry HUD */}
        <div className="lg:col-span-4 flex flex-col space-y-4">
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
