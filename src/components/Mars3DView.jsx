import React, { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';

// Realistic Martian Atmosphere: Deep starfield + floating dust motes
function MartianAtmosphere() {
  return (
    <>
      <Stars radius={250} depth={80} count={6000} factor={5} saturation={0.6} fade speed={1.2} />
      {/* Golden solar dust particles blowing across the crater */}
      <Sparkles count={300} scale={[140, 30, 140]} size={3.5} speed={0.5} color="#f97316" opacity={0.65} />
      <Sparkles count={150} scale={[120, 20, 120]} size={2.5} speed={0.3} color="#38bdf8" opacity={0.25} />
    </>
  );
}

// Generate Realistic High-Resolution Martian Terrain with Canyon, River Delta, and Craters
function MassiveMartianTerrain({ activeLayers, onTerrainClick }) {
  const meshRef = useRef();

  const { geometry, texture, normalMap } = useMemo(() => {
    // Large 160x160 scale with 256x256 vertex mesh for ultra high detail
    const size = 160;
    const segments = 240;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;

    // Procedural Elevation Sculpting based on actual Jezero Crater USGS Topography:
    // 1. Ancient Neretva Vallis River Inflow Canyon (entering from North-West)
    // 2. Stratified Triangular River Delta Fan
    // 3. Kodiak Butte (isolated mesa standing tall)
    // 4. Jezero Impact Crater Rim walls surrounding the basin
    // 5. Aeolian transverse sand dunes and ripple fields
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      const d = Math.sqrt(x * x + z * z);

      let height = -2.5; // Basin floor

      // 1. Western River Delta (Elevated plateau where mudstones formed)
      if (x < -8 && x > -55 && Math.abs(z) < 35) {
        const deltaProgress = (Math.abs(x) - 8) / 40.0;
        const deltaFanShape = Math.max(0, 1.0 - Math.abs(z) / (15 + deltaProgress * 25));
        height += Math.min(6.5, deltaProgress * 5.8 * deltaFanShape);
      }

      // 2. Neretva Vallis Inflow River Canyon (Carving through the western scarp)
      const riverPath = Math.sin(x * 0.1) * 6 - 8;
      const distToRiver = Math.abs(z - riverPath);
      if (x < -20 && distToRiver < 8) {
        const canyonDepth = Math.cos((distToRiver / 8) * (Math.PI / 2)) * 3.8;
        height -= canyonDepth; // Carve riverbed
      }

      // 3. Kodiak Butte (Steep isolated stratified mesa)
      const dKodiak = Math.sqrt((x - 14) ** 2 + (z - 22) ** 2);
      if (dKodiak < 7.0) {
        // Flat-topped butte with steep talus cliffs
        const butteFactor = Math.cos((dKodiak / 7.0) * (Math.PI / 2));
        height += Math.pow(butteFactor, 0.4) * 7.5;
      }

      // 4. Belva Impact Crater (Secondary impact crater bowl)
      const dBelva = Math.sqrt((x + 28) ** 2 + (z + 24) ** 2);
      if (dBelva < 14.0) {
        const craterRim = Math.sin((dBelva / 14.0) * Math.PI) * 2.2;
        const craterBowl = Math.cos((dBelva / 14.0) * (Math.PI / 2)) * 4.5;
        height += (craterRim - craterBowl);
      }

      // 5. Jezero Outer Crater Rim (Massive circular mountain ring)
      if (d > 45) {
        const rimDist = d - 45;
        height += Math.pow(rimDist * 0.35, 1.8);
      }

      // 6. Natural Martian Regolith dunes & micro-texture
      height += Math.sin(x * 0.4) * Math.cos(z * 0.4) * 0.6;
      height += Math.sin(x * 1.8 + z * 1.2) * 0.15;
      height += Math.sin(x * 4.0 - z * 3.0) * 0.04;

      pos.setY(i, height);
    }
    geom.computeVertexNormals();

    // High-Resolution 2048x2048 Realistic Mars Texture Map
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 2048;
    const ctx = canvas.getContext('2d');

    // Martian Iron-Oxide Regolith Gradient
    const grad = ctx.createRadialGradient(1024, 1024, 60, 1024, 1024, 1300);
    grad.addColorStop(0.0, '#a3380c'); // Vibrant Mars rust ochre
    grad.addColorStop(0.35, '#c75114'); // Terracotta dust plains
    grad.addColorStop(0.65, '#732508'); // Dark basaltic volcanic soil
    grad.addColorStop(0.85, '#4a1503'); // Shadowed crater scarps
    grad.addColorStop(1.0, '#260a02'); // Deep crater boundary
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 2048);

    // Ancient Alluvial Delta Fan Layer (Lighter beige-tan clay sediments)
    const deltaGrad = ctx.createRadialGradient(550, 1024, 40, 550, 1024, 600);
    deltaGrad.addColorStop(0, 'rgba(230, 165, 115, 0.55)');
    deltaGrad.addColorStop(0.6, 'rgba(195, 125, 80, 0.35)');
    deltaGrad.addColorStop(1, 'rgba(163, 56, 12, 0)');
    ctx.fillStyle = deltaGrad;
    ctx.beginPath();
    ctx.arc(550, 1024, 600, 0, Math.PI * 2);
    ctx.fill();

    // Neretva Vallis Dark Riverbed Channel
    ctx.strokeStyle = 'rgba(50, 18, 6, 0.45)';
    ctx.lineWidth = 45;
    ctx.beginPath();
    ctx.moveTo(0, 850);
    ctx.bezierCurveTo(300, 950, 600, 980, 850, 1024);
    ctx.stroke();

    // High-density realistic sand ripples & rock ejecta specks
    for (let i = 0; i < 35000; i++) {
      const px = Math.random() * 2048;
      const py = Math.random() * 2048;
      const sz = Math.random() * 3.0;
      ctx.fillStyle = Math.random() > 0.6 
        ? 'rgba(255, 210, 160, 0.28)' 
        : 'rgba(30, 10, 3, 0.35)';
      ctx.fillRect(px, py, sz, sz);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.ClampToEdgeWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;

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
        roughness={0.80}
        metalness={0.18}
        wireframe={activeLayers.topography}
      />
    </mesh>
  );
}

// 3D Astronaut Avatar with dynamic walk animation
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
      <Float speed={3.5} rotationIntensity={0.3} floatIntensity={0.6}>
        {/* Futuristic Spacesuit Helmet & Backpack Model */}
        <mesh ref={avatarRef} position={[0, 0.5, 0]}>
          <dodecahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color="#00f0ff" emissive="#00f0ff" emissiveIntensity={1.4} />
        </mesh>
        {/* Ground Projection Beacon Rings */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -1.2, 0]}>
          <ringGeometry args={[1.6, 2.2, 32]} />
          <meshBasicMaterial color="#00f0ff" transparent opacity={0.7} side={THREE.DoubleSide} />
        </mesh>
      </Float>
      <Html distanceFactor={35} position={[0, 4.0, 0]} center>
        <div className="bg-slate-950/95 text-cyan-300 border border-cyan-400 px-2.5 py-1 rounded-md text-[11px] font-mono whitespace-nowrap shadow-2xl font-bold flex items-center gap-1.5 backdrop-blur pointer-events-none hud-glow-cyan">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          EVA ASTRONAUT: SHASWAT SINHA
        </div>
      </Html>
    </group>
  );
}

// Clicked Custom Target Pin
function CustomTargetPin({ position }) {
  return (
    <group position={[position.x, 1.8, position.z]}>
      <Float speed={4} rotationIntensity={0.4} floatIntensity={0.8}>
        <mesh position={[0, 3.2, 0]}>
          <octahedronGeometry args={[1.4, 0]} />
          <meshStandardMaterial color="#ff9900" emissive="#ff9900" emissiveIntensity={1.6} />
        </mesh>
        <mesh position={[0, 1.6, 0]}>
          <cylinderGeometry args={[0.12, 0.12, 3.2]} />
          <meshBasicMaterial color="#ff9900" />
        </mesh>
      </Float>
      <Html distanceFactor={35} position={[0, 5.2, 0]} center>
        <div className="bg-slate-950/95 text-amber-300 border border-amber-400 px-3 py-1 rounded-md text-[11px] font-mono whitespace-nowrap shadow-2xl font-bold backdrop-blur pointer-events-none hud-glow-amber">
          🎯 TARGET COORDINATE // A* ROUTED
        </div>
      </Html>
    </group>
  );
}

// Hologram Scientific Sites
function HologramWaypoint({ position, label, subtext, color, onClick }) {
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.3} floatIntensity={0.6}>
        <mesh position={[0, 3.4, 0]}>
          <octahedronGeometry args={[1.2, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.1} />
        </mesh>
        <mesh position={[0, 1.7, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 3.4]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Float>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.1, 0]}>
        <ringGeometry args={[1.0, 2.2, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      <Html distanceFactor={38} position={[0, 5.4, 0]} center>
        <button
          onClick={onClick}
          className="bg-slate-950/95 text-slate-100 border border-cyan-500/50 hover:border-cyan-300 hover:scale-110 px-3 py-1.5 rounded-lg text-[11px] font-mono whitespace-nowrap shadow-2xl transition-all cursor-pointer backdrop-blur"
        >
          <div className="font-bold text-cyan-300">{label}</div>
          {subtext && <div className="text-[10px] text-slate-400">{subtext}</div>}
        </button>
      </Html>
    </group>
  );
}

// 3D Glowing Route Ribbon
function Route3DRibbon({ route }) {
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

  const isSafe = route.safetyScore > 80;

  return (
    <primitive
      object={new THREE.Line(
        lineGeometry,
        new THREE.LineBasicMaterial({
          color: isSafe ? 0x00ff88 : 0xff3344,
          linewidth: 5,
          transparent: true,
          opacity: 0.95
        })
      )}
    />
  );
}

export function Mars3DView({ activeLayers, activeRoute, onSelectTarget, onTerrainClick, customTarget, simulationProgress = 0 }) {
  return (
    <div className="relative w-full h-[680px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_40px_rgba(0,0,0,0.9)] bg-[#010308]">
      <Canvas
        camera={{ position: [0, 48, 65], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <MartianAtmosphere />

        <ambientLight intensity={0.5} />
        {/* Mars harsh low-angle sun with realistic shadows */}
        <directionalLight position={[60, 75, 45]} intensity={2.6} castShadow />
        {/* Rust regolith planetary bounce light */}
        <directionalLight position={[-45, -20, -45]} intensity={0.6} color="#c24810" />

        {/* Massive 160-Unit Martian Surface */}
        <MassiveMartianTerrain activeLayers={activeLayers} onTerrainClick={onTerrainClick} />

        {/* Base Hab Station */}
        <HologramWaypoint
          position={[0, 0, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#00f0ff"
          onClick={() => {}}
        />

        {/* Science Sites */}
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

        {/* Custom Click Target */}
        {customTarget && <CustomTargetPin position={customTarget} />}

        {/* Live Astronaut Model */}
        <AstronautAvatar progressPercent={simulationProgress} route={activeRoute} />

        {/* 3D Route Ribbon */}
        <Route3DRibbon route={activeRoute} />

        <OrbitControls
          enableDamping
          dampingFactor={0.06}
          maxPolarAngle={Math.PI / 2.02}
          minDistance={10}
          maxDistance={140}
        />
      </Canvas>

      {/* Futuristic Tactical Visor Reticles & HUD Overlays */}
      <div className="absolute top-4 left-4 flex items-center gap-3">
        <div className="bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2 shadow-2xl">
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping"></span>
          <span className="font-heading font-bold tracking-widest">
            JEZERO CRATER // HIGH-RESOLUTION 3D ELEVATION TERRAIN
          </span>
        </div>
      </div>

      <div className="absolute top-4 right-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3.5 py-2 rounded-lg text-xs font-mono text-slate-300 flex items-center gap-2">
        <span className="text-amber-400 font-bold">GRID:</span> 18.4447°N, 77.4508°E (-2570m MOLA)
      </div>

      {/* Navigation Helper */}
      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-3">
        <span>📍 <strong className="text-amber-300">Click Any Ground Point</strong> to Pathfind</span>
        <span>•</span>
        <span>🖱️ <strong className="text-slate-200">Orbit 360°</strong></span>
        <span>•</span>
        <span>📜 <strong className="text-slate-200">Zoom Deep into Craters</strong></span>
      </div>
    </div>
  );
}
