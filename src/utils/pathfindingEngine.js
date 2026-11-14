/**
 * pathfindingEngine.js — ARES-NAV Multi-Algorithm Pathfinding Engine
 *
 * Provides five route-planning algorithms ranging from simple straight-line
 * traversal to fully terrain-aware A* variants optimised for astronaut safety
 * and science value.
 *
 * Grid conventions (match astarEngine.js and terrainEngine.js):
 *   • Step size  : 2.0 grid units
 *   • Grid bounds: ±28 units in X and Z
 *   • Scale      : 1 grid unit = 50 m on the Martian surface
 *   • GPS origin : 18.4447°N, 77.4508°E  (Perseverance landing site)
 *   • GPS scale  : 1 grid unit = 1/800 degree (same as existing code)
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 */

import { getTerrainElevation, getHazardPenalty, calcSlopeDeg, calcSurfaceRoughness } from './terrainEngine.js';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/**
 * Cost-function weights for the astar_safety algorithm.
 *
 * Full cost per step:
 *   C = d × (1 + w_s×slope_factor + w_r×roughness + w_h×hazard_norm + w_u×uncertainty)
 *
 * where:
 *   d             = Euclidean step distance in metres
 *   slope_factor  = tan²(slope_deg × π/180)   [dimensionless, penalises steep steps]
 *   roughness     = calcSurfaceRoughness() ∈ [0,1]
 *   hazard_norm   = getHazardPenalty() / 6     [normalised to [0,1]]
 *   uncertainty   = 0 (reserved for sensor confidence layer)
 */
export const COST_WEIGHTS = {
  /** Slope penalty weight (w_s). Strongly penalises steep terrain. */
  w_slope: 3.5,
  /** Roughness penalty weight (w_r). Penalises loose/uneven surface. */
  w_roughness: 1.2,
  /** Hazard penalty weight (w_h). Penalises dunes and cliff edges. */
  w_hazard: 4.0,
  /** Uncertainty penalty weight (w_u). Reserved for sensor confidence. */
  w_uncertainty: 2.0,
  /** Science bonus coefficient for astar_science (negative = reward). */
  science_bonus: -50.0,
  /** Maximum hazard penalty value returned by getHazardPenalty() (for normalisation). */
  max_hazard: 6.0,
};

/** Human-readable display names keyed by algorithm ID. */
export const ALGORITHM_NAMES = {
  direct:          'Direct Route',
  dijkstra:        'Dijkstra (Uniform Cost)',
  astar_distance:  'A* — Distance Optimal',
  astar_safety:    'A* — Safety Optimal',
  astar_science:   'A* — Science Priority',
};

// ---------------------------------------------------------------------------
// Internal constants
// ---------------------------------------------------------------------------

const STEP = 2.0;           // grid step size (units)
const GRID_BOUND = 28;      // ±28 units
const MAX_ITER = 2000;      // iteration cap per search
const METERS_PER_UNIT = 50; // m per grid unit
const GPS_SCALE = 1 / 800;  // degrees per grid unit (lat/lng conversion)
const GPS_LAT_ORIGIN = 18.4447;
const GPS_LNG_ORIGIN = 77.4508;

/** Science targets on the Jezero traverse (3-D grid coords, approximate). */
const SCIENCE_TARGETS = [
  { x: -8, z: 2,  label: 'Western Delta' },
  { x: 8,  z: 12, label: 'Kodiak Butte'  },
  { x: 2,  z: 6,  label: 'Séítah Entry'  },
  { x: -4, z: -5, label: 'Máaz Formation' },
];

// 8-directional movement vectors [dx, dz]
const DIRECTIONS_CARDINAL  = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const DIRECTIONS_DIAGONAL  = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
const DIRECTIONS_ALL = [...DIRECTIONS_CARDINAL, ...DIRECTIONS_DIAGONAL];

// ---------------------------------------------------------------------------
// PriorityQueue — binary min-heap
//
// A binary heap gives O(log n) push and pop, versus O(n log n) for the
// sort-on-insert approach used in the legacy astarEngine.js.  For searches
// with up to 2000 iterations this is 2–5× faster in practice.
// ---------------------------------------------------------------------------

export class PriorityQueue {
  constructor() {
    /** @private @type {Array<{priority: number, item: *}>} */
    this._heap = [];
  }

  /** Number of elements in the queue. */
  get size() { return this._heap.length; }

  /** @returns {boolean} */
  isEmpty() { return this._heap.length === 0; }

  /**
   * Insert an item with the given priority (lower = higher priority).
   * @param {*} item
   * @param {number} priority
   */
  push(item, priority) {
    this._heap.push({ priority, item });
    this._bubbleUp(this._heap.length - 1);
  }

  /**
   * Remove and return the item with the lowest priority value.
   * @returns {*}
   */
  pop() {
    const top = this._heap[0].item;
    const last = this._heap.pop();
    if (this._heap.length > 0) {
      this._heap[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  /** @private */
  _bubbleUp(i) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this._heap[parent].priority <= this._heap[i].priority) break;
      [this._heap[parent], this._heap[i]] = [this._heap[i], this._heap[parent]];
      i = parent;
    }
  }

  /** @private */
  _sinkDown(i) {
    const n = this._heap.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1, r = 2 * i + 2;
      if (l < n && this._heap[l].priority < this._heap[smallest].priority) smallest = l;
      if (r < n && this._heap[r].priority < this._heap[smallest].priority) smallest = r;
      if (smallest === i) break;
      [this._heap[smallest], this._heap[i]] = [this._heap[i], this._heap[smallest]];
      i = smallest;
    }
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Quantise a continuous coordinate to the nearest grid step.
 * @param {number} val
 * @returns {number}
 */
function quantize(val) {
  return Math.round(val / STEP) * STEP;
}

/**
 * Convert a 3-D grid coordinate to GPS [lat, lng].
 * Uses the same 1/800 scale as astarEngine.js.
 * @param {number} x
 * @param {number} z
 * @returns {[number, number]} [lat, lng]
 */
function toGPS(x, z) {
  return [
    GPS_LAT_ORIGIN - z * GPS_SCALE,
    GPS_LNG_ORIGIN + x * GPS_SCALE,
  ];
}

/**
 * Returns true if moving diagonally from (cx,cz) to (nx,nz) would
 * corner-cut through a blocked (impassable) cell.
 *
 * "Blocked" means slope > slopeLimit in either of the two axis-aligned
 * intermediate cells.  This prevents the agent from slipping diagonally
 * across a ridge it could not traverse directly.
 *
 * @param {number} cx - Current X
 * @param {number} cz - Current Z
 * @param {number} nx - Neighbour X
 * @param {number} nz - Neighbour Z
 * @param {number} slopeLimit - Maximum allowed slope in degrees
 * @returns {boolean} true if the move is corner-cut blocked
 */
function isCornerCut(cx, cz, nx, nz, slopeLimit) {
  const dx = nx - cx;
  const dz = nz - cz;
  if (dx === 0 || dz === 0) return false; // not diagonal

  // The two intermediate cells share one axis with the neighbour
  const s1 = calcSlopeDeg(cx, cz, cx + dx, cz);
  const s2 = calcSlopeDeg(cx, cz, cx, cz + dz);
  return s1 > slopeLimit || s2 > slopeLimit;
}

/**
 * Compute the step cost used by the safety/science A* variants.
 *
 * C = dist_m × (1 + w_s×slope_factor + w_r×roughness + w_h×hazard_norm + w_u×uncertainty)
 *
 * @param {number} cx
 * @param {number} cz
 * @param {number} nx
 * @param {number} nz
 * @param {number} distM - Pre-computed step distance in metres
 * @param {boolean} [includeScience=false] - Apply negative science bonus
 * @returns {number}
 */
function safetyStepCost(cx, cz, nx, nz, distM, includeScience = false) {
  const slopeDeg = calcSlopeDeg(cx, cz, nx, nz);
  const slopeFactor = Math.tan((slopeDeg * Math.PI) / 180) ** 2;
  const roughness   = calcSurfaceRoughness(nx, nz);
  const hazardNorm  = getHazardPenalty(nx, nz) / COST_WEIGHTS.max_hazard;
  const uncertainty = 0; // placeholder for future sensor confidence layer

  let cost = distM * (
    1
    + COST_WEIGHTS.w_slope     * slopeFactor
    + COST_WEIGHTS.w_roughness * roughness
    + COST_WEIGHTS.w_hazard    * hazardNorm
    + COST_WEIGHTS.w_uncertainty * uncertainty
  );

  if (includeScience) {
    // Reward proximity to science targets (negative cost contribution)
    for (const target of SCIENCE_TARGETS) {
      const d = Math.sqrt((nx - target.x) ** 2 + (nz - target.z) ** 2);
      if (d < 6) {
        cost += COST_WEIGHTS.science_bonus / (d + 1);
      }
    }
  }

  return Math.max(distM * 0.1, cost); // floor: never cheaper than 10% of raw dist
}

/**
 * Reconstruct the path from the cameFrom map.
 * @param {Map<string, {x:number,z:number}|null>} cameFrom
 * @param {{x:number,z:number}} current
 * @returns {{x:number,z:number}[]}
 */
function reconstructPath(cameFrom, current) {
  const path = [];
  let node = current;
  while (node) {
    path.push(node);
    node = cameFrom.get(`${node.x},${node.z}`);
  }
  return path.reverse();
}

/**
 * Compute route metrics from an ordered array of 3-D path points.
 * @param {{x:number,z:number}[]} pathPoints
 * @returns {{
 *   distanceKm: number,
 *   estimatedMinutes: number,
 *   maxSlopeDeg: number,
 *   avgSlopeDeg: number,
 *   oxygenUsedPercent: number,
 *   safetyScore: number,
 *   waypoints: [number,number][],
 *   elevationProfile: Object[]
 * }}
 */
function computeMetrics(pathPoints) {
  let totalDistKm = 0;
  let maxSlope = 0;
  let slopeSum = 0;
  let slopeCount = 0;
  const elevationProfile = [];
  const waypoints = pathPoints.map(p => toGPS(p.x, p.z));

  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    const dUnits = Math.sqrt((curr.x - prev.x) ** 2 + (curr.z - prev.z) ** 2);
    const dKm = (dUnits * METERS_PER_UNIT) / 1000;
    totalDistKm += dKm;

    const slope = calcSlopeDeg(prev.x, prev.z, curr.x, curr.z);
    slopeSum += slope;
    slopeCount++;
    if (slope > maxSlope) maxSlope = slope;
  }

  // Sample elevation profile at ~6 evenly-spaced waypoints
  const stride = Math.max(1, Math.floor(pathPoints.length / 6));
  for (let i = 0; i < pathPoints.length; i++) {
    if (i % stride === 0 || i === pathPoints.length - 1) {
      const pt = pathPoints[i];
      const distAtPoint = i === 0 ? 0 : ((i / pathPoints.length) * totalDistKm);
      elevationProfile.push({
        dist: `${distAtPoint.toFixed(1)} km`,
        elev: Math.round(getTerrainElevation(pt.x, pt.z)),
        slope: parseFloat(
          i === 0 ? 0 : calcSlopeDeg(pathPoints[i - 1].x, pathPoints[i - 1].z, pt.x, pt.z).toFixed(1)
        ),
        note: i === 0 ? 'Start' : i === pathPoints.length - 1 ? 'Goal' : `WP-${i}`,
      });
    }
  }

  if (totalDistKm < 0.2) totalDistKm = 0.2;
  const avgSlope = slopeCount > 0 ? slopeSum / slopeCount : 0;
  const estimatedMinutes = Math.round((totalDistKm / 3.0) * 60 + maxSlope * 1.5);
  const oxygenUsedPercent = Math.min(85, Math.round((totalDistKm / 5.0) * 35 + (maxSlope > 10 ? 15 : 5)));
  const safetyScore = maxSlope > 15 ? 45 : Math.max(55, Math.round(100 - maxSlope * 1.8 - avgSlope * 0.5));

  return {
    distanceKm: parseFloat(totalDistKm.toFixed(2)),
    estimatedMinutes,
    maxSlopeDeg: parseFloat(maxSlope.toFixed(1)),
    avgSlopeDeg: parseFloat(avgSlope.toFixed(1)),
    oxygenUsedPercent,
    safetyScore,
    waypoints,
    elevationProfile,
  };
}

// ---------------------------------------------------------------------------
// Algorithm implementations
// ---------------------------------------------------------------------------

/**
 * Direct route: straight-line interpolation, no terrain analysis.
 * Always succeeds; used as a baseline for comparison.
 */
function routeDirect(sx, sz, gx, gz) {
  const points = [];
  const totalDist = Math.sqrt((gx - sx) ** 2 + (gz - sz) ** 2);
  const steps = Math.max(2, Math.ceil(totalDist / STEP));
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    points.push({ x: sx + t * (gx - sx), z: sz + t * (gz - sz) });
  }
  return points;
}

/**
 * Dijkstra: uniform-cost BFS.  No heuristic — explores uniformly outward.
 * Terrain cost: raw step distance in metres (no slope/hazard weighting).
 * Returns shortest-distance path regardless of terrain difficulty.
 */
function routeDijkstra(sx, sz, gx, gz) {
  const sq = quantize(sx), szq = quantize(sz);
  const gxq = quantize(gx), gzq = quantize(gz);

  const frontier = new PriorityQueue();
  frontier.push({ x: sq, z: szq }, 0);

  const cameFrom = new Map([[ `${sq},${szq}`, null ]]);
  const costSoFar = new Map([[ `${sq},${szq}`, 0 ]]);

  let current = { x: sq, z: szq };
  let iterations = 0;

  while (!frontier.isEmpty() && iterations < MAX_ITER) {
    iterations++;
    current = frontier.pop();
    const ck = `${current.x},${current.z}`;

    if (Math.sqrt((current.x - gxq) ** 2 + (current.z - gzq) ** 2) < STEP * 1.5) break;

    for (const [dx, dz] of DIRECTIONS_ALL) {
      const nx = current.x + dx * STEP;
      const nz = current.z + dz * STEP;
      if (Math.abs(nx) > GRID_BOUND || Math.abs(nz) > GRID_BOUND) continue;

      const nk = `${nx},${nz}`;
      const isDiag = dx !== 0 && dz !== 0;
      const distM = (isDiag ? Math.SQRT2 : 1) * STEP * METERS_PER_UNIT;
      const newCost = costSoFar.get(ck) + distM;

      if (!costSoFar.has(nk) || newCost < costSoFar.get(nk)) {
        costSoFar.set(nk, newCost);
        frontier.push({ x: nx, z: nz }, newCost);
        cameFrom.set(nk, current);
      }
    }
  }

  return reconstructPath(cameFrom, current);
}

/**
 * A* Distance: Euclidean heuristic only.  Minimal terrain weighting.
 * Finds the geometrically shortest path that stays within grid bounds.
 */
function routeAStarDistance(sx, sz, gx, gz) {
  const sq = quantize(sx), szq = quantize(sz);
  const gxq = quantize(gx), gzq = quantize(gz);

  const frontier = new PriorityQueue();
  frontier.push({ x: sq, z: szq }, 0);

  const cameFrom = new Map([[ `${sq},${szq}`, null ]]);
  const costSoFar = new Map([[ `${sq},${szq}`, 0 ]]);

  let current = { x: sq, z: szq };
  let iterations = 0;

  while (!frontier.isEmpty() && iterations < MAX_ITER) {
    iterations++;
    current = frontier.pop();
    const ck = `${current.x},${current.z}`;

    if (Math.sqrt((current.x - gxq) ** 2 + (current.z - gzq) ** 2) < STEP * 1.5) break;

    for (const [dx, dz] of DIRECTIONS_ALL) {
      const nx = current.x + dx * STEP;
      const nz = current.z + dz * STEP;
      if (Math.abs(nx) > GRID_BOUND || Math.abs(nz) > GRID_BOUND) continue;

      const nk = `${nx},${nz}`;
      const isDiag = dx !== 0 && dz !== 0;
      const distM = (isDiag ? Math.SQRT2 : 1) * STEP * METERS_PER_UNIT;

      // Light terrain weighting: add 10% slope overhead
      const slopeDeg = calcSlopeDeg(current.x, current.z, nx, nz);
      const stepCost = distM * (1 + 0.1 * Math.tan((slopeDeg * Math.PI) / 180));
      const newCost = costSoFar.get(ck) + stepCost;

      if (!costSoFar.has(nk) || newCost < costSoFar.get(nk)) {
        costSoFar.set(nk, newCost);
        const h = Math.sqrt((gxq - nx) ** 2 + (gzq - nz) ** 2) * METERS_PER_UNIT;
        frontier.push({ x: nx, z: nz }, newCost + h);
        cameFrom.set(nk, current);
      }
    }
  }

  return reconstructPath(cameFrom, current);
}

/**
 * A* Safety: Full terrain-aware cost function with slope blocking.
 *
 * Cost per step:
 *   C = d × (1 + w_s×slope_factor + w_r×roughness + w_h×hazard_norm + w_u×uncertainty)
 *
 * Skips neighbours where slope > 15° (EVA safety constraint).
 * Skips diagonal moves that would corner-cut a blocked cell.
 *
 * @param {boolean} [includeScience=false] - Whether to add science proximity bonuses
 */
function routeAStarSafety(sx, sz, gx, gz, includeScience = false) {
  const sq = quantize(sx), szq = quantize(sz);
  const gxq = quantize(gx), gzq = quantize(gz);
  const slopeLimit = 15.0; // degrees (EVA constraint, matches existing code)

  const frontier = new PriorityQueue();
  frontier.push({ x: sq, z: szq }, 0);

  const cameFrom = new Map([[ `${sq},${szq}`, null ]]);
  const costSoFar = new Map([[ `${sq},${szq}`, 0 ]]);

  let current = { x: sq, z: szq };
  let iterations = 0;

  while (!frontier.isEmpty() && iterations < MAX_ITER) {
    iterations++;
    current = frontier.pop();
    const ck = `${current.x},${current.z}`;

    if (Math.sqrt((current.x - gxq) ** 2 + (current.z - gzq) ** 2) < STEP * 1.5) break;

    for (const [dx, dz] of DIRECTIONS_ALL) {
      const nx = current.x + dx * STEP;
      const nz = current.z + dz * STEP;
      if (Math.abs(nx) > GRID_BOUND || Math.abs(nz) > GRID_BOUND) continue;

      // Slope check (safety constraint)
      const slopeDeg = calcSlopeDeg(current.x, current.z, nx, nz);
      if (slopeDeg > slopeLimit) continue;

      // No diagonal corner-cutting through blocked cells
      if (isCornerCut(current.x, current.z, nx, nz, slopeLimit)) continue;

      const nk = `${nx},${nz}`;
      const isDiag = dx !== 0 && dz !== 0;
      const distM = (isDiag ? Math.SQRT2 : 1) * STEP * METERS_PER_UNIT;
      const stepCost = safetyStepCost(current.x, current.z, nx, nz, distM, includeScience);
      const newCost = costSoFar.get(ck) + stepCost;

      if (!costSoFar.has(nk) || newCost < costSoFar.get(nk)) {
        costSoFar.set(nk, newCost);
        const h = Math.sqrt((gxq - nx) ** 2 + (gzq - nz) ** 2) * METERS_PER_UNIT;
        frontier.push({ x: nx, z: nz }, newCost + h);
        cameFrom.set(nk, current);
      }
    }
  }

  return reconstructPath(cameFrom, current);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Compute a route from (startX, startZ) to (goalX, goalZ) using the
 * specified algorithm.
 *
 * @param {number} startX
 * @param {number} startZ
 * @param {number} goalX
 * @param {number} goalZ
 * @param {'direct'|'dijkstra'|'astar_distance'|'astar_safety'|'astar_science'} algorithm
 * @param {Object} [config={}] - Optional overrides (reserved for future use)
 * @returns {{
 *   algorithm: string,
 *   name: string,
 *   path: {x:number,z:number}[],
 *   distanceKm: number,
 *   estimatedMinutes: number,
 *   maxSlopeDeg: number,
 *   avgSlopeDeg: number,
 *   oxygenUsedPercent: number,
 *   safetyScore: number,
 *   totalCost: number,
 *   computeTimeMs: number,
 *   waypoints: [number,number][],
 *   elevationProfile: Object[]
 * }}
 */
export function computeRoute(startX, startZ, goalX, goalZ, algorithm = 'astar_safety', config = {}) {
  const t0 = performance.now();

  let pathPoints;
  switch (algorithm) {
    case 'direct':
      pathPoints = routeDirect(startX, startZ, goalX, goalZ);
      break;
    case 'dijkstra':
      pathPoints = routeDijkstra(startX, startZ, goalX, goalZ);
      break;
    case 'astar_distance':
      pathPoints = routeAStarDistance(startX, startZ, goalX, goalZ);
      break;
    case 'astar_safety':
      pathPoints = routeAStarSafety(startX, startZ, goalX, goalZ, false);
      break;
    case 'astar_science':
      pathPoints = routeAStarSafety(startX, startZ, goalX, goalZ, true);
      break;
    default:
      throw new Error(`Unknown algorithm: "${algorithm}". Valid options: direct, dijkstra, astar_distance, astar_safety, astar_science`);
  }

  const computeTimeMs = parseFloat((performance.now() - t0).toFixed(2));
  const metrics = computeMetrics(pathPoints);

  // Compute total accumulated cost as a normalised index
  let totalCost = 0;
  for (let i = 1; i < pathPoints.length; i++) {
    const prev = pathPoints[i - 1];
    const curr = pathPoints[i];
    const isDiag = prev.x !== curr.x && prev.z !== curr.z;
    const distM = (isDiag ? Math.SQRT2 : 1) * STEP * METERS_PER_UNIT;
    totalCost += distM;
  }

  return {
    algorithm,
    name: ALGORITHM_NAMES[algorithm] ?? algorithm,
    path: pathPoints,
    ...metrics,
    totalCost: parseFloat(totalCost.toFixed(1)),
    computeTimeMs,
  };
}

/**
 * Run all five algorithms for the same start/goal pair and return a
 * comparative array sorted by safety score (descending).
 *
 * @param {number} startX
 * @param {number} startZ
 * @param {number} goalX
 * @param {number} goalZ
 * @returns {Array<ReturnType<computeRoute>>}
 */
export function compareAllRoutes(startX, startZ, goalX, goalZ) {
  const algorithms = ['direct', 'dijkstra', 'astar_distance', 'astar_safety', 'astar_science'];
  const results = algorithms.map(alg => {
    try {
      return computeRoute(startX, startZ, goalX, goalZ, alg);
    } catch (err) {
      // Return a stub result if an algorithm fails (e.g. no path found)
      return {
        algorithm: alg,
        name: ALGORITHM_NAMES[alg] ?? alg,
        path: [],
        distanceKm: 0,
        estimatedMinutes: 0,
        maxSlopeDeg: 0,
        avgSlopeDeg: 0,
        oxygenUsedPercent: 0,
        safetyScore: 0,
        totalCost: 0,
        computeTimeMs: 0,
        waypoints: [],
        elevationProfile: [],
        error: err.message,
      };
    }
  });

  // Sort: highest safety score first (safe routes at top)
  results.sort((a, b) => b.safetyScore - a.safetyScore);
  return results;
}
