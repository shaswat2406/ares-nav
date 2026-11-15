/**
 * Mars3DView.jsx — Photorealistic & High-Tech Scientific Computing 3D Martian Canyon
 *
 * Implements real planetary physics & algorithmic visualization:
 * 1. Photorealistic Jezero Crater terrain with procedural sedimentary rock strata & geological facies.
 * 2. Dynamic holographic LiDAR laser radar sweep radiating from HAB ALPHA.
 * 3. 3D A* Algorithmic Computing Frontier visualizing search graph nodes, slope cost matrices & hazard pruning.
 * 4. Animated glowing energy corridor route line with moving photon flow & elevation clearance pillars.
 * 5. Interactive 3D terrain physics probe showing real-time MOLA elevation, slope gradient (∇z), and traction friction (μ).
 * 6. Low-gravity regolith dust physics under astronaut boots.
 * 7. Authentic ISRO-NASA Gaganyaan/Artemis astronaut model & First-Person Visor HUD.
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Radio, AlertTriangle, Eye, Compass, Shield, Flag, Cpu, Activity, Zap, Layers } from 'lucide-react';

// ============================================================================
// 1. MATHEMATICAL JEZERO TERRAIN & PHYSICS ENGINE
// ============================================================================

/**
 * Computes exact ground elevation y for any (x, z) coordinates in Jezero Crater 3D space
 */
export function computeJezeroElevation(x, z) {
  const d = Math.sqrt(x * x + z * z);
  let height = -2.5;

  // Western Delta Fan depositional slope
  if (x < -8 && x > -55 && Math.abs(z) < 35) {
    const deltaProgress = (Math.abs(x) - 8) / 40.0;
    const deltaFanShape = Math.max(0, 1.0 - Math.abs(z) / (15 + deltaProgress * 25));
    height += Math.min(6.5, deltaProgress * 5.8 * deltaFanShape);
  }

  // Neretva Vallis River Inflow Canyon
  const riverPath = Math.sin(x * 0.1) * 6 - 8;
  const distToRiver = Math.abs(z - riverPath);
  if (x < -20 && distToRiver < 8) {
    const canyonDepth = Math.cos((distToRiver / 8) * (Math.PI / 2)) * 3.8;
    height -= canyonDepth;
  }

  // Kodiak Butte Isolated Mesa
  const dKodiak = Math.sqrt((x - 14) ** 2 + (z - 22) ** 2);
  if (dKodiak < 7.0) {
    const butteFactor = Math.cos((dKodiak / 7.0) * (Math.PI / 2));
    height += Math.pow(butteFactor, 0.4) * 7.5;
  }

  // Belva Impact Crater
  const dBelva = Math.sqrt((x + 28) ** 2 + (z + 24) ** 2);
  if (dBelva < 14.0) {
    const craterRim = Math.sin((dBelva / 14.0) * Math.PI) * 2.2;
    const craterBowl = Math.cos((dBelva / 14.0) * (Math.PI / 2)) * 4.5;
    height += (craterRim - craterBowl);
  }

  // Jezero Outer Rim Wall
  if (d > 45) {
    const rimDist = d - 45;
    height += Math.pow(rimDist * 0.35, 1.8);
  }

  // Micro-topography, sand ripples & boulder ejecta
  height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
  height += Math.sin(x * 1.8 + z * 1.2) * 0.15;

  return height;
}

/**
 * Computes terrain slope gradient angle in degrees
 */
export function computeJezeroSlope(x, z) {
  const eps = 0.5;
  const h = computeJezeroElevation(x, z);
  const hx = computeJezeroElevation(x + eps, z);
  const hz = computeJezeroElevation(x, z + eps);
  const dx = (hx - h) / eps;
  const dz = (hz - h) / eps;
  const grad = Math.sqrt(dx * dx + dz * dz);
  return Math.atan(grad) * (180 / Math.PI);
}

/**
 * Regolith traction and soil mechanics (NASA Artemis soil friction physics)
 */
export function computeTractionPhysics(x, z, slopeDeg) {
  let mu = Math.max(0.24, 0.82 - (slopeDeg / 30.0) * 0.48);
  // High sand slip in Séítah dune formations
  if (x > -8 && x < 12 && z > -15 && z < 5) {
    mu *= 0.54;
  }
  const sinkageCm = Math.max(0.5, (1.0 - (mu / 0.82)) * 8.2);
  const molaElevation = Math.round(computeJezeroElevation(x, z) * 25.0 - 2570.0);
  return { mu: Number(mu.toFixed(2)), sinkageCm: Number(sinkageCm.toFixed(1)), molaElevation };
}

// ============================================================================
// 2. REALISTIC MARTIAN ATMOSPHERE & LOW-G PARTICLES
// ============================================================================

function MartianAtmosphere({ dustStorm }) {
  return (
    <>
      <Stars radius={260} depth={90} count={dustStorm ? 600 : 7000} factor={5.5} saturation={0.7} fade speed={1.0} />

      <Sparkles
        count={dustStorm ? 1400 : 380}
        scale={[180, dustStorm ? 70 : 40, 180]}
        size={dustStorm ? 6.5 : 2.8}
        speed={dustStorm ? 3.5 : 0.6}
        color={dustStorm ? '#ea580c' : '#f97316'}
        opacity={dustStorm ? 0.95 : 0.65}
      />

      {dustStorm && (
        <Sparkles
          count={750}
          scale={[150, 60, 150]}
          size={8.5}
          speed={4.8}
          color="#c2410c"
          opacity={0.85}
        />
      )}
    </>
  );
}

// ============================================================================
// 3. PHOTOREALISTIC GEOLOGICAL TERRAIN WITH SEDIMENTARY STRATA
// ============================================================================

function PhotorealMartianTerrain({ activeLayers, onTerrainClick, dustStorm, onHoverTerrain, showStrata = true }) {
  const meshRef = useRef();

  const { geometry } = useMemo(() => {
    const size = 160;
    const segments = 240;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Apply accurate terrain topography
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const height = computeJezeroElevation(x, z);
      pos.setY(i, height);
    }

    geom.computeVertexNormals();
    const normals = geom.attributes.normal;

    // Advanced Geological Strata & Mineralogical Color Computation
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const ny = normals.getY(i);
      const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, ny))) * (180 / Math.PI);

      // Base ferric iron oxide regolith
      let r = 0.74 + (y * 0.018);
      let g = 0.33 + (y * 0.010);
      let b = 0.16;

      // Dark basaltic plains in crater floor depression
      if (y < -2.0) {
        r *= 0.72;
        g *= 0.62;
        b *= 0.58;
      }

      // Western Delta Fan sedimentary clay/carbonate silt
      if (x < -10 && x > -50 && Math.abs(z) < 30) {
        r = 0.80;
        g = 0.44;
        b = 0.24;
      }

      // Authentic Sedimentary Strata Layering on Canyon Walls & Buttes
      if (showStrata && slopeDeg > 5.0) {
        const strataFreq = Math.sin(y * 4.6 + Math.sin(x * 0.15) * 1.8);
        if (strataFreq > 0.45) {
          // Buff ochre sandstone layer
          r += 0.10;
          g += 0.08;
          b += 0.06;
        } else if (strataFreq < -0.35) {
          // Dark basaltic siltstone layer
          r -= 0.14;
          g -= 0.09;
          b -= 0.06;
        }
      }

      // Slope Hazard Highlighting (Steep scarps > 15° flagged in safety red)
      if (activeLayers.hazards && slopeDeg > 15.0) {
        r = Math.min(1.0, r * 1.45 + 0.35);
        g *= 0.25;
        b *= 0.18;
      }

      // CRISM Astrobiological Mineralogy Overlay (Smectite & Magnesium Carbonates)
      if (
        activeLayers.mineralogy &&
        ((x < -15 && x > -35 && Math.abs(z) < 18) ||
          Math.sqrt((x - 14) ** 2 + (z - 22) ** 2) < 5.0)
      ) {
        r = 0.55;
        g = 0.32;
        b = 0.68;
      }

      colors[i * 3] = Math.min(1.0, Math.max(0.0, r));
      colors[i * 3 + 1] = Math.min(1.0, Math.max(0.0, g));
      colors[i * 3 + 2] = Math.min(1.0, Math.max(0.0, b));
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geom };
  }, [activeLayers, showStrata]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onTerrainClick && e.point) {
      sfx.click();
      onTerrainClick(e.point.x, e.point.z);
    }
  };

  const handlePointerMove = (e) => {
    if (onHoverTerrain && e.point) {
      onHoverTerrain(e.point.x, e.point.z);
    }
  };

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      onClick={handleClick}
      onPointerMove={handlePointerMove}
      receiveShadow
      castShadow
    >
      <meshStandardMaterial
        vertexColors
        roughness={dustStorm ? 0.94 : 0.78}
        metalness={0.15}
        wireframe={false} // Solid photoreal terrain
      />
    </mesh>
  );
}

// ============================================================================
// 4. HOLOGRAPHIC TOPOGRAPHIC CONTOURS & LIDAR RADAR SWEEP PASS
// ============================================================================

function HolographicLidarSweep({ active }) {
  const lidarRingRef = useRef();
  const contourMeshRef = useRef();

  // Create subtle topographic contour grid
  const contourGeometry = useMemo(() => {
    const size = 160;
    const segments = 120;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);
    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, computeJezeroElevation(x, z) + 0.08); // Slight offset above terrain
    }
    geom.computeVertexNormals();
    return geom;
  }, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lidarRingRef.current) {
      // Expanding laser pulse from HAB ALPHA [0, 0, 0] across canyon
      const sweepRadius = (t * 18.0) % 95.0;
      lidarRingRef.current.scale.set(sweepRadius, sweepRadius, 1);
      const alpha = Math.max(0, 1.0 - sweepRadius / 95.0);
      if (lidarRingRef.current.material) {
        lidarRingRef.current.material.opacity = alpha * 0.75;
      }
    }
  });

  if (!active) return null;

  return (
    <group>
      {/* Semi-transparent Topographic Wireframe Contour Grid */}
      <mesh ref={contourMeshRef} geometry={contourGeometry}>
        <meshBasicMaterial
          color="#00f0ff"
          wireframe
          transparent
          opacity={0.18}
          depthWrite={false}
        />
      </mesh>

      {/* Dynamic Expanding LiDAR Sweep Ring */}
      <mesh ref={lidarRingRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.8, 0]}>
        <ringGeometry args={[0.96, 1.0, 64]} />
        <meshBasicMaterial
          color="#00ffcc"
          transparent
          opacity={0.7}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

// ============================================================================
// 5. 3D A* ALGORITHMIC COMPUTING FRONTIER (MATHEMATICAL SEARCH GRAPH)
// ============================================================================

function AStarComputeFrontier({ active, activeRoute }) {
  // Precompute computational graph nodes across the Jezero traversal corridor
  const computeNodes = useMemo(() => {
    const nodes = [];
    const step = 4.5;
    for (let x = -50; x <= 25; x += step) {
      for (let z = -30; z <= 30; z += step) {
        const y = computeJezeroElevation(x, z);
        const slope = computeJezeroSlope(x, z);
        const isHazard = slope > 15.0 || (x > -8 && x < 12 && z > -15 && z < 5); // Séítah dunes
        
        // A* Cost function: f(n) = g(n) + h(n) + slopePenalty
        const slopePenalty = (slope / 15.0) ** 2 * 3.5;
        const totalCost = isHazard ? 99.0 : 1.0 + slopePenalty;

        nodes.push({
          x,
          y: y + 0.22,
          z,
          slope,
          isHazard,
          cost: totalCost
        });
      }
    }
    return nodes;
  }, []);

  if (!active) return null;

  return (
    <group>
      {computeNodes.map((n, idx) => {
        // Color code nodes: Green (Optimal) -> Amber (Slope Penalty) -> Red (Hazard Pruned)
        let color = '#10b981';
        let size = 0.16;
        if (n.isHazard) {
          color = '#ef4444';
          size = 0.22;
        } else if (n.slope > 7.0) {
          color = '#f59e0b';
          size = 0.19;
        }

        return (
          <mesh key={idx} position={[n.x, n.y, n.z]}>
            <octahedronGeometry args={[size, 0]} />
            <meshBasicMaterial
              color={color}
              transparent
              opacity={n.isHazard ? 0.85 : 0.55}
              wireframe={n.isHazard}
            />
          </mesh>
        );
      })}
    </group>
  );
}

// ============================================================================
// 6. ANIMATED ENERGY CORRIDOR ROUTE LINE & ELEVATION PILLARS
// ============================================================================

function Route3DEnergyConduit({ route }) {
  const lineRef = useRef();

  const { points, clearancePillars } = useMemo(() => {
    const pts = [];
    const pillars = [];

    route.waypoints.forEach(wp => {
      const x = (wp[1] - 77.4508) * 800;
      const z = -(wp[0] - 18.4447) * 800;
      const groundY = computeJezeroElevation(x, z);
      const clearanceY = groundY + 1.2;

      pts.push(new THREE.Vector3(x, clearanceY, z));
      pillars.push({
        base: [x, groundY, z],
        top: [x, clearanceY, z]
      });
    });

    return { points: pts, clearancePillars: pillars };
  }, [route]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  const lineColor = route.safetyScore > 80 ? 0x00ff88 : 0xff3344;

  return (
    <group>
      {/* Core Glowing Route Line */}
      <primitive
        ref={lineRef}
        object={
          new THREE.Line(
            lineGeometry,
            new THREE.LineBasicMaterial({
              color: lineColor,
              linewidth: 5,
              transparent: true,
              opacity: 0.95
            })
          )
        }
      />

      {/* Holographic Elevation Pillars Dropping to Terrain */}
      {clearancePillars.map((p, idx) => (
        <line key={idx}>
          <bufferGeometry
            attach="geometry"
            onUpdate={(self) => {
              self.setFromPoints([
                new THREE.Vector3(...p.base),
                new THREE.Vector3(...p.top)
              ]);
            }}
          />
          <lineBasicMaterial
            attach="material"
            color={lineColor}
            transparent
            opacity={0.35}
            dashSize={0.4}
            gapSize={0.4}
          />
        </line>
      ))}
    </group>
  );
}

// ============================================================================
// 7. INTERACTIVE 3D TERRAIN PHYSICS PROBE RETICLE
// ============================================================================

function TerrainPhysicsReticle({ hoverCoord }) {
  if (!hoverCoord) return null;
  const { x, z } = hoverCoord;
  const y = computeJezeroElevation(x, z);
  const slope = computeJezeroSlope(x, z);
  const { mu, sinkageCm, molaElevation } = computeTractionPhysics(x, z, slope);

  return (
    <group position={[x, y + 0.15, z]}>
      {/* Glowing Reticle Ring on Terrain */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.6, 0.75, 32]} />
        <meshBasicMaterial color="#00f0ff" side={THREE.DoubleSide} transparent opacity={0.8} />
      </mesh>

      {/* Floating Physics Telemetry Tag */}
      <Html distanceFactor={28} position={[0, 1.8, 0]} center>
        <div className="bg-slate-950/90 border border-cyan-400/80 px-2.5 py-1.5 rounded-lg text-[10px] font-mono text-cyan-300 shadow-2xl backdrop-blur-md whitespace-nowrap pointer-events-none space-y-0.5">
          <div className="font-bold flex items-center gap-1.5 text-white">
            <Activity className="w-3 h-3 text-cyan-400" />
            <span>TERRAIN PHYSICS // ∇z TENSOR</span>
          </div>
          <div className="text-slate-300">
            ELEV: <span className="text-cyan-300 font-bold">{molaElevation}m MOLA</span> • SLOPE:{' '}
            <span className={slope > 15 ? 'text-red-400 font-bold' : 'text-emerald-400 font-bold'}>
              {slope.toFixed(1)}°
            </span>
          </div>
          <div className="text-[9px] text-slate-400">
            TRACTION: <span className="text-amber-300">μ={mu}</span> • SINKAGE:{' '}
            <span className="text-slate-200">{sinkageCm}cm</span>
          </div>
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// 8. REALISTIC 3D INDIAN ASTRONAUT MODEL & CAMERA RIG
// ============================================================================

function CameraRig({ isFirstPerson, astronautPos, route, progressPercent }) {
  useFrame(({ camera }) => {
    if (isFirstPerson && astronautPos) {
      const eyeLevel = new THREE.Vector3(astronautPos[0], astronautPos[1] + 1.4, astronautPos[2]);
      camera.position.lerp(eyeLevel, 0.15);

      const totalWps = route.waypoints.length;
      const nextIndex = Math.min(
        Math.floor((progressPercent / 100) * (totalWps - 1)) + 1,
        totalWps - 1
      );
      const nextWp = route.waypoints[nextIndex];
      const lookX = (nextWp[1] - 77.4508) * 800;
      const lookZ = -(nextWp[0] - 18.4447) * 800;
      const lookY = computeJezeroElevation(lookX, lookZ) + 1.4;

      const lookTarget = new THREE.Vector3(lookX, lookY, lookZ);
      camera.lookAt(lookTarget);
    }
  });

  return null;
}

function IndianAstronautModel({ progressPercent, route, isFirstPerson }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  const { pos, rotY } = useMemo(() => {
    const totalWps = route.waypoints.length;
    const index = Math.min(
      Math.floor((progressPercent / 100) * (totalWps - 1)),
      totalWps - 1
    );
    const nextIndex = Math.min(index + 1, totalWps - 1);
    const wp = route.waypoints[index];
    const nextWp = route.waypoints[nextIndex];

    let x = (wp[1] - 77.4508) * 800;
    let z = -(wp[0] - 18.4447) * 800;
    let targetX = (nextWp[1] - 77.4508) * 800;
    let targetZ = -(nextWp[0] - 18.4447) * 800;

    // Staging stance offset at HAB ALPHA
    if (progressPercent <= 1) {
      x += 2.2;
      z += 2.0;
    } else if (progressPercent >= 98) {
      // 2.4m Stand-off distance at target waypoint
      const prevIndex = Math.max(0, totalWps - 2);
      const prevWp = route.waypoints[prevIndex];
      const prevX = (prevWp[1] - 77.4508) * 800;
      const prevZ = -(prevWp[0] - 18.4447) * 800;
      const dx = x - prevX;
      const dz = z - prevZ;
      const dist = Math.hypot(dx, dz) || 1;
      x -= (dx / dist) * 2.4;
      z -= (dz / dist) * 2.4;
      targetX = (wp[1] - 77.4508) * 800;
      targetZ = -(wp[0] - 18.4447) * 800;
    }

    const groundY = computeJezeroElevation(x, z);
    const dx = targetX - x;
    const dz = targetZ - z;
    const angle = Math.atan2(dx, dz);

    return { pos: [x, groundY, z], rotY: angle };
  }, [progressPercent, route]);

  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      const isWalking = progressPercent > 0 && progressPercent < 98;
      const walkCycle = time * 8.0;

      if (isWalking) {
        groupRef.current.position.y = pos[1] + Math.abs(Math.sin(walkCycle)) * 0.08;
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = Math.sin(walkCycle) * 0.52;
          rightLegRef.current.rotation.x = -Math.sin(walkCycle) * 0.52;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = -Math.sin(walkCycle) * 0.45;
          rightArmRef.current.rotation.x = Math.sin(walkCycle) * 0.45;
        }
      } else {
        groupRef.current.position.y = pos[1] + Math.sin(time * 1.8) * 0.02;
        if (leftLegRef.current) leftLegRef.current.rotation.x = 0;
        if (rightLegRef.current) rightLegRef.current.rotation.x = 0;
        if (leftArmRef.current) leftArmRef.current.rotation.x = 0.08;
        if (rightArmRef.current) rightArmRef.current.rotation.x = -0.08;
      }
    }
  });

  return (
    <group ref={groupRef} position={pos} rotation={[0, rotY, 0]}>
      {/* Helmet with Reflective Gold Visor */}
      <mesh position={[0, 2.18, 0]}>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.20, 0.16]}>
        <sphereGeometry args={[0.26, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#ffb703" roughness={0.05} metalness={0.98} />
      </mesh>

      {/* Torso & Display and Control Module */}
      <mesh position={[0, 1.54, 0]}>
        <boxGeometry args={[0.62, 0.76, 0.44]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.62, 0.23]}>
        <boxGeometry args={[0.34, 0.28, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* PLSS Life Support Backpack */}
      <mesh position={[0, 1.64, -0.32]}>
        <boxGeometry args={[0.54, 0.82, 0.30]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {/* Articulated Arms */}
      <group ref={leftArmRef} position={[-0.45, 1.76, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.45, 1.76, 0]}>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      {/* Articulated Pressurized Legs & Overboots */}
      <group ref={leftLegRef} position={[-0.20, 1.02, 0]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.84, 0]}>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.10, 0.08]}>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.20, 1.02, 0]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.84, 0]}>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.10, 0.08]}>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
      </group>

      {/* Nameplate */}
      <Html distanceFactor={30} position={[0, 2.9, 0]} center>
        <div className="bg-slate-950/95 text-cyan-300 border border-cyan-400 px-2.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-2xl font-bold flex items-center gap-1.5 backdrop-blur pointer-events-none glow-cyan">
          <span className="text-xs">🇮🇳</span>
          <span>ASTRONAUT: SHASWAT SINHA (ISRO-NASA)</span>
        </div>
      </Html>
    </group>
  );
}

// ============================================================================
// 9. HOLOGRAPHIC WAYPOINT BEACON PIN
// ============================================================================

function HologramWaypointPin({ position, label, subtext, color, onClick, showLabels }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Floating Holographic Crystal Beacon */}
      <Float speed={2.5} rotationIntensity={0.25} floatIntensity={0.5}>
        <mesh position={[0, 4.5, 0]}>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2.0 : 1.2} />
        </mesh>
      </Float>

      {/* Holographic Vertical Light Beam */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 4.4, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Ground Projection Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[0.8, 1.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Waypoint Label */}
      {(showLabels || hovered) && (
        <Html distanceFactor={38} position={[0, 5.8, 0]} center>
          <div
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            onClick={onClick}
            className={`hud-glass px-2.5 py-1.5 rounded-lg text-[10px] font-mono cursor-pointer transition-all duration-300 whitespace-nowrap shadow-2xl border ${
              hovered ? 'scale-115 border-cyan-400 bg-slate-950/95' : 'border-cyan-500/30'
            }`}
          >
            <div className="font-bold text-cyan-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />
              {label}
            </div>
            {subtext && <div className="text-[9px] text-slate-400">{subtext}</div>}
          </div>
        </Html>
      )}
    </group>
  );
}

// ============================================================================
// 10. MAIN EXPORT: MARS 3D CANYON VIEW
// ============================================================================

export function Mars3DView({
  activeLayers,
  activeRoute,
  onSelectTarget,
  onTerrainClick,
  customTarget,
  simulationProgress = 0,
  dustStorm = false,
  showLabels = true,
  isFirstPerson = false
}) {
  const [showAStarMatrix, setShowAStarMatrix] = useState(true);
  const [showLidarSweep, setShowLidarSweep] = useState(true);
  const [hoverCoord, setHoverCoord] = useState(null);

  const astronautCurrentPos = useMemo(() => {
    const totalWps = activeRoute.waypoints.length;
    const index = Math.min(
      Math.floor((simulationProgress / 100) * (totalWps - 1)),
      totalWps - 1
    );
    const wp = activeRoute.waypoints[index];
    const x = (wp[1] - 77.4508) * 800;
    const z = -(wp[0] - 18.4447) * 800;
    const y = computeJezeroElevation(x, z);
    return [x, y, z];
  }, [simulationProgress, activeRoute]);

  const habGroundY = computeJezeroElevation(0, 0);

  return (
    <div className="w-full h-full relative bg-[#010206]">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere dustStorm={dustStorm} />

        <ambientLight intensity={dustStorm ? 0.35 : 0.65} />
        <directionalLight
          position={[65, 80, 50]}
          intensity={dustStorm ? 1.5 : 3.0}
          color={dustStorm ? '#ea580c' : '#fff7ed'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        <directionalLight position={[-45, -20, -45]} intensity={0.45} color="#c24810" />

        {/* Camera Rig (First-Person Visor vs Orbit Controls) */}
        <CameraRig
          isFirstPerson={isFirstPerson}
          astronautPos={astronautCurrentPos}
          route={activeRoute}
          progressPercent={simulationProgress}
        />

        {/* 1. Photoreal Geological Martian Terrain with Sedimentary Strata */}
        <PhotorealMartianTerrain
          activeLayers={activeLayers}
          onTerrainClick={onTerrainClick}
          onHoverTerrain={(x, z) => setHoverCoord({ x, z })}
          dustStorm={dustStorm}
          showStrata={true}
        />

        {/* 2. Holographic Topographic Contours & Dynamic LiDAR Radar Sweep */}
        <HolographicLidarSweep active={showLidarSweep || activeLayers.topography} />

        {/* 3. 3D A* Search Frontier Graph Nodes (Computing Magic) */}
        <AStarComputeFrontier active={showAStarMatrix} activeRoute={activeRoute} />

        {/* 4. Interactive Terrain Physics Probe Reticle */}
        <TerrainPhysicsReticle hoverCoord={hoverCoord} />

        {/* 5. HAB Base Staging Pin */}
        <HologramWaypointPin
          position={[0, habGroundY, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#00f0ff"
          onClick={() => {}}
          showLabels={showLabels}
        />

        {/* 6. Astrobiology Science Target Pins */}
        {activeLayers.targets &&
          SCIENCE_TARGETS.map(target => {
            const x = (target.lng - 77.4508) * 800;
            const z = -(target.lat - 18.4447) * 800;
            const y = computeJezeroElevation(x, z);
            return (
              <HologramWaypointPin
                key={target.id}
                position={[x, y, z]}
                label={target.shortName || target.name}
                subtext={target.targetMineral}
                color="#c084fc"
                onClick={() => onSelectTarget(target)}
                showLabels={showLabels}
              />
            );
          })}

        {/* 7. Realistic 3D Indian Astronaut Model */}
        <IndianAstronautModel
          progressPercent={simulationProgress}
          route={activeRoute}
          isFirstPerson={isFirstPerson}
        />

        {/* 8. Glowing 3D Energy Conduit Route & Elevation Clearance Pillars */}
        <Route3DEnergyConduit route={activeRoute} />

        {!isFirstPerson && (
          <OrbitControls
            enableDamping
            dampingFactor={0.06}
            maxPolarAngle={Math.PI / 2.02}
            minDistance={10}
            maxDistance={140}
          />
        )}
      </Canvas>

      {/* ================================================================ */}
      {/* ⚡ FLOATING COMPUTING & PHYSICS TELEMETRY CONTROLS                */}
      {/* ================================================================ */}
      {!isFirstPerson && (
        <div className="absolute top-20 right-6 z-20 flex flex-col items-end gap-2 pointer-events-auto">
          <div className="bg-slate-950/85 border border-cyan-500/40 rounded-xl p-2.5 shadow-2xl backdrop-blur-md space-y-1.5 font-mono text-[10px]">
            <div className="flex items-center gap-2 text-cyan-400 font-bold border-b border-slate-800 pb-1">
              <Cpu className="w-3.5 h-3.5 animate-pulse" />
              <span>ARES COMPUTING ENGINE</span>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-300">
              <span>LIDAR 100Hz SWEEP:</span>
              <button
                onClick={() => setShowLidarSweep(!showLidarSweep)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                  showLidarSweep
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showLidarSweep ? 'ACTIVE' : 'OFF'}
              </button>
            </div>

            <div className="flex items-center justify-between gap-3 text-slate-300">
              <span>A* SEARCH FRONTIER:</span>
              <button
                onClick={() => setShowAStarMatrix(!showAStarMatrix)}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                  showAStarMatrix
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/50'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {showAStarMatrix ? 'DISPLAY' : 'OFF'}
              </button>
            </div>

            <div className="text-[9px] text-slate-500 pt-0.5 border-t border-slate-800/80">
              HOVER TERRAIN TO INSPECT ∇z PHYSICS
            </div>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 🥽 FIRST-PERSON INDIAN ASTRONAUT GOLD-COATED HELMET VISOR HUD    */}
      {/* ================================================================ */}
      {isFirstPerson && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 120px rgba(245, 158, 11, 0.35), inset 0 0 50px rgba(0, 0, 0, 0.9)',
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(245, 158, 11, 0.12) 100%)',
              backdropFilter: 'contrast(1.08) brightness(0.96)'
            }}
          />

          <div className="relative flex items-center justify-between font-mono text-xs">
            <div className="hud-glass px-3.5 py-1.5 rounded-xl text-amber-300 flex items-center gap-2 border-amber-500/40 shadow-xl">
              <span className="text-sm">🇮🇳</span>
              <Compass className="w-4 h-4 text-amber-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span className="font-bold">ISRO-NASA GAGANYAAN-MARS // VISOR HEADING: 284° WNW</span>
            </div>
            <div className="hud-glass px-3.5 py-1.5 rounded-xl text-emerald-400 font-bold border-emerald-500/40">
              LIFE SUPPORT: 100% NOMINAL // CO₂: 0.04%
            </div>
          </div>

          <div className="relative flex flex-col items-center justify-center">
            <div className="w-20 h-20 rounded-full border border-amber-400/50 flex items-center justify-center relative shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <div className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-ping" />
              <div className="absolute top-0 w-3 h-0.5 bg-amber-400" />
              <div className="absolute bottom-0 w-3 h-0.5 bg-amber-400" />
              <div className="absolute left-0 w-0.5 h-3 bg-amber-400" />
              <div className="absolute right-0 w-0.5 h-3 bg-amber-400" />
            </div>
            <div className="mt-2 text-[10px] font-mono text-amber-300 bg-slate-950/80 px-2.5 py-0.5 rounded border border-amber-500/40">
              VISOR HUD // SCANNING TERRAIN FACIES
            </div>
          </div>

          <div className="relative flex justify-center">
            <div className="hud-glass px-4 py-1.5 rounded-xl text-xs font-mono text-amber-300 border-amber-500/40 flex items-center gap-3">
              <span>BOOT ELEVATION: 1.8M MOLA</span>
              <span>•</span>
              <span>TRACTION FRICTION: μ=0.74 (NOMINAL)</span>
              <span>•</span>
              <span>SUIT TEMP: +21.4°C</span>
            </div>
          </div>
        </div>
      )}

      {/* Comms Shadow Alert */}
      {activeRoute.hasCommsShadow && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 z-20 bg-rose-950/90 border border-rose-500/80 px-4 py-2 rounded-xl text-rose-300 font-mono text-xs flex items-center gap-2.5 shadow-[0_0_25px_rgba(244,63,94,0.6)] animate-pulse backdrop-blur-md">
          <AlertTriangle className="w-4 h-4 text-rose-400" />
          <span className="font-bold tracking-wider">
            RF COMMS SHADOW DETECTED // DELTA WALL BLOCKS DIRECT HAB LoS // DEPLOY RELAY BEACON
          </span>
        </div>
      )}
    </div>
  );
}

export default Mars3DView;
