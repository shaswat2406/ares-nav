import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Radio, AlertTriangle, Eye, Compass } from 'lucide-react';

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

// Photorealistic Jezero Crater Surface Terrain
function PhotorealMartianTerrain({ activeLayers, onTerrainClick, dustStorm }) {
  const meshRef = useRef();

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

      // 1. Western River Delta
      if (x < -8 && x > -55 && Math.abs(z) < 35) {
        const deltaProgress = (Math.abs(x) - 8) / 40.0;
        const deltaFanShape = Math.max(0, 1.0 - Math.abs(z) / (15 + deltaProgress * 25));
        height += Math.min(6.5, deltaProgress * 5.8 * deltaFanShape);
      }

      // 2. Neretva Vallis Inflow River Canyon
      const riverPath = Math.sin(x * 0.1) * 6 - 8;
      const distToRiver = Math.abs(z - riverPath);
      if (x < -20 && distToRiver < 8) {
        const canyonDepth = Math.cos((distToRiver / 8) * (Math.PI / 2)) * 3.8;
        height -= canyonDepth;
      }

      // 3. Kodiak Butte
      const dKodiak = Math.sqrt((x - 14) ** 2 + (z - 22) ** 2);
      if (dKodiak < 7.0) {
        const butteFactor = Math.cos((dKodiak / 7.0) * (Math.PI / 2));
        height += Math.pow(butteFactor, 0.4) * 7.5;
      }

      // 4. Belva Impact Crater
      const dBelva = Math.sqrt((x + 28) ** 2 + (z + 24) ** 2);
      if (dBelva < 14.0) {
        const craterRim = Math.sin((dBelva / 14.0) * Math.PI) * 2.2;
        const craterBowl = Math.cos((dBelva / 14.0) * (Math.PI / 2)) * 4.5;
        height += (craterRim - craterBowl);
      }

      // 5. Outer crater rim wall
      if (d > 45) {
        const rimDist = d - 45;
        height += Math.pow(rimDist * 0.35, 1.8);
      }

      // Micro-texture
      height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
      height += Math.sin(x * 1.8 + z * 1.2) * 0.15;

      pos.setY(i, height);
    }

    geom.computeVertexNormals();
    const normals = geom.attributes.normal;

    // Authentic Mars Regolith Palette
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
        roughness={dustStorm ? 0.95 : 0.84}
        metalness={0.12}
        wireframe={activeLayers.topography}
      />
    </mesh>
  );
}

// Camera Controller: Handles Orbit Mode vs. First-Person Visor POV
function CameraRig({ isFirstPerson, astronautPos, route, progressPercent }) {
  useFrame(({ camera }) => {
    if (isFirstPerson && astronautPos) {
      // Position camera right at astronaut eye level (1.8m above Martian surface)
      const eyeLevel = new THREE.Vector3(astronautPos[0], astronautPos[1] + 1.2, astronautPos[2]);
      camera.position.lerp(eyeLevel, 0.15);

      // Determine look-ahead target along path
      const totalWps = route.waypoints.length;
      const nextIndex = Math.min(
        Math.floor((progressPercent / 100) * (totalWps - 1)) + 1,
        totalWps - 1
      );
      const nextWp = route.waypoints[nextIndex];
      const lookX = (nextWp[1] - 77.4508) * 800;
      const lookZ = -(nextWp[0] - 18.4447) * 800;

      // Smoothly steer head direction towards upcoming waypoint
      const lookTarget = new THREE.Vector3(lookX, astronautPos[1] + 1.2, lookZ);
      camera.lookAt(lookTarget);
    }
  });

  return null;
}

// Compact Holographic Waypoint Pins
function HologramWaypointPin({ position, label, subtext, color, onClick, showLabels }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh position={[0, 2.2, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.8 : 1.1} />
        </mesh>
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.2]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Float>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[0.8, 1.6, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {(showLabels || hovered) && (
        <Html distanceFactor={35} position={[0, 3.8, 0]} center>
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

// 3D Astronaut Avatar
function AstronautAvatar({ progressPercent, route, isFirstPerson }) {
  const avatarRef = useRef();

  const pos = useMemo(() => {
    const totalWps = route.waypoints.length;
    const index = Math.min(
      Math.floor((progressPercent / 100) * (totalWps - 1)),
      totalWps - 1
    );
    const wp = route.waypoints[index];
    const x = (wp[1] - 77.4508) * 800;
    const z = -(wp[0] - 18.4447) * 800;
    return [x, 2.0, z];
  }, [progressPercent, route]);

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.rotation.y += 0.03;
    }
  });

  // Hide 3D body if inside first-person helmet view
  if (isFirstPerson) return null;

  return (
    <group position={pos}>
      <Float speed={3.5} rotationIntensity={0.2} floatIntensity={0.4}>
        <mesh ref={avatarRef} position={[0, 0.4, 0]}>
          <dodecahedronGeometry args={[1.0, 0]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.4} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.0, 0]}>
          <ringGeometry args={[1.4, 1.9, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Html distanceFactor={30} position={[0, 3.4, 0]} center>
        <div className="bg-slate-950/95 text-cyan-300 border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-2xl font-bold flex items-center gap-1 backdrop-blur pointer-events-none glow-cyan">
          <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
          ASTRONAUT: SHASWAT
        </div>
      </Html>
    </group>
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
  // Compute current astronaut coordinates
  const astronautCurrentPos = useMemo(() => {
    const totalWps = activeRoute.waypoints.length;
    const index = Math.min(
      Math.floor((simulationProgress / 100) * (totalWps - 1)),
      totalWps - 1
    );
    const wp = activeRoute.waypoints[index];
    const x = (wp[1] - 77.4508) * 800;
    const z = -(wp[0] - 18.4447) * 800;
    return [x, 2.0, z];
  }, [simulationProgress, activeRoute]);

  return (
    <div className="w-full h-full relative bg-[#010206]">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere dustStorm={dustStorm} />

        <ambientLight intensity={dustStorm ? 0.3 : 0.55} />
        <directionalLight
          position={[60, 75, 45]}
          intensity={dustStorm ? 1.4 : 2.8}
          color={dustStorm ? "#ea580c" : "#ffffff"}
          castShadow
        />
        <directionalLight position={[-45, -20, -45]} intensity={0.5} color="#c24810" />

        {/* Camera Rig (Handles Orbit vs Visor Mode) */}
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

        {/* Base Hab Station Pin */}
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

        {/* Astronaut Avatar */}
        <AstronautAvatar
          progressPercent={simulationProgress}
          route={activeRoute}
          isFirstPerson={isFirstPerson}
        />

        {/* 3D Route Line */}
        <Route3DLine route={activeRoute} />

        {/* OrbitControls disabled during First-Person mode to keep camera locked in helmet */}
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

      {/* ======================================================= */}
      {/* 🥽 FIRST-PERSON ASTRONAUT HELMET VISOR HUD OVERLAY     */}
      {/* ======================================================= */}
      {isFirstPerson && (
        <div className="absolute inset-0 pointer-events-none z-10 flex flex-col justify-between p-6">
          {/* Curved Visor Vignette / Glass Reflection */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              boxShadow: 'inset 0 0 100px rgba(0, 240, 255, 0.25), inset 0 0 40px rgba(0, 0, 0, 0.85)',
              background: 'radial-gradient(ellipse at center, transparent 65%, rgba(0, 240, 255, 0.08) 100%)'
            }}
          />

          {/* Top Visor Telemetry Ribbon */}
          <div className="relative flex items-center justify-between font-mono text-xs">
            <div className="bg-slate-950/80 backdrop-blur border border-cyan-500/40 px-3 py-1.5 rounded-lg text-cyan-300 flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '10s' }} />
              <span>VISOR HEADING: 284° WNW // TILT: 0.0°</span>
            </div>
            <div className="bg-slate-950/80 backdrop-blur border border-cyan-500/40 px-3 py-1.5 rounded-lg text-emerald-400 font-bold">
              SUIT LIFE SUPPORT: 100% NOMINAL
            </div>
          </div>

          {/* Center Targeting Reticle */}
          <div className="relative flex items-center justify-center">
            <div className="w-16 h-16 rounded-full border border-cyan-400/40 flex items-center justify-center">
              <div className="w-1 h-1 bg-cyan-400 rounded-full" />
              <div className="absolute top-0 w-2 h-0.5 bg-cyan-400" />
              <div className="absolute bottom-0 w-2 h-0.5 bg-cyan-400" />
              <div className="absolute left-0 w-0.5 h-2 bg-cyan-400" />
              <div className="absolute right-0 w-0.5 h-2 bg-cyan-400" />
            </div>
          </div>

          {/* Bottom Footstep Telemetry */}
          <div className="relative flex justify-center">
            <div className="bg-slate-950/80 backdrop-blur border border-cyan-500/40 px-4 py-1.5 rounded-xl text-xs font-mono text-cyan-300">
              GROUND CLEARANCE: 1.8M // TERRAIN FRICTION COEFF: 0.68
            </div>
          </div>
        </div>
      )}

      {/* Line-of-Sight Comms Shadow Warning */}
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
