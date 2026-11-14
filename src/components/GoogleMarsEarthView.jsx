/**
 * GoogleMarsEarthView — High-Fidelity 3D Planetary Mars Globe
 * Complete with authentic procedural albedo textures, atmospheric rim scattering,
 * interactive 3D pins for all major NASA/ESA/CNSA rovers & landers, and a Wikipedia dossier modal.
 */

import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { MARS_SITES_CATALOG, SITE_CATEGORIES } from '../data/marsGlobalSites';
import { MarsSiteWikiModal } from './MarsSiteWikiModal';
import { sfx } from '../utils/soundFX';
import {
  Globe,
  Search,
  Filter,
  Layers,
  Compass,
  Rocket,
  Info,
  Maximize2,
  Eye,
  RotateCcw
} from 'lucide-react';

// Convert Planetary Latitude (-90 to +90) & Longitude (0 to 360) into 3D Sphere Coordinates
function latLngToVector3(lat, lng, radius = 18.25) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lng + 180) * (Math.PI / 180);
  const x = -(radius * Math.sin(phi) * Math.cos(theta));
  const z = radius * Math.sin(phi) * Math.sin(theta);
  const y = radius * Math.cos(phi);
  return [x, y, z];
}

// Ultra-Realistic Procedural Mars Surface & Bump Texture Generator
function createPhotorealisticMarsTexture() {
  const width = 4096;
  const height = 2048;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // 1. Base Martian Soil Gradient (Desert Ochre, Hematite Red, Basaltic Brown)
  const baseGrad = ctx.createLinearGradient(0, 0, 0, height);
  baseGrad.addColorStop(0, '#be5a2a');
  baseGrad.addColorStop(0.2, '#c46332');
  baseGrad.addColorStop(0.4, '#a94a1d');
  baseGrad.addColorStop(0.7, '#8f3b14');
  baseGrad.addColorStop(0.9, '#63250c');
  baseGrad.addColorStop(1, '#3b1406');
  ctx.fillStyle = baseGrad;
  ctx.fillRect(0, 0, width, height);

  // Helper to map lat/lng to texture pixel coordinates
  const toXY = (lat, lng) => {
    const x = ((lng + 180) % 360) * (width / 360);
    const y = ((90 - lat) / 180) * height;
    return { x, y };
  };

  // 2. Major Dark Albedo Provinces (Syrtis Major, Sinus Sabaeus, Mare Tyrrhenum, Acidalia)
  ctx.save();
  ctx.filter = 'blur(16px)';

  // Syrtis Major (Volcanic Dark Plain near Jezero Crater ~70°E, 10°N)
  const sm = toXY(10, 70);
  ctx.fillStyle = '#220b04';
  ctx.beginPath();
  ctx.ellipse(sm.x, sm.y, 220, 320, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // Acidalia Planitia (Northern Lowland Dark Basin ~330°E, 50°N)
  const ap = toXY(50, 330);
  ctx.fillStyle = '#2b0f05';
  ctx.beginPath();
  ctx.ellipse(ap.x, ap.y, 350, 260, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Sinus Sabaeus & Meridiani (Equatorial Dark Band)
  const ss = toXY(-5, 350);
  ctx.fillStyle = '#1e0802';
  ctx.beginPath();
  ctx.ellipse(ss.x, ss.y, 450, 110, 0.05, 0, Math.PI * 2);
  ctx.fill();

  // Mare Sirenum / Cimmerium (Southern Highland Dark Shading)
  const ms = toXY(-30, 180);
  ctx.fillStyle = '#260a03';
  ctx.beginPath();
  ctx.ellipse(ms.x, ms.y, 600, 180, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // 3. Valles Marineris Canyon System (~300°E, -14°S)
  ctx.save();
  ctx.filter = 'blur(4px)';
  const vm = toXY(-14, 300);
  ctx.strokeStyle = '#120401';
  ctx.lineWidth = 28;
  ctx.beginPath();
  ctx.moveTo(vm.x - 300, vm.y - 30);
  ctx.bezierCurveTo(vm.x - 150, vm.y, vm.x + 100, vm.y - 20, vm.x + 350, vm.y + 40);
  ctx.stroke();

  // Branching Chasmata (Candor, Ophir, Melas, Capri)
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(vm.x - 100, vm.y);
  ctx.lineTo(vm.x - 40, vm.y + 60);
  ctx.moveTo(vm.x + 50, vm.y - 15);
  ctx.lineTo(vm.x + 120, vm.y - 65);
  ctx.stroke();
  ctx.restore();

  // 4. Tharsis Volcanic Province & Olympus Mons
  // Olympus Mons (~226°E, 18.6°N)
  const om = toXY(18.65, 226.2);
  const omGrad = ctx.createRadialGradient(om.x, om.y, 10, om.x, om.y, 120);
  omGrad.addColorStop(0, '#100301');
  omGrad.addColorStop(0.3, '#4d1505');
  omGrad.addColorStop(0.8, '#8e310e');
  omGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = omGrad;
  ctx.beginPath();
  ctx.arc(om.x, om.y, 120, 0, Math.PI * 2);
  ctx.fill();

  // Tharsis Montes Chain (Ascraeus, Pavonis, Arsia)
  const tm1 = toXY(11.9, 255.5);
  const tm2 = toXY(0.8, 247.0);
  const tm3 = toXY(-8.4, 238.9);
  [tm1, tm2, tm3].forEach((pt) => {
    const tg = ctx.createRadialGradient(pt.x, pt.y, 5, pt.x, pt.y, 70);
    tg.addColorStop(0, '#1c0501');
    tg.addColorStop(0.5, '#5e1b07');
    tg.addColorStop(1, 'transparent');
    ctx.fillStyle = tg;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, 70, 0, Math.PI * 2);
    ctx.fill();
  });

  // 5. Hellas Impact Basin (Light ochre depression ~70°E, -42°S)
  const hl = toXY(-42.4, 70.5);
  const hlGrad = ctx.createRadialGradient(hl.x, hl.y, 20, hl.x, hl.y, 200);
  hlGrad.addColorStop(0, '#d9814c');
  hlGrad.addColorStop(0.6, '#b85f2b');
  hlGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = hlGrad;
  ctx.beginPath();
  ctx.arc(hl.x, hl.y, 200, 0, Math.PI * 2);
  ctx.fill();

  // 6. Polar Ice Caps with Spiral Troughs
  // North Pole: Planum Boreum
  const npGrad = ctx.createRadialGradient(width / 2, 0, 10, width / 2, 0, 240);
  npGrad.addColorStop(0, '#ffffff');
  npGrad.addColorStop(0.5, '#e2e8f0');
  npGrad.addColorStop(0.8, '#cbd5e1');
  npGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = npGrad;
  ctx.fillRect(0, 0, width, 180);

  // South Pole: Planum Australe
  const spGrad = ctx.createRadialGradient(width / 2, height, 10, width / 2, height, 200);
  spGrad.addColorStop(0, '#ffffff');
  spGrad.addColorStop(0.6, '#e2e8f0');
  spGrad.addColorStop(1, 'transparent');
  ctx.fillStyle = spGrad;
  ctx.fillRect(0, height - 160, width, 160);

  // 7. Micro-Crater Field & Regolith Texture Noise (45,000 dots)
  for (let i = 0; i < 45000; i++) {
    const px = Math.random() * width;
    const py = Math.random() * height;
    const size = Math.random() * 2.8;
    ctx.fillStyle =
      Math.random() > 0.55
        ? 'rgba(255, 215, 175, 0.22)'
        : 'rgba(15, 4, 1, 0.28)';
    ctx.fillRect(px, py, size, size);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.ClampToEdgeWrapping;
  return texture;
}

// 3D Mars Planetary Sphere Component
function MarsGlobeMesh({
  sites,
  activeSiteId,
  onSelectSite,
  autoRotate,
  targetRotation,
  hoveredSiteId,
  setHoveredSiteId
}) {
  const globeGroupRef = useRef();

  // Generate realistic texture
  const marsColorMap = useMemo(() => createPhotorealisticMarsTexture(), []);

  // Smoothly rotate globe
  useFrame((state, delta) => {
    if (!globeGroupRef.current) return;

    if (autoRotate && !targetRotation) {
      globeGroupRef.current.rotation.y += delta * 0.05;
    } else if (targetRotation !== null) {
      // Interpolate towards targeted site orientation
      globeGroupRef.current.rotation.y = THREE.MathUtils.lerp(
        globeGroupRef.current.rotation.y,
        targetRotation.y,
        delta * 3.5
      );
      globeGroupRef.current.rotation.x = THREE.MathUtils.lerp(
        globeGroupRef.current.rotation.x,
        targetRotation.x,
        delta * 3.5
      );
    }
  });

  return (
    <group ref={globeGroupRef}>
      {/* 1. Main Mars Planetary Sphere */}
      <mesh receiveShadow castShadow>
        <sphereGeometry args={[18, 96, 96]} />
        <meshStandardMaterial
          map={marsColorMap}
          roughness={0.82}
          metalness={0.12}
        />
      </mesh>

      {/* 2. Realistic Rayleigh Atmospheric Scattering Halo */}
      <mesh scale={[1.028, 1.028, 1.028]}>
        <sphereGeometry args={[18, 64, 64]} />
        <meshBasicMaterial
          color="#ff7b3d"
          transparent
          opacity={0.16}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 3. Outer Pale Blue-White High Atmosphere Thin Layer */}
      <mesh scale={[1.042, 1.042, 1.042]}>
        <sphereGeometry args={[18, 64, 64]} />
        <meshBasicMaterial
          color="#93c5fd"
          transparent
          opacity={0.06}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* 4. Interactive 3D Rover & Landmark Pins */}
      {sites.map((site) => {
        const [x, y, z] = latLngToVector3(site.lat, site.lng, 18.25);
        const isHovered = hoveredSiteId === site.id;
        const isSelected = activeSiteId === site.id;
        const isRover = site.type === 'rover';
        const isLander = site.type === 'lander';

        // Pin styling colors
        const pinColor = isRover
          ? '#00f0ff' // Cyan for rovers
          : isLander
          ? '#f59e0b' // Amber for landers
          : '#c084fc'; // Purple for geological landmarks

        return (
          <group key={site.id} position={[x, y, z]}>
            {/* Glowing 3D Beacon Sphere */}
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                sfx.click();
                onSelectSite(site);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                setHoveredSiteId(site.id);
              }}
              onPointerOut={() => setHoveredSiteId(null)}
            >
              <sphereGeometry args={[isSelected ? 0.6 : isHovered ? 0.5 : 0.35, 16, 16]} />
              <meshBasicMaterial
                color={isSelected ? '#ffffff' : pinColor}
                transparent
                opacity={0.95}
              />
            </mesh>

            {/* Glowing Aura Ring */}
            <mesh scale={[1.5, 1.5, 1.5]}>
              <ringGeometry args={[0.3, 0.45, 16]} />
              <meshBasicMaterial
                color={pinColor}
                transparent
                opacity={isHovered || isSelected ? 0.8 : 0.4}
                side={THREE.DoubleSide}
              />
            </mesh>

            {/* Floating HTML Label with Wikipedia Preview Trigger */}
            <Html distanceFactor={42} center style={{ pointerEvents: 'auto' }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  sfx.click();
                  onSelectSite(site);
                }}
                onMouseEnter={() => setHoveredSiteId(site.id)}
                onMouseLeave={() => setHoveredSiteId(null)}
                className={`flex items-center gap-1.5 px-2 py-0.5 rounded-lg border font-mono text-[10px] whitespace-nowrap shadow-2xl transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-400 text-slate-950 font-bold border-white scale-110 shadow-[0_0_20px_rgba(0,240,255,0.8)]'
                    : isHovered
                    ? 'bg-slate-950/95 text-white font-bold border-cyan-400 scale-105'
                    : 'bg-slate-950/85 text-slate-300 border-slate-700/80 hover:border-cyan-400'
                }`}
              >
                <span>{site.flag}</span>
                <span className="truncate max-w-[140px]">{site.name}</span>
                <span className="text-[8px] opacity-70">
                  {site.lat > 0 ? `${site.lat.toFixed(0)}°N` : `${Math.abs(site.lat).toFixed(0)}°S`}
                </span>
              </button>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

export function GoogleMarsEarthView({ onSiteSelect, activeSite }) {
  const [selectedSite, setSelectedSite] = useState(null);
  const [isWikiOpen, setIsWikiOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [autoRotate, setAutoRotate] = useState(true);
  const [targetRotation, setTargetRotation] = useState(null);
  const [hoveredSiteId, setHoveredSiteId] = useState(null);

  // Filter sites based on category and search query
  const filteredSites = useMemo(() => {
    return MARS_SITES_CATALOG.filter((site) => {
      const matchesCategory =
        selectedCategory === 'All' || site.category === selectedCategory;
      const matchesSearch =
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.siteName.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Center Globe on a specific site
  const handleFlyToSite = (site) => {
    setAutoRotate(false);
    // Convert site lat/lng to target rotation angles
    const targetY = -((site.lng + 180) * (Math.PI / 180)) + Math.PI / 2;
    const targetX = (site.lat * (Math.PI / 180)) * 0.3;
    setTargetRotation({ x: targetX, y: targetY });
  };

  const handleOpenDossier = (site) => {
    setSelectedSite(site);
    setIsWikiOpen(true);
    handleFlyToSite(site);
  };

  return (
    <div className="relative w-full h-full min-h-screen bg-[#010206] text-slate-200 font-mono select-none overflow-hidden">
      {/* ── 3D Canvas Viewport ── */}
      <Canvas
        camera={{ position: [0, 0, 48], fov: 42 }}
        gl={{ antialias: true }}
        className="w-full h-full"
      >
        <Stars radius={300} depth={100} count={8000} factor={6} saturation={0.8} fade speed={0.6} />
        <ambientLight intensity={0.45} />
        <directionalLight position={[60, 25, 45]} intensity={2.8} castShadow />
        <directionalLight position={[-40, -20, -30]} intensity={0.3} color="#93c5fd" />

        <MarsGlobeMesh
          sites={filteredSites}
          activeSiteId={selectedSite?.id}
          onSelectSite={handleOpenDossier}
          autoRotate={autoRotate}
          targetRotation={targetRotation}
          hoveredSiteId={hoveredSiteId}
          setHoveredSiteId={setHoveredSiteId}
        />

        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          minDistance={22}
          maxDistance={95}
          rotateSpeed={0.65}
          onStart={() => setAutoRotate(false)}
        />
      </Canvas>

      {/* ── Top Left: Global Title & Stats (Offset to clear main header) ── */}
      <div className="absolute top-32 sm:top-24 md:top-20 left-4 z-20 space-y-2 pointer-events-auto">
        <div className="hud-glass rounded-xl px-4 py-2 border-cyan-500/40 flex items-center gap-2.5 shadow-2xl">
          <Globe className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: '16s' }} />
          <div>
            <h2 className="font-heading font-extrabold text-xs text-white tracking-widest uppercase">
              MARS DIGITAL TWIN // 3D GLOBAL EXPLORER
            </h2>
            <p className="text-[10px] font-mono text-slate-400">
              Interactive Catalog of All Mars Rovers, Landers & Geological Formations
            </p>
          </div>
        </div>

        {/* Search Bar */}
        <div className="hud-glass rounded-xl p-1.5 border-cyan-500/30 flex items-center gap-2 max-w-xs shadow-xl">
          <Search className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search rover, lander, volcano..."
            className="bg-transparent text-xs text-white placeholder-slate-500 focus:outline-none w-full"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="text-slate-500 hover:text-white text-xs px-1.5 cursor-pointer"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* ── Top Right: Category Filters & Globe Controls ── */}
      <div className="absolute top-32 sm:top-24 md:top-20 right-4 z-20 space-y-2 pointer-events-auto flex flex-col items-end">
        {/* Category Pills */}
        <div className="hud-glass rounded-xl p-1.5 border-cyan-500/30 flex items-center gap-1 shadow-xl">
          {SITE_CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                sfx.click();
                setSelectedCategory(cat);
              }}
              className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,240,255,0.4)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Globe Rotation Toggle */}
        <button
          onClick={() => {
            sfx.click();
            setAutoRotate(!autoRotate);
            setTargetRotation(null);
          }}
          className={`hud-glass px-3 py-1.5 rounded-xl text-[10px] font-mono font-bold flex items-center gap-1.5 transition-all border ${
            autoRotate
              ? 'text-cyan-300 border-cyan-500/50 shadow-[0_0_10px_rgba(0,240,255,0.3)]'
              : 'text-slate-400 border-slate-700 hover:text-white'
          }`}
        >
          <RotateCcw className={`w-3 h-3 ${autoRotate ? 'animate-spin' : ''}`} style={{ animationDuration: '6s' }} />
          <span>{autoRotate ? 'AUTO-ORBIT: ON' : 'AUTO-ORBIT: PAUSED'}</span>
        </button>
      </div>

      {/* ── Bottom Left: Quick Jump Rover Strip ── */}
      <div className="absolute bottom-4 left-4 z-20 pointer-events-auto max-w-xl space-y-1.5">
        <div className="text-[10px] font-mono font-bold text-cyan-400 flex items-center gap-1">
          <Rocket className="w-3 h-3" /> HISTORIC MISSIONS (CLICK FOR WIKIPEDIA DOSSIER)
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
          {filteredSites.slice(0, 8).map((site) => (
            <button
              key={site.id}
              onClick={() => handleOpenDossier(site)}
              className="hud-glass px-2.5 py-1.5 rounded-xl text-left border-cyan-500/30 hover:border-cyan-400 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap group hover:scale-105"
            >
              <span className="text-sm">{site.flag}</span>
              <div>
                <div className="text-[10px] font-bold text-white group-hover:text-cyan-300">
                  {site.name.split(' ')[0]}
                </div>
                <div className="text-[8px] text-slate-500">
                  {site.landingDate?.split(',')[1] || site.mission}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* ── Bottom Right: Navigation Tips ── */}
      <div className="absolute bottom-4 right-4 z-20 hud-glass px-3.5 py-2 rounded-xl text-[10px] font-mono text-slate-400 pointer-events-auto border-cyan-500/30 flex items-center gap-2.5 shadow-2xl">
        <span>🌍 Rotate with drag</span>
        <span>•</span>
        <span>📜 Scroll to zoom</span>
        <span>•</span>
        <span>📍 Click marker for Wikipedia dossier</span>
      </div>

      {/* ── Wikipedia Scientific Dossier Modal ── */}
      <MarsSiteWikiModal
        site={selectedSite}
        isOpen={isWikiOpen}
        onClose={() => setIsWikiOpen(false)}
        onEnterSurfaceView={(siteId) => {
          setIsWikiOpen(false);
          if (onSiteSelect) onSiteSelect(siteId);
        }}
        onFlyToSite={(site) => {
          handleFlyToSite(site);
        }}
      />
    </div>
  );
}
