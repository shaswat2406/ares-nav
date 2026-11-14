import React, { useRef, useMemo, useState } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Float, Html, Stars, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { HABITAT_BASE, SCIENCE_TARGETS, HAZARD_ZONES } from '../data/jezeroData';
import { sfx } from '../utils/soundFX';
import { Globe, ZoomIn, ZoomOut, Compass, Navigation } from 'lucide-react';

// Photorealistic 3D Mars Globe (Google Earth for Mars)
function MarsPlanetaryGlobe({ onSiteSelect, activeSite }) {
  const globeRef = useRef();

  // Create high-res Mars planetary texture
  const marsTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 2048;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // Base Martian Rust
    const grad = ctx.createLinearGradient(0, 0, 0, 1024);
    grad.addColorStop(0, '#e27b4e');
    grad.addColorStop(0.3, '#c24810');
    grad.addColorStop(0.6, '#8e3009');
    grad.addColorStop(1, '#4a1503');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 2048, 1024);

    // Valles Marineris canyon system
    ctx.fillStyle = '#300f04';
    ctx.beginPath();
    ctx.ellipse(900, 520, 320, 25, 0.05, 0, Math.PI * 2);
    ctx.fill();

    // Olympus Mons & Tharsis volcanoes
    ctx.fillStyle = '#691d05';
    ctx.beginPath();
    ctx.arc(620, 420, 70, 0, Math.PI * 2); // Olympus Mons
    ctx.arc(750, 480, 50, 0, Math.PI * 2); // Ascraeus
    ctx.arc(800, 560, 50, 0, Math.PI * 2); // Pavonis
    ctx.arc(850, 640, 50, 0, Math.PI * 2); // Arsia
    ctx.fill();

    // Dark Syrtis Major (near Jezero Crater)
    ctx.fillStyle = '#3a1306';
    ctx.beginPath();
    ctx.ellipse(1450, 480, 120, 180, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Hellas Impact Basin (light ochre)
    ctx.fillStyle = '#e8905e';
    ctx.beginPath();
    ctx.arc(1420, 750, 110, 0, Math.PI * 2);
    ctx.fill();

    // Polar Ice Caps (North and South)
    ctx.fillStyle = '#f8fafc';
    ctx.beginPath();
    ctx.ellipse(1024, 30, 280, 40, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(1024, 994, 220, 30, 0, 0, Math.PI * 2);
    ctx.fill();

    // Planetary crater noise
    for (let i = 0; i < 25000; i++) {
      const px = Math.random() * 2048;
      const py = Math.random() * 1024;
      const r = Math.random() * 2.5;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255, 200, 150, 0.25)' : 'rgba(20, 5, 2, 0.3)';
      ctx.fillRect(px, py, r, r);
    }

    const tex = new THREE.CanvasTexture(canvas);
    return tex;
  }, []);

  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.04;
    }
  });

  // Convert Planetary Latitude/Longitude into 3D Globe Vector
  const getCoordinates3D = (lat, lng, radius = 18.2) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    const x = -(radius * Math.sin(phi) * Math.cos(theta));
    const z = radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(phi);
    return [x, y, z];
  };

  const jezeroPos = getCoordinates3D(18.4447, 77.4508);
  const galePos = getCoordinates3D(-4.5895, 137.4417);
  const olympusPos = getCoordinates3D(18.65, -133.8);

  return (
    <group ref={globeRef}>
      {/* Planetary Sphere */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[18, 64, 64]} />
        <meshStandardMaterial
          map={marsTexture}
          roughness={0.78}
          metalness={0.15}
        />
      </mesh>

      {/* Atmospheric Glow Halo */}
      <mesh scale={[1.025, 1.025, 1.025]}>
        <sphereGeometry args={[18, 64, 64]} />
        <meshBasicMaterial
          color="#ff7733"
          transparent
          opacity={0.18}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Planetary Hotspot 1: Jezero Crater */}
      <group position={jezeroPos}>
        <mesh>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <Html distanceFactor={40} center>
          <button
            onClick={() => onSiteSelect('jezero')}
            className="bg-slate-950/95 border-2 border-cyan-400 text-cyan-300 font-mono text-[10px] px-2.5 py-1 rounded shadow-2xl font-bold cursor-pointer hover:scale-125 transition-all whitespace-nowrap"
          >
            🔴 JEZERO CRATER (DELTA)
          </button>
        </Html>
      </group>

      {/* Planetary Hotspot 2: Gale Crater */}
      <group position={galePos}>
        <mesh>
          <sphereGeometry args={[0.4, 16, 16]} />
          <meshBasicMaterial color="#c084fc" />
        </mesh>
        <Html distanceFactor={40} center>
          <button
            onClick={() => onSiteSelect('gale')}
            className="bg-slate-950/95 border-2 border-purple-400 text-purple-300 font-mono text-[10px] px-2.5 py-1 rounded shadow-2xl font-bold cursor-pointer hover:scale-125 transition-all whitespace-nowrap"
          >
            🌋 GALE CRATER (MT. SHARP)
          </button>
        </Html>
      </group>

      {/* Planetary Hotspot 3: Olympus Mons */}
      <group position={olympusPos}>
        <mesh>
          <sphereGeometry args={[0.45, 16, 16]} />
          <meshBasicMaterial color="#f59e0b" />
        </mesh>
        <Html distanceFactor={40} center>
          <button
            onClick={() => onSiteSelect('olympus')}
            className="bg-slate-950/95 border-2 border-amber-400 text-amber-300 font-mono text-[10px] px-2.5 py-1 rounded shadow-2xl font-bold cursor-pointer hover:scale-125 transition-all whitespace-nowrap"
          >
            🏔️ OLYMPUS MONS (22 KM)
          </button>
        </Html>
      </group>
    </group>
  );
}

export function GoogleMarsEarthView({ onSiteSelect, activeSite }) {
  return (
    <div className="relative w-full h-[680px] rounded-2xl overflow-hidden border border-cyan-500/30 shadow-[0_0_50px_rgba(0,0,0,0.95)] bg-[#010206]">
      <Canvas camera={{ position: [0, 0, 46], fov: 45 }} gl={{ antialias: true }}>
        <Stars radius={300} depth={100} count={7000} factor={5} saturation={0.7} fade speed={0.8} />
        <ambientLight intensity={0.4} />
        <directionalLight position={[50, 20, 40]} intensity={2.5} />
        
        {/* Full 3D Interactive Mars Globe */}
        <MarsPlanetaryGlobe onSiteSelect={onSiteSelect} activeSite={activeSite} />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={22}
          maxDistance={90}
          rotateSpeed={0.6}
        />
      </Canvas>

      {/* Google Earth Navigation Bar Overlay */}
      <div className="absolute top-4 left-4 bg-slate-950/90 backdrop-blur-md border border-cyan-500/40 px-4 py-2 rounded-lg text-xs font-mono text-cyan-300 flex items-center gap-2.5 shadow-2xl">
        <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '12s' }} />
        <span className="font-heading font-bold tracking-widest">
          MARS GLOBAL 3D DIGITAL TWIN // PLANETARY SCALE
        </span>
      </div>

      <div className="absolute bottom-4 left-4 bg-slate-950/90 backdrop-blur-md border border-slate-800 px-4 py-2 rounded-lg text-xs font-mono text-slate-400 flex items-center gap-3">
        <span>🌍 <strong className="text-cyan-300">Rotate Planet</strong> with Mouse</span>
        <span>•</span>
        <span>📜 <strong className="text-cyan-300">Scroll to Zoom</strong> from Space</span>
        <span>•</span>
        <span>📍 <strong className="text-amber-300">Click Any Landing Site</strong> to Enter Surface View</span>
      </div>
    </div>
  );
}
