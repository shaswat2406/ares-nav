import React from 'react';
import { Microscope, Camera, Crosshair, Award, MapPin, X } from 'lucide-react';

export const ScienceInspector = ({ target, onClose }) => {
  if (!target) {
    return (
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 text-center text-slate-500 font-mono text-xs flex flex-col items-center justify-center min-h-[220px]">
        <Crosshair className="w-8 h-8 text-slate-700 mb-2 animate-pulse" />
        <p>SELECT A SCIENCE WAYPOINT ON THE MAP TO INSPECT NASA SPECTROMETRY & POV IMAGERY</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900/90 backdrop-blur-md border border-purple-500/30 rounded-xl overflow-hidden shadow-2xl space-y-3">
      {/* Top Banner */}
      <div className="bg-purple-950/50 border-b border-purple-800/40 p-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Microscope className="w-4 h-4 text-purple-400" />
          <h3 className="font-bold text-sm text-purple-200 font-mono tracking-wide">
            {target.name}
          </h3>
        </div>
        <button 
          onClick={onClose}
          className="text-slate-400 hover:text-white p-1 rounded-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Ground POV Camera View */}
        <div className="relative rounded-lg overflow-hidden border border-slate-800 group">
          <img 
            src={target.image} 
            alt={target.name} 
            className="w-full h-44 object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute top-2 left-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1">
            <Camera className="w-3 h-3 text-cyan-400" /> POV: Mastcam-Z Surface Ground Feed
          </div>
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur px-2 py-0.5 rounded text-[10px] font-mono text-purple-300">
            Elev: {target.elevation}m
          </div>
        </div>

        {/* Metadata Details */}
        <div className="grid grid-cols-2 gap-2 text-xs font-mono">
          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">PRIMARY MINERAL</div>
            <div className="text-purple-300 font-semibold mt-0.5">{target.targetMineral}</div>
          </div>
          <div className="bg-slate-950/80 p-2.5 rounded border border-slate-800">
            <div className="text-[10px] text-slate-500">SCIENCE INSTRUMENT</div>
            <div className="text-cyan-300 font-semibold mt-0.5">{target.instrument}</div>
          </div>
        </div>

        {/* Description & Objective */}
        <div className="bg-slate-950/90 p-3 rounded border border-slate-800 text-xs text-slate-300 space-y-1">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider flex items-center gap-1">
            <Award className="w-3 h-3 text-amber-400" /> Mission Science Value:
          </div>
          <p className="leading-relaxed">{target.description}</p>
        </div>

        {/* Biosignature Confidence Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Astrobiology Potential:</span>
            <span className="text-purple-400 font-bold">{target.biosignaturePotential}</span>
          </div>
          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
            <div 
              className="bg-gradient-to-r from-purple-500 to-cyan-400 h-full rounded-full transition-all duration-700"
              style={{ width: target.biosignaturePotential }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
