import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, Polyline, Marker, Popup, LayersControl } from 'react-leaflet';
import L from 'leaflet';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES, PRECOMPUTED_ROUTES, SOL_TELEMETRY } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';
import { Activity, ShieldAlert, Navigation, Mountain, CheckCircle2, ChevronRight, Radio, Compass, Eye, Zap } from 'lucide-react';

// Custom icons using Lucide/SVG data URIs
const createCustomIcon = (bgColor, borderColor, text) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        border: 2px solid ${borderColor};
        width: 32px;
        height: 32px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-weight: bold;
        font-size: 11px;
        color: white;
        box-shadow: 0 0 14px ${borderColor};
      ">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const habIcon = createCustomIcon('#0284c7', '#38bdf8', 'HAB');
const targetIcon = createCustomIcon('#7c3aed', '#c084fc', 'SCI');

export function MarsTrekGISView() {
  const [activeRouteType, setActiveRouteType] = useState('safe');
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const activeRoute = PRECOMPUTED_ROUTES[activeRouteType];
  const centerPos = [HABITAT_BASE.lat, HABITAT_BASE.lng];

  const handleToggleSim = () => {
    sfx.click();
    setIsSimulating(!isSimulating);
  };

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimProgress(p => {
          if (p >= 100) {
            setIsSimulating(false);
            sfx.scienceSuccess();
            confetti({ particleCount: 110, spread: 70, origin: { y: 0.6 } });
            return 100;
          }
          return p + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="relative w-full h-[720px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-[#040816] flex">
      {/* High-Contrast Interactive Planetary GIS Canvas */}
      <MapContainer
        center={centerPos}
        zoom={12}
        maxZoom={16}
        minZoom={8}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Layer 1: NASA JPL Official Mars Trek Global MOLA Shaded Color Elevation Basemap */}
        <TileLayer
          attribution='&copy; NASA / JPL / USGS Astrogeology // Mars Trek'
          url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
          maxNativeZoom={7}
          maxZoom={16}
        />

        {/* Habitat Base Marker */}
        <Marker position={[HABITAT_BASE.lat, HABITAT_BASE.lng]} icon={habIcon}>
          <Popup className="custom-popup">
            <div className="p-1 text-slate-900 font-mono text-xs">
              <h3 className="font-bold text-sky-700">{HABITAT_BASE.name}</h3>
              <p className="text-slate-600 mt-1">{HABITAT_BASE.description}</p>
              <div className="mt-2 text-[10px] bg-slate-100 p-1 rounded font-bold">
                18.4447°N, 77.4508°E | Elev: -2,570m MOLA
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Hazard Zones (Séítah Dunes, Delta Cliffs, Boulders) */}
        {HAZARD_ZONES.map(hz => (
          <Circle
            key={hz.id}
            center={hz.center}
            radius={hz.radius}
            pathOptions={{
              color: hz.color,
              fillColor: hz.color,
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '5, 8'
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-mono text-xs">
                <div className="font-bold text-rose-700">⚠️ {hz.name}</div>
                <div className="text-slate-600 mt-0.5">{hz.type} ({hz.severity})</div>
                <p className="text-[11px] text-slate-500 mt-1">{hz.risk}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* CRISM Spectroscopy Science Sites */}
        {SCIENCE_TARGETS.map(target => (
          <Marker
            key={target.id}
            position={[target.lat, target.lng]}
            icon={targetIcon}
            eventHandlers={{
              click: () => {
                sfx.click();
                setSelectedTarget(target);
              }
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-mono text-xs max-w-[220px]">
                <div className="font-bold text-purple-700">{target.name}</div>
                <div className="text-[10px] text-purple-600 mt-0.5 font-bold">
                  {target.targetMineral}
                </div>
                <p className="text-[11px] text-slate-600 mt-1">{target.description}</p>
                <div className="mt-1 text-[10px] bg-purple-50 text-purple-900 p-1 rounded flex justify-between font-bold">
                  <span>Biosignature Potential:</span>
                  <span>{target.biosignaturePotential}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Route Traversal Polyline */}
        <Polyline
          positions={activeRoute.waypoints}
          pathOptions={{
            color: activeRouteType === 'safe' ? '#00ff88' : '#ff3344',
            weight: 5,
            opacity: 0.95,
            dashArray: activeRouteType === 'safe' ? undefined : '8, 8'
          }}
        />
      </MapContainer>

      {/* Overlaid Tactical HUD Top Bar */}
      <div className="absolute top-4 left-4 z-[400] flex items-center gap-2.5 pointer-events-none">
        <div className="bg-[#040816]/95 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-heading font-bold tracking-wider">
            NASA JPL MARS TREK // MOLA COLOR SHADED RELIEF
          </span>
        </div>
      </div>

      {/* Algorithm Switcher Floating Toolbar */}
      <div className="absolute top-4 right-4 z-[400] flex items-center gap-2 bg-[#040816]/95 border border-cyan-500/30 p-1.5 rounded-xl shadow-2xl backdrop-blur-md">
        <button
          onClick={() => {
            sfx.click();
            setActiveRouteType('safe');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeRouteType === 'safe'
              ? 'bg-emerald-500 text-slate-950 shadow-[0_0_15px_rgba(0,255,136,0.4)]'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-3.5 h-3.5" />
          A* SAFE (8.4° SLOPE)
        </button>
        <button
          onClick={() => {
            sfx.hazardAlarm();
            setActiveRouteType('direct');
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all cursor-pointer ${
            activeRouteType === 'direct'
              ? 'bg-rose-600 text-white shadow-[0_0_15px_rgba(244,63,94,0.4)] animate-pulse'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-3.5 h-3.5" />
          UNCONSTRAINED LINE (26.2° HAZARD)
        </button>
      </div>

      {/* Floating HUD Mission Telemetry Card (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-[400] max-w-sm w-full bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3.5 shadow-2xl space-y-2.5 font-mono text-xs">
        <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
          <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-heading">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> EVA ROUTE METRICS
          </div>
          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
            activeRoute.safetyScore > 80 ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
          }`}>
            SAFETY: {activeRoute.safetyScore}%
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500">TRAVERSE</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{activeRoute.distanceKm} km</div>
          </div>
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500">MET DURATION</div>
            <div className="text-xs font-bold text-slate-200 mt-0.5">{activeRoute.estimatedMinutes} min</div>
          </div>
          <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
            <div className="text-[9px] text-slate-500">MAX PITCH</div>
            <div className={`text-xs font-bold mt-0.5 ${activeRoute.maxSlopeDeg > 15 ? 'text-rose-400 font-bold' : 'text-emerald-400'}`}>
              {activeRoute.maxSlopeDeg}°
            </div>
          </div>
        </div>

        {/* Live Simulation Trigger */}
        <div className="pt-1 flex items-center gap-2">
          <button
            onClick={handleToggleSim}
            className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/30"
          >
            {isSimulating ? 'PAUSE TRAVERSAL' : 'SIMULATE REAL-TIME WALK'}
          </button>
          <div className="text-[11px] text-slate-400 font-bold">
            {simProgress}%
          </div>
        </div>
      </div>

      {/* Waypoint Inspector Card (Bottom Right) */}
      {selectedTarget && (
        <div className="absolute bottom-4 right-4 z-[400] max-w-sm w-full bg-[#040816]/95 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3.5 shadow-2xl space-y-2 font-mono text-xs">
          <div className="flex items-center justify-between border-b border-purple-500/20 pb-1.5">
            <span className="font-heading font-bold text-purple-300 text-xs">
              🔬 {selectedTarget.name}
            </span>
            <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
              BIO: {selectedTarget.biosignaturePotential}
            </span>
          </div>

          <div className="text-[11px] text-slate-300 line-clamp-2">
            {selectedTarget.description}
          </div>

          <div className="grid grid-cols-2 gap-2 text-[10px] pt-1">
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">MINERAL:</span>
              <div className="text-purple-300 font-bold mt-0.5">{selectedTarget.targetMineral}</div>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <span className="text-slate-500">INSTRUMENT:</span>
              <div className="text-cyan-300 font-bold mt-0.5">{selectedTarget.instrument}</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
