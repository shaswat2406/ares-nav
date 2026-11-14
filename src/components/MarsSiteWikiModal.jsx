/**
 * MarsSiteWikiModal — Wikipedia-style Scientific Dossier for Martian Sites & Missions
 * Displays authentic photography, mission dates, payload instruments, coordinates, and discoveries.
 */

import React, { useState } from 'react';
import {
  X,
  ExternalLink,
  MapPin,
  Calendar,
  Rocket,
  Shield,
  Activity,
  Award,
  Layers,
  Compass,
  ArrowRight,
  Database,
  Image as ImageIcon
} from 'lucide-react';
import { sfx } from '../utils/soundFX';

export function MarsSiteWikiModal({ site, isOpen, onClose, onEnterSurfaceView, onFlyToSite }) {
  const [imgError, setImgError] = useState(false);

  React.useEffect(() => {
    setImgError(false);
  }, [site]);

  if (!isOpen || !site) return null;

  const handleClose = () => {
    sfx.click();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="hud-glass hud-corner-tl hud-corner-br rounded-2xl border-cyan-500/40 shadow-[0_0_50px_rgba(0,240,255,0.25)] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden bg-slate-950/95"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Top Wikipedia-Style Header ── */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-cyan-500/20 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <span className="text-2xl">{site.flag || '🪐'}</span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base md:text-lg font-heading font-extrabold text-white tracking-wide">
                  {site.name}
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded border border-cyan-500/40 bg-cyan-950/60 text-cyan-300 uppercase">
                  {site.category}
                </span>
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border ${
                    site.status.includes('Active')
                      ? 'border-emerald-500/50 bg-emerald-950/50 text-emerald-300'
                      : 'border-slate-700 bg-slate-900 text-slate-300'
                  }`}
                >
                  ● {site.status}
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-400 mt-0.5">
                {site.organization} · {site.mission} · Site: {site.siteName}
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer border border-transparent hover:border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ── Main Content Body: Wikipedia 2-Column Dossier ── */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 md:space-y-0 md:grid md:grid-cols-12 md:gap-6 font-mono">
          {/* LEFT COLUMN: Overview, Discoveries, Instruments (7 cols) */}
          <div className="md:col-span-7 space-y-5">
            {/* Mission Overview */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-cyan-400 border-b border-cyan-500/20 pb-1 uppercase tracking-wider">
                <Rocket className="w-4 h-4 text-cyan-400" /> MISSION OVERVIEW
              </div>
              <p className="text-xs text-slate-300 leading-relaxed font-sans text-justify">
                {site.overview}
              </p>
            </section>

            {/* Key Scientific Discoveries */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-amber-400 border-b border-amber-500/20 pb-1 uppercase tracking-wider">
                <Award className="w-4 h-4 text-amber-400" /> MAJOR SCIENTIFIC DISCOVERIES
              </div>
              <ul className="space-y-1.5">
                {site.keyDiscoveries?.map((disc, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-300 font-sans">
                    <span className="text-amber-400 text-sm leading-none mt-0.5">✦</span>
                    <span className="leading-relaxed">{disc}</span>
                  </li>
                ))}
              </ul>
            </section>

            {/* Scientific Instruments & Payload */}
            <section className="space-y-2">
              <div className="flex items-center gap-2 text-xs font-heading font-bold text-purple-400 border-b border-purple-500/20 pb-1 uppercase tracking-wider">
                <Layers className="w-4 h-4 text-purple-400" /> SCIENTIFIC INSTRUMENT PAYLOAD
              </div>
              <div className="grid grid-cols-1 gap-1.5 text-xs">
                {site.instruments?.map((inst, idx) => (
                  <div
                    key={idx}
                    className="p-1.5 rounded bg-slate-900/80 border border-slate-800 text-slate-300 flex items-center gap-2"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                    <span>{inst}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* External Planetary Archives */}
            <section className="pt-2 flex flex-wrap gap-2 text-xs">
              {site.wikiUrl && (
                <a
                  href={site.wikiUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 hover:text-white transition-all flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  WIKIPEDIA ARTICLE
                </a>
              )}
              {site.nasaUrl && (
                <a
                  href={site.nasaUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900/80 border border-cyan-500/40 text-cyan-300 hover:text-cyan-100 transition-all flex items-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-cyan-400" />
                  OFFICIAL MISSION ARCHIVE
                </a>
              )}
            </section>
          </div>

          {/* RIGHT COLUMN: Wikipedia Infobox Sidebar (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="bg-slate-900/90 border border-cyan-500/30 rounded-xl p-3 shadow-xl space-y-3">
              {/* Authentic Photo */}
              <div className="rounded-lg overflow-hidden border border-slate-800 bg-black">
                {imgError ? (
                  <div className="w-full h-44 bg-gradient-to-br from-slate-950 via-slate-900 to-cyan-950 flex flex-col items-center justify-center p-4 text-center border border-slate-800">
                    <span className="text-4xl mb-2">{site.flag || '🪐'}</span>
                    <span className="text-xs font-heading font-bold text-cyan-300">{site.name}</span>
                    <span className="text-[10px] font-mono text-slate-400 mt-1">{site.organization} · {site.mission}</span>
                    <span className="text-[9px] text-emerald-400 font-mono mt-0.5">{site.siteName}</span>
                  </div>
                ) : (
                  <img
                    src={site.image}
                    alt={site.name}
                    onError={() => setImgError(true)}
                    className="w-full h-44 object-cover object-center hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                )}
                <div className="p-2 text-[10px] text-slate-400 italic bg-slate-950/90 border-t border-slate-800 font-sans">
                  {site.imageCaption}
                </div>
              </div>

              {/* Wikipedia-Style Fact Table */}
              <div className="border border-slate-800 rounded-lg overflow-hidden text-xs">
                <div className="bg-slate-950 px-2.5 py-1 text-center font-bold text-cyan-400 border-b border-slate-800 text-[11px]">
                  MISSION DATA & GEODETICS
                </div>
                <div className="divide-y divide-slate-800/80">
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">ORGANIZATION</span>
                    <span className="text-slate-200 font-bold text-right text-[11px]">{site.organization}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">PROGRAM</span>
                    <span className="text-slate-200 text-right text-[11px]">{site.mission}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">LAUNCH DATE</span>
                    <span className="text-slate-200 text-right text-[11px]">{site.launchDate}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">LANDING / EPOCH</span>
                    <span className="text-emerald-400 font-bold text-right text-[11px]">{site.landingDate}</span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">COORDINATES</span>
                    <span className="text-cyan-300 font-bold text-right text-[11px]">
                      {site.lat > 0 ? `${site.lat.toFixed(4)}°N` : `${Math.abs(site.lat).toFixed(4)}°S`},{' '}
                      {site.lng.toFixed(4)}°E
                    </span>
                  </div>
                  <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                    <span className="text-slate-500 text-[10px]">ELEVATION (MOLA)</span>
                    <span className="text-amber-400 font-bold text-right text-[11px]">
                      {site.elevation.toLocaleString()} m
                    </span>
                  </div>
                  {site.distanceDriven && (
                    <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                      <span className="text-slate-500 text-[10px]">TRAVERSE DISTANCE</span>
                      <span className="text-orange-400 font-bold text-right text-[11px]">
                        {site.distanceDriven}
                      </span>
                    </div>
                  )}
                  {site.powerSource && (
                    <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                      <span className="text-slate-500 text-[10px]">POWER SOURCE</span>
                      <span className="text-slate-300 text-right text-[11px]">{site.powerSource}</span>
                    </div>
                  )}
                  {site.mass && (
                    <div className="grid grid-cols-2 p-1.5 hover:bg-slate-800/40">
                      <span className="text-slate-500 text-[10px]">MASS / VOLUME</span>
                      <span className="text-slate-300 text-right text-[11px]">{site.mass}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-1.5 pt-1">
                {onFlyToSite && (
                  <button
                    onClick={() => {
                      sfx.click();
                      onFlyToSite(site);
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <Compass className="w-3.5 h-3.5" />
                    CENTER GLOBE ON SITE
                  </button>
                )}
                {onEnterSurfaceView && site.id === 'perseverance' && (
                  <button
                    onClick={() => {
                      sfx.click();
                      onEnterSurfaceView('jezero');
                    }}
                    className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    ENTER 3D CANYON SURFACE VIEW
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-2.5 bg-slate-950 border-t border-cyan-500/20 flex items-center justify-between text-[10px] font-mono text-slate-500">
          <span>NASA Planetary Data System (PDS) & Wikipedia Public Knowledge Graph</span>
          <button
            onClick={handleClose}
            className="px-3 py-1 rounded bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-colors"
          >
            CLOSE DOSSIER
          </button>
        </div>
      </div>
    </div>
  );
}
