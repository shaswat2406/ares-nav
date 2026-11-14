import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Shield, Zap, Compass, CheckCircle2, AlertTriangle, X } from 'lucide-react';

const ALGO_META = {
  direct: {
    label: 'DIRECT',
    badgeClass: 'bg-rose-950/80 text-rose-300 border-rose-500/50',
    color: '#f43f5e',
    desc: 'Euclidean straight line — ignores terrain slope and hazard zones'
  },
  dijkstra: {
    label: 'DIJKSTRA',
    badgeClass: 'bg-blue-950/80 text-blue-300 border-blue-500/50',
    color: '#3b82f6',
    desc: 'Uniform-cost breadth exploration without directional heuristic guidance'
  },
  astar_distance: {
    label: 'A* DIST',
    badgeClass: 'bg-cyan-950/80 text-cyan-300 border-cyan-500/50',
    color: '#06b6d4',
    desc: 'Euclidean distance heuristic with minimal terrain slope weighting'
  },
  astar_safety: {
    label: 'A* SAFETY',
    badgeClass: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50',
    color: '#10b981',
    desc: 'Slope gradient penalty + dune hazard avoidance + comms shadow bypass'
  },
  astar_science: {
    label: 'A* SCI',
    badgeClass: 'bg-purple-950/80 text-purple-300 border-purple-500/50',
    color: '#a855f7',
    desc: 'Safety-constrained path diverted toward high-value CRISM mineral targets'
  }
};

export function RouteComparison({ routes, activeAlgorithm, onSelectAlgorithm, onClose }) {
  if (!routes || routes.length === 0) return null;

  const chartData = routes.map((r) => ({
    name: ALGO_META[r.algorithm]?.label || r.algorithm,
    safety: r.safetyScore || 0,
    distance: r.distanceKm || 0,
    time: r.estimatedMinutes || 0,
    color: ALGO_META[r.algorithm]?.color || '#38bdf8'
  }));

  return (
    <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl p-4 border-cyan-500/40 shadow-2xl backdrop-blur-xl text-slate-200 font-mono max-h-[85vh] overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="font-heading font-extrabold text-sm tracking-wider text-cyan-300 uppercase">
            PATHFINDING BENCHMARK // 5 ALGORITHMS
          </h2>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <p className="text-[11px] text-slate-400 mb-3">
        Mathematical comparison across slope gradients, energy costs, and Jezero Crater hazard zones.
      </p>

      {/* Safety Score Bar Chart */}
      <div className="h-32 w-full bg-slate-950/60 rounded-xl p-2 border border-slate-800/80 mb-3">
        <span className="text-[10px] text-slate-400 font-bold block mb-1">SAFETY SCORE COMPARISON (%)</span>
        <ResponsiveContainer width="100%" height="80%">
          <BarChart data={chartData} margin={{ top: 0, right: 10, left: -25, bottom: 0 }}>
            <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
            <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: '#090d16', borderColor: '#38bdf8', borderRadius: '8px', fontSize: '11px' }}
              formatter={(val) => [`${val}%`, 'Safety']}
            />
            <Bar dataKey="safety" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Comparison Table */}
      <div className="space-y-2">
        {routes.map((route) => {
          const meta = ALGO_META[route.algorithm] || {
            label: route.algorithm,
            badgeClass: 'bg-slate-800 text-slate-300 border-slate-700',
            color: '#38bdf8',
            desc: route.name
          };
          const isSelected = activeAlgorithm === route.algorithm;

          return (
            <div
              key={route.algorithm}
              className={`p-2.5 rounded-xl border transition-all text-xs ${
                isSelected
                  ? 'bg-cyan-950/60 border-cyan-400 shadow-[0_0_15px_rgba(0,240,255,0.3)]'
                  : 'bg-slate-950/80 border-slate-800 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${meta.badgeClass}`}>
                    {meta.label}
                  </span>
                  <span className="font-heading font-bold text-slate-200 text-xs">
                    {route.name}
                  </span>
                </div>
                <button
                  onClick={() => onSelectAlgorithm(route)}
                  className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-400 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.5)]'
                      : 'bg-slate-800 hover:bg-slate-700 text-cyan-300'
                  }`}
                >
                  {isSelected ? 'SELECTED' : 'SELECT'}
                </button>
              </div>

              <p className="text-[10px] text-slate-400 mb-2">{meta.desc}</p>

              <div className="grid grid-cols-4 gap-1.5 text-[10px] bg-slate-900/90 p-1.5 rounded-lg border border-slate-800/80 text-center">
                <div>
                  <span className="text-slate-500 block">DIST</span>
                  <span className="text-cyan-300 font-bold">{route.distanceKm} km</span>
                </div>
                <div>
                  <span className="text-slate-500 block">TIME</span>
                  <span className="text-amber-300 font-bold">{route.estimatedMinutes} min</span>
                </div>
                <div>
                  <span className="text-slate-500 block">MAX SLOPE</span>
                  <span className={`font-bold ${route.maxSlopeDeg > 15 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {route.maxSlopeDeg}°
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">SAFETY</span>
                  <span className={`font-bold ${route.safetyScore > 80 ? 'text-emerald-400' : route.safetyScore > 50 ? 'text-amber-400' : 'text-rose-400'}`}>
                    {route.safetyScore}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-3 pt-2 border-t border-cyan-500/20 text-[10px] text-slate-500 flex items-center justify-between">
        <span>8-directional path grid // 100m cell resolution</span>
        <span className="text-cyan-400">Heuristic: Admissible Euclidean</span>
      </div>
    </div>
  );
}
