import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Text, Float, Html } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';

// Generate procedural 3D Jezero Crater Terrain Mesh with delta river and crater rim
function MartianTerrain({ activeLayers }) {
  const meshRef = useRef();

  // Create customized terrain geometry with Jezero topographic features
  const { geometry, texture } = useMemo(() => {
    const size = 60;
    const segments = 120;
    const geom = new THREE.PlaneGeometry(size, size, segments, segments);
    geom.rotateX(-Math.PI / 2);

    const pos = geom.attributes.position;
    // Generate terrain elevations
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);

      // Distance from center
      const d = Math.sqrt(x * x + z * z);

      // Jezero Crater Rim (higher elevation outer ring)
      let height = Math.sin(x * 0.15) * Math.cos(z * 0.15) * 1.5;
      
      // Delta fan formation on the west (negative X)
      if (x < -5 && Math.abs(z) < 15) {
        height += (Math.abs(x) - 5) * 0.25; // Delta scarp
      }

      // Kodiak Butte feature
      const dKodiak = Math.sqrt((x - 8) ** 2 + (z - 12) ** 2);
      if (dKodiak < 4) {
        height += Math.cos((dKodiak / 4) * Math.PI) * 2.8;
      }

      // Outer crater rim
      if (d > 22) {
        height += Math.pow((d - 22) * 0.4, 1.6);
      }

      // Micro roughness / dunes
      height += (Math.sin(x * 1.2) * Math.cos(z * 1.2)) * 0.2;

      pos.setY(i, height);
    }
    geom.computeVertexNormals();

    // Procedural Martian surface canvas texture
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');

    // Base Martian Regolith color gradient
    const grad = ctx.createRadialGradient(256, 256, 20, 256, 256, 300);
    grad.addColorStop(0, '#c1440e'); // Deep rust
    grad.addColorStop(0.4, '#e77d32'); // Mars orange
    grad.addColorStop(0.7, '#8b3a16'); // Dark basaltic soil
    grad.addColorStop(1, '#5c1d06'); // Rim shadow
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Dust & texture noise
    for (let i = 0; i < 4000; i++) {
      const px = Math.random() * 512;
      const py = Math.random() * 512;
      const radius = Math.random() * 2;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 180, 120, 0.25)' : 'rgba(40, 15, 5, 0.25)';
      ctx.beginPath();
      ctx.arc(px, py, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(canvas);
    return { geometry: geom, texture: tex };
  }, []);

  return (
    <mesh ref={meshRef} geometry={geometry} receiveShadow castShadow>
      <meshStandardMaterial
        map={texture}
        roughness={0.88}
        metalness={0.12}
        wireframe={activeLayers.topography}
        wireframeLinewidth={1}
      />
    </mesh>
  );
}

// 3D Animated Astronaut Route Polyline
function Route3D({ route, isSafe }) {
  const points = useMemo(() => {
    // Map GPS lat/lng to 3D X/Z coordinates centered on Hab
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
    <group>
      <primitive
        object={new THREE.Line(
          lineGeometry,
          new THREE.LineBasicMaterial({
            color: isSafe ? 0x10b981 : 0xf43f5e,
            linewidth: 3,
            transparent: true,
            opacity: 0.95
          })
        )}
      />
    </group>
  );
}

// 3D Waypoint Pin
function WaypointPin({ position, label, color, onClick, subtext }) {
  return (
    <group position={position}>
      <Float speed={2} rotationIntensity={0.2} floatIntensity={0.4}>
        {/* Glowing Pin Head */}
        <mesh position={[0, 2.5, 0]}>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} />
        </mesh>
        {/* Pin Stem */}
        <mesh position={[0, 1.25, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 2.5]} />
          <meshBasicMaterial color={color} />
        </mesh>
      </Float>

      {/* Interactive HTML Tag on hover */}
      <Html distanceFactor={28} position={[0, 3.5, 0]} center>
        <button
          onClick={onClick}
          className="bg-slate-950/90 text-slate-100 border border-slate-700 hover:border-cyan-400 px-2 py-1 rounded-md text-[10px] font-mono whitespace-nowrap shadow-xl transition-all cursor-pointer backdrop-blur"
        >
          <div className="font-bold text-cyan-300">{label}</div>
          {subtext && <div className="text-[9px] text-slate-400">{subtext}</div>}
        </button>
      </Html>
    </group>
  );
}

// 3D Hazard Domes
function HazardZone3D({ center, radius, color, label }) {
  const x = (center[1] - 77.4508) * 800;
  const z = -(center[0] - 18.4447) * 800;
  const r3d = radius * 0.012;

  return (
    <group position={[x, 0.6, z]}>
      <mesh>
        <cylinderGeometry args={[r3d, r3d, 0.4, 32]} />
        <meshBasicMaterial color={color} transparent opacity={0.35} wireframe />
      </mesh>
      <Html distanceFactor={30} position={[0, 1.5, 0]} center>
        <div className="bg-rose-950/80 border border-rose-600/60 text-rose-300 text-[9px] font-mono px-1.5 py-0.5 rounded backdrop-blur">
          ⚠️ {label}
        </div>
      </Html>
    </group>
  );
}

export function Mars3DView({ activeLayers, activeRoute, onSelectTarget }) {
  return (
    <div className="relative w-full h-[580px] rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-black">
      {/* 3D Canvas */}
      <Canvas
        camera={{ position: [0, 24, 32], fov: 50 }}
        shadows
        gl={{ antialias: true }}
      >
        <ambientLight intensity={0.4} />
        {/* Harsh Martian Sunlight */}
        <directionalLight
          position={[30, 40, 20]}
          intensity={1.8}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        {/* Subtle orange bounce light */}
        <directionalLight position={[-20, -10, -20]} intensity={0.3} color="#f97316" />

        {/* Procedural Jezero Surface */}
        <MartianTerrain activeLayers={activeLayers} />

        {/* Hab Base 3D Marker */}
        <WaypointPin
          position={[0, 0, 0]}
          label="HAB ALPHA"
          subtext="Butler Landing Site"
          color="#38bdf8"
          onClick={() => {}}
        />

        {/* Science Targets 3D Markers */}
        {activeLayers.targets && SCIENCE_TARGETS.map(target => {
          const x = (target.lng - 77.4508) * 800;
          const z = -(target.lat - 18.4447) * 800;
          return (
            <WaypointPin
              key={target.id}
              position={[x, 0, z]}
              label={target.name}
              subtext={target.targetMineral}
              color="#c084fc"
              onClick={() => onSelectTarget(target)}
            />
          );
        })}

        {/* Hazard Zones 3D */}
        {activeLayers.hazards && HAZARD_ZONES.map(haz => (
          <HazardZone3D
            key={haz.id}
            center={haz.center}
            radius={haz.radius}
            color={haz.color}
            label={haz.name}
          />
        ))}

        {/* 3D Active Trajectory Line */}
        <Route3D route={activeRoute} isSafe={activeRoute.safetyScore > 80} />

        {/* Controls */}
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxPolarAngle={Math.PI / 2.1}
          minDistance={10}
          maxDistance={70}
        />
      </Canvas>

      {/* 3D Viewport HUD Overlay */}
      <div className="absolute top-3 left-3 bg-slate-950/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono flex items-center gap-2 pointer-events-none text-slate-300">
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
        <span>3D DIGITAL ELEVATION MODEL // INTERACTIVE ORBIT</span>
      </div>

      <div className="absolute bottom-3 left-3 bg-slate-950/85 backdrop-blur-md border border-slate-800/80 px-3 py-1 rounded text-[11px] font-mono text-slate-400 pointer-events-none">
        🖱️ <span className="text-slate-200">Left Click + Drag</span> to Rotate | <span className="text-slate-200">Scroll</span> to Zoom | <span className="text-slate-200">Right Click</span> to Pan
      </div>
    </div>
  );
}
