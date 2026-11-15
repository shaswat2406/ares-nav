import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Radio, AlertTriangle, Eye, Compass, Shield, Flag } from 'lucide-react';

// Realistic Martian Atmosphere & Dynamic Dust Storm Simulation
function MartianAtmosphere({ dustStorm }) {
  return (
    <>
      <Stars radius={250} depth={80} count={dustStorm ? 800 : 6000} factor={5} saturation={0.6} fade speed={1.2} />
      
      <Sparkles
        count={dustStorm ? 1200 : 350}
        scale={[160, dustStorm ? 60 : 35, 160]}
        size={dustStorm ? 6.0 : 3.0}
        speed={dustStorm ? 3.2 : 0.5}
        color={dustStorm ? "#ea580c" : "#f97316"}
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

// Photorealistic Jezero Crater Surface Terrain with Photographic Mars PBR Textures
function PhotorealMartianTerrain({ activeLayers, onTerrainClick, dustStorm }) {
  const meshRef = useRef();

  // Load high-resolution photographic Mars PBR texture maps
  const textures = useMemo(() => {
    const loader = new THREE.TextureLoader();
    const albedo = loader.load('/textures/mars_surface_albedo.jpg', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
    });
    const normal = loader.load('/textures/mars_surface_normal.jpg', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      tex.needsUpdate = true;
    });
    const roughness = loader.load('/textures/mars_surface_roughness.jpg', (tex) => {
      tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
      tex.repeat.set(16, 16);
      tex.needsUpdate = true;
    });
    return { albedo, normal, roughness };
  }, []);

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
      const d = Math.sqrt(x * x + z * z);

      let height = -2.5;

      if (x < -8 && x > -55 && Math.abs(z) < 35) {
        const deltaProgress = (Math.abs(x) - 8) / 40.0;
        const deltaFanShape = Math.max(0, 1.0 - Math.abs(z) / (15 + deltaProgress * 25));
        height += Math.min(6.5, deltaProgress * 5.8 * deltaFanShape);
      }

      const riverPath = Math.sin(x * 0.1) * 6 - 8;
      const distToRiver = Math.abs(z - riverPath);
      if (x < -20 && distToRiver < 8) {
        const canyonDepth = Math.cos((distToRiver / 8) * (Math.PI / 2)) * 3.8;
        height -= canyonDepth;
      }

      const dKodiak = Math.sqrt((x - 14) ** 2 + (z - 22) ** 2);
      if (dKodiak < 7.0) {
        const butteFactor = Math.cos((dKodiak / 7.0) * (Math.PI / 2));
        height += Math.pow(butteFactor, 0.4) * 7.5;
      }

      const dBelva = Math.sqrt((x + 28) ** 2 + (z + 24) ** 2);
      if (dBelva < 14.0) {
        const craterRim = Math.sin((dBelva / 14.0) * Math.PI) * 2.2;
        const craterBowl = Math.cos((dBelva / 14.0) * (Math.PI / 2)) * 4.5;
        height += (craterRim - craterBowl);
      }

      if (d > 45) {
        const rimDist = d - 45;
        height += Math.pow(rimDist * 0.35, 1.8);
      }

      height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
      height += Math.sin(x * 1.8 + z * 1.2) * 0.15;

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

      let r = 0.72 + (y * 0.02);
      let g = 0.31 + (y * 0.01);
      let b = 0.14;

      if (y < -2.0) {
        r *= 0.75;
        g *= 0.65;
        b *= 0.60;
      }

      if (x < -10 && x > -50 && Math.abs(z) < 30) {
        r = 0.78;
        g = 0.42;
        b = 0.22;
      }

      if (activeLayers.hazards && slopeDeg > 15.0) {
        r = Math.min(1.0, r * 1.4 + 0.3);
        g *= 0.3;
        b *= 0.2;
      }

      if (activeLayers.mineralogy && ((x < -15 && x > -35 && Math.abs(z) < 18) || (Math.sqrt((x - 14)**2 + (z - 22)**2) < 5.0))) {
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
        map={textures.albedo}
        normalMap={textures.normalMap}
        normalScale={new THREE.Vector2(2.2, 2.2)}
        roughnessMap={textures.roughness}
        roughness={dustStorm ? 0.94 : 0.82}
        metalness={0.06}
        wireframe={activeLayers.topography}
      />
    </mesh>
  );
}

// Camera Rig: Handles Orbit Mode vs. First-Person Indian Astronaut Visor
function CameraRig({ isFirstPerson, astronautPos, route, progressPercent }) {
  useFrame(({ camera }) => {
    if (isFirstPerson && astronautPos) {
      // Astronaut head position (1.8m above ground)
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

      const lookTarget = new THREE.Vector3(lookX, astronautPos[1] + 1.4, lookZ);
      camera.lookAt(lookTarget);
    }
  });

  return null;
}

// 🇮🇳 Realistic 3D Indian Astronaut Model (ISRO-NASA Gaganyaan/Artemis Spacesuit)
function IndianAstronautModel({ progressPercent, route, isFirstPerson }) {
  const groupRef = useRef();
  const leftLegRef = useRef();
  const rightLegRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const beaconLightRef = useRef();

  // Position calculation, orientation towards next waypoint, and collision avoidance at stop points
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

    // Avoid colliding with HAB ALPHA pin at the start (progress = 0%)
    if (progressPercent <= 1) {
      x += 2.2;
      z += 2.0;
    } else if (progressPercent >= 98) {
      // Stand off 2.4 meters before the destination waypoint pin so astronaut stands in front facing it
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

    const dx = targetX - x;
    const dz = targetZ - z;
    const angle = Math.atan2(dx, dz);

    return { pos: [x, 0.0, z], rotY: angle };
  }, [progressPercent, route]);

  // Dynamic walking gait animation & idle breathing
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    if (groupRef.current) {
      const isWalking = progressPercent > 0 && progressPercent < 98;
      const walkCycle = time * 8.0;

      if (isWalking) {
        // Vertical hip bob while walking
        groupRef.current.position.y = Math.abs(Math.sin(walkCycle)) * 0.07;
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = Math.sin(walkCycle) * 0.52;
          rightLegRef.current.rotation.x = -Math.sin(walkCycle) * 0.52;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = -Math.sin(walkCycle) * 0.42;
          rightArmRef.current.rotation.x = Math.sin(walkCycle) * 0.42;
        }
      } else {
        // Idle gentle breathing motion
        groupRef.current.position.y = Math.sin(time * 1.8) * 0.02;
        if (leftLegRef.current && rightLegRef.current) {
          leftLegRef.current.rotation.x = 0;
          rightLegRef.current.rotation.x = 0;
        }
        if (leftArmRef.current && rightArmRef.current) {
          leftArmRef.current.rotation.x = 0.12;
          rightArmRef.current.rotation.x = 0.12;
        }
      }

      if (beaconLightRef.current) {
        beaconLightRef.current.intensity = Math.sin(time * 5.0) > 0 ? 1.6 : 0.2;
      }
    }
  });

  if (isFirstPerson) return null; // Inside the helmet in POV mode

  return (
    <group ref={groupRef} position={pos} rotation={[0, rotY, 0]}>
      {/* 1. Torso: Bulky Pressurized Extravehicular Suit (Hard Upper Torso / HUT) */}
      <mesh position={[0, 1.48, 0]}>
        <cylinderGeometry args={[0.42, 0.35, 0.88, 18]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.35} metalness={0.25} />
      </mesh>

      {/* Waist Bearing / Lower Torso Assembly (LTA) Ring */}
      <mesh position={[0, 1.05, 0]}>
        <cylinderGeometry args={[0.36, 0.36, 0.08, 18]} />
        <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.8} />
      </mesh>

      {/* 2. Chest Display and Control Module (DCM) */}
      <group position={[0, 1.5, 0.34]}>
        {/* Main DCM Unit Box */}
        <mesh>
          <boxGeometry args={[0.34, 0.36, 0.14]} />
          <meshStandardMaterial color="#1e293b" roughness={0.4} metalness={0.7} />
        </mesh>
        {/* Digital Telemetry Screen */}
        <mesh position={[0, 0.06, 0.075]}>
          <planeGeometry args={[0.22, 0.12]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={0.8} roughness={0.1} />
        </mesh>
        {/* Pressure Gauge & Toggle Valves */}
        <mesh position={[-0.08, -0.09, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.035, 0.035, 0.03, 12]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
        <mesh position={[0.08, -0.09, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.04, 8]} />
          <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
        </mesh>
      </group>

      {/* Dual Corrugated Life Support Umbilical Hoses (Shoulders to Chest) */}
      <mesh position={[-0.22, 1.72, 0.14]} rotation={[0.4, -0.3, 0]}>
        <torusGeometry args={[0.18, 0.035, 8, 16, Math.PI * 0.9]} />
        <meshStandardMaterial color="#0284c7" roughness={0.6} />
      </mesh>
      <mesh position={[0.22, 1.72, 0.14]} rotation={[0.4, 0.3, 0]}>
        <torusGeometry args={[0.18, 0.035, 8, 16, Math.PI * 0.9]} />
        <meshStandardMaterial color="#dc2626" roughness={0.6} />
      </mesh>

      {/* 3. Primary Life Support System (PLSS Backpack) */}
      <group position={[0, 1.52, -0.36]}>
        {/* Main Backpack Chassis */}
        <mesh>
          <boxGeometry args={[0.62, 0.86, 0.32]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.45} metalness={0.4} />
        </mesh>
        {/* Sublimator Heat Radiation Grill */}
        <mesh position={[0, -0.05, -0.165]}>
          <planeGeometry args={[0.48, 0.52]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>
        {/* Dual High-Pressure Emergency Oxygen Canisters (Top) */}
        <mesh position={[-0.18, 0.48, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.32, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[0.18, 0.48, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.32, 16]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* High-Gain Comms Antenna with Blinking Emergency Beacon */}
        <mesh position={[0.26, 0.78, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.55, 8]} />
          <meshStandardMaterial color="#475569" metalness={0.9} />
        </mesh>
        <mesh position={[0.26, 1.06, 0]}>
          <sphereGeometry args={[0.04, 12, 12]} />
          <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={1.8} />
        </mesh>
      </group>

      {/* 4. Shoulder Mission Badges */}
      {/* 🇮🇳 Indian Tricolour Shoulder Flag (Right Sleeve) */}
      <mesh position={[0.45, 1.74, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, 0.13]} />
        <meshBasicMaterial color="#ff9933" />
      </mesh>
      <mesh position={[0.451, 1.67, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[0.2, 0.045]} />
        <meshBasicMaterial color="#138808" />
      </mesh>

      {/* ISRO-NASA Mission Patch (Left Sleeve) */}
      <mesh position={[-0.45, 1.74, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[0.18, 0.18]} />
        <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={0.4} />
      </mesh>

      {/* 5. Extravehicular Visor Assembly (Helmet & Gold Visor) */}
      <group position={[0, 2.18, 0]}>
        {/* Neck Locking Ring */}
        <mesh position={[0, -0.24, 0]}>
          <cylinderGeometry args={[0.32, 0.34, 0.08, 20]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* White Protective Helmet Dome */}
        <mesh>
          <sphereGeometry args={[0.38, 28, 28]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.25} metalness={0.3} />
        </mesh>
        {/* Reflective Spherical Gold Visor (Filters Mars UV/IR Radiation) */}
        <mesh position={[0, 0.02, 0.16]}>
          <sphereGeometry args={[0.30, 28, 28, 0, Math.PI * 2, 0, Math.PI / 1.8]} />
          <meshStandardMaterial
            color="#ffb703"
            roughness={0.04}
            metalness={0.98}
            emissive="#d97706"
            emissiveIntensity={0.4}
          />
        </mesh>
        {/* Dual Helmet Mounted EVA Floodlights (Left & Right Temples) */}
        <mesh position={[-0.34, 0.12, 0.16]}>
          <boxGeometry args={[0.08, 0.08, 0.14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[-0.34, 0.12, 0.24]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#e0f2fe" emissiveIntensity={2.0} />
        </mesh>
        <mesh position={[0.34, 0.12, 0.16]}>
          <boxGeometry args={[0.08, 0.08, 0.14]} />
          <meshStandardMaterial color="#334155" />
        </mesh>
        <mesh position={[0.34, 0.12, 0.24]}>
          <cylinderGeometry args={[0.03, 0.03, 0.02, 12]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#e0f2fe" emissive="#e0f2fe" emissiveIntensity={2.0} />
        </mesh>
      </group>

      {/* 6. Articulated Pressurized Arms & EVA Gloves */}
      <group ref={leftArmRef} position={[-0.45, 1.76, 0]}>
        {/* Upper Arm & Shoulder Convolute Bellows Ring */}
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.12, 14]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        {/* Elbow Joint */}
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        {/* Forearm & Wrist Disconnect Ring */}
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.96, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.05, 14]} />
          <meshStandardMaterial color="#dc2626" metalness={0.9} />
        </mesh>
        {/* Form-Fitted EVA Spacesuit Glove */}
        <mesh position={[0, -1.08, 0.02]}>
          <boxGeometry args={[0.14, 0.20, 0.12]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.18, 0.03]}>
          <boxGeometry args={[0.12, 0.06, 0.10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      <group ref={rightArmRef} position={[0.45, 1.76, 0]}>
        <mesh position={[0, -0.06, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.12, 14]} />
          <meshStandardMaterial color="#64748b" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.32, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.44, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.7} />
        </mesh>
        <mesh position={[0, -0.78, 0]}>
          <cylinderGeometry args={[0.11, 0.10, 0.34, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.96, 0]}>
          <cylinderGeometry args={[0.11, 0.11, 0.05, 14]} />
          <meshStandardMaterial color="#0284c7" metalness={0.9} />
        </mesh>
        {/* Form-Fitted EVA Spacesuit Glove */}
        <mesh position={[0, -1.08, 0.02]}>
          <boxGeometry args={[0.14, 0.20, 0.12]} />
          <meshStandardMaterial color="#f1f5f9" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.18, 0.03]}>
          <boxGeometry args={[0.12, 0.06, 0.10]} />
          <meshStandardMaterial color="#1e293b" roughness={0.9} />
        </mesh>
      </group>

      {/* 7. Articulated Pressurized Legs & Planetary Regolith Overboots */}
      <group ref={leftLegRef} position={[-0.20, 1.02, 0]}>
        {/* Thigh */}
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* Knee Flex Bellows Joint */}
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        {/* Lower Leg */}
        <mesh position={[0, -0.84, 0]}>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        {/* Planetary Heavy-Duty Regolith Overboot */}
        <mesh position={[0, -1.10, 0.08]}>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
        {/* Deep Lug Tread Sole */}
        <mesh position={[0, -1.20, 0.08]}>
          <boxGeometry args={[0.26, 0.04, 0.44]} />
          <meshStandardMaterial color="#0f172a" roughness={0.95} />
        </mesh>
      </group>

      <group ref={rightLegRef} position={[0.20, 1.02, 0]}>
        <mesh position={[0, -0.28, 0]}>
          <cylinderGeometry args={[0.16, 0.14, 0.52, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.56, 0]}>
          <sphereGeometry args={[0.14, 12, 12]} />
          <meshStandardMaterial color="#475569" roughness={0.8} />
        </mesh>
        <mesh position={[0, -0.84, 0]}>
          <cylinderGeometry args={[0.14, 0.13, 0.48, 14]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.5} />
        </mesh>
        <mesh position={[0, -1.10, 0.08]}>
          <boxGeometry args={[0.24, 0.18, 0.42]} />
          <meshStandardMaterial color="#334155" roughness={0.85} metalness={0.3} />
        </mesh>
        <mesh position={[0, -1.20, 0.08]}>
          <boxGeometry args={[0.26, 0.04, 0.44]} />
          <meshStandardMaterial color="#0f172a" roughness={0.95} />
        </mesh>
      </group>

      {/* Interactive Floating Nameplate */}
      <Html distanceFactor={30} position={[0, 2.9, 0]} center>
        <div className="bg-slate-950/95 text-cyan-300 border border-cyan-400 px-2.5 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-2xl font-bold flex items-center gap-1.5 backdrop-blur pointer-events-none glow-cyan">
          <span className="text-xs">🇮🇳</span>
          <span>ASTRONAUT: SHASWAT SINHA (ISRO-NASA)</span>
        </div>
      </Html>
    </group>
  );
}

// Hologram Waypoints (Elevated Floating GPS Navigation Beacon)
function HologramWaypointPin({ position, label, subtext, color, onClick, showLabels }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      {/* Floating Holographic Crystal Beacon (Elevated to y=4.5 so it never collides with astronaut at ground level) */}
      <Float speed={2.5} rotationIntensity={0.25} floatIntensity={0.5}>
        <mesh position={[0, 4.5, 0]}>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 2.0 : 1.2} />
        </mesh>
      </Float>

      {/* Transparent Holographic Vertical Positioning Light Beam */}
      <mesh position={[0, 2.2, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 4.4, 12]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} />
      </mesh>

      {/* Ground Projection Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.12, 0]}>
        <ringGeometry args={[0.8, 1.8, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Waypoint Label (Elevated above astronaut nameplate) */}
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

// 3D Route Line
function Route3DLine({ route }) {
  const points = useMemo(() => {
    return route.waypoints.map(wp => {
      const x = (wp[1] - 77.4508) * 800;
      const z = -(wp[0] - 18.4447) * 800;
      return new THREE.Vector3(x, 1.2, z);
    });
  }, [route]);

  const lineGeometry = useMemo(() => {
    return new THREE.BufferGeometry().setFromPoints(points);
  }, [points]);

  return (
    <primitive
      object={new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color: route.safetyScore > 80 ? 0x00ff88 : 0xff3344,
          linewidth: 5,
          transparent: true,
          opacity: 0.95
        })
      )}
    />
  );
}

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
    return [x, 0.0, z];
  }, [simulationProgress, activeRoute]);

  return (
    <div className="w-full h-full relative bg-[#010206]">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere dustStorm={dustStorm} />

        <ambientLight intensity={dustStorm ? 0.35 : 0.62} color="#fed7aa" />
        <directionalLight
          position={[68, 52, 45]}
          intensity={dustStorm ? 1.6 : 3.0}
          color={dustStorm ? "#ea580c" : "#fff7ed"}
          castShadow
        />
        <directionalLight position={[-45, 10, -45]} intensity={0.5} color="#c24810" />

        {/* Camera Rig (Visor vs Orbit) */}
        <CameraRig
          isFirstPerson={isFirstPerson}
          astronautPos={astronautCurrentPos}
          route={activeRoute}
          progressPercent={simulationProgress}
        />

        {/* Photoreal Terrain */}
        <PhotorealMartianTerrain
          activeLayers={activeLayers}
          onTerrainClick={onTerrainClick}
          dustStorm={dustStorm}
        />

        {/* Hab Base */}
        <HologramWaypointPin
          position={[0, 0, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#00f0ff"
          onClick={() => {}}
          showLabels={showLabels}
        />

        {/* Science Sites Pins */}
        {activeLayers.targets && SCIENCE_TARGETS.map(target => {
          const x = (target.lng - 77.4508) * 800;
          const z = -(target.lat - 18.4447) * 800;
          return (
            <HologramWaypointPin
              key={target.id}
              position={[x, 0, z]}
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
          {/* Gold Visor Optical UV-Shielding Tint + Curved Glass Vignette */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 120px rgba(245, 158, 11, 0.35), inset 0 0 50px rgba(0, 0, 0, 0.9)',
              background: 'radial-gradient(ellipse at center, transparent 60%, rgba(245, 158, 11, 0.12) 100%)',
              backdropFilter: 'contrast(1.08) brightness(0.96)'
            }}
          />

          {/* Top Visor Telemetry Ribbon with ISRO-NASA & Indian Flag */}
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

          {/* Center Tactical Targeting Reticle with Mineral Spectral Scanner */}
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

          {/* Bottom Footstep & Traction Telemetry */}
          <div className="relative flex justify-center">
            <div className="hud-glass px-4 py-1.5 rounded-xl text-xs font-mono text-amber-300 border-amber-500/40 flex items-center gap-3">
              <span>BOOT ELEVATION: 1.8M MOLA</span>
              <span>•</span>
              <span>TRACTION FRICTION: 0.72 (NOMINAL)</span>
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
