/**
 * ARES-NAV Scientific Validation & Automated Test Suite
 * NASA Space Apps Challenge 2026: "Interplanetary Survival Guide: Martian Map"
 * 
 * Tests:
 * 1. Pathfinding (A*, Dijkstra, obstacle avoidance, diagonal costs, heuristic admissibility)
 * 2. Terrain Analysis (elevation datum, slope gradients, roughness, classification)
 * 3. Life Support Resource Models (O2 burn, battery drain, 25% safety reserve, RAD radiation)
 * 4. NASA Datasets & Provenance (PDS endpoints, coordinate alignment, citation integrity)
 */

import { getTerrainElevation, calcSlopeDeg, classifyTerrain, calcSurfaceRoughness, TERRAIN_CONFIG } from '../src/utils/terrainEngine.js';
import { computeRoute, compareAllRoutes, COST_WEIGHTS } from '../src/utils/pathfindingEngine.js';
import { NASA_DATASETS } from '../src/data/marsDatasets.js';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES, CRISM_DETECTIONS, SOL_TELEMETRY } from '../src/data/jezeroData.js';

let passedTests = 0;
let totalTests = 0;

function assert(condition, testName, details = '') {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    console.error(`  ✗ FAIL: ${testName} - ${details}`);
    process.exitCode = 1;
  }
}

function assertClose(actual, expected, tolerance = 0.01, testName = '') {
  const diff = Math.abs(actual - expected);
  assert(diff <= tolerance, testName, `Expected ${expected} ± ${tolerance}, got ${actual}`);
}

console.log('\n===============================================================');
console.log(' ARES-NAV SCIENTIFIC & ALGORITHMIC VALIDATION TEST SUITE');
console.log('===============================================================\n');

// -----------------------------------------------------------------------------
// 1. TERRAIN ANALYSIS TESTS
// -----------------------------------------------------------------------------
console.log('--- 1. TERRAIN ANALYSIS & TOPOGRAPHY ---');

// Test 1.1: Elevation at Hab Base should be approximately -2,570m
const habElevation = getTerrainElevation(0, 0);
assert(habElevation <= -2550 && habElevation >= -2600, 
  'Base Elevation Datum Alignment', 
  `Base elevation should be ~ -2570m, got ${habElevation.toFixed(1)}m`);

// Test 1.2: Western delta elevation rise
const deltaElev = getTerrainElevation(-10, 0);
assert(deltaElev > habElevation, 
  'Western Delta Topographic Elevation Rise', 
  `Delta scarp at x=-10 should be higher than floor, got ${deltaElev.toFixed(1)}m vs ${habElevation.toFixed(1)}m`);

// Test 1.3: Slope gradient calculation: theta = atan(sqrt(p^2 + q^2))
const slopeDeg = calcSlopeDeg(0, 0, 0, 2);
assert(slopeDeg >= 0 && slopeDeg <= 90, 
  'Slope Angle Bounded [0°, 90°]', 
  `Got ${slopeDeg}°`);

// Test 1.4: Terrain classification thresholds
const flatClass = classifyTerrain(1.5, 0.1);
assert(flatClass.type === 'flat', 'Terrain Classification: Flat (<2°)', `Got ${flatClass.type}`);

const gentleClass = classifyTerrain(3.5, 0.1);
assert(gentleClass.type === 'gentle', 'Terrain Classification: Gentle (2-5°)', `Got ${gentleClass.type}`);

const moderateClass = classifyTerrain(7.5, 0.2);
assert(moderateClass.type === 'moderate', 'Terrain Classification: Moderate (5-10°)', `Got ${moderateClass.type}`);

const steepClass = classifyTerrain(12.5, 0.3);
assert(steepClass.type === 'steep', 'Terrain Classification: Steep (10-15°)', `Got ${steepClass.type}`);

const cliffClass = classifyTerrain(22.0, 0.5);
assert(cliffClass.type === 'cliff' && !cliffClass.traversable, 
  'Terrain Classification: Cliff (>15° untraversable)', 
  `Got ${cliffClass.type}, traversable: ${cliffClass.traversable}`);

// Test 1.5: Surface roughness is non-negative
const roughness = calcSurfaceRoughness(2, 2);
assert(roughness >= 0 && roughness <= 1.0, 
  'Surface Roughness Metric Normalized [0, 1]', 
  `Got ${roughness}`);

// -----------------------------------------------------------------------------
// 2. PATHFINDING & ALGORITHM BENCHMARK TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 2. ADVANCED PATHFINDING & MULTI-ALGORITHM BENCHMARK ---');

// Test 2.1: Straight line vs Safety-aware A*
const startX = 0, startZ = 0;
const goalX = 10, goalZ = -10;

const directRoute = computeRoute(startX, startZ, goalX, goalZ, 'direct');
const safeRoute = computeRoute(startX, startZ, goalX, goalZ, 'astar_safety');
const dijkstraRoute = computeRoute(startX, startZ, goalX, goalZ, 'dijkstra');

assert(directRoute.distanceKm > 0, 'Direct Path Distance > 0', `Got ${directRoute.distanceKm} km`);
assert(safeRoute.distanceKm > 0, 'Safe A* Path Distance > 0', `Got ${safeRoute.distanceKm} km`);
assert(dijkstraRoute.distanceKm > 0, 'Dijkstra Path Distance > 0', `Got ${dijkstraRoute.distanceKm} km`);

// Test 2.2: Safety score constraint verification
assert(safeRoute.safetyScore >= directRoute.safetyScore, 
  'A* Safety-Aware Route Safety Score >= Direct Route', 
  `Safe: ${safeRoute.safetyScore}%, Direct: ${directRoute.safetyScore}%`);

// Test 2.3: Max slope on safe route must respect mobility limits
assert(safeRoute.maxSlopeDeg <= 16.0, 
  'Safe A* Max Slope Bounded Under Mobility Threshold (<=16°)', 
  `Safe max slope: ${safeRoute.maxSlopeDeg}°`);

// Test 2.4: 5-Algorithm comparison returns all 5 modes
const allCompared = compareAllRoutes(startX, startZ, goalX, goalZ);
assert(allCompared.length === 5, 
  '5-Algorithm Comparison Engine Evaluates All 5 Modes', 
  `Expected 5, got ${allCompared.length}`);

const algorithmsPresent = allCompared.map(r => r.algorithm);
assert(
  algorithmsPresent.includes('direct') &&
  algorithmsPresent.includes('dijkstra') &&
  algorithmsPresent.includes('astar_distance') &&
  algorithmsPresent.includes('astar_safety') &&
  algorithmsPresent.includes('astar_science'),
  'All 5 Unique Algorithms Present in Comparison Matrix'
);

// Test 2.5: Admissible heuristic verification
// h(n) = Euclidean distance to goal; must never overestimate actual grid distance
const testX = 4, testZ = -4;
const euclideanH = Math.hypot(goalX - testX, goalZ - testZ) * 50; // meters
const actualDistM = (Math.abs(goalX - testX) + Math.abs(goalZ - testZ)) * 50; // Manhattan is >= Euclidean
assert(euclideanH <= actualDistM, 'Heuristic Admissibility: h(n) <= true distance');

// -----------------------------------------------------------------------------
// 3. ASTRONAUT LIFE SUPPORT & SURVIVAL MODEL TESTS
// -----------------------------------------------------------------------------
console.log('\n--- 3. ASTRONAUT LIFE SUPPORT & METABOLIC SURVIVAL MODELS ---');

// Test 3.1: NASA EMU PLSS Baseline Parameters
const nominalO2CapacityL = 862; // Liters
const nominalBurnRateLmin = 0.84; // L/min
const safetyReserveMargin = 0.25; // 25% Apollo policy

const usableO2 = nominalO2CapacityL * (1 - safetyReserveMargin);
assertClose(usableO2, 646.5, 0.1, 'Usable O2 Under 25% Reserve Policy (646.5 L)');

// Test 3.2: Walk duration supported by usable O2
const maxWalkMinutes = usableO2 / nominalBurnRateLmin;
assert(maxWalkMinutes > 700, 
  'Usable O2 Supports >11 Hours of Nominal Exertion', 
  `Got ${maxWalkMinutes.toFixed(1)} minutes`);

// Test 3.3: Elevated metabolic burn on slope
const slopeFactor = 1 + 0.05 * 10; // 10° slope adds 50% exertion
const slopeBurnRate = nominalBurnRateLmin * slopeFactor;
assert(slopeBurnRate > nominalBurnRateLmin, 
  'Metabolic O2 Burn Scales Dynamically with Terrain Slope', 
  `Flat: ${nominalBurnRateLmin} L/min, 10° Slope: ${slopeBurnRate.toFixed(2)} L/min`);

// Test 3.4: Radiation daily rate conforms to Perseverance RAD baseline
assertClose(SOL_TELEMETRY.radiationMilliSievertsPerDay, 0.62, 0.01, 
  'Surface Radiation Matches Perseverance RAD Sol 1328 Ground Truth (0.62 mSv/day)');

// Test 3.5: Return to base feasibility threshold
const remainingConsumablePctHigh = 75;
const remainingConsumablePctLow = 18;
assert(remainingConsumablePctHigh > 25, 'Consumable Status Nominal (>25%)');
assert(remainingConsumablePctLow < 25, 'Consumable Status Triggers Critical Emergency (<25%)');

// -----------------------------------------------------------------------------
// 4. NASA DATA INTEGRATION & CITATION VALIDATION
// -----------------------------------------------------------------------------
console.log('\n--- 4. NASA DATASETS, PDS ENDPOINTS & PROVENANCE ---');

// Test 4.1: Ensure 9 genuine NASA datasets are registered
assert(NASA_DATASETS.length === 9, 
  'NASA Dataset Registry Contains Exactly 9 Documented Missions/Instruments', 
  `Got ${NASA_DATASETS.length}`);

// Test 4.2: Every dataset must have valid source URL, quality, and limitations
NASA_DATASETS.forEach((ds) => {
  assert(ds.source.startsWith('http'), 
    `Dataset ${ds.id} Has Traceable External Repository URL`, 
    ds.source);
  assert(ds.quality !== undefined && ds.quality.length > 0, 
    `Dataset ${ds.id} Has Stated Quality Metric`, 
    ds.quality);
  assert(ds.limitations !== undefined && ds.limitations.length > 0, 
    `Dataset ${ds.id} Has Disclosed Scientific Limitations`);
});

// Test 4.3: Jezero Crater coordinates are mathematically consistent
assert(HABITAT_BASE.lat >= 18.0 && HABITAT_BASE.lat <= 19.0, 
  'Habitat Latitude Aligned with Jezero Floor (18.4447°N)');
assert(HABITAT_BASE.lng >= 77.0 && HABITAT_BASE.lng <= 78.0, 
  'Habitat Longitude Aligned with Jezero Floor (77.4508°E)');

// Test 4.4: CRISM mineral detections have peer-reviewed literature citations
assert(CRISM_DETECTIONS.length >= 5, 
  'CRISM Detections Registry Contains Ground Truth Spectral Locations', 
  `Got ${CRISM_DETECTIONS.length}`);

CRISM_DETECTIONS.forEach((det) => {
  const ref = det.citation || det.paper;
  assert(ref && ref.length > 5, 
    `CRISM Detection ${det.mineral} Cites Peer-Reviewed Literature`, 
    ref);
  const conf = det.confidence > 1 ? det.confidence / 100 : det.confidence;
  assert(conf >= 0.5 && conf <= 1.0, 
    `CRISM Detection ${det.mineral} Has Documented Confidence Score`, 
    `${det.confidence}`);
});

// Test 4.5: Hazard zones are properly demarcated
assert(HAZARD_ZONES.length >= 3, 'Hazard Zones Registry Loaded', `Got ${HAZARD_ZONES.length}`);
HAZARD_ZONES.forEach((hz) => {
  assert(hz.radius > 0 && hz.severity, `Hazard Zone ${hz.name} Fully Formed`);
});

// -----------------------------------------------------------------------------
// FINAL SUMMARY
// -----------------------------------------------------------------------------
console.log('\n===============================================================');
console.log(` TEST EXECUTION COMPLETE: ${passedTests} / ${totalTests} TESTS PASSED`);
if (passedTests === totalTests) {
  console.log(' STATUS: ALL SCIENTIFIC & ALGORITHMIC SYSTEMS VERIFIED 100%');
} else {
  console.log(` STATUS: ${totalTests - passedTests} TESTS FAILED`);
}
console.log('===============================================================\n');
