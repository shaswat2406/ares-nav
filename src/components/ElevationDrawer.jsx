import React, { useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Activity, ChevronUp, ChevronDown, Mountain } from 'lucide-react';
import { sfx } from '../utils/soundFX';

export const ElevationDrawer = ({ activeRoute }) => {
  const [isOpen, setIsOpen] = useState(false);

  const chartData = activeRoute.elevationProfile && activeRoute.elevationProfile.length > 0 
    ? activeRoute.elevationProfile 
    : [
        { dist: '0.0 km', elev: -2570, slope: 2.1, note: 'Hab Alpha' },
        { dist: '0.8 km', elev: -2562, slope: 3.5, note: 'Valley Pass' },
        { dist: '1.6 km', elev: -2540, slope: 4.8, note: 'Séítah Outcrop' },
        { dist: '2.4 km', elev: activeRoute.safetyScore > 80 ? -2515 : -2440, slope: activeRoute.safetyScore > 80 ? 7.2 : 26.2, note: activeRoute.safetyScore > 80 ? 'Delta Ramp' : 'Scarp Cliff (Danger!)' },
        { dist: '3.2 km', elev: -2480, slope: 4.1, note: 'Three Forks' },
        { dist: `${activeRoute.distanceKm} km`, elev: -2570, slope: 3.2, note: 'Hab Return' }
      ];

  const isSafe = activeRoute.safetyScore > 80;

  const toggleOpen = () => {
    sfx.click();
    setIsOpen(!isOpen);
  };

  return (
    <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-30 w-full max-w-2xl px-4 pointer-events-auto transition-all duration-300">
      <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl shadow-2xl overflow-hidden border border-cyan-500/30">
        {/* Collapsible Header Drawer Button */}
        <button
          onClick={toggleOpen}
          className="w-full px-4 py-2.5 flex items-center justify-between text-xs font-mono font-bold text-cyan-300 bg-[#040816]/90 hover:bg-[#060d24] transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            <span className="font-heading tracking-widest text-slate-100 uppercase">
              ELEVATION PROFILE &amp; SLOPE GRADIENT
            </span>
            <span className={`px-2 py-0.5 rounded text-[10px] ml-2 ${
              isSafe ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' : 'bg-rose-950 text-rose-400 border border-rose-500/40'
            }`}>
              MAX INCLINE: {activeRoute.maxSlopeDeg}° {isSafe ? '✓ NOMINAL' : '⚠️ HAZARDOUS'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-slate-400 hover:text-white">
            <span className="text-[10px]">{isOpen ? 'COLLAPSE' : 'EXPAND CHART'}</span>
            {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronUp className="w-4 h-4" />}
          </div>
        </button>

        {/* Collapsible Body */}
        {isOpen && (
          <div className="p-4 space-y-2 bg-[#020510]/95 border-t border-cyan-500/20 animate-in fade-in">
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={isSafe ? "#00ff88" : "#ff3344"} stopOpacity={0.6}/>
                      <stop offset="95%" stopColor={isSafe ? "#00ff88" : "#ff3344"} stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="dist" stroke="#475569" fontSize={10} tickLine={false} />
                  <YAxis stroke="#475569" fontSize={10} domain={['dataMin - 15', 'dataMax + 15']} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-950/95 border border-cyan-500/40 p-2 rounded text-[10px] font-mono shadow-2xl backdrop-blur">
                            <div className="text-cyan-400 font-bold">{data.note} ({data.dist})</div>
                            <div className="text-slate-200 mt-0.5">Altitude: {data.elev}m MOLA Datum</div>
                            <div className={data.slope > 15 ? "text-rose-400 font-bold mt-0.5" : "text-emerald-400 font-bold mt-0.5"}>
                              Local Pitch: {data.slope}° {data.slope > 15 ? '⚠️ ROLLOVER HAZARD' : '✓ TRAVERSABLE'}
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="elev"
                    stroke={isSafe ? "#00ff88" : "#ff3344"}
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#elevGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800">
              <span>DATUM: MOLA AREOID 0-DATUM</span>
              <span>SUIT THRESHOLD: 15.0° LIMIT</span>
              <span>100M DEM RASTER RESOLUTION</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
