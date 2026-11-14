import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Mountain } from 'lucide-react';

export const ElevationProfile = ({ activeRoute }) => {
  // Generate elevation samples along the route path
  const chartData = [
    { dist: '0.0 km', elev: -2570, slope: 2.1, note: 'Hab Alpha' },
    { dist: '0.8 km', elev: -2562, slope: 3.5, note: 'Valley Pass' },
    { dist: '1.6 km', elev: -2540, slope: 4.8, note: 'Séítah Outcrop' },
    { dist: '2.4 km', elev: activeRoute.safetyScore > 80 ? -2515 : -2440, slope: activeRoute.safetyScore > 80 ? 7.2 : 26.2, note: activeRoute.safetyScore > 80 ? 'Delta Ramp' : 'Scarp Cliff (Danger!)' },
    { dist: '3.2 km', elev: -2480, slope: 4.1, note: 'Three Forks' },
    { dist: '3.8 km', elev: -2570, slope: 3.2, note: 'Hab Return' }
  ];

  return (
    <div className="bg-slate-900/90 backdrop-blur border border-slate-800 rounded-xl p-3 shadow-xl space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-300">
          <Mountain className="w-3.5 h-3.5 text-orange-400" />
          <span>MARSWALK ELEVATION CROSS-SECTION</span>
        </div>
        <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1">
          <TrendingUp className="w-3 h-3 text-cyan-400" />
          <span>Max Incline: </span>
          <span className={`font-bold ${activeRoute.maxSlopeDeg > 15 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'}`}>
            {activeRoute.maxSlopeDeg}°
          </span>
        </div>
      </div>

      <div className="h-28 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="elevGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={activeRoute.safetyScore > 80 ? "#10b981" : "#f43f5e"} stopOpacity={0.6}/>
                <stop offset="95%" stopColor={activeRoute.safetyScore > 80 ? "#10b981" : "#f43f5e"} stopOpacity={0.0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="dist" stroke="#64748b" fontSize={10} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={10} domain={[-2600, -2400]} tickLine={false} />
            <Tooltip
              content={({ active, payload }) => {
                if (active && payload && payload.length) {
                  const data = payload[0].payload;
                  return (
                    <div className="bg-slate-950 border border-slate-700 p-2 rounded text-[11px] font-mono shadow-xl">
                      <div className="text-orange-400 font-bold">{data.note} ({data.dist})</div>
                      <div className="text-slate-200">Elevation: {data.elev}m</div>
                      <div className={data.slope > 15 ? "text-rose-400 font-bold" : "text-emerald-400"}>
                        Local Slope: {data.slope}° {data.slope > 15 ? '⚠️ HAZARDOUS' : '✓ SAFE'}
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
              stroke={activeRoute.safetyScore > 80 ? "#10b981" : "#f43f5e"}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#elevGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
