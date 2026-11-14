// NASA Jezero Crater Science Mission Data
// Octavia E. Butler Landing Site: 18.4447° N, 77.4508° E (-2570m elevation)

export const HABITAT_BASE = {
  id: "HAB-01",
  name: "Artemis Hab Alpha (Butler Site)",
  lat: 18.4447,
  lng: 77.4508,
  elevation: -2570,
  description: "Primary pressurized habitat and rover docking facility. Landing coordinate of Mars 2020 mission.",
  type: "base"
};

// Scientific targets identified by CRISM and Perseverance
export const SCIENCE_TARGETS = [
  {
    id: "SCI-01",
    shortName: "Kodiak Butte",
    name: "Kodiak Butte (Delta Scarp)",
    lat: 18.4230,
    lng: 77.4300,
    elevation: -2510,
    priority: "HIGH",
    scienceDomain: "Facies Geology & Sedimentology",
    instrument: "SuperCam / Mastcam-Z",
    targetMineral: "Clay Minerals & Layered Delta Siltstone",
    biosignaturePotential: "92%",
    description: "Prominent remnant erosional butte showing stratified delta topset/foreset beds, confirming Jezero was fed by a persistent river.",
    image: "https://images-assets.nasa.gov/image/PIA24836/PIA24836~orig.jpg"
  },
  {
    id: "SCI-02",
    shortName: "Three Forks",
    name: "Three Forks Delta Front",
    lat: 18.4550,
    lng: 77.4120,
    elevation: -2480,
    priority: "CRITICAL",
    scienceDomain: "Astrobiology / Organic Carbon",
    instrument: "SHERLOC & PIXL",
    targetMineral: "Magnesium Carbonates & Smectite Clays",
    biosignaturePotential: "97%",
    description: "Deposition zone where ancient Neretva Vallis emptied into Jezero crater lake. High preservation of organic compounds in mudstones.",
    image: "https://images-assets.nasa.gov/image/PIA25424/PIA25424~orig.jpg"
  },
  {
    id: "SCI-03",
    shortName: "Séítah Outcrop",
    name: "Séítah Subsurface Outcrop",
    lat: 18.4350,
    lng: 77.4420,
    elevation: -2560,
    priority: "MEDIUM",
    scienceDomain: "Igneous Petrology / Geochronology",
    instrument: "RIMFAX (Ground Penetrating Radar)",
    targetMineral: "Olivine-Rich Cumulate Bedrock",
    biosignaturePotential: "64%",
    description: "Layered igneous rock formed from magma cooling, providing critical radiometric age dating for the Martian timeline.",
    image: "https://images-assets.nasa.gov/image/PIA24930/PIA24930~orig.jpg"
  },
  {
    id: "SCI-04",
    shortName: "Belva Rim",
    name: "Belva Impact Crater Rim",
    lat: 18.4680,
    lng: 77.3850,
    elevation: -2410,
    priority: "HIGH",
    scienceDomain: "Deep Impact Excavation",
    instrument: "SuperCam & Mastcam-Z",
    targetMineral: "Hydrothermal Silica & Phyllosilicates",
    biosignaturePotential: "88%",
    description: "Secondary impact crater exposing deep basement stratigraphy that predated the delta formation.",
    image: "https://images-assets.nasa.gov/image/PIA25828/PIA25828~orig.jpg"
  }
];

// Hazard zones calculated from MOLA/HRSC DEM slope & THEMIS thermal inertia
export const HAZARD_ZONES = [
  {
    id: "HAZ-01",
    name: "Séítah Dune Fields",
    type: "Terrain / Wheel Sinkage",
    severity: "HIGH",
    risk: "Unconsolidated fine aeolian dust & ripple dunes. Severe rover immobilization and astronaut slip hazard.",
    center: [18.4320, 77.4480],
    radius: 750,
    color: "#ef4444"
  },
  {
    id: "HAZ-02",
    name: "Delta Scarp Cliffs",
    type: "Topographic Cliff (>24°)",
    severity: "CRITICAL",
    risk: "Steep shear cliff face exceeding astronaut suit incline limit (15° threshold). High tumble and rockfall risk.",
    center: [18.4410, 77.4190],
    radius: 600,
    color: "#dc2626"
  },
  {
    id: "HAZ-03",
    name: "Boulder Ejecta Field",
    type: "Geophysical Obstacle",
    severity: "MODERATE",
    risk: "Concentrated meter-scale rock cluster resulting from impact ejecta. Spacesuit ankle/knee mobility hazard.",
    center: [18.4620, 77.4350],
    radius: 500,
    color: "#f59e0b"
  }
];

// Safe vs Direct Routes with LoS occlusion flags
export const PRECOMPUTED_ROUTES = {
  safe: {
    name: "A* Safe EVA Path (Traversability Optimized)",
    color: "#00ff88",
    distanceKm: 3.82,
    estimatedMinutes: 85,
    maxSlopeDeg: 8.4,
    avgSlopeDeg: 4.1,
    oxygenUsedPercent: 38,
    caloriesBurnedKcal: 620,
    safetyScore: 96,
    hasCommsShadow: false,
    waypoints: [
      [18.4447, 77.4508],
      [18.4400, 77.4470],
      [18.4350, 77.4420],
      [18.4280, 77.4350],
      [18.4230, 77.4300],
      [18.4350, 77.4210],
      [18.4550, 77.4120],
      [18.4580, 77.4300],
      [18.4447, 77.4508]
    ]
  },
  direct: {
    name: "Direct Linear Path (Hazardous / High Slope)",
    color: "#ff3344",
    distanceKm: 2.95,
    estimatedMinutes: 120,
    maxSlopeDeg: 26.2,
    avgSlopeDeg: 12.8,
    oxygenUsedPercent: 68,
    caloriesBurnedKcal: 1140,
    safetyScore: 42,
    hasCommsShadow: true,
    shadowWaypointIndex: 2,
    waypoints: [
      [18.4447, 77.4508],
      [18.4320, 77.4480],
      [18.4410, 77.4190], // Delta cliff wall blocks RF line-of-sight!
      [18.4550, 77.4120],
      [18.4447, 77.4508]
    ]
  },
  emergency: {
    name: "Emergency Hab Return Vector",
    color: "#f59e0b",
    distanceKm: 2.45,
    estimatedMinutes: 45,
    maxSlopeDeg: 7.1,
    avgSlopeDeg: 3.5,
    oxygenUsedPercent: 24,
    caloriesBurnedKcal: 410,
    safetyScore: 98,
    hasCommsShadow: false,
    waypoints: [
      [18.4550, 77.4120], // Three Forks
      [18.4520, 77.4280], // Low-gradient return apron
      [18.4480, 77.4400],
      [18.4447, 77.4508]  // Safe in Hab
    ]
  }
};

// Environmental Telemetry baseline
export const SOL_TELEMETRY = {
  solNumber: 1328,
  airTempC: -48.2,
  groundTempC: -14.6,
  pressurePa: 742,
  uvIndex: "HIGH",
  dustOpticalDepthTau: 0.62,
  radiationMilliSievertsPerDay: 0.62,
  windSpeedMs: 5.4,
  windDirection: "ENE"
};
