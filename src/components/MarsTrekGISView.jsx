import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Circle, CircleMarker, Polyline, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import {
  HABITAT_BASE,
  SCIENCE_TARGETS,
  HAZARD_ZONES,
  PRECOMPUTED_ROUTES,
  QUICK_NAV_LOCATIONS,
  ROVER_TRAVERSE,
  CRISM_DETECTIONS
} from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';
import {
  Activity,
  ShieldAlert,
  Navigation,
  Compass,
  Layers,
  MapPin,
  Ruler,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  RotateCcw,
  Plus,
  Minus,
  X,
  Play,
  Check
} from 'lucide-react';

// Custom icons using Lucide/SVG data URIs
const createCustomIcon = (bgColor, borderColor, text) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        border: 2px solid ${borderColor};
        width: 28px;
        height: 28px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-weight: bold;
        font-size: 10px;
        color: white;
        box-shadow: 0 0 12px ${borderColor};
      ">
        ${text}
      </div>
    `,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });
};

const habIcon = createCustomIcon('#0284c7', '#38bdf8', 'HAB');
const targetIcon = createCustomIcon('#7c3aed', '#c084fc', 'SCI');

// Map Event Listener for Cursor Coordinates & Click Inspector
function MapEventListener({ onMouseMove, onMapClick, onMapReady }) {
  const map = useMapEvents({
    mousemove(e) {
      onMouseMove(e.latlng);
    },
    click(e) {
      onMapClick(e.latlng);
    }
  });
  useEffect(() => {
    if (map && onMapReady) {
      onMapReady(map);
    }
  }, [map, onMapReady]);
  return null;
}

export function MarsTrekGISView() {
  const mapRef = useRef(null);
  const [leafletMap, setLeafletMap] = useState(null);
  const [activeRouteType, setActiveRouteType] = useState('safe');
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  // Mouse coordinate and elevation
  const [mousePos, setMousePos] = useState({ lat: 18.4447, lng: 77.4508, elev: -2570 });
  const [inspectedPoint, setInspectedPoint] = useState(null);

  // Measure distance state
  const [measureMode, setMeasureMode] = useState(false);
  const [measurePoints, setMeasurePoints] = useState([]);
  const [measureDistance, setMeasureDistance] = useState(null);

  // UI Responsiveness & Collapsible States (uncluttering screen)
  const [hudVisible, setHudVisible] = useState(true);
  const [isJumpOpen, setIsJumpOpen] = useState(false);
  const [isLayersOpen, setIsLayersOpen] = useState(false);
  const [isMetricsExpanded, setIsMetricsExpanded] = useState(false);

  // Layer Visibility
  const [layers, setLayers] = useState({
    mola: true,
    themis: false,
    hazards: true,
    science: true,
    route: true,
    rover: true,
    crism: true
  });

  const activeRoute = PRECOMPUTED_ROUTES[activeRouteType] || PRECOMPUTED_ROUTES.safe;
  // Jezero Crater Center datum
  const centerPos = [HABITAT_BASE.lat, HABITAT_BASE.lng];

  // Estimate elevation in Jezero from lat/lng
  const estimateElevation = (lat, lng) => {
    const dLat = (lat - 18.4447) * 111000;
    const dLng = (lng - 77.4508) * 111000 * Math.cos((18.4447 * Math.PI) / 180);
    const distM = Math.sqrt(dLat * dLat + dLng * dLng);
    let elev = -2570;
    if (lng < 77.43) elev += (77.43 - lng) * 2200; // Delta rise
    if (distM > 15000) elev += Math.pow((distM - 15000) / 1000, 1.8) * 18; // Rim rise
    return Math.round(elev);
  };

  const handleMouseMove = (latlng) => {
    const elev = estimateElevation(latlng.lat, latlng.lng);
    setMousePos({
      lat: latlng.lat,
      lng: latlng.lng,
      elev
    });
  };

  const handleMapClick = (latlng) => {
    if (measureMode) {
      const newPoints = [...measurePoints, latlng];
      if (newPoints.length === 2) {
        const dLat = (newPoints[1].lat - newPoints[0].lat) * 111000;
        const dLng = (newPoints[1].lng - newPoints[0].lng) * 111000 * Math.cos((18.4447 * Math.PI) / 180);
        const dist = Math.sqrt(dLat * dLat + dLng * dLng);
        setMeasureDistance(dist);
        setMeasurePoints(newPoints);
      } else if (newPoints.length > 2) {
        setMeasurePoints([latlng]);
        setMeasureDistance(null);
      } else {
        setMeasurePoints(newPoints);
      }
      return;
    }

    const elev = estimateElevation(latlng.lat, latlng.lng);
    let closestTarget = SCIENCE_TARGETS[0];
    let minD = 999999;
    SCIENCE_TARGETS.forEach((st) => {
      const d = Math.hypot(st.lat - latlng.lat, st.lng - latlng.lng);
      if (d < minD) {
        minD = d;
        closestTarget = st;
      }
    });

    setInspectedPoint({
      lat: latlng.lat,
      lng: latlng.lng,
      elev,
      nearestTarget: closestTarget.name,
      terrain: elev > -2450 ? 'Steep Delta / Rim Scarp' : elev < -2550 ? 'Smooth Basin Floor' : 'Moderate Incline'
    });
  };

  const flyToLocation = (loc) => {
    sfx.click();
    setIsJumpOpen(false);
    if (leafletMap) {
      leafletMap.flyTo([loc.lat, loc.lng], loc.zoom || 10, { duration: 1.5 });
    }
  };

  const resetToOverview = () => {
    sfx.click();
    if (leafletMap) {
      leafletMap.flyTo([18.4447, 77.4508], 9.5, { duration: 1.2 });
    }
  };

  const handleZoom = (delta) => {
    sfx.click();
    if (leafletMap) {
      if (delta > 0) leafletMap.zoomIn();
      else leafletMap.zoomOut();
    }
  };

  const handleToggleSim = () => {
    sfx.click();
    setIsSimulating(!isSimulating);
  };

  useEffect(() => {
    let interval;
    if (isSimulating) {
      interval = setInterval(() => {
        setSimProgress((p) => {
          if (p >= 100) {
            setIsSimulating(false);
            sfx.scienceSuccess();
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return 100;
          }
          return p + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  // Rover traverse polyline coordinates safely normalized
  const roverTraversePositions = ROVER_TRAVERSE.map((p) =>
    Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng]
  );

  const activeLayerCount = Object.values(layers).filter(Boolean).length;

  return (
    <div className="relative w-full h-full min-h-screen bg-[#040816] text-slate-200 font-mono select-none overflow-hidden flex flex-col">
      {/* ── High-Contrast Interactive Planetary GIS Canvas ── */}
      {/* Starting at zoom 9.5 gives a stunning wide overview of the entire Jezero Crater basin */}
      <MapContainer
        ref={mapRef}
        center={centerPos}
        zoom={9.5}
        maxZoom={15}
        minZoom={5}
        scrollWheelZoom={true}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapEventListener onMouseMove={handleMouseMove} onMapClick={handleMapClick} onMapReady={setLeafletMap} />

        {/* Layer 1: NASA JPL Official Mars Trek Global MOLA Shaded Color Elevation Basemap */}
        {layers.mola && (
          <TileLayer
            attribution='&copy; NASA / JPL / USGS Astrogeology // Mars Trek MOLA'
            url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
            maxNativeZoom={7}
            maxZoom={15}
          />
        )}

        {/* Layer 2: NASA Mars Odyssey THEMIS Daytime Infrared Global 100m */}
        {layers.themis && (
          <TileLayer
            attribution='&copy; NASA / ASU // THEMIS IR 100m'
            url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_Odyssey_THEMIS_IR_Daytime_100m_v14.0_global/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
            maxNativeZoom={7}
            maxZoom={15}
            opacity={0.65}
          />
        )}

        {/* Habitat Base Marker */}
        <Marker position={[HABITAT_BASE.lat, HABITAT_BASE.lng]} icon={habIcon}>
          <Popup>
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
        {layers.hazards &&
          HAZARD_ZONES.map((hz) => (
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
        {layers.science &&
          SCIENCE_TARGETS.map((target) => (
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

        {/* CRISM Spectral Detections */}
        {layers.crism &&
          CRISM_DETECTIONS.map((det, idx) => (
            <CircleMarker
              key={`crism-${det.id || idx}`}
              center={[det.lat, det.lng]}
              radius={6}
              pathOptions={{
                color: '#c084fc',
                fillColor: '#9333ea',
                fillOpacity: 0.8,
                weight: 1.5
              }}
            >
              <Popup>
                <div className="p-1 text-slate-900 font-mono text-xs">
                  <span className="text-[10px] text-purple-700 font-bold block">CRISM DETECTION</span>
                  <div className="font-bold text-purple-900">{det.mineral}</div>
                  <div className="text-[10px] text-slate-600">
                    Confidence: {det.confidence > 1 ? det.confidence : Math.round(det.confidence * 100)}%
                  </div>
                  <div className="text-[10px] text-slate-500 italic mt-0.5">{det.citation || det.paper}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}

        {/* Perseverance Rover Traverse */}
        {layers.rover && (
          <>
            <Polyline
              positions={roverTraversePositions}
              pathOptions={{
                color: '#fb923c',
                weight: 3,
                opacity: 0.8,
                dashArray: '4, 6'
              }}
            />
            {ROVER_TRAVERSE.filter((_, i) => i % 3 === 0).map((pt, idx) => {
              const lat = Array.isArray(pt) ? pt[0] : pt.lat;
              const lng = Array.isArray(pt) ? pt[1] : pt.lng;
              const sol = pt.sol !== undefined ? pt.sol : idx * 90;
              const label = pt.label || `Traverse Waypoint #${idx + 1}`;
              return (
                <CircleMarker
                  key={`sol-${idx}`}
                  center={[lat, lng]}
                  radius={4}
                  pathOptions={{ color: '#ea580c', fillColor: '#f97316', fillOpacity: 0.9 }}
                >
                  <Popup>
                    <div className="p-1 text-slate-900 font-mono text-xs">
                      <span className="font-bold text-orange-700">Sol {sol}</span>: {label}
                    </div>
                  </Popup>
                </CircleMarker>
              );
            })}
          </>
        )}

        {/* Active Route Traversal Polyline */}
        {layers.route && activeRoute?.waypoints && (
          <Polyline
            positions={activeRoute.waypoints}
            pathOptions={{
              color: activeRouteType === 'safe' ? '#00ff88' : '#ff3344',
              weight: 4,
              opacity: 0.95,
              dashArray: activeRouteType === 'safe' ? undefined : '8, 8'
            }}
          />
        )}

        {/* Measurement Polyline */}
        {measureMode && measurePoints.length === 2 && (
          <Polyline
            positions={measurePoints.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#38bdf8', weight: 3, dashArray: '6, 6' }}
          />
        )}
      </MapContainer>

      {/* ── RESPONSIVE AEROSPACE HUD OVERLAYS ── */}
      {hudVisible && (
        <>
          {/* Top Left: Sleek Branding & Dropdown Quick Navigation */}
          <div className="absolute top-32 sm:top-28 md:top-24 lg:top-20 left-4 z-[400] space-y-2 pointer-events-auto max-w-[calc(100vw-6rem)]">
            <div className="flex items-center gap-1.5 flex-wrap">
              <div className="bg-[#040816]/90 backdrop-blur-xl border border-cyan-500/40 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="font-heading font-extrabold text-[11px] tracking-wider uppercase">
                  NASA MARS TREK // GIS
                </span>
              </div>

              {/* Quick Jump Dropdown Toggle */}
              <div className="relative">
                <button
                  onClick={() => {
                    sfx.click();
                    setIsJumpOpen(!isJumpOpen);
                    setIsLayersOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-lg ${
                    isJumpOpen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-[#040816]/90 backdrop-blur-xl text-slate-200 border-cyan-500/30 hover:border-cyan-400'
                  }`}
                >
                  <Compass className="w-3.5 h-3.5 text-cyan-400" />
                  <span>SITES ({QUICK_NAV_LOCATIONS.length})</span>
                  {isJumpOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Dropdown Menu */}
                {isJumpOpen && (
                  <div className="absolute top-full left-0 mt-1 w-56 bg-[#040816]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-2 shadow-2xl space-y-1 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[9px] text-cyan-400 font-bold px-1.5 py-0.5 border-b border-cyan-500/20 flex items-center justify-between">
                      <span>ORBITAL RECON JUMP</span>
                      <span>MOLA</span>
                    </div>
                    <div className="grid grid-cols-1 gap-1 max-h-56 overflow-y-auto pt-1">
                      {QUICK_NAV_LOCATIONS.map((loc, idx) => (
                        <button
                          key={loc.name || idx}
                          onClick={() => flyToLocation(loc)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-200 text-left text-xs transition-colors cursor-pointer flex items-center justify-between group"
                        >
                          <span className="truncate">{loc.name}</span>
                          <span className="text-[9px] text-slate-500 group-hover:text-cyan-400 font-mono">
                            Z{loc.zoom || 11}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Reset to Wide Crater Overview */}
              <button
                onClick={resetToOverview}
                className="bg-[#040816]/90 backdrop-blur-xl border border-slate-700 hover:border-cyan-500/50 px-2.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-cyan-300 flex items-center gap-1 cursor-pointer transition-colors shadow-lg"
                title="Reset zoom to wide Jezero Crater view"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-[11px]">RESET ZOOM</span>
              </button>
            </div>
          </div>

          {/* Top Right: Layer Switcher, Compass & Zoom Controls */}
          <div className="absolute top-32 sm:top-28 md:top-24 lg:top-20 right-4 z-[400] space-y-2 pointer-events-auto flex flex-col items-end">
            <div className="flex items-center gap-1.5">
              {/* Layers Popover Button */}
              <div className="relative">
                <button
                  onClick={() => {
                    sfx.click();
                    setIsLayersOpen(!isLayersOpen);
                    setIsJumpOpen(false);
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer border shadow-lg ${
                    isLayersOpen
                      ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                      : 'bg-[#040816]/90 backdrop-blur-xl text-slate-200 border-cyan-500/30 hover:border-cyan-400'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 text-cyan-400" />
                  <span>LAYERS ({activeLayerCount})</span>
                  {isLayersOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>

                {/* Layers Dropdown Menu */}
                {isLayersOpen && (
                  <div className="absolute top-full right-0 mt-1 w-52 bg-[#040816]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl space-y-2 animate-in fade-in zoom-in-95 duration-150">
                    <div className="text-[10px] text-cyan-400 font-bold border-b border-cyan-500/20 pb-1 flex items-center justify-between">
                      <span>MAP OVERLAYS</span>
                      <span className="text-[9px] text-slate-500">TOGGLE</span>
                    </div>

                    <div className="space-y-1">
                      {[
                        { key: 'mola', label: 'MOLA Relief', color: 'text-sky-300' },
                        { key: 'themis', label: 'THEMIS Thermal', color: 'text-amber-300' },
                        { key: 'hazards', label: 'Hazard Zones', color: 'text-rose-300' },
                        { key: 'science', label: 'Science Sites', color: 'text-purple-300' },
                        { key: 'crism', label: 'CRISM Minerals', color: 'text-fuchsia-300' },
                        { key: 'rover', label: 'Rover Traverse', color: 'text-orange-300' },
                        { key: 'route', label: 'EVA Route', color: 'text-emerald-300' }
                      ].map(({ key, label, color }) => (
                        <label
                          key={key}
                          className="flex items-center justify-between text-xs cursor-pointer hover:bg-slate-900/80 px-2 py-1 rounded transition-colors"
                        >
                          <span className={color}>{label}</span>
                          <input
                            type="checkbox"
                            checked={layers[key]}
                            onChange={() => setLayers({ ...layers, [key]: !layers[key] })}
                            className="rounded accent-cyan-500 cursor-pointer"
                          />
                        </label>
                      ))}
                    </div>

                    {/* Measure Distance Button */}
                    <button
                      onClick={() => {
                        sfx.click();
                        setMeasureMode(!measureMode);
                        setMeasurePoints([]);
                        setMeasureDistance(null);
                        setIsLayersOpen(false);
                      }}
                      className={`w-full py-1.5 px-2 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                        measureMode
                          ? 'bg-cyan-500 text-slate-950 shadow-[0_0_15px_rgba(0,240,255,0.5)]'
                          : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <Ruler className="w-3.5 h-3.5" />
                      {measureMode ? 'MEASURE: ACTIVE' : 'MEASURE DISTANCE'}
                    </button>
                  </div>
                )}
              </div>

              {/* Compass Indicator */}
              <div className="w-8 h-8 rounded-xl bg-[#040816]/90 border border-cyan-500/40 flex items-center justify-center shadow-lg text-[10px] font-bold text-rose-400">
                ▲ N
              </div>

              {/* Toggle All HUD Visibility Button */}
              <button
                onClick={() => {
                  sfx.click();
                  setHudVisible(false);
                }}
                className="w-8 h-8 rounded-xl bg-[#040816]/90 border border-slate-700 hover:border-cyan-400 flex items-center justify-center shadow-lg text-slate-400 hover:text-cyan-300 cursor-pointer transition-colors"
                title="Hide all overlays for pure map view"
              >
                <EyeOff className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Custom Map Zoom Buttons */}
            <div className="bg-[#040816]/90 border border-slate-800 rounded-xl overflow-hidden shadow-xl flex flex-col">
              <button
                onClick={() => handleZoom(1)}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-900/80 transition-colors cursor-pointer border-b border-slate-800"
                title="Zoom In"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => handleZoom(-1)}
                className="p-1.5 text-slate-300 hover:text-cyan-300 hover:bg-slate-900/80 transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Measurement Floating Chip (Center Top) */}
          {measureMode && (
            <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[400] bg-[#040816]/95 border border-cyan-400 px-4 py-2 rounded-xl text-xs font-mono text-cyan-200 shadow-2xl flex items-center gap-2 animate-in fade-in duration-150">
              <Ruler className="w-4 h-4 text-cyan-400" />
              {measureDistance !== null ? (
                <span>
                  DISTANCE: <strong className="text-white">{(measureDistance / 1000).toFixed(2)} km</strong> ({Math.round(measureDistance)} m)
                </span>
              ) : (
                <span>Click 2 points on the terrain to measure surface distance</span>
              )}
              <button
                onClick={() => {
                  setMeasureMode(false);
                  setMeasurePoints([]);
                  setMeasureDistance(null);
                }}
                className="ml-2 text-slate-500 hover:text-white p-0.5 rounded cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Bottom Left: Responsive Minimal Telemetry Bar + Expandable Route Metrics */}
          <div className="absolute bottom-4 left-4 z-[400] max-w-sm w-[calc(100vw-2rem)] sm:w-80 space-y-1.5 pointer-events-auto">
            {/* Minimal High-Tech Single-Line Bar */}
            <div
              onClick={() => setIsMetricsExpanded(!isMetricsExpanded)}
              className="bg-[#040816]/90 backdrop-blur-xl border border-cyan-500/40 px-3 py-2 rounded-xl text-xs text-slate-300 shadow-2xl flex items-center justify-between cursor-pointer hover:border-cyan-400 transition-colors"
            >
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
                <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                <span>{mousePos.lat.toFixed(4)}°N, {mousePos.lng.toFixed(4)}°E</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-amber-400 font-bold text-[11px]">
                  {mousePos.elev}m
                </span>
                <span className="text-slate-500">|</span>
                <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                  {activeRoute.distanceKm} km
                  {isMetricsExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
                </span>
              </div>
            </div>

            {/* Expandable Route Metrics Card */}
            {isMetricsExpanded && (
              <div className="bg-[#040816]/95 backdrop-blur-2xl border border-cyan-500/40 rounded-xl p-3 shadow-2xl space-y-2.5 animate-in fade-in duration-150">
                <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
                  <div className="flex items-center gap-1.5 text-cyan-400 font-bold text-xs">
                    <Activity className="w-3.5 h-3.5" /> EVA ROUTE METRICS
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setActiveRouteType('safe')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeRouteType === 'safe'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      SAFE
                    </button>
                    <button
                      onClick={() => setActiveRouteType('direct')}
                      className={`px-2 py-0.5 rounded text-[10px] font-bold cursor-pointer ${
                        activeRouteType === 'direct'
                          ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                          : 'text-slate-400'
                      }`}
                    >
                      DIRECT
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-[8px] text-slate-500">TRAVERSE</div>
                    <div className="font-bold text-slate-200 mt-0.5">{activeRoute.distanceKm} km</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-[8px] text-slate-500">TIME</div>
                    <div className="font-bold text-slate-200 mt-0.5">{activeRoute.estimatedMinutes} min</div>
                  </div>
                  <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
                    <div className="text-[8px] text-slate-500">MAX PITCH</div>
                    <div
                      className={`font-bold mt-0.5 ${
                        activeRoute.maxSlopeDeg > 15 ? 'text-rose-400' : 'text-emerald-400'
                      }`}
                    >
                      {activeRoute.maxSlopeDeg}°
                    </div>
                  </div>
                </div>

                {/* Simulation Trigger */}
                <div className="pt-0.5 flex items-center gap-2">
                  <button
                    onClick={handleToggleSim}
                    className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/30"
                  >
                    <Play className="w-3 h-3 fill-slate-950" />
                    {isSimulating ? 'PAUSE WALK' : 'SIMULATE WALK'}
                  </button>
                  <div className="text-xs text-slate-400 font-bold font-mono">{simProgress}%</div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Right: Click Inspector Card */}
          {inspectedPoint && (
            <div className="absolute bottom-4 right-4 z-[400] max-w-xs w-[calc(100vw-2rem)] sm:w-72 bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-2xl space-y-1.5 pointer-events-auto text-xs animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
                <span className="font-heading font-bold text-cyan-300 text-[11px]">INSPECTED REGION</span>
                <button
                  onClick={() => setInspectedPoint(null)}
                  className="text-slate-500 hover:text-white p-0.5 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-0.5 text-[11px]">
                <div>Coord: {inspectedPoint.lat.toFixed(4)}°N, {inspectedPoint.lng.toFixed(4)}°E</div>
                <div>Elevation: <strong className="text-amber-400">{inspectedPoint.elev}m</strong></div>
                <div>Terrain: <span className="text-slate-300">{inspectedPoint.terrain}</span></div>
                <div>Nearest Target: <span className="text-purple-300 font-bold">{inspectedPoint.nearestTarget}</span></div>
              </div>
            </div>
          )}
        </>
      )}

      {/* When HUD is hidden, show a small floating button to bring it back */}
      {!hudVisible && (
        <button
          onClick={() => {
            sfx.click();
            setHudVisible(true);
          }}
          className="absolute top-32 sm:top-28 md:top-24 lg:top-20 right-4 z-[400] bg-[#040816]/90 border border-cyan-500/50 hover:border-cyan-300 px-3 py-1.5 rounded-xl text-xs font-mono text-cyan-300 shadow-2xl flex items-center gap-1.5 cursor-pointer pointer-events-auto"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>SHOW HUD</span>
        </button>
      )}
    </div>
  );
}
