import React from 'react';
import { Download, CheckCircle, FileText, Printer, ExternalLink } from 'lucide-react';
import { sfx } from '../utils/soundFX';

export const MissionExportModal = ({ isOpen, onClose, activeRoute, selectedTarget }) => {
  if (!isOpen) return null;

  const handlePrint = () => {
    sfx.click();
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700 max-w-xl w-full rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-mono">
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <FileText className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-sm tracking-wider text-orange-400">
              NASA EVA FLIGHT DISPATCH ORDER // JEZERO-2026
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2 py-1 rounded bg-slate-800 cursor-pointer"
          >
            ESC / CLOSE
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 text-xs max-h-[70vh] overflow-y-auto">
          <div className="border border-slate-800 bg-slate-950 p-3 rounded-lg space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wide border-b border-slate-800 pb-1">
              Mission Specifications
            </div>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div>Target Region: <span className="text-slate-200">Jezero Crater Delta West</span></div>
              <div>Departure Point: <span className="text-cyan-400">Hab Alpha (Butler Site)</span></div>
              <div>Traverse Length: <span className="text-slate-200">{activeRoute.distanceKm} km</span></div>
              <div>Est. EVA Time: <span className="text-slate-200">{activeRoute.estimatedMinutes} min</span></div>
              <div>Safety Margin: <span className="text-emerald-400 font-bold">{activeRoute.safetyScore}%</span></div>
              <div>Max Incline Limit: <span className="text-amber-400 font-bold">{activeRoute.maxSlopeDeg}° (&lt;15° safe)</span></div>
            </div>
          </div>

          <div className="border border-slate-800 bg-slate-950 p-3 rounded-lg space-y-2">
            <div className="text-slate-400 font-bold uppercase tracking-wide border-b border-slate-800 pb-1">
              Scientific Objectives & Protocol
            </div>
            <ul className="list-disc list-inside space-y-1 text-[11px] text-slate-300">
              <li>Deploy SHERLOC & PIXL on delta mudstones (Three Forks).</li>
              <li>Aquire 2x sealed rock core samples for Mars Sample Return.</li>
              <li>Measure subsurface stratigraphy via RIMFAX ground radar.</li>
              <li>Bypass Séítah high-sinkage dune field along low-gradient apron.</li>
            </ul>
          </div>

          <div className="border border-emerald-950 bg-emerald-950/20 p-3 rounded-lg text-emerald-300 text-[11px] flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
            <span>Flight Director & Traversal Safety Officer Sign-off: <strong>APPROVED FOR SURFACE DISPATCH</strong></span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-950 p-4 border-t border-slate-800 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handlePrint}
            className="px-4 py-2 rounded-lg text-xs bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 hover:to-amber-500 text-white font-bold flex items-center gap-1.5 cursor-pointer shadow-lg shadow-orange-950"
          >
            <Printer className="w-3.5 h-3.5" />
            PRINT / EXPORT FLIGHT PLAN
          </button>
        </div>
      </div>
    </div>
  );
};
