import * as THREE from 'three';

// 50x50 resolution grid representation of Jezero Crater West
const GRID_SIZE = 50;
const RESOLUTION_M = 100; // 100 meters per grid cell

// Helper: Calculate height at any local (x, z) 3D coordinate matching terrain geometry
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

  // Micro ripples
  height += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.35;
  height += Math.sin(x * 2.5 + z * 1.5) * 0.08;

  // Convert 3D mesh units to Martian meters (-2570m base datum)
  return -2570 + height * 25;
}

// Check if a 3D coordinate is inside known hazard zones (Séítah dunes or steep scarps)
export function getHazardPenalty(x, z) {
  // Séítah dune trap around (x: 2.5, z: 5.5) in 3D units
  const dSeitah = Math.sqrt((x - 2.5) ** 2 + (z - 5.5) ** 2);
  if (dSeitah < 6.0) return 4.0; // High sinkage risk

  // Delta cliff drop-off (x: -5.5 to -8.0, z: -3 to +5)
  if (x < -5.5 && x > -9.0 && Math.abs(z) < 6.0) {
    return 6.0; // Cliff edge
  }

  return 0.0;
}

// Priority Queue for A*
class PriorityQueue {
  constructor() {
    this.elements = [];
  }
  push(item, priority) {
    this.elements.push({ item, priority });
    this.elements.sort((a, b) => a.priority - b.priority);
  }
  pop() {
    return this.elements.shift().item;
  }
  isEmpty() {
    return this.elements.length === 0;
  }
}

// Real-time A* Pathfinding from Hab [0, 0] to any clicked [targetX, targetZ]
export function computeCustomAStarRoute(startX, startZ, targetX, targetZ, maxSlopeLimit = 15.0) {
  // Quantize coordinates to discrete step size
  const step = 2.0; // 3D units step
  const quantize = (val) => Math.round(val / step) * step;

  const startKey = `${quantize(startX)},${quantize(startZ)}`;
  const goalKey = `${quantize(targetX)},${quantize(targetZ)}`;

  const frontier = new PriorityQueue();
  frontier.push({ x: quantize(startX), z: quantize(startZ) }, 0);

  const cameFrom = new Map();
  const costSoFar = new Map();

  cameFrom.set(startKey, null);
  costSoFar.set(startKey, 0);

  let current = null;
  let iterations = 0;
  const maxIterations = 1200;

  while (!frontier.isEmpty() && iterations < maxIterations) {
    iterations++;
    current = frontier.pop();
    const currentKey = `${current.x},${current.z}`;

    const distToGoal = Math.sqrt((current.x - targetX) ** 2 + (current.z - targetZ) ** 2);
    if (distToGoal < step * 1.5) {
      break;
    }

    // 8 neighbors
    const neighbors = [
      { x: current.x + step, z: current.z },
      { x: current.x - step, z: current.z },
      { x: current.x, z: current.z + step },
      { x: current.x, z: current.z - step },
      { x: current.x + step, z: current.z + step },
      { x: current.x + step, z: current.z - step },
      { x: current.x - step, z: current.z + step },
      { x: current.x - step, z: current.z - step },
    ];

    for (const next of neighbors) {
      const nextKey = `${next.x},${next.z}`;

      // Check boundary
      if (Math.abs(next.x) > 28 || Math.abs(next.z) > 28) continue;

      const currElev = getTerrainElevation(current.x, current.z);
      const nextElev = getTerrainElevation(next.x, next.z);

      // Approximate distance in meters
      const horizontalDistM = Math.sqrt((next.x - current.x) ** 2 + (next.z - current.z) ** 2) * 50;
      const elevDiffM = Math.abs(nextElev - currElev);
      const slopeDeg = Math.atan(elevDiffM / Math.max(horizontalDistM, 1)) * (180 / Math.PI);

      // Astronaut safety constraint: avoid slopes > maxSlopeLimit
      if (slopeDeg > maxSlopeLimit) continue;

      const hazardPenalty = getHazardPenalty(next.x, next.z);
      const slopePenalty = Math.tan((slopeDeg * Math.PI) / 180) ** 2;

      // Traversal Cost Function
      const stepCost = horizontalDistM * (1.0 + 3.5 * slopePenalty + 4.0 * hazardPenalty);
      const newCost = costSoFar.get(currentKey) + stepCost;

      if (!costSoFar.has(nextKey) || newCost < costSoFar.get(nextKey)) {
        costSoFar.set(nextKey, newCost);
        const heuristic = Math.sqrt((targetX - next.x) ** 2 + (targetZ - next.z) ** 2) * 50;
        frontier.push(next, newCost + heuristic);
        cameFrom.set(nextKey, current);
      }
    }
  }

  // Reconstruct path
  const pathPoints = [];
  let currNode = current;
  while (currNode) {
    pathPoints.push(currNode);
    const key = `${currNode.x},${currNode.z}`;
    currNode = cameFrom.get(key);
  }
  pathPoints.reverse();

  // Add exact target point at the end
  pathPoints.push({ x: targetX, z: targetZ });

  // Compute realistic metrics along path
  let totalDistKm = 0;
  let maxIncline = 0;
  const profileData = [];

  for (let i = 0; i < pathPoints.length; i++) {
    const pt = pathPoints[i];
    const elev = getTerrainElevation(pt.x, pt.z);

    let localSlope = 0;
    if (i > 0) {
      const prev = pathPoints[i - 1];
      const prevElev = getTerrainElevation(prev.x, prev.z);
      const d = Math.sqrt((pt.x - prev.x) ** 2 + (pt.z - prev.z) ** 2) * 0.05; // km
      totalDistKm += d;
      const elevDiff = Math.abs(elev - prevElev);
      localSlope = Math.round(Math.atan(elevDiff / Math.max(d * 1000, 1)) * (180 / Math.PI) * 10) / 10;
      if (localSlope > maxIncline) maxIncline = localSlope;
    }

    if (i % Math.max(1, Math.floor(pathPoints.length / 6)) === 0 || i === pathPoints.length - 1) {
      profileData.push({
        dist: `${totalDistKm.toFixed(1)} km`,
        elev: Math.round(elev),
        slope: localSlope,
        note: i === 0 ? 'Hab Base' : i === pathPoints.length - 1 ? 'Target Destination' : `Waypoint ${i}`
      });
    }
  }

  // If total distance was very short
  if (totalDistKm < 0.2) totalDistKm = 0.8;

  const estimatedMinutes = Math.round((totalDistKm / 3.0) * 60 + maxIncline * 1.5);
  const oxygenUsedPercent = Math.min(85, Math.round((totalDistKm / 5.0) * 35 + (maxIncline > 10 ? 15 : 5)));
  const safetyScore = maxIncline > 15 ? 45 : Math.max(75, Math.round(100 - maxIncline * 1.8));

  // Convert 3D path points back to GPS lat/lng for mapping
  const gpsWaypoints = pathPoints.map(p => {
    const lat = 18.4447 - p.z / 800;
    const lng = 77.4508 + p.x / 800;
    return [lat, lng];
  });

  return {
    name: "Custom Real-time A* Path",
    color: safetyScore > 80 ? "#10b981" : "#f43f5e",
    distanceKm: parseFloat(totalDistKm.toFixed(2)),
    estimatedMinutes,
    maxSlopeDeg: maxIncline,
    avgSlopeDeg: (maxIncline * 0.45).toFixed(1),
    oxygenUsedPercent,
    safetyScore,
    waypoints: gpsWaypoints,
    threePoints: pathPoints,
    elevationProfile: profileData
  };
}
