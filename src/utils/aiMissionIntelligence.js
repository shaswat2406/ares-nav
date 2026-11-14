/**
 * ARES-NAV AI Mission Intelligence
 * Deterministic context builder → Gemini LLM for natural language explanations
 * 
 * Design principle: We READ actual loaded data first. The LLM only EXPLAINS the results.
 * We never ask the LLM to fabricate NASA observations or invent safety decisions.
 */

import { GoogleGenerativeAI } from '@google/generative-ai';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

let genAI = null;
let model = null;

function initGemini() {
  if (!API_KEY) throw new Error('VITE_GEMINI_API_KEY not set in environment');
  if (!genAI) {
    genAI = new GoogleGenerativeAI(API_KEY);
    model = genAI.getGenerativeModel({
      model: 'gemini-1.5-flash',
      generationConfig: {
        maxOutputTokens: 600,
        temperature: 0.3,
      },
    });
  }
  return model;
}

/**
 * Build a deterministic context snapshot from current app state.
 * This is what we feed to the LLM as "ground truth" so it can't hallucinate.
 */
export function buildMissionContext({
  routeType,
  activeRoute,
  evaConfig,
  evaElapsedSeconds,
  dustStorm,
  selectedTarget,
  viewMode,
  comparedRoutes,
}) {
  const elapsed = evaElapsedSeconds || 0;
  const elapsedMin = Math.floor(elapsed / 60);
  const o2Used = (evaConfig?.o2ConsumptionLmin || 0.84) * elapsedMin;
  const o2Remaining = (evaConfig?.o2CapacityL || 862) - o2Used;
  const o2Pct = Math.max(0, (o2Remaining / (evaConfig?.o2CapacityL || 862)) * 100).toFixed(1);
  const battUsed = ((evaConfig?.batteryDrainWh || 85) / 60) * elapsedMin;
  const battRemaining = (evaConfig?.batteryCapacityWh || 45000) - battUsed;
  const battPct = Math.max(0, (battRemaining / (evaConfig?.batteryCapacityWh || 45000)) * 100).toFixed(1);

  const route = activeRoute || {};
  const waypoints = route.waypoints || [];
  const routeName = routeType === 'safe' ? 'A* Safe Corridor'
    : routeType === 'science' ? 'Science Optimized'
    : routeType === 'direct' ? 'Direct (High-Risk)'
    : routeType === 'emergency' ? 'Emergency Return'
    : routeType === 'custom' ? 'Custom (Click-to-Place)'
    : routeType;

  const target = selectedTarget || {};

  const ctx = {
    mission: {
      astronaut: 'Shaswat Sinha (ISRO-NASA)',
      team: 'Singular Anomaly',
      hub: 'Surat, India',
      challenge: 'NASA Space Apps 2026 — Interplanetary Survival Guide: Martian Map',
      site: 'Jezero Crater (Octavia E. Butler Landing Site: 18.4447°N, 77.4508°E, −2570 m)',
    },
    environment: {
      dustStorm: dustStorm ? 'ACTIVE — visibility severely reduced, solar power degraded ~40%' : 'CLEAR',
      currentView: viewMode,
    },
    route: {
      algorithm: routeName,
      waypointCount: waypoints.length,
      distanceKm: route.totalDistanceKm?.toFixed(2) ?? '—',
      estimatedTimeMin: route.estimatedTimeMin?.toFixed(0) ?? '—',
      safetyScore: route.safetyScore?.toFixed(1) ?? '—',
      maxSlopeDeg: route.maxSlopeDeg?.toFixed(1) ?? '—',
      hazardCrossings: route.hazardCrossings ?? '—',
    },
    lifeSupport: {
      elapsedMin,
      o2RemainingL: o2Remaining.toFixed(1),
      o2Percent: o2Pct,
      batteryRemainingWh: battRemaining.toFixed(0),
      batteryPercent: battPct,
      crewSize: evaConfig?.crewSize ?? 2,
      walkSpeedKmh: evaConfig?.walkSpeedKmh ?? 3.0,
      missionDurationMin: evaConfig?.missionDurationMin ?? 480,
      safetyReservePercent: evaConfig?.safetyReservePercent ?? 25,
      status: parseFloat(o2Pct) < 25 ? 'CRITICAL' : parseFloat(o2Pct) < 40 ? 'MARGINAL' : 'FEASIBLE',
    },
    scienceTarget: {
      id: target.id ?? '—',
      name: target.name ?? '—',
      priority: target.priority ?? '—',
      domain: target.scienceDomain ?? '—',
      mineral: target.targetMineral ?? '—',
      biosignaturePotential: target.biosignaturePotential ?? '—',
      instrument: target.instrument ?? '—',
      description: target.description ?? '—',
    },
    algorithmsCompared: comparedRoutes
      ? comparedRoutes.map(r => `${r.algorithm}: ${r.distanceKm?.toFixed(2)}km, safety=${r.safetyScore?.toFixed(1)}`).join(' | ')
      : 'Not yet benchmarked — click BENCHMARK to compare 5 algorithms',
  };

  return ctx;
}

const SYSTEM_PROMPT = `You are ARES-AI, the onboard mission intelligence assistant for ARES-NAV, a Martian EVA tactical planner.

RULES (strictly enforced):
1. Only explain what the CONTEXT DATA shows. Never invent NASA observations or scientific values.
2. Never fabricate terrain readings, coordinates, sensor values, or mission metrics not in the context.
3. Keep answers under 150 words — astronaut is in EVA suit and needs brief, clear intel.
4. Use military-style brevity: direct, confident, no filler.
5. Cite the context data when relevant (e.g., "O₂ at 72.3% per life-support calc").
6. If asked something outside the context, say "Insufficient data in current mission context — consult mission control."
7. Scientific integrity: label ARES-NAV model estimates vs. actual NASA measurements.
8. This is a NASA Space Apps 2026 competition project by Shaswat Sinha, Team Singular Anomaly, Surat, India.

You have access to: live route metrics, life-support calculations, terrain analysis, NASA CRISM mineralogy detections, Perseverance rover traverse data, and science target assessments.`;

/**
 * Ask the AI Mission Commander a question about the current mission state.
 * @param {string} userQuestion
 * @param {object} missionContext - output of buildMissionContext()
 * @returns {Promise<string>}
 */
export async function askMissionCommander(userQuestion, missionContext) {
  const mdl = initGemini();

  const contextBlock = `
=== CURRENT MISSION CONTEXT (live data snapshot) ===
${JSON.stringify(missionContext, null, 2)}
=== END CONTEXT ===

ASTRONAUT QUESTION: ${userQuestion}`;

  const chat = mdl.startChat({
    history: [
      {
        role: 'user',
        parts: [{ text: SYSTEM_PROMPT }],
      },
      {
        role: 'model',
        parts: [{ text: 'ARES-AI online. Mission context loaded. Ready to assist astronaut.' }],
      },
    ],
  });

  const result = await chat.sendMessage(contextBlock);
  return result.response.text();
}

/** Suggested questions the user can tap to get started */
export const SUGGESTED_QUESTIONS = [
  'Is my current EVA route safe?',
  'How much O₂ do I have left and when must I return?',
  'What is the most scientifically valuable target nearby?',
  'Should I reroute because of the dust storm?',
  'Which pathfinding algorithm gives the best safety score?',
  'What minerals has CRISM detected in Jezero Crater?',
  'Explain the biosignature potential of my current science target.',
  'What is the radiation status for this EVA?',
  'Give me a full EVA status report.',
  'Compare all five routing algorithms for me.',
];
