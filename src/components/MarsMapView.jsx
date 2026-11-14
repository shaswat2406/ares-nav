import React from 'react';
import { MapContainer, Circle, Polyline, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';

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
        box-shadow: 0 0 10px ${borderColor};
      ">
        ${text}
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 16]
  });
};

const habIcon = createCustomIcon('#0284c7', '#38bdf8', 'HAB');
const targetIcon = createCustomIcon('#7c3aed', '#a855f7', 'SCI');

export const MarsMapView = ({ activeLayers, activeRoute, onSelectTarget }) => {
  const centerPos = [HABITAT_BASE.lat, HABITAT_BASE.lng];

  return (
    <div className="relative w-full h-full min-h-[550px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-[#090d16]">
      {/* Tactical Grid Background */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-20 z-[401]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #38bdf8 1px, transparent 1px),
            linear-gradient(to bottom, #38bdf8 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px'
        }}
      />

      <MapContainer
        center={centerPos}
        zoom={13}
        maxZoom={16}
        minZoom={11}
        scrollWheelZoom={true}
        className="w-full h-full"
      >
        {/* Jezero Crater Martian Surface Grid Canvas */}
        {/* Topographic Elevation Contour Circles */}
        {activeLayers.topography && (
          <>
            <Circle
              center={[18.4447, 77.4508]}
              radius={3500}
              pathOptions={{
                color: '#334155',
                fillColor: '#1e293b',
                fillOpacity: 0.15,
                weight: 1,
                dashArray: '2, 4'
              }}
            />
            <Circle
              center={[18.4400, 77.4200]}
              radius={2400}
              pathOptions={{
                color: '#475569',
                fillColor: '#334155',
                fillOpacity: 0.1,
                weight: 1,
                dashArray: '4, 4'
              }}
            />
          </>
        )}

        {/* Habitat Base Marker */}
        <Marker position={[HABITAT_BASE.lat, HABITAT_BASE.lng]} icon={habIcon}>
          <Popup className="custom-popup">
            <div className="p-1 text-slate-900 font-sans">
              <h3 className="font-bold text-sm text-sky-700">{HABITAT_BASE.name}</h3>
              <p className="text-xs text-slate-600 mt-1">{HABITAT_BASE.description}</p>
              <div className="text-[11px] font-mono mt-2 bg-slate-100 p-1 rounded">
                Elev: {HABITAT_BASE.elevation}m | Lat: {HABITAT_BASE.lat}°, Lng: {HABITAT_BASE.lng}°
              </div>
            </div>
          </Popup>
        </Marker>

        {/* Hazard Zones Overlay (DEM Slope & Sand Traps) */}
        {activeLayers.hazards && HAZARD_ZONES.map(hazard => (
          <Circle
            key={hazard.id}
            center={hazard.center}
            radius={hazard.radius}
            pathOptions={{
              color: hazard.color,
              fillColor: hazard.color,
              fillOpacity: 0.35,
              weight: 2,
              dashArray: '4, 6'
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans">
                <div className="flex items-center gap-1 font-bold text-xs text-rose-700">
                  ⚠️ {hazard.name}
                </div>
                <div className="text-xs text-slate-600 mt-1 font-semibold">{hazard.type} - Severity: {hazard.severity}</div>
                <p className="text-[11px] text-slate-600 mt-1">{hazard.risk}</p>
              </div>
            </Popup>
          </Circle>
        ))}

        {/* Mineralogy / CRISM Spectroscopy Zones */}
        {activeLayers.mineralogy && (
          <>
            {/* Kodiak Clay zone */}
            <Circle
              center={[18.4230, 77.4300]}
              radius={850}
              pathOptions={{
                color: '#a855f7',
                fillColor: '#9333ea',
                fillOpacity: 0.25,
                weight: 1
              }}
            />
            {/* Delta Mudstones / Carbonates zone */}
            <Circle
              center={[18.4550, 77.4120]}
              radius={1200}
              pathOptions={{
                color: '#06b6d4',
                fillColor: '#0891b2',
                fillOpacity: 0.25,
                weight: 1
              }}
            />
          </>
        )}

        {/* Science Targets Markers */}
        {activeLayers.targets && SCIENCE_TARGETS.map(target => (
          <Marker
            key={target.id}
            position={[target.lat, target.lng]}
            icon={targetIcon}
            eventHandlers={{
              click: () => onSelectTarget(target)
            }}
          >
            <Popup>
              <div className="p-1 text-slate-900 font-sans max-w-[220px]">
                <div className="font-bold text-xs text-purple-800">{target.name}</div>
                <div className="text-[10px] text-purple-600 font-mono mt-0.5 font-semibold">
                  Target: {target.targetMineral}
                </div>
                <div className="text-[11px] text-slate-600 mt-1 line-clamp-2">
                  {target.description}
                </div>
                <div className="mt-2 text-[10px] bg-purple-50 text-purple-900 font-mono p-1 rounded flex justify-between">
                  <span>Biosignature:</span>
                  <span className="font-bold">{target.biosignaturePotential}</span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Active Route Trajectory Line */}
        <Polyline
          positions={activeRoute.waypoints}
          pathOptions={{
            color: activeRoute.color,
            weight: 4,
            opacity: 0.9,
            dashArray: activeRoute.safetyScore < 80 ? '8, 8' : undefined
          }}
        />
      </MapContainer>

      {/* Grid Coordinates Overlay */}
      <div className="absolute bottom-2 left-2 z-[400] bg-slate-950/90 backdrop-blur border border-slate-800 px-3 py-1.5 rounded-lg text-[11px] font-mono text-slate-300 flex items-center gap-3">
        <span className="text-cyan-400 font-semibold">GRID: MOLA EQUIDISTANT</span>
        <span>LAT: 18.4447°N</span>
        <span>LNG: 77.4508°E</span>
        <span className="text-emerald-400">ELEV: -2,570m</span>
      </div>
    </div>
  );
};
