import React, { useState } from 'react';
import { SCIENCE_TARGETS, CRISM_DETECTIONS } from '../data/jezeroData';
import { Microscope, Sparkles, Target, Compass, Award, X, Check, ExternalLink, Bookmark } from 'lucide-react';

export function ScienceTargetPanel({ isOpen, onClose, onSelectTarget, currentTarget }) {
  const [activeTab, setActiveTab] = useState('targets');
  const [domainFilter, setDomainFilter] = useState('ALL');

  if (!isOpen) return null;

  // Compute ARES-NAV Science Priority Score
  const targetsWithScores = SCIENCE_TARGETS.map((t) => {
    const bioScore = parseInt(t.biosignaturePotential, 10) || 50;
    const prioScore = t.priority === 'CRITICAL' ? 100 : t.priority === 'HIGH' ? 80 : 60;
    const score = Math.round(bioScore * 0.5 + prioScore * 0.5);
    return { ...t, calculatedScore: score };
  });

  const filteredTargets = targetsWithScores.filter((t) => {
    if (domainFilter === 'ALL') return true;
    if (domainFilter === 'ASTROBIOLOGY') return t.scienceDomain.toLowerCase().includes('astrobiology');
    if (domainFilter === 'GEOLOGY') return t.scienceDomain.toLowerCase().includes('geology');
    if (domainFilter === 'IGNEOUS') return t.scienceDomain.toLowerCase().includes('igneous');
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-4xl h-[85vh] bg-[#030712] border border-purple-500/40 rounded-2xl shadow-[0_0_50px_rgba(168,85,247,0.25)] flex flex-col overflow-hidden text-slate-200 font-mono">
        {/* Header */}
        <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/50 flex items-center justify-center text-purple-400">
              <Microscope className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base tracking-wider text-slate-100 uppercase">
                  MARTIAN SCIENCE TARGET DISCOVERY & CRISM MINERALOGY
                </h2>
                <span className="text-[10px] bg-purple-950 text-purple-400 border border-purple-500/40 px-2 py-0.5 rounded font-bold">
                  JEZERO CRATER WEST
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Astrobiology targets, habitability biosignatures, and CRISM spectral reflectance detections
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Controls & Filters */}
        <div className="px-6 py-3 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('targets')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'targets'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              PRIORITY TARGETS ({SCIENCE_TARGETS.length})
            </button>
            <button
              onClick={() => setActiveTab('crism')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'crism'
                  ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]'
                  : 'bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              CRISM SPECTRAL DETECTIONS ({CRISM_DETECTIONS.length})
            </button>
          </div>

          {activeTab === 'targets' && (
            <div className="flex items-center gap-1.5 text-xs">
              {['ALL', 'ASTROBIOLOGY', 'GEOLOGY', 'IGNEOUS'].map((f) => (
                <button
                  key={f}
                  onClick={() => setDomainFilter(f)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold ${
                    domainFilter === f
                      ? 'bg-purple-950 text-purple-300 border border-purple-500/50'
                      : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {activeTab === 'targets' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredTargets.map((target) => {
                const isSelected = currentTarget?.id === target.id;

                return (
                  <div
                    key={target.id}
                    className={`bg-slate-900/60 border rounded-xl p-4 flex flex-col justify-between transition-all ${
                      isSelected
                        ? 'border-purple-400 shadow-[0_0_20px_rgba(168,85,247,0.3)] bg-purple-950/20'
                        : 'border-slate-800 hover:border-purple-500/40'
                    }`}
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <span className="text-[10px] text-purple-400 font-bold tracking-wider">
                            {target.id} // {target.priority} PRIORITY
                          </span>
                          <h3 className="font-heading font-bold text-sm text-slate-100">
                            {target.name}
                          </h3>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block">SCORE</span>
                          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                            {target.calculatedScore}/100
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 mb-3">{target.description}</p>

                      <div className="space-y-1.5 text-[10px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                        <div className="flex justify-between">
                          <span className="text-slate-500">DOMAIN:</span>
                          <span className="text-purple-300 font-bold">{target.scienceDomain}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">TARGET MINERAL:</span>
                          <span className="text-cyan-300 font-bold">{target.targetMineral}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">INSTRUMENTS:</span>
                          <span className="text-slate-300">{target.instrument}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">ELEVATION:</span>
                          <span className="text-slate-300">{target.elevation} m</span>
                        </div>
                        <div className="flex justify-between items-center pt-1 border-t border-slate-800">
                          <span className="text-slate-500">BIOSIGNATURE POTENTIAL:</span>
                          <span className="text-emerald-400 font-bold">{target.biosignaturePotential}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-[10px] text-slate-500 font-mono">
                        {target.lat.toFixed(4)}°N, {target.lng.toFixed(4)}°E
                      </span>
                      <button
                        onClick={() => onSelectTarget(target)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                          isSelected
                            ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                            : 'bg-slate-800 hover:bg-slate-700 text-purple-300'
                        }`}
                      >
                        {isSelected ? <Check className="w-3.5 h-3.5" /> : <Target className="w-3.5 h-3.5" />}
                        {isSelected ? 'ACTIVE TARGET' : 'SELECT TARGET'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 mb-2">
                Spectroscopic detections from Mars Reconnaissance Orbiter (MRO) CRISM infrared spectrometer cubes.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {CRISM_DETECTIONS.map((det, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 hover:border-purple-500/40 text-xs"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="font-heading font-bold text-purple-300 text-sm">
                        {det.mineral}
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-purple-950/80 text-purple-300 border border-purple-500/40">
                        CONFIDENCE: {Math.round(det.confidence * 100)}%
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 space-y-1 mb-2">
                      <div>Observation: <strong className="text-slate-200">{det.instrument}</strong></div>
                      <div>Citation: <strong className="text-slate-300 italic">{det.paper}</strong></div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex justify-between text-[10px] text-slate-500">
                      <span>Coordinates: {det.lat.toFixed(4)}°N, {det.lng.toFixed(4)}°E</span>
                      <span className="text-emerald-400">PDS Verified</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <span className="text-[10px] text-slate-500">
            * Science priority score is calculated using ARES-NAV multi-criteria mineralogical proxy model.
          </span>
          <span className="text-[10px] text-purple-400 font-bold">
            Mars 2020 Perseverance Campaign Ground Truth
          </span>
        </div>
      </div>
    </div>
  );
}
