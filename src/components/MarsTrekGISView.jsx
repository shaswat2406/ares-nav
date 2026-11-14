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
  Radio,
  Sliders,
  Sparkles,
  Maximize2
} from 'lucide-react';

// Custom icons using Lucide/SVG data URIs
const createCustomIcon = (bgColor, borderColor, text) => {
  return L.divIcon({
    className: 'custom-map-icon',
    html: `
      <div style="
        background-color: ${bgColor};
        border: 2px solid ${borderColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: monospace;
        font-weight: bold;
        font-size: 10px;
        color: white;
        box-shadow: 0 0 14px ${borderColor};
      ">
        ${text}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  });
};

const habIcon = createCustomIcon('#0284c7', '#38bdf8', 'HAB');
const targetIcon = createCustomIcon('#7c3aed', '#c084fc', 'SCI');
const roverIcon = createCustomIcon('#ea580c', '#fb923c', 'M20');

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

  const activeRoute = PRECOMPUTED_ROUTES[activeRouteType];
  const centerPos = [HABITAT_BASE.lat, HABITAT_BASE.lng];

  // Estimate elevation in Jezero from lat/lng
  const estimateElevation = (lat, lng) => {
    const dLat = (lat - 18.4447) * 111000;
    const dLng = (lng - 77.4508) * 111000 * Math.cos((18.4447 * Math.PI) / 180);
    const distM = Math.sqrt(dLat * dLat + dLng * dLng);
    // Base crater floor -2570m with western delta rise and outer crater rim
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
    // Find closest target
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
    if (leafletMap) {
      leafletMap.flyTo([loc.lat, loc.lng], loc.zoom, { duration: 1.5 });
    } else if (mapRef.current?.flyTo) {
      mapRef.current.flyTo([loc.lat, loc.lng], loc.zoom, { duration: 1.5 });
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

  // Rover traverse polyline coordinates safely normalized for array or object format
  const roverTraversePositions = ROVER_TRAVERSE.map((p) =>
    Array.isArray(p) ? [p[0], p[1]] : [p.lat, p.lng]
  );

  return (
    <div className="relative w-full h-full min-h-screen bg-[#040816] text-slate-200 font-mono select-none overflow-hidden flex flex-col">
      {/* High-Contrast Interactive Planetary GIS Canvas */}
      <MapContainer
        ref={mapRef}
        center={centerPos}
        zoom={12}
        maxZoom={16}
        minZoom={7}
        scrollWheelZoom={true}
        className="w-full h-full z-0"
      >
        <MapEventListener onMouseMove={handleMouseMove} onMapClick={handleMapClick} onMapReady={setLeafletMap} />

        {/* Layer 1: NASA JPL Official Mars Trek Global MOLA Shaded Color Elevation Basemap */}
        {layers.mola && (
          <TileLayer
            attribution='&copy; NASA / JPL / USGS Astrogeology // Mars Trek MOLA'
            url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_MGS_MOLA_ClrShade_merge_global_463m/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
            maxNativeZoom={7}
            maxZoom={16}
          />
        )}

        {/* Layer 2: NASA Mars Odyssey THEMIS Daytime Infrared Global 100m */}
        {layers.themis && (
          <TileLayer
            attribution='&copy; NASA / ASU // THEMIS IR 100m'
            url="https://trek.nasa.gov/tiles/Mars/EQ/Mars_Odyssey_THEMIS_IR_Daytime_100m_v14.0_global/1.0.0/default/default028mm/{z}/{y}/{x}.jpg"
            maxNativeZoom={7}
            maxZoom={16}
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
              weight: 5,
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

      {/* Top Left: Title & Quick Navigation */}
      <div className="absolute top-4 left-4 z-[400] space-y-2 pointer-events-auto">
        <div className="bg-[#040816]/95 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
          <span className="font-heading font-bold tracking-wider">
            NASA JPL MARS TREK // GIS VIEWER
          </span>
        </div>

        {/* Quick Nav Chips */}
        <div className="bg-[#040816]/90 backdrop-blur-md border border-cyan-500/30 p-2 rounded-xl shadow-xl max-w-xs space-y-1">
          <div className="text-[10px] text-cyan-400 font-bold px-1 flex items-center gap-1">
            <Compass className="w-3 h-3" /> QUICK JUMP SITES
          </div>
          <div className="grid grid-cols-2 gap-1 text-[10px]">
            {QUICK_NAV_LOCATIONS.map((loc, idx) => (
              <button
                key={loc.id || loc.name || idx}
                onClick={() => flyToLocation(loc)}
                className="px-2 py-1 rounded bg-slate-900/90 hover:bg-cyan-950 text-slate-300 hover:text-cyan-300 border border-slate-800 text-left truncate transition-colors"
                title={loc.description || loc.name}
              >
                {loc.label || loc.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Top Right: Layer Switcher & Compass Rose */}
      <div className="absolute top-4 right-4 z-[400] space-y-2 pointer-events-auto flex flex-col items-end">
        {/* Compass Rose */}
        <div className="w-10 h-10 rounded-full bg-[#040816]/90 border border-cyan-500/40 flex items-center justify-center shadow-xl">
          <div className="text-[10px] font-bold text-rose-400 flex flex-col items-center">
            <span>▲ N</span>
          </div>
        </div>

        {/* Layer Controls Panel */}
        <div className="bg-[#040816]/95 border border-cyan-500/30 p-2.5 rounded-xl shadow-2xl backdrop-blur-md text-xs space-y-1.5 w-48">
          <div className="text-[10px] text-cyan-400 font-bold flex items-center gap-1.5 border-b border-cyan-500/20 pb-1">
            <Layers className="w-3 h-3" /> MAP LAYERS
          </div>

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
              className="flex items-center justify-between text-[11px] cursor-pointer hover:bg-slate-900/60 p-1 rounded transition-colors"
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

          {/* Measure Tool Button */}
          <button
            onClick={() => {
              setMeasureMode(!measureMode);
              setMeasurePoints([]);
              setMeasureDistance(null);
            }}
            className={`w-full mt-2 py-1 px-2 rounded text-[10px] font-bold flex items-center justify-center gap-1 transition-all ${
              measureMode
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                : 'bg-slate-900 text-slate-300 hover:text-white border border-slate-800'
            }`}
          >
            <Ruler className="w-3 h-3" />
            {measureMode ? 'MEASURE: ACTIVE' : 'MEASURE DISTANCE'}
          </button>
        </div>
      </div>

      {/* Measurement HUD Chip */}
      {measureMode && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-[400] bg-cyan-950/90 border border-cyan-400 px-4 py-2 rounded-xl text-xs font-mono text-cyan-200 shadow-2xl flex items-center gap-2">
          <Ruler className="w-4 h-4 text-cyan-400" />
          {measureDistance !== null ? (
            <span>
              DISTANCE: <strong>{(measureDistance / 1000).toFixed(2)} km</strong> ({Math.round(measureDistance)} m)
            </span>
          ) : (
            <span>Click 2 points on the terrain to measure surface distance</span>
          )}
        </div>
      )}

      {/* Bottom Left: Live Cursor Coordinates & Telemetry */}
      <div className="absolute bottom-4 left-4 z-[400] max-w-sm w-full space-y-2 pointer-events-auto">
        {/* Lat / Lng / Elev Bar */}
        <div className="bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/40 px-3 py-2 rounded-xl text-xs text-slate-300 shadow-2xl flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-cyan-300 font-bold">
            <MapPin className="w-3.5 h-3.5" />
            <span>{mousePos.lat.toFixed(4)}°N, {mousePos.lng.toFixed(4)}°E</span>
          </div>
          <span className="text-amber-400 font-bold">
            ELEV: {mousePos.elev} m
          </span>
        </div>

        {/* Route Metrics Card */}
        <div className="bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3.5 shadow-2xl space-y-2.5">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1.5">
            <div className="flex items-center gap-1.5 text-cyan-400 font-bold font-heading">
              <Activity className="w-3.5 h-3.5" /> EVA ROUTE METRICS
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveRouteType('safe')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeRouteType === 'safe'
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                    : 'text-slate-400'
                }`}
              >
                SAFE
              </button>
              <button
                onClick={() => setActiveRouteType('direct')}
                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  activeRouteType === 'direct'
                    ? 'bg-rose-950 text-rose-400 border border-rose-500/40'
                    : 'text-slate-400'
                }`}
              >
                DIRECT
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-500">TRAVERSE</div>
              <div className="font-bold text-slate-200 mt-0.5">{activeRoute.distanceKm} km</div>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-500">TIME</div>
              <div className="font-bold text-slate-200 mt-0.5">{activeRoute.estimatedMinutes} min</div>
            </div>
            <div className="bg-slate-950 p-1.5 rounded border border-slate-800">
              <div className="text-[9px] text-slate-500">MAX PITCH</div>
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
          <div className="pt-1 flex items-center gap-2">
            <button
              onClick={handleToggleSim}
              className="flex-1 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-lg shadow-cyan-500/30"
            >
              {isSimulating ? 'PAUSE TRAVERSAL' : 'SIMULATE REAL-TIME WALK'}
            </button>
            <div className="text-[11px] text-slate-400 font-bold">{simProgress}%</div>
          </div>
        </div>
      </div>

      {/* Bottom Right: Click Inspector Card */}
      {inspectedPoint && (
        <div className="absolute bottom-4 right-4 z-[400] max-w-xs w-full bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3 shadow-2xl space-y-2 pointer-events-auto text-xs">
          <div className="flex items-center justify-between border-b border-cyan-500/20 pb-1">
            <span className="font-heading font-bold text-cyan-300">INSPECTED REGION</span>
            <button
              onClick={() => setInspectedPoint(null)}
              className="text-slate-500 hover:text-white"
            >
              ✕
            </button>
          </div>
          <div className="space-y-1 text-[11px]">
            <div>Coord: {inspectedPoint.lat.toFixed(4)}°N, {inspectedPoint.lng.toFixed(4)}°E</div>
            <div>Elevation: <strong className="text-amber-400">{inspectedPoint.elev}m</strong></div>
            <div>Classification: <span className="text-slate-300">{inspectedPoint.terrain}</span></div>
            <div>Nearest Target: <span className="text-purple-300 font-bold">{inspectedPoint.nearestTarget}</span></div>
          </div>
        </div>
      )}
    </div>
  );
}
