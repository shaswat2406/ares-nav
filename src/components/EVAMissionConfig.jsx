import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Settings, Info, AlertTriangle, Play } from 'lucide-react';

const DEFAULT_CONFIG = {
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
};

const TOOLTIPS = {
  crewSize: 'Number of EVA crew members (1–4). NASA typically sends 2 for buddy system safety.',
  walkSpeedKmh: 'Walk speed: "Lunar/Mars surface walk: 1.5–3.5 km/h nominal (Carr & Newman 2008)"',
  missionDurationMin: 'Planned EVA duration in minutes. NASA EMU rated for up to 8 hours (480 min).',
  maxSlopeDeg: 'Maximum safe traverse slope. >15° is generally considered unsafe for suited EVA.',
  o2CapacityL: 'EMU suit PLSS: 862L at 100% purity (NASA-STD-3001)',
  o2ConsumptionLmin: 'Nominal consumption ~0.84 L/min at rest. Up to 1.5 L/min at max exertion.',
  batteryCapacityWh: 'EMU PLSS rechargeable battery: 45,000 Wh (NASA)',
  batteryDrainWh: 'Baseline power draw from EMU systems at nominal operational load.',
  safetyReservePercent: 'Apollo EVA policy: 25% consumables reserve minimum',
  thermalLimitC: 'Minimum operational temperature for EMU suit electronics (-60°C).',
  radiationLimitMsv: 'NASA daily radiation limit per NCRP Report 132. Mars surface ~0.62 mSv/day.',
  returnToBase: 'Route planning will optimize for return path if enabled.',
};

function Tooltip({ text }) {
  const [show, setShow] = useState(false);
  return (
    <span className="relative inline-block ml-1">
      <Info
        className="w-3 h-3 text-cyan-500/60 cursor-help hover:text-cyan-400 transition-colors"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
      />
      {show && (
        <span className="absolute z-50 left-5 -top-1 w-56 bg-slate-900/95 border border-cyan-500/40 rounded-lg p-2.5 text-[10px] text-slate-300 font-sans leading-relaxed shadow-xl">
          {text}
        </span>
      )}
    </span>
  );
}

function FieldRow({ label, unit, tooltipKey, children }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <label className="text-[11px] text-slate-400 font-sans flex items-center whitespace-nowrap">
        {label}
        {tooltipKey && <Tooltip text={TOOLTIPS[tooltipKey]} />}
      </label>
      <div className="flex items-center gap-1.5">
        {children}
        {unit && <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, min, max, step = 1 }) {
  return (
    <input
      type="number"
      value={value}
      onChange={e => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-24 bg-slate-950/80 border border-slate-700 hover:border-cyan-500/50 focus:border-cyan-400 rounded-lg px-2 py-1 text-xs font-mono text-cyan-200 text-right outline-none transition-colors"
    />
  );
}

export const EVAMissionConfig = ({ config = DEFAULT_CONFIG, onChange, onStartMission }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [local, setLocal] = useState({ ...DEFAULT_CONFIG, ...config });
  const [openSection, setOpenSection] = useState(null);

  const set = (key, val) => setLocal(prev => ({ ...prev, [key]: val }));
  const toggle = (section) => setOpenSection(prev => prev === section ? null : section);

  const handleApply = () => {
    if (onChange) onChange(local);
  };

  const SectionHeader = ({ id, label }) => (
    <button
      onClick={() => toggle(id)}
      className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg hover:bg-cyan-950/30 transition-colors text-left cursor-pointer"
    >
      <span className="text-[11px] font-heading font-bold tracking-widest text-cyan-400 uppercase">{label}</span>
      {openSection === id
        ? <ChevronDown className="w-3.5 h-3.5 text-cyan-400" />
        : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
    </button>
  );

  return (
    <div className={`hud-glass hud-corner-tl hud-corner-br rounded-2xl p-4 space-y-3 transition-all duration-300 border ${
      collapsed ? 'border-cyan-500/20' : 'border-cyan-500/40 shadow-[0_0_20px_rgba(0,255,220,0.08)]'
    }`}>
      {/* Header */}
      <div
        className="flex items-center justify-between cursor-pointer select-none"
        onClick={() => setCollapsed(c => !c)}
      >
        <div className="flex items-center gap-2">
          <Settings className="w-4 h-4 text-cyan-400" />
          <span className="font-heading text-xs font-bold tracking-widest text-slate-100 uppercase">
            EVA MISSION CONFIG
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-mono text-slate-500">{collapsed ? 'EXPAND' : 'COLLAPSE'}</span>
          {collapsed
            ? <ChevronRight className="w-4 h-4 text-cyan-400" />
            : <ChevronDown className="w-4 h-4 text-cyan-400" />}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Section 1: Crew & Mobility */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <SectionHeader id="crew" label="§1 // Crew & Mobility" />
            {openSection === 'crew' && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/60 pt-2.5">
                <FieldRow label="Crew Size" tooltipKey="crewSize">
                  <NumberInput value={local.crewSize} onChange={v => set('crewSize', Math.round(v))} min={1} max={4} step={1} />
                  <span className="text-[10px] text-slate-500 font-mono">pax</span>
                </FieldRow>
                <FieldRow label="Walk Speed" tooltipKey="walkSpeedKmh">
                  <NumberInput value={local.walkSpeedKmh} onChange={v => set('walkSpeedKmh', v)} min={1.5} max={5.0} step={0.1} />
                  <span className="text-[10px] text-slate-500 font-mono">km/h</span>
                </FieldRow>
                <FieldRow label="Mission Duration" tooltipKey="missionDurationMin">
                  <NumberInput value={local.missionDurationMin} onChange={v => set('missionDurationMin', v)} min={60} max={720} step={30} />
                  <span className="text-[10px] text-slate-500 font-mono">min</span>
                </FieldRow>
                <FieldRow label="Max Slope" tooltipKey="maxSlopeDeg">
                  <NumberInput value={local.maxSlopeDeg} onChange={v => set('maxSlopeDeg', v)} min={5} max={20} step={1} />
                  <span className="text-[10px] text-slate-500 font-mono">°</span>
                </FieldRow>
              </div>
            )}
          </div>

          {/* Section 2: Life Support */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <SectionHeader id="lifesupport" label="§2 // Life Support" />
            {openSection === 'lifesupport' && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/60 pt-2.5">
                <FieldRow label="O₂ Capacity" tooltipKey="o2CapacityL">
                  <NumberInput value={local.o2CapacityL} onChange={v => set('o2CapacityL', v)} min={500} max={1200} step={10} />
                  <span className="text-[10px] text-slate-500 font-mono">L</span>
                </FieldRow>
                <FieldRow label="O₂ Consumption" tooltipKey="o2ConsumptionLmin">
                  <NumberInput value={local.o2ConsumptionLmin} onChange={v => set('o2ConsumptionLmin', v)} min={0.5} max={2.0} step={0.01} />
                  <span className="text-[10px] text-slate-500 font-mono">L/min</span>
                </FieldRow>
                <FieldRow label="Battery Capacity" tooltipKey="batteryCapacityWh">
                  <NumberInput value={local.batteryCapacityWh} onChange={v => set('batteryCapacityWh', v)} min={10000} max={80000} step={1000} />
                  <span className="text-[10px] text-slate-500 font-mono">Wh</span>
                </FieldRow>
                <FieldRow label="Battery Drain" tooltipKey="batteryDrainWh">
                  <NumberInput value={local.batteryDrainWh} onChange={v => set('batteryDrainWh', v)} min={40} max={200} step={5} />
                  <span className="text-[10px] text-slate-500 font-mono">W</span>
                </FieldRow>
                <FieldRow label="Safety Reserve" tooltipKey="safetyReservePercent">
                  <NumberInput value={local.safetyReservePercent} onChange={v => set('safetyReservePercent', v)} min={10} max={50} step={5} />
                  <span className="text-[10px] text-slate-500 font-mono">%</span>
                </FieldRow>
              </div>
            )}
          </div>

          {/* Section 3: Limits */}
          <div className="border border-slate-800 rounded-xl overflow-hidden">
            <SectionHeader id="limits" label="§3 // Limits" />
            {openSection === 'limits' && (
              <div className="px-3 pb-3 space-y-2.5 border-t border-slate-800/60 pt-2.5">
                <FieldRow label="Thermal Limit" tooltipKey="thermalLimitC">
                  <NumberInput value={local.thermalLimitC} onChange={v => set('thermalLimitC', v)} min={-100} max={-20} step={5} />
                  <span className="text-[10px] text-slate-500 font-mono">°C</span>
                </FieldRow>
                <FieldRow label="Radiation Limit" tooltipKey="radiationLimitMsv">
                  <NumberInput value={local.radiationLimitMsv} onChange={v => set('radiationLimitMsv', v)} min={0.5} max={5.0} step={0.1} />
                  <span className="text-[10px] text-slate-500 font-mono">mSv/day</span>
                </FieldRow>
                <FieldRow label="Return to Base" tooltipKey="returnToBase">
                  <button
                    onClick={() => set('returnToBase', !local.returnToBase)}
                    className={`w-10 h-5 rounded-full border transition-all relative cursor-pointer ${
                      local.returnToBase
                        ? 'bg-cyan-500/30 border-cyan-400'
                        : 'bg-slate-800 border-slate-600'
                    }`}
                  >
                    <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                      local.returnToBase
                        ? 'left-5 bg-cyan-400 shadow-[0_0_6px_#00f0ff]'
                        : 'left-0.5 bg-slate-500'
                    }`} />
                  </button>
                  <span className="text-[10px] font-mono text-slate-400">{local.returnToBase ? 'ON' : 'OFF'}</span>
                </FieldRow>
              </div>
            )}
          </div>

          {/* Disclaimer */}
          <div className="flex items-start gap-2 bg-amber-950/20 border border-amber-500/20 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
            <p className="text-[10px] text-amber-300/80 font-sans leading-relaxed">
              Parameters are user-configured estimates, not NASA-certified operational values.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={handleApply}
              className="flex-1 py-2 rounded-xl bg-cyan-950/40 hover:bg-cyan-900/50 border border-cyan-500/50 hover:border-cyan-400 text-xs font-mono font-bold text-cyan-300 transition-all cursor-pointer"
            >
              APPLY CONFIG
            </button>
            {onStartMission && (
              <button
                onClick={onStartMission}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/50 hover:border-emerald-400 text-xs font-mono font-bold text-emerald-300 transition-all cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                START
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};
