import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';

// Animated Mars Atmosphere & Dust Particles
function MartianAtmosphere() {
  return (
    <>
      {/* Distant space stars */}
      <Stars radius={120} depth={50} count={3000} factor={4} saturation={0.5} fade speed={1} />
      {/* Floating Martian dust motes illuminated by the sun */}
      <Sparkles count={150} scale={50} size={2.5} speed={0.4} color="#f97316" opacity={0.6} />
      <Sparkles count={80} scale={40} size={3} speed={0.2} color="#38bdf8" opacity={0.3} />
    </>
  );
}

// Ultra-realistic Jezero Crater 3D Terrain
function PhotorealTerrain({ activeLayers }) {
  const meshRef = useRef();

  const { geometry, texture, normalMap } = useMemo(() => {
    const size = 70;
    const segments = 160;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);

      // Western river delta fan (elevated scarp drop-off)
      let height = -1.0;
      if (x < -4) {
        const deltaRidge = (Math.abs(x) - 4) * 0.45;
        height += Math.min(deltaRidge, 3.8);
      }

      // Kodiak Butte (isolated mesa)
      const dKodiak = Math.sqrt((x - 8) ** 2 + (z - 12) ** 2);
      if (dKodiak < 4.5) {
        height += Math.cos((dKodiak / 4.5) * (Math.PI / 2)) * 3.6;
      }

      // Outer impact crater rim wall
      if (d > 24) {
        height += Math.pow((d - 24) * 0.45, 1.7);
      }

      // Layered sedimentary dunes & ripples
      height += Math.sin(x * 0.8) * Math.cos(z * 0.8) * 0.35;
      height += Math.sin(x * 2.5 + z * 1.5) * 0.08;

      pos.setY(i, height);
    }
    geom.computeVertexNormals();

    // High-fidelity procedural Martian surface shader texture
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Rich Mars regolith gradient
    const grad = ctx.createRadialGradient(512, 512, 40, 512, 512, 600);
    grad.addColorStop(0, '#9e330a');   // Deep oxidized iron
    grad.addColorStop(0.3, '#c24810'); // Martian ochre
    grad.addColorStop(0.65, '#782806'); // Basaltic volcanic plain
    grad.addColorStop(1, '#3b1102');    // Crater rim shadows
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 1024);

    // Delta silt deposition channels (lighter clay silt tones)
    ctx.fillStyle = 'rgba(215, 140, 95, 0.28)';
    ctx.beginPath();
    ctx.arc(320, 512, 220, 0, Math.PI * 2);
    ctx.fill();

    // High frequency sand ripples
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

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        map={texture}
        roughness={0.82}
        metalness={0.15}
        wireframe={activeLayers.topography}
      />
    </mesh>
  );
}

// 3D Animated Astronaut Model / Rover Indicator
function AstronautAvatar({ progressPercent, route }) {
  const avatarRef = useRef();
  
  // Calculate position along route based on progress
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

  useFrame((state) => {
    if (avatarRef.current) {
      avatarRef.current.rotation.y += 0.02;
    }
  });

  return (
    <group position={pos}>
      <Float speed={3} rotationIntensity={0.2} floatIntensity={0.5}>
        {/* Glowing Astronaut Beacon */}
        <mesh ref={avatarRef}>
          <dodecahedronGeometry args={[0.9, 0]} />
          <meshStandardMaterial color="#06b6d4" emissive="#0891b2" emissiveIntensity={1.2} />
        </mesh>
        {/* Dynamic EVA Pulse Ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.6, 0]}>
          <ringGeometry args={[1.2, 1.5, 32]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0.6} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Html distanceFactor={25} position={[0, 2.8, 0]} center>
        <div className="bg-cyan-950/90 text-cyan-200 border border-cyan-400 px-2 py-0.5 rounded text-[10px] font-mono whitespace-nowrap shadow-xl font-bold flex items-center gap-1 backdrop-blur">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          ASTRONAUT: SHASWAT
        </div>
      </Html>
    </group>
  );
}

// 3D Holographic Waypoint Pins
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

      {/* Holographic Base Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.05, 0]}>
        <ringGeometry args={[0.6, 1.4, 24]} />
        <meshBasicMaterial color={color} transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

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

// Glowing 3D Traversal Route Ribbon
function Route3DRibbon({ route, isSafe }) {
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
          color: isSafe ? 0x10b981 : 0xf43f5e,
          linewidth: 4,
          transparent: true,
          opacity: 0.95
        })
      )}
    />
  );
}

export function Mars3DView({ activeLayers, activeRoute, onSelectTarget, simulationProgress = 0 }) {
  return (
    <div className="relative w-full h-[600px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#030712]">
      {/* 3D WebGL Canvas */}
      <Canvas
        camera={{ position: [0, 26, 34], fov: 48 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere />

        <ambientLight intensity={0.45} />
        {/* Harsh Martian Sun */}
        <directionalLight
          position={[35, 45, 25]}
          intensity={2.2}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Warm ochre regolith bounce light */}
        <directionalLight position={[-25, -15, -25]} intensity={0.5} color="#ea580c" />

        {/* 3D Surface Terrain */}
        <PhotorealTerrain activeLayers={activeLayers} />

        {/* Hab Base Marker */}
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

        {/* Live Astronaut Position in 3D */}
        <AstronautAvatar progressPercent={simulationProgress} route={activeRoute} />

        {/* 3D Traversal Route */}
        <Route3DRibbon route={activeRoute} isSafe={activeRoute.safetyScore > 80} />

        {/* Orbit Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.05}
          minDistance={8}
          maxDistance={80}
        />
      </Canvas>

      {/* Futuristic Tactical HUD Overlays (Top / Bottom) */}
      <div className="absolute top-4 left-4 flex items-center gap-3 pointer-events-none">
        <div className="bg-slate-950/85 backdrop-blur-md border border-cyan-500/40 px-3.5 py-1.5 rounded-xl text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-bold tracking-wider">MOLA DIGITAL ELEVATION MODEL // 3D ORBIT</span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-950/85 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-xl text-xs font-mono text-slate-300 pointer-events-none flex items-center gap-2">
        <span className="text-orange-400">COORDINATES:</span> 18.4447°N, 77.4508°E
      </div>

      {/* Control Helper Pill */}
      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800/80 px-4 py-1.5 rounded-xl text-[11px] font-mono text-slate-400 pointer-events-none flex items-center gap-3">
        <span>🖱️ <strong className="text-slate-200">Left Click + Drag</strong> to Orbit</span>
        <span>•</span>
        <span>📜 <strong className="text-slate-200">Scroll</strong> to Zoom</span>
        <span>•</span>
        <span>👆 <strong className="text-slate-200">Click Pins</strong> to Inspect</span>
      </div>
    </div>
  );
}
