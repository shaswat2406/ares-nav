import React, { useState } from 'react';
import { NASA_DATASETS } from '../data/marsDatasets';
import { Database, Search, Filter, ExternalLink, X, CheckCircle, Clock, Info, ShieldCheck, AlertCircle } from 'lucide-react';

export function DataExplorer({ isOpen, onClose }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('ALL');

  if (!isOpen) return null;

  const filters = ['ALL', 'ACTIVE', 'PREPROCESSED', 'HIGH QUALITY', 'MRO', 'PERSEVERANCE', 'MGS'];

  const filteredDatasets = NASA_DATASETS.filter((ds) => {
    const matchesSearch =
      ds.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.instrument.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.mission.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ds.purpose.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedFilter === 'ALL') return true;
    if (selectedFilter === 'ACTIVE') return ds.processingStatus.startsWith('ACTIVE');
    if (selectedFilter === 'PREPROCESSED') return ds.processingStatus.startsWith('PREPROCESSED');
    if (selectedFilter === 'HIGH QUALITY') return ds.quality === 'HIGH' || ds.quality === 'VERY_HIGH';
    if (selectedFilter === 'MRO') return ds.mission.includes('Reconnaissance');
    if (selectedFilter === 'PERSEVERANCE') return ds.mission.includes('Perseverance');
    if (selectedFilter === 'MGS') return ds.mission.includes('Global Surveyor');

    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl h-[88vh] bg-[#030712] border border-cyan-500/40 rounded-2xl shadow-[0_0_50px_rgba(0,240,255,0.2)] flex flex-col overflow-hidden text-slate-200 font-mono">
        {/* Header */}
        <div className="px-6 py-4 border-b border-cyan-500/20 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/50 flex items-center justify-center text-cyan-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-heading font-extrabold text-base tracking-wider text-slate-100 uppercase">
                  NASA PLANETARY DATA REPOSITORY & PIPELINE
                </h2>
                <span className="text-[10px] bg-cyan-950 text-cyan-400 border border-cyan-500/40 px-2 py-0.5 rounded font-bold">
                  {NASA_DATASETS.length} DATASETS
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                PDS Geosciences, Mars Trek, HiRISE PDS, and Perseverance MEDA Sol 1328 Data Ingestion
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

        {/* Search & Filters */}
        <div className="p-4 border-b border-slate-800 bg-slate-950/40 flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by mission, instrument, or scientific purpose..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/80 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {filters.map((f) => (
              <button
                key={f}
                onClick={() => setSelectedFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition-all ${
                  selectedFilter === f
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                    : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {/* Dataset Cards Grid */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDatasets.map((ds) => {
            const isActive = ds.processingStatus.startsWith('ACTIVE');
            const isPreprocessed = ds.processingStatus.startsWith('PREPROCESSED');

            return (
              <div
                key={ds.id}
                className="bg-slate-900/60 border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 flex flex-col justify-between transition-all group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <span className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider block">
                        {ds.mission} // {ds.instrument}
                      </span>
                      <h3 className="font-heading font-bold text-sm text-slate-100 mt-0.5">
                        {ds.name}
                      </h3>
                    </div>
                    <span
                      className={`text-[9px] px-2 py-0.5 rounded font-bold border ${
                        isActive
                          ? 'bg-emerald-950/80 text-emerald-400 border-emerald-500/40'
                          : isPreprocessed
                          ? 'bg-amber-950/80 text-amber-400 border-amber-500/40'
                          : 'bg-blue-950/80 text-blue-400 border-blue-500/40'
                      }`}
                    >
                      {isActive ? 'ACTIVE IN-HUD' : isPreprocessed ? 'PREPROCESSED' : 'CONTEXT'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 mb-3">{ds.purpose}</p>

                  <div className="grid grid-cols-2 gap-2 text-[10px] bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/80 mb-3">
                    <div>
                      <span className="text-slate-500 block">SPATIAL RESOLUTION:</span>
                      <span className="text-slate-200 font-bold">{ds.resolution}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">COVERAGE:</span>
                      <span className="text-slate-200 font-bold">{ds.coverage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">TEMPORAL:</span>
                      <span className="text-slate-200 font-bold">{ds.temporalCoverage}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">FORMAT:</span>
                      <span className="text-slate-200 font-bold">{ds.format}</span>
                    </div>
                  </div>

                  {ds.limitations && (
                    <div className="text-[10px] text-slate-400 flex items-start gap-1.5 bg-slate-950/40 p-2 rounded border border-slate-800/40 mb-3">
                      <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{ds.limitations}</span>
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">Quality: <strong className="text-slate-300">{ds.quality}</strong></span>
                  <a
                    href={ds.source}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 font-bold group-hover:underline"
                  >
                    <span>SOURCE REPO</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" /> All data verified via NASA Planetary Data System (PDS)
            </span>
          </div>
          <span className="text-[10px] text-slate-500">
            ARES-NAV Scientific Data Architecture // Jezero Crater West 18.44°N, 77.45°E
          </span>
        </div>
      </div>
    </div>
  );
}
