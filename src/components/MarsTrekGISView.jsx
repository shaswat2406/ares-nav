import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Layers, Compass, Eye, ShieldAlert, Zap, Navigation, Mountain, CheckCircle2, ChevronRight, Activity, Camera, Radio } from 'lucide-react';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES, PRECOMPUTED_ROUTES, SOL_TELEMETRY } from '../data/jezeroData';
import { computeCustomAStarRoute } from '../utils/astarEngine';
import { sfx } from '../utils/soundFX';
import confetti from 'canvas-confetti';

export function MarsTrekGISView() {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [pitch, setPitch] = useState(60);
  const [bearing, setBearing] = useState(-30);
  const [activeRouteType, setActiveRouteType] = useState('safe');
  const [selectedTarget, setSelectedTarget] = useState(SCIENCE_TARGETS[1]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simProgress, setSimProgress] = useState(0);

  const activeRoute = PRECOMPUTED_ROUTES[activeRouteType];

  useEffect(() => {
    if (map.current) return;

    // Real USGS Astrogeology / OpenPlanetary Mars Global Basemap & HiRISE/MOLA Tile Server
    const marsStyle = {
      version: 8,
      sources: {
        'mars-mola-elevation': {
          type: 'raster',
          tiles: [
            'https://cartocdn-gusc.global.ssl.fastly.net/opmbuilder/api/v1/map/named/opm:mars_v1/all/{z}/{x}/{y}.png'
          ],
          tileSize: 256,
          attribution: 'USGS Astrogeology / NASA JPL Mars Trek / OpenPlanetary'
        }
      },
      layers: [
        {
          id: 'mars-surface-raster',
          type: 'raster',
          source: 'mars-mola-elevation',
          paint: {
            'raster-opacity': 0.92,
            'raster-contrast': 0.15,
            'raster-brightness-min': 0.05
          }
        }
      ]
    };

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: marsStyle,
      center: [77.4350, 18.4447], // Jezero Crater Delta center
      zoom: 12.8,
      pitch: 60,
      bearing: -30,
      maxZoom: 18,
      minZoom: 6
    });

    map.current.on('load', () => {
      // Add Hazard Perimeters
      HAZARD_ZONES.forEach(hz => {
        const coords = [];
        const steps = 32;
        const radiusDeg = hz.radius / 100000;
        for (let i = 0; i <= steps; i++) {
          const angle = (i / steps) * (Math.PI * 2);
          coords.push([
            hz.center[1] + Math.cos(angle) * radiusDeg * 1.5,
            hz.center[0] + Math.sin(angle) * radiusDeg
          ]);
        }

        map.current.addSource(`hazard-${hz.id}`, {
          type: 'geojson',
          data: {
            type: 'Feature',
            geometry: { type: 'Polygon', coordinates: [coords] }
          }
        });

        map.current.addLayer({
          id: `layer-${hz.id}`,
          type: 'fill',
          source: `hazard-${hz.id}`,
          paint: {
            'fill-color': hz.color,
            'fill-opacity': 0.35,
            'fill-outline-color': hz.color
          }
        });
      });

      // Add Habitat Base Marker
      const habEl = document.createElement('div');
      habEl.className = 'w-8 h-8 rounded-full bg-cyan-500 border-2 border-white shadow-[0_0_15px_#00f0ff] flex items-center justify-center font-mono font-bold text-slate-950 text-[10px] cursor-pointer';
      habEl.innerHTML = 'HAB';
      new maplibregl.Marker({ element: habEl })
        .setLngLat([HABITAT_BASE.lng, HABITAT_BASE.lat])
        .addTo(map.current);

      // Add Science Targets Markers
      SCIENCE_TARGETS.forEach(target => {
        const sciEl = document.createElement('div');
        sciEl.className = 'w-7 h-7 rounded-full bg-purple-600 border-2 border-purple-300 shadow-[0_0_15px_#c084fc] flex items-center justify-center font-mono font-bold text-white text-[9px] cursor-pointer hover:scale-125 transition-all';
        sciEl.innerHTML = 'SCI';
        sciEl.addEventListener('click', () => {
          sfx.click();
          setSelectedTarget(target);
        });

        new maplibregl.Marker({ element: sciEl })
          .setLngLat([target.lng, target.lat])
          .addTo(map.current);
      });
    });

    map.current.on('rotate', () => {
      setBearing(Math.round(map.current.getBearing()));
      setPitch(Math.round(map.current.getPitch()));
    });
  }, []);

  // Update Route Polyline Layer dynamically
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    const routeGeoJSON = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: activeRoute.waypoints.map(wp => [wp[1], wp[0]])
      }
    };

    if (map.current.getSource('route-line')) {
      map.current.getSource('route-line').setData(routeGeoJSON);
    } else {
      map.current.addSource('route-line', {
        type: 'geojson',
        data: routeGeoJSON
      });

      map.current.addLayer({
        id: 'route-line-layer',
        type: 'line',
        source: 'route-line',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': activeRouteType === 'safe' ? '#00ff88' : '#ff3344',
          'line-width': 5,
          'line-opacity': 0.95
        }
      });
    }

    if (map.current.getLayer('route-line-layer')) {
      map.current.setPaintProperty(
        'route-line-layer',
        'line-color',
        activeRouteType === 'safe' ? '#00ff88' : '#ff3344'
      );
    }
  }, [activeRouteType, activeRoute]);

  // Real-time Traversal Simulation
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
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
            return 100;
          }
          return p + 1;
        });
      }, 150);
    }
    return () => clearInterval(interval);
  }, [isSimulating]);

  return (
    <div className="relative w-full h-[720px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.9)] bg-[#050811] flex">
      {/* 1. Main High-Resolution Real GIS Mars Map Canvas */}
      <div ref={mapContainer} className="w-full h-full relative" />

      {/* 2. Overlaid Tactical HUD Top Bar */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2.5">
        <div className="bg-[#040816]/95 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-heading font-bold tracking-wider">
            NASA MARS TREK // GIS HIGH-RES MOSAIC
          </span>
        </div>
        <div className="bg-[#040816]/95 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300">
          BEARING: {bearing}° | PITCH: {pitch}°
        </div>
      </div>

      {/* 3. Algorithm Switcher Floating Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2 bg-[#040816]/95 border border-cyan-500/30 p-1.5 rounded-xl shadow-2xl backdrop-blur-md">
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

      {/* 4. Floating HUD Mission Telemetry Card (Bottom Left) */}
      <div className="absolute bottom-4 left-4 z-10 max-w-sm w-full bg-[#040816]/95 backdrop-blur-xl border border-cyan-500/30 rounded-xl p-3.5 shadow-2xl space-y-2.5 font-mono text-xs">
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

      {/* 5. Waypoint Inspector Card (Bottom Right) */}
      {selectedTarget && (
        <div className="absolute bottom-4 right-4 z-10 max-w-sm w-full bg-[#040816]/95 backdrop-blur-xl border border-purple-500/30 rounded-xl p-3.5 shadow-2xl space-y-2 font-mono text-xs">
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
