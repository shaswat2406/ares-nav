/**
 * terrainEngine.js — ARES-NAV Terrain Analysis Engine
 *
 * Provides terrain elevation, slope, roughness, classification, and
 * grid-generation utilities modelled on MOLA/HRSC DEM data for
 * Jezero Crater West (18.44°N, 77.45°E).
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *   • MOLA: Mars Global Surveyor, Mars Orbiter Laser Altimeter, 1997–2001
 *   • HRSC: Mars Express High-Resolution Stereo Camera, 2004–present
 *   • Served via NASA JPL Mars Trek (https://trek.nasa.gov)
 */

// ---------------------------------------------------------------------------
// Configuration — all classification thresholds are set here and can be
// overridden by consumers at runtime before calling any function.
// ---------------------------------------------------------------------------

/** @type {Object} Configurable terrain classification thresholds */
export const TERRAIN_CONFIG = {
  /** Maximum slope (°) considered "flat" */
  flat_max_deg: 2,
  /** Maximum slope (°) considered "gentle" */
  gentle_max_deg: 5,
  /** Maximum slope (°) considered "moderate" */
  moderate_max_deg: 10,
  /** Maximum slope (°) considered "steep" */
  steep_max_deg: 15,
  /** Slopes above steep_max_deg are classified as "cliff" */

  /** Radius (3-D units) of the Séítah dune trap */
  dune_radius: 6.0,
  /** Centre of the Séítah dune field (3-D grid units) */
  dune_centre_x: 2.5,
  dune_centre_z: 5.5,

  /** Roughness threshold above which a cell is flagged high-roughness */
  roughness_high_threshold: 0.65,

  /**
   * Horizontal scale factor: each 3-D unit represents this many metres
   * on the Martian surface (matches the existing astarEngine.js convention
   * where step=2 → 100 m, so 1 unit = 50 m).
   */
  meters_per_unit: 50,

  /** Base elevation datum for Jezero Crater West (MOLA, metres) */
  base_elevation_m: -2570,
};

// ---------------------------------------------------------------------------
// Core elevation & hazard helpers
// (Copied verbatim from astarEngine.js so this module is fully standalone.)
// ---------------------------------------------------------------------------

/**
 * Returns the synthetic elevation (metres, MOLA datum) at grid point (x, z).
 *
 * The model encodes:
 *   • Western delta scarp (x < -4)
 *   • Kodiak Butte mesa (centred at x=8, z=12)
 *   • Outer crater rim (d > 24)
 *   • Micro-ripple texture (sin/cos terms)
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} x - East-West grid coordinate (3-D units, ±28 range)
 * @param {number} z - North-South grid coordinate (3-D units, ±28 range)
 * @returns {number} Elevation in metres above MOLA datum
 */
export function getTerrainElevation(x, z) {
  const d = Math.sqrt(x * x + z * z);
  let height = -1.0;

  // Western delta scarp
  if (x < -4) {
    const deltaRidge = (Math.abs(x) - 4) * 0.45;
    height += Math.min(deltaRidge, 3.8);
  }

  // Kodiak Butte mesa
  const dKodiak = Math.sqrt((x - 8) ** 2 + (z - 12) ** 2);
  if (dKodiak < 4.5) {
    height += Math.cos((dKodiak / 4.5) * (Math.PI / 2)) * 3.6;
  }

  // Outer crater rim
  if (d > 24) {
    height += Math.pow((d - 24) * 0.45, 1.7);
  }

  // Micro ripples (macro scale)
  height += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.35;
  // Micro ripples (fine scale)
  height += Math.sin(x * 2.5 + z * 1.5) * 0.08;

  return TERRAIN_CONFIG.base_elevation_m + height * 25;
}

/**
 * Returns a hazard penalty score for grid point (x, z).
 *
 * Hazard zones:
 *   • Séítah dune trap  → penalty 4.0 (high sinkage / mobility risk)
 *   • Delta cliff edge  → penalty 6.0 (drop-off, unrecoverable)
 *   • Elsewhere         → 0.0
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} x
 * @param {number} z
 * @returns {number} Hazard penalty 0–6
 */
export function getHazardPenalty(x, z) {
  const { dune_centre_x, dune_centre_z, dune_radius } = TERRAIN_CONFIG;

  // Séítah dune trap
  const dSeitah = Math.sqrt((x - dune_centre_x) ** 2 + (z - dune_centre_z) ** 2);
  if (dSeitah < dune_radius) return 4.0;

  // Delta cliff drop-off
  if (x < -5.5 && x > -9.0 && Math.abs(z) < 6.0) return 6.0;

  return 0.0;
}

// ---------------------------------------------------------------------------
// Slope & roughness calculations
// ---------------------------------------------------------------------------

/**
 * Calculates the slope angle in degrees between two adjacent 3-D grid points.
 *
 * Uses the standard rise-over-run formula:
 *   slope = atan( |Δelev| / horizontal_distance ) × (180/π)
 *
 * Horizontal distance is converted to metres using TERRAIN_CONFIG.meters_per_unit.
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} x1 - Start X (3-D grid units)
 * @param {number} z1 - Start Z
 * @param {number} x2 - End X
 * @param {number} z2 - End Z
 * @returns {number} Slope angle in degrees (always ≥ 0)
 */
export function calcSlopeDeg(x1, z1, x2, z2) {
  const scale = TERRAIN_CONFIG.meters_per_unit;
  const horizontalM = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2) * scale;
  const elev1 = getTerrainElevation(x1, z1);
  const elev2 = getTerrainElevation(x2, z2);
  const elevDiffM = Math.abs(elev2 - elev1);
  if (horizontalM < 0.001) return 0;
  return Math.atan(elevDiffM / horizontalM) * (180 / Math.PI);
}

/**
 * Calculates surface roughness at (x, z) by sampling its 8 immediate
 * grid neighbours (Moore neighbourhood).
 *
 * Roughness is defined as the standard deviation of the 9-sample elevation
 * set, normalised to a 0–1 range using an empirical maximum of 25 m (one
 * height unit in the terrain model equals 25 m).
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} x
 * @param {number} z
 * @returns {number} Roughness index in [0, 1]
 */
export function calcSurfaceRoughness(x, z) {
  const step = 2.0; // matches pathfinding step size
  const samples = [];

  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      samples.push(getTerrainElevation(x + dx * step, z + dz * step));
    }
  }

  const mean = samples.reduce((a, b) => a + b, 0) / samples.length;
  const variance = samples.reduce((sum, v) => sum + (v - mean) ** 2, 0) / samples.length;
  const stdDev = Math.sqrt(variance);

  // Normalise: 25 m std-dev maps to roughness = 1.0
  return Math.min(1.0, stdDev / 25.0);
}

// ---------------------------------------------------------------------------
// Terrain classification
// ---------------------------------------------------------------------------

/**
 * Classifies terrain given a slope angle and optional roughness index.
 *
 * Classification hierarchy (TERRAIN_CONFIG thresholds):
 *   flat      < 2°   — smooth crater floor, safe
 *   gentle    2–5°   — slight undulation, safe
 *   moderate  5–10°  — caution required, manageable
 *   steep    10–15°  — high exertion, borderline safe
 *   cliff    > 15°   — impassable in EVA suit
 *   dune              — high roughness in known dune zone (overrides slope)
 *   uncertain         — data confidence too low
 *
 * @param {number} slopeDeg   - Slope angle in degrees
 * @param {number} [roughness=0] - Roughness index 0–1
 * @param {boolean} [inDuneZone=false] - Whether the point is inside the Séítah dune zone
 * @returns {{ type: string, label: string, color: string, traversable: boolean, description: string }}
 */
export function classifyTerrain(slopeDeg, roughness = 0, inDuneZone = false) {
  const cfg = TERRAIN_CONFIG;

  // Dune override — higher roughness inside known dune zones
  if (inDuneZone && roughness > 0.4) {
    return {
      type: 'dune',
      label: 'Dune Field',
      color: '#f59e0b',
      traversable: false,
      description: 'Aeolian sand dunes (Séítah). High sinkage risk; wheel-slip likely. Avoid.',
    };
  }

  if (isNaN(slopeDeg) || slopeDeg < 0) {
    return {
      type: 'uncertain',
      label: 'Uncertain',
      color: '#6b7280',
      traversable: false,
      description: 'Terrain data insufficient. Treat as impassable until surveyed.',
    };
  }

  if (slopeDeg < cfg.flat_max_deg) {
    return {
      type: 'flat',
      label: 'Flat',
      color: '#10b981',
      traversable: true,
      description: 'Near-level crater floor. Optimal traverse surface.',
    };
  }

  if (slopeDeg < cfg.gentle_max_deg) {
    return {
      type: 'gentle',
      label: 'Gentle Slope',
      color: '#84cc16',
      traversable: true,
      description: 'Slight gradient. Normal locomotion with minimal metabolic increase.',
    };
  }

  if (slopeDeg < cfg.moderate_max_deg) {
    return {
      type: 'moderate',
      label: 'Moderate Slope',
      color: '#f59e0b',
      traversable: true,
      description: 'Moderate gradient. Increased O₂ consumption; caution on loose regolith.',
    };
  }

  if (slopeDeg < cfg.steep_max_deg) {
    return {
      type: 'steep',
      label: 'Steep',
      color: '#f97316',
      traversable: true,
      description: 'Steep slope approaching EVA safety limit. Use tether; buddy system required.',
    };
  }

  return {
    type: 'cliff',
    label: 'Cliff / Scarp',
    color: '#ef4444',
    traversable: false,
    description: 'Exceeds 15° EVA safety threshold. Impassable without specialised equipment.',
  };
}

// ---------------------------------------------------------------------------
// Terrain report
// ---------------------------------------------------------------------------

/**
 * Generates a comprehensive terrain analysis report for grid point (x, z).
 *
 * Samples slope in two orthogonal directions (north = +Z, east = +X) using
 * a fixed 2-unit step, then computes roughness from the full neighbourhood.
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} x
 * @param {number} z
 * @returns {{
 *   elevation: number,
 *   slope_deg_north: number,
 *   slope_deg_east: number,
 *   roughness: number,
 *   terrain_class: Object,
 *   hazard_level: number,
 *   is_traversable: boolean,
 *   recommended_action: string,
 *   data_source: string
 * }}
 */
export function getTerrainReport(x, z) {
  const step = 2.0;
  const elevation = getTerrainElevation(x, z);
  const slope_deg_north = calcSlopeDeg(x, z, x, z + step);
  const slope_deg_east = calcSlopeDeg(x, z, x + step, z);
  const roughness = calcSurfaceRoughness(x, z);
  const hazard_level = getHazardPenalty(x, z);

  const { dune_centre_x, dune_centre_z, dune_radius } = TERRAIN_CONFIG;
  const dSeitah = Math.sqrt((x - dune_centre_x) ** 2 + (z - dune_centre_z) ** 2);
  const inDuneZone = dSeitah < dune_radius;

  const maxSlope = Math.max(slope_deg_north, slope_deg_east);
  const terrain_class = classifyTerrain(maxSlope, roughness, inDuneZone);
  const is_traversable = terrain_class.traversable && hazard_level < 4.0;

  let recommended_action;
  if (!is_traversable) {
    recommended_action = 'AVOID — reroute around this grid cell';
  } else if (maxSlope > 10) {
    recommended_action = 'CAUTION — proceed slowly, monitor O₂ levels';
  } else if (roughness > TERRAIN_CONFIG.roughness_high_threshold) {
    recommended_action = 'CAUTION — high surface roughness; watch footing';
  } else {
    recommended_action = 'CLEAR — standard traverse';
  }

  return {
    elevation,
    slope_deg_north: parseFloat(slope_deg_north.toFixed(2)),
    slope_deg_east: parseFloat(slope_deg_east.toFixed(2)),
    roughness: parseFloat(roughness.toFixed(3)),
    terrain_class,
    hazard_level,
    is_traversable,
    recommended_action,
    data_source: 'MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)',
  };
}

// ---------------------------------------------------------------------------
// Grid generation utilities
// ---------------------------------------------------------------------------

/**
 * Generates a 2-D array of elevations for a square grid centred on (0, 0).
 *
 * Grid coordinates run from -(size/2) to +(size/2) in steps of 1 unit.
 * Access: elevGrid[row][col] where row=0 is the most-negative Z.
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number} [size=50] - Number of cells along each axis
 * @returns {number[][]} 2-D elevation array [row][col]
 */
export function generateElevationGrid(size = 50) {
  const half = Math.floor(size / 2);
  const grid = [];
  for (let row = 0; row < size; row++) {
    const z = row - half;
    const rowArr = [];
    for (let col = 0; col < size; col++) {
      const x = col - half;
      rowArr.push(parseFloat(getTerrainElevation(x, z).toFixed(2)));
    }
    grid.push(rowArr);
  }
  return grid;
}

/**
 * Derives a 2-D slope grid from a pre-computed elevation grid.
 *
 * Slope at each cell is the maximum of the north-facing and east-facing
 * finite-difference gradients (using the same rise-over-run formula as
 * calcSlopeDeg).  Edge cells use forward/backward differences.
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number[][]} elevGrid - Output of generateElevationGrid()
 * @returns {number[][]} 2-D slope array in degrees [row][col]
 */
export function generateSlopeGrid(elevGrid) {
  const rows = elevGrid.length;
  const cols = elevGrid[0].length;
  const scale = TERRAIN_CONFIG.meters_per_unit; // m per grid cell
  const slopeGrid = [];

  for (let r = 0; r < rows; r++) {
    const rowArr = [];
    for (let c = 0; c < cols; c++) {
      // Finite difference in column direction (east)
      const c0 = Math.max(0, c - 1);
      const c1 = Math.min(cols - 1, c + 1);
      const dEast = Math.abs(elevGrid[r][c1] - elevGrid[r][c0]) / ((c1 - c0) * scale);

      // Finite difference in row direction (north)
      const r0 = Math.max(0, r - 1);
      const r1 = Math.min(rows - 1, r + 1);
      const dNorth = Math.abs(elevGrid[r1][c] - elevGrid[r0][c]) / ((r1 - r0) * scale);

      const maxGrad = Math.max(dEast, dNorth);
      const slopeDeg = Math.atan(maxGrad) * (180 / Math.PI);
      rowArr.push(parseFloat(slopeDeg.toFixed(2)));
    }
    slopeGrid.push(rowArr);
  }
  return slopeGrid;
}

/**
 * Generates a 2-D hazard rating grid (0–5 scale) combining elevation
 * features and slope analysis.
 *
 * Rating breakdown:
 *   0 — no hazard
 *   1 — minor elevation change
 *   2 — moderate slope or mild roughness
 *   3 — steep slope or moderate hazard zone proximity
 *   4 — severe slope or Séítah dune field
 *   5 — cliff / delta drop-off (impassable)
 *
 * Data source: MOLA/HRSC DEM Model — Jezero Crater W (18.44°N, 77.45°E)
 *
 * @param {number[][]} elevGrid  - Output of generateElevationGrid()
 * @param {number[][]} slopeGrid - Output of generateSlopeGrid()
 * @returns {number[][]} 2-D integer hazard array 0–5 [row][col]
 */
export function generateHazardGrid(elevGrid, slopeGrid) {
  const rows = elevGrid.length;
  const cols = elevGrid[0].length;
  const half = Math.floor(cols / 2);
  const hazardGrid = [];

  for (let r = 0; r < rows; r++) {
    const rowArr = [];
    for (let c = 0; c < cols; c++) {
      const x = c - half;
      const z = r - Math.floor(rows / 2);
      const slope = slopeGrid[r][c];
      const rawHazard = getHazardPenalty(x, z);

      let rating = 0;

      if (rawHazard >= 6.0) {
        rating = 5; // cliff / scarp
      } else if (rawHazard >= 4.0) {
        rating = 4; // dune field
      } else if (slope >= TERRAIN_CONFIG.steep_max_deg) {
        rating = 4;
      } else if (slope >= TERRAIN_CONFIG.moderate_max_deg) {
        rating = 3;
      } else if (slope >= TERRAIN_CONFIG.gentle_max_deg) {
        rating = 2;
      } else if (slope >= TERRAIN_CONFIG.flat_max_deg) {
        rating = 1;
      }

      rowArr.push(rating);
    }
    hazardGrid.push(rowArr);
  }
  return hazardGrid;
}
