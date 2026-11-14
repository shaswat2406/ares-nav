import React from 'react';
import { Database, Atom, Layers, FileCode2, ExternalLink, X, CheckCircle2 } from 'lucide-react';
import { sfx } from '../utils/soundFX';

export const DataSpecsModal = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="hud-glass max-w-3xl w-full rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-mono border-cyan-500/40">
        {/* Header */}
        <div className="bg-[#040816] p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Database className="w-5 h-5 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm tracking-widest text-cyan-300 uppercase">
              NASA DATA INTEGRATIONS &amp; TRAVERSAL PHYSICS SPECIFICATIONS
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5 text-xs max-h-[75vh] overflow-y-auto">
          {/* Section 1: NASA Datasets */}
          <div className="space-y-2">
            <div className="text-cyan-400 font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-cyan-500/20 pb-1">
              <Layers className="w-4 h-4 text-cyan-400" /> 1. MULTI-MISSION NASA DATASETS
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-cyan-300 font-bold">MOLA &amp; HRSC (Topographic DEM)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Mars Orbiter Laser Altimeter &amp; High Resolution Stereo Camera. Used to calculate slope angles, contour relief, and the 15° suit rollover threshold.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-purple-300 font-bold">CRISM (Planetary Mineralogy)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Compact Reconnaissance Imaging Spectrometer for Mars. Mapped hydrated smectite clays and magnesium carbonates in Jezero delta mudstones.
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-amber-300 font-bold">MEDA &amp; RAD (Surface Weather &amp; Flux)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  Mars Environmental Dynamics Analyzer (Perseverance Sol 1328). Ambient temperature (-48.2°C), atmospheric pressure (742 Pa), and cosmic radiation (0.62 mSv/day).
                </p>
              </div>

              <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800">
                <div className="text-emerald-300 font-bold">HiRISE &amp; Mastcam-Z (Imagery)</div>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  High-Resolution Imaging Science Experiment orbital mosaic + rover ground POV camera feeds for astronaut waypoint preview.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Mathematical Physics & Traversability Cost Model */}
          <div className="space-y-2">
            <div className="text-cyan-400 font-heading font-bold uppercase tracking-wider flex items-center gap-1.5 border-b border-cyan-500/20 pb-1">
              <Atom className="w-4 h-4 text-cyan-400" /> 2. MATHEMATICAL TRAVERSABILITY &amp; METABOLIC PHYSICS
            </div>

            <div className="bg-slate-950/90 p-4 rounded-xl border border-cyan-500/30 space-y-3 font-mono text-[11px]">
              <div>
                <span className="text-slate-400 font-bold">Traversability Cost Function (A* Heuristic):</span>
                <div className="bg-[#010307] p-2.5 rounded-lg border border-slate-800 text-cyan-300 font-bold mt-1">
                  Cost(i, j) = d_ij × [ 1 + w_slope × tan²(θ) + w_hazard × H_zone ]
                </div>
                <p className="text-[10px] text-slate-400 mt-1">
                  Where θ is slope angle in degrees. If θ &gt; 15.0°, traversal cost spikes exponentially toward infinity to enforce spacesuit biomechanical safety.
                </p>
              </div>

              <div className="border-t border-slate-800 pt-2">
                <span className="text-slate-400 font-bold">Metabolic Oxygen Burn Model:</span>
                <div className="bg-[#010307] p-2.5 rounded-lg border border-slate-800 text-emerald-300 font-bold mt-1">
                  O₂_rate (L/hr) = 0.85 + 0.12 × Velocity_kmh + 0.08 × tan(θ)
                </div>
              </div>
            </div>
          </div>

          <div className="bg-cyan-950/30 border border-cyan-500/40 p-3 rounded-xl text-cyan-300 text-[11px] flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-cyan-400 shrink-0" />
            <span>All formulas and coordinate systems calibrated to the <strong>IAU 2000 Martian Geographic Datum</strong>.</span>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#040816] p-4 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            Close Specs
          </button>
        </div>
      </div>
    </div>
  );
};
