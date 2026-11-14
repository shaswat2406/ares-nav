import React, { useState } from 'react';
import { Microscope, Play, Sparkles, CheckCircle2, ChevronRight, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';

export const AstrobiologyLabModal = ({ isOpen, onClose, selectedTarget }) => {
  if (!isOpen) return null;

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzed, setAnalyzed] = useState(false);

  // Raman / Luminescence Spectral Peaks for Jezero Carbonates & Smectite Clays
  const spectrumData = [
    { wavenumber: 200, intensity: 12 },
    { wavenumber: 350, intensity: 18 },
    { wavenumber: 500, intensity: 22 },
    { wavenumber: 680, intensity: 35 },
    { wavenumber: 850, intensity: 48 },
    { wavenumber: 1080, intensity: 94 }, // Carbonate CO3 peak
    { wavenumber: 1200, intensity: 52 },
    { wavenumber: 1350, intensity: 88 }, // Polycyclic Aromatic Hydrocarbons (PAHs)
    { wavenumber: 1500, intensity: 45 },
    { wavenumber: 1600, intensity: 78 }, // Amide/Organic Carbon band
    { wavenumber: 1800, intensity: 28 },
    { wavenumber: 2000, intensity: 15 }
  ];

  const handleRunSpectroscopy = () => {
    sfx.click();
    setIsAnalyzing(true);
    setTimeout(() => {
      setIsAnalyzing(false);
      setAnalyzed(true);
      sfx.scienceSuccess();
      confetti({
        particleCount: 100,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#00f0ff', '#c084fc', '#00ff88']
      });
    }, 1400);
  };

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-in fade-in">
      <div className="hud-panel max-w-2xl w-full rounded-2xl shadow-2xl overflow-hidden text-slate-100 font-mono border-cyan-500/40">
        {/* Header */}
        <div className="bg-[#040816] p-4 border-b border-cyan-500/20 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Microscope className="w-5 h-5 text-cyan-400" />
            <h3 className="font-heading font-bold text-sm tracking-widest text-cyan-300 uppercase">
              SHERLOC / PIXL // RAMAN ASTROBIOLOGY LAB SIMULATOR
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xs px-2.5 py-1 rounded bg-slate-900 border border-slate-700 cursor-pointer"
          >
            ESC
          </button>
        </div>

        <div className="p-5 space-y-4 text-xs">
          {/* Target Sample Overview */}
          <div className="bg-slate-950/90 border border-slate-800 p-3.5 rounded-xl flex items-center justify-between">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Specimen Source</div>
              <div className="text-sm font-bold text-cyan-300 font-heading mt-0.5">
                {selectedTarget ? selectedTarget.name : 'Three Forks Delta Mudstone'}
              </div>
              <div className="text-[11px] text-slate-400 mt-0.5">
                Target Mineralogy: <span className="text-purple-300 font-bold">{selectedTarget ? selectedTarget.targetMineral : 'Magnesium Carbonates'}</span>
              </div>
            </div>
            <button
              onClick={handleRunSpectroscopy}
              disabled={isAnalyzing}
              className={`px-4 py-2 rounded-lg font-bold text-xs font-mono flex items-center gap-1.5 cursor-pointer transition-all ${
                isAnalyzing
                  ? 'bg-amber-500 text-slate-950 animate-pulse'
                  : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 shadow-lg shadow-cyan-500/30'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              {isAnalyzing ? 'FIRING LASER (248.6 NM)...' : 'RUN SPECTROMETRY SCAN'}
            </button>
          </div>

          {/* Raman Spectrum Chart */}
          <div className="bg-slate-950/90 border border-cyan-500/20 p-3.5 rounded-xl space-y-2">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400 flex items-center gap-1">
                <Activity className="w-3.5 h-3.5 text-cyan-400" /> UV FLUORESCENCE / RAMAN SHIFT SPECTRA
              </span>
              <span className="text-cyan-400 font-bold">WAVELENGTH: 200 - 2000 CM⁻¹</span>
            </div>

            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={spectrumData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="wavenumber" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const d = payload[0].payload;
                        return (
                          <div className="bg-slate-950 border border-cyan-500/40 p-2 rounded text-[10px] font-mono shadow-2xl">
                            <div className="text-cyan-400 font-bold">{d.wavenumber} cm⁻¹</div>
                            <div className="text-slate-200">Intensity: {d.intensity} counts</div>
                            {d.intensity > 70 && (
                              <div className="text-emerald-400 font-bold mt-0.5">
                                ✓ Organic / Carbonate Resonance Peak!
                              </div>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="intensity"
                    stroke="#00f0ff"
                    strokeWidth={2.5}
                    dot={{ fill: '#c084fc', r: 4 }}
                    activeDot={{ r: 6, fill: '#00ff88' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Analysis Findings */}
          {analyzed && (
            <div className="bg-emerald-950/40 border border-emerald-500/50 p-3.5 rounded-xl space-y-1.5 animate-in fade-in">
              <div className="flex items-center gap-1.5 text-emerald-400 font-bold text-xs font-heading">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                BIOSIGNATURE MOLECULAR DETECTION CONFIRMED
              </div>
              <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
                Spectroscopic signature matches <strong>Magnesium Carbonate (1080 cm⁻¹)</strong> and <strong>Aromatic Carbon rings (1350–1600 cm⁻¹)</strong>. In lacustrine mudstone facies, this represents prime conditions for fossilized prebiotic organic compounds.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-[#040816] p-4 border-t border-cyan-500/20 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-xs bg-slate-900 hover:bg-slate-800 text-slate-300 cursor-pointer"
          >
            Close Lab Window
          </button>
        </div>
      </div>
    </div>
  );
};
