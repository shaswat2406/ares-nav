import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Radio, AlertTriangle } from 'lucide-react';

// Realistic Martian Atmosphere & Dynamic Dust Storm Simulation
function MartianAtmosphere({ dustStorm }) {
  return (
    <>
      <Stars radius={250} depth={80} count={dustStorm ? 800 : 6000} factor={5} saturation={0.6} fade speed={1.2} />
      
      {/* Ambient solar dust motes */}
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

// Full 3D Jezero Terrain with dynamic vertex shader coloring for NASA Layers
function DynamicShadedTerrain({ activeLayers, onTerrainClick, dustStorm }) {
  const meshRef = useRef();

  const { geometry, texture } = useMemo(() => {
    const size = 160;
    const segments = 240;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    const colors = new Float32Array(pos.count * 3);

    // Track elevations and slope
    const elevations = new Float32Array(pos.count);

    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);

      let height = -2.5;

      // 1. Western River Delta (Elevated plateau where mudstones formed)
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

      // 3. Kodiak Butte (Steep isolated mesa)
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

      // Sand dunes & micro-texture
      height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
      height += Math.sin(x * 1.8 + z * 1.2) * 0.15;

      pos.setY(i, height);
      elevations[i] = height;
    }

    geom.computeVertexNormals();
    const normals = geom.attributes.normal;

    // Dynamic Vertex Colors calculation
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const ny = normals.getY(i); // Dot product with up-vector [0, 1, 0] gives slope!
      const slopeDeg = Math.acos(Math.min(1.0, Math.max(0.0, ny))) * (180 / Math.PI);

      let r = 0.65;
      let g = 0.28;
      let b = 0.12;

      // Layer 1: Slope Hazard (>15 deg marked in glowing crimson)
      if (activeLayers.hazards && slopeDeg > 15.0) {
        r = 0.95;
        g = 0.10;
        b = 0.15;
      }
      // Layer 2: CRISM Mineralogy (Smectite Clays & Carbonates in delta & Kodiak)
      else if (activeLayers.mineralogy && ((x < -12 && x > -45 && Math.abs(z) < 25) || (Math.sqrt((x - 14)**2 + (z - 22)**2) < 6.0))) {
        r = 0.75;
        g = 0.25;
        b = 0.95; // Glowing purple/magenta spectral signature
      }
      // Layer 3: Safe traversable plains in subtle emerald/cyan
      else if (activeLayers.hazards && slopeDeg < 8.0) {
        r = 0.15;
        g = 0.65;
        b = 0.45;
      }

      colors[i * 3] = r;
      colors[i * 3 + 1] = g;
      colors[i * 3 + 2] = b;
    }

    geom.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    // High-Res Martian Regolith Base Texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(512, 512, 30, 512, 512, 600);
    grad.addColorStop(0, '#c75114');
    grad.addColorStop(0.5, '#8c2d08');
    grad.addColorStop(1, '#3b1102');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    for (let i = 0; i < 15000; i++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      ctx.fillStyle = Math.random() > 0.6 ? 'rgba(255, 210, 160, 0.2)' : 'rgba(20, 5, 2, 0.25)';
      ctx.fillRect(px, py, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return { geometry: geom, texture: tex };
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
        roughness={dustStorm ? 0.95 : 0.82}
        metalness={0.15}
        wireframe={activeLayers.topography}
      />
    </mesh>
  );
}

// Compact Holographic Waypoint Pins (with Hover expansion & Label Toggle)
function HologramWaypointPin({ position, label, subtext, color, onClick, showLabels }) {
  const [hovered, setHovered] = useState(false);

  return (
    <group position={position}>
      <Float speed={2.5} rotationIntensity={0.2} floatIntensity={0.4}>
        {/* Glowing Pin Tip */}
        <mesh position={[0, 2.2, 0]}>
          <octahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={hovered ? 1.8 : 1.1} />
        </mesh>
        {/* Holographic Stalk */}
        <mesh position={[0, 1.1, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.2]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Float>

      {/* Holographic Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[0.8, 1.6, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Glass Card on Hover or when Labels are ON */}
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

// 3D Path with Line-of-Sight Occlusion Warning
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
function AstronautAvatar({ progressPercent, route }) {
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

export function Mars3DView({ activeLayers, activeRoute, onSelectTarget, onTerrainClick, customTarget, simulationProgress = 0, dustStorm = false, showLabels = true }) {
  return (
    <div className="w-full h-full relative bg-[#010206]">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere dustStorm={dustStorm} />

        <ambientLight intensity={dustStorm ? 0.3 : 0.5} />
        <directionalLight
          position={[60, 75, 45]}
          intensity={dustStorm ? 1.4 : 2.6}
          color={dustStorm ? "#ea580c" : "#ffffff"}
          castShadow
        />
        <directionalLight position={[-45, -20, -45]} intensity={0.5} color="#c24810" />

        {/* Dynamic Shader Terrain with Real-Time NASA Layer Coloring */}
        <DynamicShadedTerrain
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
        <AstronautAvatar progressPercent={simulationProgress} route={activeRoute} />

        {/* 3D Route Line */}
        <Route3DLine route={activeRoute} />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={10}
          maxDistance={140}
        />
      </Canvas>

      {/* Line-of-Sight Comms Shadow HUD Warning */}
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
