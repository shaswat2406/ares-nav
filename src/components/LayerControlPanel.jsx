import { useState } from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// Mission badge color mapping
// MGS = Mars Global Surveyor (orange)
// MRO = Mars Reconnaissance Orbiter (cyan)
// M2020 = Mars 2020 / Perseverance (green)
// MSO = Mars Science Odyssey (purple)
// DERIVED = derived/computed layers (slate)
// ─────────────────────────────────────────────────────────────────────────────
const MISSION_BADGE_STYLES = {
  MGS:     'bg-orange-500/20 text-orange-300 border border-orange-500/40',
  MRO:     'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40',
  M2020:   'bg-green-500/20 text-green-300 border border-green-500/40',
  MSO:     'bg-purple-500/20 text-purple-300 border border-purple-500/40',
  DERIVED: 'bg-slate-500/20 text-slate-300 border border-slate-500/40',
};

// ─────────────────────────────────────────────────────────────────────────────
// Default layer definitions — parent passes these as the `layers` prop.
// Export so the parent can use it as the initial state.
// ─────────────────────────────────────────────────────────────────────────────
export const DEFAULT_LAYERS = {
  basemap: [
    { id: 'mola-shaded',  name: 'MOLA Color Shaded Relief', mission: 'MGS',     enabled: true,  opacity: 100 },
    { id: 'hirise-opt',   name: 'HiRISE Optical',           mission: 'MRO',     enabled: false, opacity: 80  },
  ],
  terrain: [
    { id: 'elev-contours', name: 'Elevation Contours', mission: 'DERIVED', enabled: true,  opacity: 70 },
    { id: 'slope-heat',    name: 'Slope Heatmap',      mission: 'DERIVED', enabled: false, opacity: 60 },
    { id: 'roughness',     name: 'Roughness',          mission: 'DERIVED', enabled: false, opacity: 60 },
  ],
  mineralogy: [
    { id: 'crism-detect', name: 'CRISM Detections', mission: 'MRO',     enabled: true, opacity: 90 },
    { id: 'min-labels',   name: 'Mineral Labels',   mission: 'DERIVED', enabled: true, opacity: 100 },
  ],
  hazards: [
    { id: 'hazard-zones', name: 'Hazard Zones',  mission: 'DERIVED', enabled: true,  opacity: 80 },
    { id: 'dune-fields',  name: 'Dune Fields',   mission: 'DERIVED', enabled: false, opacity: 70 },
    { id: 'rock-fields',  name: 'Rock Fields',   mission: 'DERIVED', enabled: false, opacity: 70 },
  ],
  mission: [
    { id: 'hab-alpha',     name: 'Hab Alpha',        mission: 'M2020',   enabled: true,  opacity: 100 },
    { id: 'sci-targets',   name: 'Science Targets',  mission: 'M2020',   enabled: true,  opacity: 100 },
    { id: 'rover-traverse',name: 'Rover Traverse',   mission: 'M2020',   enabled: true,  opacity: 85  },
    { id: 'eva-route',     name: 'EVA Route',        mission: 'DERIVED', enabled: true,  opacity: 100 },
    { id: 'emerg-route',   name: 'Emergency Route',  mission: 'DERIVED', enabled: false, opacity: 100 },
  ],
};

const SECTION_LABELS = {
  basemap:    'Basemap',
  terrain:    'Terrain',
  mineralogy: 'Mineralogy',
  hazards:    'Hazards',
  mission:    'Mission',
};

// ─────────────────────────────────────────────────────────────────────────────
// Toggle Switch
// ─────────────────────────────────────────────────────────────────────────────
function ToggleSwitch({ enabled, onChange }) {
  return (
    <button
      onClick={onChange}
      aria-pressed={enabled}
      className={`
        relative inline-flex h-4 w-8 flex-shrink-0 cursor-pointer rounded-full
        transition-colors duration-200 ease-in-out focus:outline-none
        ${enabled ? 'bg-green-500' : 'bg-white/10'}
      `}
    >
      <span
        className={`
          inline-block h-3 w-3 mt-0.5 ml-0.5 rounded-full bg-white shadow
          transform transition-transform duration-200 ease-in-out
          ${enabled ? 'translate-x-3.5' : 'translate-x-0'}
        `}
      />
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Single layer row
// ─────────────────────────────────────────────────────────────────────────────
function LayerRow({ layer, onToggle, onOpacityChange }) {
  const badgeStyle = MISSION_BADGE_STYLES[layer.mission] ?? MISSION_BADGE_STYLES.DERIVED;

  return (
    <div className="group flex flex-col gap-1 py-1.5 border-b border-white/5 last:border-0">
      {/* Top row: name + badge + toggle */}
      <div className="flex items-center gap-2">
        <ToggleSwitch enabled={layer.enabled} onChange={onToggle} />
        <span
          className={`font-heading text-[11px] flex-1 truncate leading-tight
            ${layer.enabled ? 'text-white/90' : 'text-white/40'}`}
        >
          {layer.name}
        </span>
        <span className={`font-mono text-[9px] px-1 py-0.5 rounded ${badgeStyle}`}>
          {layer.mission}
        </span>
      </div>

      {/* Opacity slider — only shown when layer is enabled */}
      {layer.enabled && (
        <div className="flex items-center gap-2 pl-10">
          <input
            type="range"
            min={0}
            max={100}
            value={layer.opacity}
            onChange={(e) => onOpacityChange(Number(e.target.value))}
            className="
              flex-1 h-1 appearance-none rounded-full cursor-pointer
              bg-white/10 accent-green-400
            "
          />
          <span className="font-mono text-[9px] text-white/40 w-6 text-right">
            {layer.opacity}
          </span>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Collapsible section
// ─────────────────────────────────────────────────────────────────────────────
function LayerSection({ sectionKey, layers, onLayerToggle, onOpacityChange }) {
  const [open, setOpen] = useState(true);
  const activeCount = layers.filter(l => l.enabled).length;

  return (
    <div className="mb-1">
      {/* Section header */}
      <button
        onClick={() => setOpen(o => !o)}
        className="
          w-full flex items-center justify-between px-2 py-1.5
          rounded hover:bg-white/5 transition-colors
        "
      >
        <span className="font-heading text-[10px] uppercase tracking-widest text-white/50">
          {SECTION_LABELS[sectionKey]}
        </span>
        <div className="flex items-center gap-1.5">
          <span className="font-mono text-[9px] text-white/30">
            {activeCount}/{layers.length}
          </span>
          <svg
            className={`w-3 h-3 text-white/30 transition-transform ${open ? '' : '-rotate-90'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {/* Layer rows */}
      {open && (
        <div className="px-2">
          {layers.map((layer) => (
            <LayerRow
              key={layer.id}
              layer={layer}
              onToggle={() => onLayerToggle(sectionKey, layer.id)}
              onOpacityChange={(val) => onOpacityChange(sectionKey, layer.id, val)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// LayerControlPanel — main export
//
// Props:
//   layers         : object matching DEFAULT_LAYERS shape (passed from parent state)
//   onLayerToggle  : (sectionKey, layerId) => void
//   onOpacityChange: (sectionKey, layerId, value 0-100) => void
// ─────────────────────────────────────────────────────────────────────────────
export default function LayerControlPanel({ layers, onLayerToggle, onOpacityChange }) {
  const activeLayers = Object.values(layers).flat().filter(l => l.enabled).length;
  const totalLayers  = Object.values(layers).flat().length;

  return (
    <div
      className="
        hud-glass flex flex-col
        w-[280px] max-h-[calc(100vh-120px)]
        rounded-xl overflow-hidden
        select-none
      "
    >
      {/* Panel header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-white/10">
        <div className="flex items-center gap-2">
          {/* Layers icon */}
          <svg className="w-3.5 h-3.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <span className="font-heading text-[11px] uppercase tracking-widest text-white/80">
            Layers
          </span>
        </div>
        <span className="font-mono text-[9px] text-white/30">
          {activeLayers}/{totalLayers} active
        </span>
      </div>

      {/* Scrollable section list */}
      <div className="flex-1 overflow-y-auto py-1 scrollbar-thin scrollbar-thumb-white/10">
        {Object.keys(layers).map((sectionKey) => (
          <LayerSection
            key={sectionKey}
            sectionKey={sectionKey}
            layers={layers[sectionKey]}
            onLayerToggle={onLayerToggle}
            onOpacityChange={onOpacityChange}
          />
        ))}
      </div>

      {/* Footer — data sources legend */}
      <div className="border-t border-white/10 px-3 py-2">
        <p className="font-mono text-[8px] text-white/25 uppercase tracking-widest mb-1.5">
          Source legend
        </p>
        <div className="flex flex-wrap gap-1">
          {Object.entries(MISSION_BADGE_STYLES).map(([mission, style]) => (
            <span key={mission} className={`font-mono text-[8px] px-1.5 py-0.5 rounded ${style}`}>
              {mission}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
