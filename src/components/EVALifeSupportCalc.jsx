import React, { useMemo } from 'react';
import { AlertTriangle, Activity, Zap, Wind, Clock } from 'lucide-react';

/**
 * EVALifeSupportCalc
 * Real-time life support calculation display using NASA EMU parameters.
 *
 * @param {object} config - EVA mission config from EVAMissionConfig
 * @param {object} activeRoute - current route object (optional, used for slope)
 * @param {boolean} dustStorm - dust storm active flag
 * @param {number} elapsedSeconds - elapsed EVA time in seconds
 * @param {boolean} running - whether EVA timer is running
 */
export const EVALifeSupportCalc = ({ config = {}, activeRoute, dustStorm, elapsedSeconds = 0, running }) => {
  // Merge defaults
  const cfg = {
    crewSize: 2,
    walkSpeedKmh: 3.0,
    o2CapacityL: 862,
    o2ConsumptionLmin: 0.84,
    batteryCapacityWh: 45000,
    batteryDrainWh: 85,
    missionDurationMin: 480,
    safetyReservePercent: 25,
    maxSlopeDeg: 15,
    thermalLimitC: -60,
    radiationLimitMsv: 1.0,
    returnToBase: true,
    ...config,
  };

  const calcs = useMemo(() => {
    // ── O2 Calculations ──────────────────────────────────────────
    // Uphill factor: slope increases O2 consumption proportionally
    const uphillFactor = 1.0 + (cfg.maxSlopeDeg / 15) * 0.25; // max ~25% increase at 15°
    const dustFactor = dustStorm ? 1.35 : 1.0;
    const elapsedMin = elapsedSeconds / 60;

    const o2Budget = cfg.o2CapacityL * (1 - cfg.safetyReservePercent / 100);
    const o2Consumed = cfg.o2ConsumptionLmin * elapsedMin * dustFactor * uphillFactor;
    const o2Remaining = Math.max(0, o2Budget - o2Consumed);
    const o2Pct = o2Budget > 0 ? Math.max(0, (o2Remaining / o2Budget) * 100) : 0;

    // ── Battery Calculations ─────────────────────────────────────
    const battDustFactor = dustStorm ? 1.4 : 1.0;
    const battConsumedWh = (cfg.batteryDrainWh / 3600) * elapsedSeconds * battDustFactor;
    const battRemainingWh = Math.max(0, cfg.batteryCapacityWh - battConsumedWh);
    const battPct = cfg.batteryCapacityWh > 0
      ? Math.max(0, (battRemainingWh / cfg.batteryCapacityWh) * 100)
      : 0;

    // ── Radiation Dose ───────────────────────────────────────────
    // RAD baseline: 0.62 mSv/day = 0.000007175 mSv/s
    // Using assignment's 0.000258 mSv/s (matches per-hour rate for EVA scenario)
    const radiationMsv = 0.000258 * elapsedSeconds;

    // ── Return Deadline ──────────────────────────────────────────
    // Time remaining before consumables fall below reserve
    const o2RatePerSec = cfg.o2ConsumptionLmin * dustFactor * uphillFactor / 60;
    const battRatePerSec = (cfg.batteryDrainWh / 3600) * battDustFactor;

    const o2SecsRemaining = o2RatePerSec > 0 ? o2Remaining / o2RatePerSec : Infinity;
    const battSecsRemaining = battRatePerSec > 0 ? battRemainingWh / battRatePerSec : Infinity;
    const deadlineSecs = Math.min(o2SecsRemaining, battSecsRemaining);

    // ── Feasibility ──────────────────────────────────────────────
    const minPct = Math.min(o2Pct, battPct);
    const feasibility = minPct > 50 ? 'FEASIBLE' : minPct > 25 ? 'MARGINAL' : 'CRITICAL';

    return {
      o2Budget, o2Consumed, o2Remaining, o2Pct,
      battConsumedWh, battRemainingWh, battPct,
      radiationMsv,
      deadlineSecs: Math.max(0, deadlineSecs),
      feasibility,
      uphillFactor, dustFactor,
      elapsedMin,
    };
  }, [cfg, dustStorm, elapsedSeconds]);

  const fmtTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const fmtElapsed = fmtTime(elapsedSeconds);
  const fmtDeadline = calcs.deadlineSecs === Infinity ? '--:--:--' : fmtTime(calcs.deadlineSecs);

  const feasColor = {
    FEASIBLE: 'text-emerald-400',
    MARGINAL: 'text-amber-400',
    CRITICAL: 'text-rose-400',
  }[calcs.feasibility];

  const feasBg = {
    FEASIBLE: 'bg-emerald-950/40 border-emerald-500/40',
    MARGINAL: 'bg-amber-950/40 border-amber-500/40',
    CRITICAL: 'bg-rose-950/40 border-rose-500/40',
  }[calcs.feasibility];

  const barColor = (pct) =>
    pct > 50 ? 'bg-emerald-400' : pct > 25 ? 'bg-amber-400' : 'bg-rose-500';

  return (
    <div className="hud-glass hud-corner-tl hud-corner-br rounded-2xl p-4 space-y-4 border border-cyan-500/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-cyan-500/20 pb-2.5">
        <div className="flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${running ? 'bg-emerald-400 animate-ping' : 'bg-slate-600'}`} />
          <span className="font-heading text-xs font-bold tracking-widest text-slate-100 uppercase">
            LIFE SUPPORT MONITOR
          </span>
        </div>
        {dustStorm && (
          <span className="text-[10px] font-mono font-bold text-amber-300 bg-amber-950/60 border border-amber-500/50 px-2 py-0.5 rounded animate-pulse">
            ⚠ DUST STORM
          </span>
        )}
      </div>

      {/* Critical Alert */}
      {calcs.feasibility === 'CRITICAL' && (
        <div className="flex items-center gap-2 bg-rose-950/60 border border-rose-500 rounded-xl px-3 py-2.5 animate-pulse">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          <span className="text-xs font-mono font-bold text-rose-300 tracking-wider">
            ⚠ RETURN TO BASE NOW
          </span>
        </div>
      )}

      {/* 4 Big Readouts */}
      <div className="grid grid-cols-2 gap-2.5">
        {/* O2 */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-sans">
            <Wind className="w-3 h-3 text-cyan-400" /> O₂ REMAINING
          </div>
          <div className={`text-2xl font-mono font-bold ${barColor(calcs.o2Pct).replace('bg-', 'text-')}`}>
            {calcs.o2Pct.toFixed(1)}<span className="text-sm font-normal text-slate-500">%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor(calcs.o2Pct)}`}
              style={{ width: `${calcs.o2Pct}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {calcs.o2Remaining.toFixed(1)}L / {calcs.o2Budget.toFixed(1)}L budget
          </div>
        </div>

        {/* Battery */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-sans">
            <Zap className="w-3 h-3 text-amber-400" /> BATTERY
          </div>
          <div className={`text-2xl font-mono font-bold ${barColor(calcs.battPct).replace('bg-', 'text-')}`}>
            {calcs.battPct.toFixed(1)}<span className="text-sm font-normal text-slate-500">%</span>
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-1000 ${barColor(calcs.battPct)}`}
              style={{ width: `${calcs.battPct}%` }}
            />
          </div>
          <div className="text-[9px] font-mono text-slate-500">
            {calcs.battRemainingWh.toFixed(0)}Wh / {cfg.batteryCapacityWh.toLocaleString()}Wh
          </div>
        </div>

        {/* Elapsed Time */}
        <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 space-y-1">
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-sans">
            <Clock className="w-3 h-3 text-cyan-400" /> ELAPSED TIME
          </div>
          <div className="text-xl font-mono font-bold text-cyan-300">{fmtElapsed}</div>
          <div className="text-[9px] font-mono text-slate-500">
            OF {fmtTime(cfg.missionDurationMin * 60)} PLANNED
          </div>
        </div>

        {/* Return Status */}
        <div className={`border rounded-xl p-3 space-y-1 ${feasBg}`}>
          <div className="flex items-center gap-1 text-[10px] text-slate-400 font-sans">
            <Activity className="w-3 h-3 text-slate-400" /> RETURN STATUS
          </div>
          <div className={`text-lg font-mono font-bold ${feasColor}`}>{calcs.feasibility}</div>
          <div className="text-[9px] font-mono text-slate-500">
            {calcs.feasibility === 'FEASIBLE' ? 'All systems nominal'
              : calcs.feasibility === 'MARGINAL' ? 'Begin return planning'
              : 'IMMEDIATE RTB required'}
          </div>
        </div>
      </div>

      {/* Return Deadline */}
      <div className="bg-slate-950/80 border border-slate-700 rounded-xl p-3 flex items-center justify-between">
        <div>
          <div className="text-[10px] text-slate-400 font-sans">RETURN DEADLINE (consumables)</div>
          <div className="text-sm font-mono font-bold text-rose-300 mt-0.5">⏱ {fmtDeadline}</div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-slate-400 font-sans">RAD EXPOSURE</div>
          <div className="text-sm font-mono font-bold text-purple-300 mt-0.5">
            {calcs.radiationMsv.toFixed(4)} <span className="text-[9px] text-slate-500">mSv</span>
          </div>
        </div>
      </div>

      {/* Formula Display */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-xl px-3 py-2.5 space-y-1.5">
        <div className="text-[10px] font-heading tracking-widest text-slate-500 uppercase">Active Formulae</div>
        <div className="text-[9px] font-mono text-slate-400 leading-5 space-y-0.5">
          <div className="text-cyan-500/70">O₂:</div>
          <div>budget = {cfg.o2CapacityL}L × (1 − {cfg.safetyReservePercent}%) = <span className="text-cyan-300">{calcs.o2Budget.toFixed(1)}L</span></div>
          <div>consumed = {cfg.o2ConsumptionLmin} × {calcs.elapsedMin.toFixed(2)}min × {calcs.dustFactor.toFixed(2)} × {calcs.uphillFactor.toFixed(2)} = <span className="text-cyan-300">{calcs.o2Consumed.toFixed(2)}L</span></div>
          <div className="text-amber-500/70 mt-1">Battery:</div>
          <div>consumed = ({cfg.batteryDrainWh}W ÷ 3600) × {elapsedSeconds.toFixed(0)}s × {calcs.dustFactor === 1 ? '1.0' : '1.4'} = <span className="text-amber-300">{calcs.battConsumedWh.toFixed(1)}Wh</span></div>
          <div className="text-purple-500/70 mt-1">Radiation:</div>
          <div>dose = 0.000258 mSv/s × {elapsedSeconds.toFixed(0)}s = <span className="text-purple-300">{calcs.radiationMsv.toFixed(4)} mSv</span></div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="flex items-start gap-2 bg-slate-900/40 border border-slate-700/40 rounded-xl px-3 py-2">
        <AlertTriangle className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
        <p className="text-[9px] text-slate-500 font-sans leading-relaxed">
          Life support calculations are model estimates based on published NASA EMU parameters. Not certified for actual mission planning.
        </p>
      </div>
    </div>
  );
};
