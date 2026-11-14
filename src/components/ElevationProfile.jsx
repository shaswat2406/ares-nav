import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Mountain, Activity, ShieldCheck } from 'lucide-react';

export const ElevationProfile = ({ activeRoute }) => {
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

  return (
    <div className="hud-panel hud-corner-tl hud-corner-br rounded-xl p-3.5 space-y-2 border-cyan-500/30">
      {/* Tactical Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <span className="font-heading text-xs font-bold tracking-widest text-cyan-300">
            ELEVATION GRADIENT &amp; SLAPE ANGLE // PROFILE
          </span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="text-slate-400">MAX INCLINE:</span>
          <span className={`font-bold px-2 py-0.5 rounded ${
            isSafe 
              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-500/40 hud-glow-green' 
              : 'bg-rose-950/80 text-rose-400 border border-rose-500/40 animate-pulse'
          }`}>
            {activeRoute.maxSlopeDeg}° {isSafe ? '✓ TRAVERSABLE' : '⚠️ CRITICAL TILT'}
          </span>
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isSafe ? "#00ff88" : "#ff3344"} stopOpacity={0.5}/>
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
                    <div className="bg-slate-950/95 border border-cyan-500/40 p-2.5 rounded-lg text-[11px] font-mono shadow-2xl backdrop-blur">
                      <div className="text-cyan-400 font-bold tracking-wider">{data.note} ({data.dist})</div>
                      <div className="text-slate-200 mt-0.5">Altitude: {data.elev}m MOLA Datum</div>
                      <div className={data.slope > 15 ? "text-rose-400 font-bold mt-0.5" : "text-emerald-400 font-bold mt-0.5"}>
                        Local Pitch: {data.slope}° {data.slope > 15 ? '⚠️ ROLLOVER HAZARD' : '✓ NOMINAL'}
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
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#elevGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-slate-800/60">
        <span>DATUM: MOLA AREOID 0-ELEVATION</span>
        <span>SUIT TRACTION THRESHOLD: 15.0° LIMIT</span>
        <span>RESOLUTION: 100M DEM SAMPLING</span>
      </div>
    </div>
  );
};
