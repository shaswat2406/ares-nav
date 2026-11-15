/**
 * Mars3DView.jsx — Photorealistic 3D Jezero Crater Mission View
 *
 * NASA Space Apps Challenge 2026:
 * - Authentic Martian atmospheric depth & exponential horizon fog (no hard box edges)
 * - Low-angle cinematic "golden hour" sunlight with soft terrain shadows
 * - Instanced natural basaltic boulders & regolith rocks across crater floor & ejecta
 * - Procedural surface bump mapping for authentic sand ripples & pebble relief
 * - 3D HAB ALPHA Expedition Base (geodesic dome, airlock, solar arrays, comm antenna)
 * - 3D Ingenuity Mars Helicopter (Scout 1) resting on bedrock near Séítah
 * - Authentic ISRO-NASA Gaganyaan/Artemis astronaut model & First-Person Visor HUD
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Radio, AlertTriangle, Eye, Compass, Shield, Flag } from 'lucide-react';

// ============================================================================
// 1. MATHEMATICAL JEZERO ELEVATION MODEL
// ============================================================================

export function getTerrainHeight(x, z) {
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

  // Natural micro-topography & ripple waves
  height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
  height += Math.sin(x * 1.8 + z * 1.2) * 0.15;

  return height;
}

// ============================================================================
// 2. PROCEDURAL MARTIAN REGOLITH BUMP TEXTURE
// ============================================================================

function getRegolithBumpTexture() {
  if (typeof document === 'undefined') return null;
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Base regolith noise
  const imgData = ctx.createImageData(512, 512);
  for (let i = 0; i < imgData.data.length; i += 4) {
    const noise = Math.floor(Math.random() * 110 + 60);
    imgData.data[i] = noise;
    imgData.data[i + 1] = noise;
    imgData.data[i + 2] = noise;
    imgData.data[i + 3] = 255;
  }
  ctx.putImageData(imgData, 0, 0);

  // Subtle aeolian wind ripple bands
  ctx.fillStyle = 'rgba(255, 255, 255, 0.15)';
  for (let y = 0; y < 512; y += 12) {
    const offset = Math.sin(y * 0.04) * 5;
    ctx.fillRect(0, y + offset, 512, 3);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(32, 32);
  return texture;
}

// ============================================================================
// 3. MARTIAN ATMOSPHERE & EXPONENTIAL FOG
// ============================================================================

function MartianAtmosphere({ dustStorm }) {
  return (
    <>
      <Stars radius={250} depth={80} count={dustStorm ? 500 : 5000} factor={5} saturation={0.6} fade speed={1.2} />

      <Sparkles
        count={dustStorm ? 1200 : 280}
        scale={[160, dustStorm ? 60 : 35, 160]}
        size={dustStorm ? 6.0 : 2.5}
        speed={dustStorm ? 3.2 : 0.5}
        color={dustStorm ? '#ea580c' : '#f97316'}
        opacity={dustStorm ? 0.95 : 0.65}
      />

      {dustStorm && (
        <Sparkles
          count={600}
          scale={[140, 50, 140]}
          size={8.0}
          speed={4.5}
          color="#c2410c"
          opacity={0.8}
        />
      )}
    </>
  );
}

// ============================================================================
// 4. PHOTOREALISTIC GEOLOGICAL TERRAIN
// ============================================================================

function PhotorealMartianTerrain({ activeLayers, onTerrainClick, dustStorm }) {
  const meshRef = useRef();

  const bumpTexture = useMemo(() => getRegolithBumpTexture(), []);

  const { geometry } = useMemo(() => {
    const size = 160;
    const segments = 240;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const height = getTerrainHeight(x, z);
      pos.setY(i, height);
    }

    geom.computeVertexNormals();
    const normals = geom.attributes.normal;

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const y = pos.getY(i);
      const ny = normals.getY(i);
      const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, ny))) * (180 / Math.PI);

      let r = 0.73 + (y * 0.018);
      let g = 0.32 + (y * 0.010);
      let b = 0.15;

      // Dark basalt floor depression
      if (y < -2.0) {
        r *= 0.74;
        g *= 0.64;
        b *= 0.58;
      }

      // Western Delta sedimentary mudstone
      if (x < -10 && x > -50 && Math.abs(z) < 30) {
        r = 0.79;
        g = 0.43;
        b = 0.23;
      }

      // Hazard highlighting on steep slopes (>15°)
      if (activeLayers.hazards && slopeDeg > 15.0) {
        r = Math.min(1.0, r * 1.4 + 0.3);
        g *= 0.3;
        b *= 0.2;
      }

      // CRISM Mineralogy Astrobiological Preservation sites
      if (
        activeLayers.mineralogy &&
        ((x < -15 && x > -35 && Math.abs(z) < 18) ||
          Math.sqrt((x - 14) ** 2 + (z - 22) ** 2) < 5.0)
      ) {
        r = 0.58;
        g = 0.28;
        b = 0.62;
      }

      colors[i * 3] = Math.min(1.0, Math.max(0.0, r));
      colors[i * 3 + 1] = Math.min(1.0, Math.max(0.0, g));
      colors[i * 3 + 2] = Math.min(1.0, Math.max(0.0, b));
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return { geometry: geom };
  }, [activeLayers]);

  const handleClick = (e) => {
    e.stopPropagation();
    if (onTerrainClick && e.point) {
      sfx.click();
      onTerrainClick(e.point.x, e.point.z);
    }
  };

  return (
    <mesh ref={meshRef} geometry={geometry} onClick={handleClick} receiveShadow castShadow>
      <meshStandardMaterial
        vertexColors
        roughness={dustStorm ? 0.94 : 0.82}
        metalness={0.12}
        bumpMap={bumpTexture}
        bumpScale={0.12}
        wireframe={false}
      />
    </mesh>
  );
}

// ============================================================================
// 5. INSTANCED BASALTIC BOULDERS & REGOLITH ROCKS
// ============================================================================

function InstancedMartianRocks() {
  const meshRef = useRef();
  const count = 380;

  const rockMatrices = useMemo(() => {
    const dummy = new THREE.Object3D();
    const matrices = [];

    let seed = 12345;
    const random = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };

    for (let i = 0; i < count; i++) {
      const x = (random() - 0.5) * 135;
      const z = (random() - 0.5) * 135;

      // Keep clearance around HAB ALPHA base
      if (Math.hypot(x, z) < 6.5) continue;

      const y = getTerrainHeight(x, z);
      const scale = 0.25 + random() * 0.70;

      dummy.position.set(x, y + scale * 0.28, z);
      dummy.rotation.set(random() * Math.PI, random() * Math.PI, random() * Math.PI);
      dummy.scale.set(
        scale * (0.8 + random() * 0.4),
        scale * (0.6 + random() * 0.5),
        scale * (0.8 + random() * 0.4)
      );
      dummy.updateMatrix();
      matrices.push(dummy.matrix.clone());
    }

    return matrices;
  }, []);

  useEffect(() => {
    if (meshRef.current) {
      rockMatrices.forEach((mat, i) => {
        meshRef.current.setMatrixAt(i, mat);
      });
      meshRef.current.instanceMatrix.needsUpdate = true;
    }
  }, [rockMatrices]);

  return (
    <instancedMesh
      ref={meshRef}
      args={[null, null, rockMatrices.length]}
      castShadow
      receiveShadow
    >
      <dodecahedronGeometry args={[0.7, 1]} />
      <meshStandardMaterial color="#472e21" roughness={0.92} metalness={0.08} />
    </instancedMesh>
  );
}

// ============================================================================
// 6. 3D HAB ALPHA EXPEDITION BASE (Geodesic Dome, Airlock & Solar Array)
// ============================================================================

function HabAlphaBaseModel({ position }) {
  const [x, y, z] = position;

  return (
    <group position={[x, y, z]}>
      {/* Landing Pad Apron */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]} receiveShadow>
        <circleGeometry args={[4.8, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.8} />
      </mesh>

      {/* Geodesic Pressurized Habitat Dome */}
      <mesh position={[0, 1.4, 0]} castShadow receiveShadow>
        <sphereGeometry args={[2.8, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.3} metalness={0.2} />
      </mesh>

      {/* Dome Thermal Red Trim Ring */}
      <mesh position={[0, 0.2, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.75, 2.9, 32]} />
        <meshBasicMaterial color="#ef4444" side={THREE.DoubleSide} />
      </mesh>

      {/* Pressurized Airlock Tunnel */}
      <mesh position={[2.6, 0.65, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.75, 0.75, 1.6, 16]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.4} />
      </mesh>

      {/* Airlock Outer Door Frame */}
      <mesh position={[3.45, 0.65, 0]}>
        <boxGeometry args={[0.1, 1.3, 1.1]} />
        <meshStandardMaterial color="#0f172a" roughness={0.7} />
      </mesh>

      {/* Dual Deployable Solar Panel Wings */}
      <group position={[-1.8, 1.2, 2.6]} rotation={[0.4, 0.3, 0]} castShadow>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[3.2, 0.06, 1.4]} />
          <meshStandardMaterial color="#0284c7" metalness={0.85} roughness={0.15} />
        </mesh>
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 1.2, 8]} />
          <meshStandardMaterial color="#64748b" metalness={0.7} />
        </mesh>
      </group>

      {/* Deep Space High-Gain Comm Antenna Dish */}
      <group position={[-0.8, 3.0, -1.2]} rotation={[0.5, 0.6, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.75, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2.5]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.7, 8]} />
          <meshStandardMaterial color="#ef4444" />
        </mesh>
      </group>
    </group>
  );
}

// ============================================================================
// 7. INGENUITY MARS HELICOPTER (SCOUT 1) MODEL
// ============================================================================

function IngenuityHelicopterModel({ position }) {
  const rotorRef = useRef();

  useFrame((state) => {
    if (rotorRef.current) {
      rotorRef.current.rotation.y = state.clock.getElapsedTime() * 1.5;
    }
  });

  return (
    <group position={position} scale={[1.3, 1.3, 1.3]}>
      {/* Gold Kapton Fuselage Cube */}
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[0.34, 0.30, 0.30]} />
        <meshStandardMaterial color="#eab308" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Mast & Solar Panel Top */}
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.35, 8]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
      <mesh position={[0, 0.90, 0]}>
        <boxGeometry args={[0.38, 0.02, 0.24]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} />
      </mesh>

      {/* Counter-Rotating Carbon Fiber Rotors */}
      <group ref={rotorRef} position={[0, 0.78, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.015, 0.10]} />
          <meshStandardMaterial color="#0f172a" roughness={0.4} />
        </mesh>
      </group>

      {/* 4 Carbon-Composite Landing Legs */}
      {[
        [0.24, 0.18, 0.24],
        [-0.24, 0.18, 0.24],
        [0.24, 0.18, -0.24],
        [-0.24, 0.18, -0.24]
      ].map((legPos, idx) => (
        <mesh key={idx} position={legPos} rotation={[0.4 * (legPos[0] > 0 ? 1 : -1), 0, 0.4 * (legPos[2] > 0 ? 1 : -1)]}>
          <cylinderGeometry args={[0.015, 0.015, 0.45, 6]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
      ))}

      {/* Floating Scout Badge */}
      <Html distanceFactor={26} position={[0, 1.3, 0]} center>
        <div className="bg-slate-950/90 border border-amber-400/80 px-2 py-0.5 rounded text-[8px] font-mono text-amber-300 shadow-xl whitespace-nowrap pointer-events-none">
          INGENUITY // SCOUT 1 (72 FLIGHTS)
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
      const lookY = getTerrainHeight(lookX, lookZ) + 1.4;

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

    const groundY = getTerrainHeight(x, z);
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
      <mesh position={[0, 2.18, 0]} castShadow>
        <sphereGeometry args={[0.34, 24, 24]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.3} metalness={0.1} />
      </mesh>
      <mesh position={[0, 2.20, 0.16]}>
        <sphereGeometry args={[0.26, 24, 24, 0, Math.PI * 2, 0, Math.PI / 1.7]} />
        <meshStandardMaterial color="#ffb703" roughness={0.05} metalness={0.98} />
      </mesh>

      {/* Torso & Display and Control Module */}
      <mesh position={[0, 1.54, 0]} castShadow>
        <boxGeometry args={[0.62, 0.76, 0.44]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.62, 0.23]}>
        <boxGeometry args={[0.34, 0.28, 0.08]} />
        <meshStandardMaterial color="#0f172a" roughness={0.6} metalness={0.8} />
      </mesh>

      {/* PLSS Life Support Backpack */}
      <mesh position={[0, 1.64, -0.32]} castShadow>
        <boxGeometry args={[0.54, 0.82, 0.30]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.5} />
      </mesh>

      {/* Articulated Arms */}
      <group ref={leftArmRef} position={[-0.45, 1.76, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.78, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.45, 1.76, 0]}>
        <mesh position={[0, -0.32, 0]} castShadow>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.78, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
      </group>

      {/* Articulated Pressurized Legs & Overboots */}
      <group ref={leftLegRef} position={[-0.20, 1.02, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.84, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.10, 0.08]} castShadow>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.20, 1.02, 0]}>
        <mesh position={[0, -0.28, 0]} castShadow>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.84, 0]} castShadow>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.10, 0.08]} castShadow>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
      </group>

      {/* Floating Astronaut Nameplate */}
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
// 10. 3D ROUTE LINE
// ============================================================================

function Route3DLine({ route }) {
  const points = useMemo(() => {
    return route.waypoints.map(wp => {
      const x = (wp[1] - 77.4508) * 800;
      const z = -(wp[0] - 18.4447) * 800;
      const y = getTerrainHeight(x, z) + 0.8;
      return new THREE.Vector3(x, y, z);
    });
  }, [route]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      object={
        new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: route.safetyScore > 80 ? 0x00ff88 : 0xff3344,
            linewidth: 4,
            transparent: true,
            opacity: 0.95
          })
        )
      }
    />
  );
}

// ============================================================================
// 11. MAIN EXPORT: MARS 3D VIEW
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
  const astronautCurrentPos = useMemo(() => {
    const totalWps = activeRoute.waypoints.length;
    const index = Math.min(
      Math.floor((simulationProgress / 100) * (totalWps - 1)),
      totalWps - 1
    );
    const wp = activeRoute.waypoints[index];
    const x = (wp[1] - 77.4508) * 800;
    const z = -(wp[0] - 18.4447) * 800;
    const y = getTerrainHeight(x, z);
    return [x, y, z];
  }, [simulationProgress, activeRoute]);

  const habY = getTerrainHeight(0, 0);
  const ingenuityY = getTerrainHeight(-14, 12);

  return (
    <div className="w-full h-full relative bg-[#1c0c06]">
      <Canvas
        camera={{ position: [0, 42, 60], fov: 46 }}
        shadows
        gl={{ antialias: true }}
      >
        {/* Background & Atmospheric Exponential Horizon Fog */}
        <color attach="background" args={['#1c0c06']} />
        <fogExp2 attach="fog" args={[dustStorm ? '#381408' : '#220e06', dustStorm ? 0.016 : 0.007]} />

        <MartianAtmosphere dustStorm={dustStorm} />

        {/* Ambient & Low-Angle Warm Cinematic Sunlight */}
        <ambientLight intensity={dustStorm ? 0.35 : 0.60} color="#fed7aa" />
        <directionalLight
          position={[75, 42, 50]}
          intensity={dustStorm ? 1.6 : 3.2}
          color={dustStorm ? '#ea580c' : '#ffedd5'}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
          shadow-camera-near={0.5}
          shadow-camera-far={250}
          shadow-camera-left={-70}
          shadow-camera-right={70}
          shadow-camera-top={70}
          shadow-camera-bottom={-70}
          shadow-bias={-0.0004}
        />
        <directionalLight position={[-45, 10, -45]} intensity={0.45} color="#c2410c" />

        {/* Camera Rig (Visor vs Orbit Controls) */}
        <CameraRig
          isFirstPerson={isFirstPerson}
          astronautPos={astronautCurrentPos}
          route={activeRoute}
          progressPercent={simulationProgress}
        />

        {/* Photoreal Geological Martian Terrain */}
        <PhotorealMartianTerrain
          activeLayers={activeLayers}
          onTerrainClick={onTerrainClick}
          dustStorm={dustStorm}
        />

        {/* Instanced Natural Basaltic Boulders & Regolith Rocks */}
        <InstancedMartianRocks />

        {/* 3D HAB ALPHA Expedition Base (Dome, Airlock & Solar Panels) */}
        <HabAlphaBaseModel position={[0, habY, 0]} />

        {/* 3D Ingenuity Mars Helicopter (Scout 1) at Séítah Bedrock */}
        <IngenuityHelicopterModel position={[-14, ingenuityY, 12]} />

        {/* Hab Base Hologram Pin */}
        <HologramWaypointPin
          position={[0, habY, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#00f0ff"
          onClick={() => {}}
          showLabels={showLabels}
        />

        {/* Science Sites Waypoint Pins */}
        {activeLayers.targets &&
          SCIENCE_TARGETS.map(target => {
            const x = (target.lng - 77.4508) * 800;
            const z = -(target.lat - 18.4447) * 800;
            const y = getTerrainHeight(x, z);
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

        {/* Realistic 3D Indian Astronaut Model */}
        <IndianAstronautModel
          progressPercent={simulationProgress}
          route={activeRoute}
          isFirstPerson={isFirstPerson}
        />

        {/* 3D Route Line */}
        <Route3DLine route={activeRoute} />

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
