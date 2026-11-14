import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';

// Animated Mars Atmosphere & Dust Particles
function MartianAtmosphere() {
  return (
    <>
      <Stars radius={120} depth={50} count={3500} factor={4} saturation={0.5} fade speed={1} />
      <Sparkles count={180} scale={50} size={2.5} speed={0.4} color="#f97316" opacity={0.6} />
      <Sparkles count={90} scale={40} size={3} speed={0.2} color="#38bdf8" opacity={0.3} />
    </>
  );
}

// Photorealistic Jezero Crater Terrain with click listener
function PhotorealTerrain({ activeLayers, onTerrainClick }) {
  const meshRef = useRef();

  const { geometry, texture } = useMemo(() => {
    const size = 70;
    const segments = 160;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);

      let height = -1.0;
      if (x < -4) {
        const deltaRidge = (Math.abs(x) - 4) * 0.45;
        height += Math.min(deltaRidge, 3.8);
      }

      const dKodiak = Math.sqrt((x - 8) ** 2 + (z - 12) ** 2);
      if (dKodiak < 4.5) {
        height += Math.cos((dKodiak / 4.5) * (Math.PI / 2)) * 3.6;
      }

      if (d > 24) {
        height += Math.pow((d - 24) * 0.45, 1.7);
      }

      height += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.35;
      height += Math.sin(x * 2.5 + z * 1.5) * 0.08;

      pos.setY(i, height);
    }
    geom.computeVertexNormals();

    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 600);
    grad.addColorStop(0, '#9e330a');
    grad.addColorStop(0.3, '#c24810');
    grad.addColorStop(0.65, '#782806');
    grad.addColorStop(1, '#3b1102');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    ctx.fillStyle = 'rgba(215, 140, 95, 0.28)';
    ctx.beginPath();
    ctx.arc(320, 512, 220, 0, Math.PI * 2);
    ctx.fill();

    for (let i = 0; i < 9000; i++) {
      const px = Math.random() * 1024;
      const py = Math.random() * 1024;
      const r = Math.random() * 2.2;
      ctx.fillStyle = Math.random() > 0.55 ? 'rgba(255, 190, 140, 0.3)' : 'rgba(30, 10, 5, 0.35)';
      ctx.fillRect(px, py, r, r);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return { geometry: geom, texture: tex };
  }, []);

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
        map={texture}
        roughness={0.82}
        metalness={0.15}
        wireframe={activeLayers.topography}
      />
    </mesh>
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
    return [x, 1.4, z];
  }, [progressPercent, route]);

  useFrame(() => {
    if (avatarRef.current) {
      avatarRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={pos}>
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
        <mesh ref={avatarRef}>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1.2} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Html distanceFactor={25} position={[0, 2.8, 0]} center>
        <div className="bg-cyan-950/90 text-cyan-200 border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-xl font-bold flex items-center gap-1 backdrop-blur pointer-events-none">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          ASTRONAUT: SHASWAT
        </div>
      </Html>
    </group>
  );
}

// Clicked Custom Target Pin
function CustomTargetPin({ position }) {
  return (
    <group position={[position.x, 1.2, position.z]}>
      <Float speed={4} rotationIntensity={0.5} floatIntensity={0.8}>
        <mesh position={[0, 2.0, 0]}>
          <octahedronGeometry args={[1.0, 0]} />
          <meshStandardMaterial color="#f59e0b" emissive="#d97706" emissiveIntensity={1.4} />
        </mesh>
        <mesh position={[0, 1.0, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.0]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
      </Float>
      <Html distanceFactor={25} position={[0, 3.4, 0]} center>
        <div className="bg-amber-950/90 text-amber-300 border border-amber-400 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-xl font-bold backdrop-blur pointer-events-none">
          🎯 CUSTOM A* TARGET
        </div>
      </Html>
    </group>
  );
}

// Hologram Waypoints
function HologramWaypoint({ position, label, subtext, color, onClick }) {
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.4} floatIntensity={0.6}>
        <mesh position={[0, 2.6, 0]}>
          <octahedronGeometry args={[0.85, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.9} />
        </mesh>
        <mesh position={[0, 1.3, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 2.6]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Float>
      <Html distanceFactor={28} position={[0, 3.8, 0]} center>
        <button
          onClick={onClick}
          className="bg-slate-950/95 text-slate-100 border border-slate-700 hover:border-cyan-400 hover:scale-110 px-2.5 py-1 rounded-lg text-[10px] font-mono whitespace-nowrap shadow-2xl transition-all cursor-pointer backdrop-blur"
        >
          <div className="font-bold text-cyan-300">{label}</div>
          {subtext && <div className="text-[9px] text-slate-400">{subtext}</div>}
        </button>
      </Html>
    </group>
  );
}

// 3D Route Line
function Route3DRibbon({ route }) {
  const points = useMemo(() => {
    return route.waypoints.map(wp => {
      const x = (wp[1] - 77.4508) * 800;
      const z = -(wp[0] - 18.4447) * 800;
      return new THREE.Vector3(x, 0.8, z);
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
          color: route.safetyScore > 80 ? 0x10b981 : 0xf43f5e,
          linewidth: 4,
          transparent: true,
          opacity: 0.95
        })
      )}
    />
  );
}

export function Mars3DView({ activeLayers, activeRoute, onSelectTarget, onTerrainClick, customTarget, simulationProgress = 0 }) {
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#030712]">
      <Canvas camera={{ position: [0, 26, 34], fov: 48 }} shadows gl={{ antialias: true }}>
        <MartianAtmosphere />

        <ambientLight intensity={0.45} />
        <directionalLight position={[35, 45, 25]} intensity={2.2} castShadow />
        <directionalLight position={[-25, -15, -25]} intensity={0.5} color="#ea580c" />

        {/* Clickable 3D Surface */}
        <PhotorealTerrain activeLayers={activeLayers} onTerrainClick={onTerrainClick} />

        {/* Base Hab */}
        <HologramWaypoint
          position={[0, 0, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#38bdf8"
          onClick={() => {}}
        />

        {/* Science Waypoints */}
        {activeLayers.targets && SCIENCE_TARGETS.map(target => {
          const x = (target.lng - 77.4508) * 800;
          const z = -(target.lat - 18.4447) * 800;
          return (
            <HologramWaypoint
              key={target.id}
              position={[x, 0, z]}
              label={target.name}
              subtext={target.targetMineral}
              color="#c084fc"
              onClick={() => onSelectTarget(target)}
            />
          );
        })}

        {/* Custom Clicked Target Pin */}
        {customTarget && <CustomTargetPin position={customTarget} />}

        {/* Dynamic Astronaut Avatar */}
        <AstronautAvatar progressPercent={simulationProgress} route={activeRoute} />

        {/* Active Route */}
        <Route3DRibbon route={activeRoute} />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={8}
          maxDistance={80}
        />
      </Canvas>

      {/* Interactive Helper Banner */}
      <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-xl">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
        <span className="font-bold tracking-wider">CLICK ANYWHERE ON 3D TERRAIN TO COMPUTE A* PATH</span>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-4 py-1.5 rounded-xl text-[11px] font-mono text-slate-400 pointer-events-none flex items-center gap-3">
        <span>📍 <strong className="text-amber-300">Click Terrain</strong> to Drop Destination</span>
        <span>•</span>
        <span>🖱️ <strong className="text-slate-200">Drag</strong> to Orbit</span>
        <span>•</span>
        <span>📜 <strong className="text-slate-200">Scroll</strong> to Zoom</span>
      </div>
    </div>
  );
}
