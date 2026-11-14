import React, { useState } from 'react';
import { Download, CheckCircle, FileText, Printer, CloudUpload, User, MapPin } from 'lucide-react';
import { sfx } from '../utils/soundFX';
import { logEVAMission } from '../utils/supabaseClient';

export const MissionExportModal = ({ isOpen, onClose, activeRoute, selectedTarget }) => {
  if (!isOpen) return null;

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState(null);

  const handlePrint = () => {
    sfx.click();
    window.print();
  };

  const handleDownloadFile = () => {
    sfx.click();
    const flightPlanText = `========================================================================
NASA ARTEMIS EVA FLIGHT DISPATCH ORDER // JEZERO-2026
Team: Singular Anomaly // Local Hub: Surat, India
Astronaut: Shaswat Sinha
Timestamp: ${new Date().toISOString()}
========================================================================

1. MISSION SPECIFICATIONS:
- Sector: Jezero Crater Western River Delta
- Departure Hab: Artemis Hab Alpha (Butler Landing Site: 18.4447°N, 77.4508°E)
- Selected Traversal Route: ${activeRoute.name}
- Total Distance: ${activeRoute.distanceKm} km
- Estimated Duration: ${activeRoute.estimatedMinutes} minutes
- Max Incline Limit: ${activeRoute.maxSlopeDeg}° (Threshold: <15° Safe)
- Average Incline: ${activeRoute.avgSlopeDeg || '4.1'}°
- Safety Integrity Score: ${activeRoute.safetyScore}%
- Suit O2 Budget Expended: ${activeRoute.oxygenUsedPercent}%
- Comms Shadow Status: ${activeRoute.hasCommsShadow ? 'WARNING: DEPLOY RF RELAY' : 'DIRECT LINE-OF-SIGHT NOMINAL'}

2. SCIENTIFIC TARGETS & PROTOCOL:
- Primary Science Site: ${selectedTarget ? selectedTarget.name : 'Three Forks Delta Front'}
- Target Mineral: ${selectedTarget ? selectedTarget.targetMineral : 'Magnesium Carbonate & Smectite Clay'}
- Instrument Package: ${selectedTarget ? selectedTarget.instrument : 'SHERLOC, PIXL, SuperCam'}
- Biosignature Potential: ${selectedTarget ? selectedTarget.biosignaturePotential : '97%'}
- Core Sample Protocol: Retrieve 2x sealed rock core samples for Mars Sample Return.

3. HAZARD BOUNDARIES:
- AVOID: Séítah dune fields (high wheel/boot sinkage risk).
- AVOID: Delta scarp shear walls (slopes >24° rollover hazard).

========================================================================
TRAVERSAL SAFETY SIGN-OFF: APPROVED FOR SURFACE DISPATCH
Flight Director: Shaswat Sinha (Surat Hub)
========================================================================`;

    const blob = new Blob([flightPlanText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `NASA_EVA_FLIGHT_PLAN_JEZERO_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
    sfx.scienceSuccess();
  };

  const handleCloudSync = async () => {
    sfx.click();
    setIsSyncing(true);
    const success = await logEVAMission({
      astronautName: 'Shaswat Sinha',
      routeType: activeRoute.name,
      safetyScore: activeRoute.safetyScore,
      distanceKm: activeRoute.distanceKm,
      maxSlopeDeg: activeRoute.maxSlopeDeg,
      oxygenExpendedPct: activeRoute.oxygenUsedPercent,
      targetSite: selectedTarget ? selectedTarget.name : 'Jezero Delta Front'
    });
    setIsSyncing(false);
    setSyncStatus('success');
    sfx.scienceSuccess();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="hud-glass max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-mono border-cyan-500/40">
        {/* Header */}
        <div className="bg-[#040816] p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-orange-400" />
            <h3 className="font-heading font-bold text-sm tracking-widest text-orange-400 uppercase">
              NASA EVA FLIGHT DISPATCH // ARTEMIS MARS-01
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          {/* Astronaut Badge */}
          <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border border-cyan-800/40 p-3 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-cyan-950 border border-cyan-500/50 flex items-center justify-center text-cyan-300">
                <User className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-cyan-300">ASTRONAUT: SHASWAT SINHA</div>
                <div className="text-[10px] text-slate-400 flex items-center gap-1 font-mono">
                  <MapPin className="w-2.5 h-2.5 text-orange-400" /> TEAM SINGULAR ANOMALY (SURAT HUB)
                </div>
              </div>
            </div>
            <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-500/50 px-2 py-0.5 rounded font-bold">
              QUALIFIED
            </span>
          </div>

          <div className="border border-slate-800 bg-slate-950 p-3 rounded-xl space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wide border-b border-slate-800 pb-1">
              Mission Specifications
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Target Region: <span className="text-slate-200">Jezero Crater Delta West</span></div>
              <div>Departure Point: <span className="text-cyan-400">Hab Alpha (Butler Site)</span></div>
              <div>Traverse Length: <span className="text-slate-200">{activeRoute.distanceKm} km</span></div>
              <div>Est. EVA Time: <span className="text-slate-200">{activeRoute.estimatedMinutes} min</span></div>
              <div>Safety Margin: <span className="text-emerald-400 font-bold">{activeRoute.safetyScore}%</span></div>
              <div>Max Incline: <span className="text-amber-400 font-bold">{activeRoute.maxSlopeDeg}° (&lt;15° threshold)</span></div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-950 p-3 rounded-xl space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wide border-b border-slate-800 pb-1">
              Scientific Protocol &amp; Sample Retrieval
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li>Inspect {selectedTarget ? selectedTarget.name : 'Three Forks Delta Front'} for clay minerals.</li>
              <li>Aquire 2x sealed rock core samples for Mars Sample Return.</li>
              <li>Deploy RIMFAX ground-penetrating radar along low-gradient apron.</li>
              <li>Strict hazard boundary: Avoid Séítah dune fields (high sinkage).</li>
            </ul>
          </div>

          {syncStatus === 'success' && (
            <div className="bg-cyan-950/40 border border-cyan-500/50 p-2.5 rounded-lg text-cyan-300 text-[11px] flex items-center gap-2">
              <CloudUpload className="w-4 h-4 text-cyan-400" />
              <span>Telemetry synchronized to <strong>Supabase Cloud Database</strong> (Project: Single Anomaly).</span>
            </div>
          )}

          <div className="border border-emerald-950 bg-emerald-950/20 p-3 rounded-xl text-emerald-300 text-[11px] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Flight Director &amp; Safety Officer Sign-off: <strong>APPROVED FOR SURFACE DISPATCH</strong></span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-[#040816] p-4 border-t border-cyan-500/20 flex items-center justify-between gap-2.5">
          <button
            onClick={handleCloudSync}
            disabled={isSyncing}
            className="px-3 py-2 rounded-xl text-xs bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold flex items-center gap-1.5 cursor-pointer border border-cyan-800/40"
          >
            <CloudUpload className="w-3.5 h-3.5 text-cyan-400" />
            {isSyncing ? 'SYNCING...' : 'LOG TO SUPABASE'}
          </button>

          <div className="flex gap-2">
            <button
              onClick={handleDownloadFile}
              className="px-3.5 py-2 rounded-xl text-xs bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-600/30"
            >
              <Download className="w-3.5 h-3.5" />
              DOWNLOAD FLIGHT PLAN (.TXT)
            </button>
            <button
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl text-xs bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950"
            >
              <Printer className="w-3.5 h-3.5" />
              PRINT
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
