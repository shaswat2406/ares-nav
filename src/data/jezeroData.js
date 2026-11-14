// NASA Jezero Crater Science Mission Data
// Octavia E. Butler Landing Site: 18.4447° N, 77.4508° E (-2570m elevation)

export const HABITAT_BASE = {
  id: "HAB-01",
  name: "Artemis Mars Hab Alpha (Butler Landing Site)",
  lat: 18.4447,
  lng: 77.4508,
  elevation: -2570, // meters
  description: "Primary pressurized habitat and rover docking facility. Landing coordinate of Mars 2020 mission.",
  type: "base"
};

// Scientific targets identified by CRISM and Perseverance
export const SCIENCE_TARGETS = [
  {
    id: "SCI-01",
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
    name: "Séítah Dune Fields (Mobility Trap)",
    type: "Terrain / Wheel Sinkage",
    severity: "HIGH",
    risk: "Unconsolidated fine aeolian dust & ripple dunes. Severe rover immobilization and astronaut slip hazard.",
    center: [18.4320, 77.4480],
    radius: 750, // meters
    color: "#ef4444"
  },
  {
    id: "HAZ-02",
    name: "Delta Scarp Cliffs (Slope > 24°)",
    type: "Topographic Cliff",
    severity: "CRITICAL",
    risk: "Steep shear cliff face exceeding astronaut suit incline limit (15° threshold). High tumble and rockfall risk.",
    center: [18.4410, 77.4190],
    radius: 600,
    color: "#dc2626"
  },
  {
    id: "HAZ-03",
    name: "Boulders Field / Ejecta Block",
    type: "Geophysical Obstacle",
    severity: "MODERATE",
    risk: "Concentrated meter-scale rock cluster resulting from impact ejecta. Spacesuit ankle/knee mobility hazard.",
    center: [18.4620, 77.4350],
    radius: 500,
    color: "#f59e0b"
  }
];

// Safe vs Direct Routes: Demonstrating our cost-function pathfinding (A*)
export const PRECOMPUTED_ROUTES = {
  safe: {
    name: "ARES Safe EVA Path (Traversability Optimized)",
    color: "#10b981", // Emerald green
    distanceKm: 3.82,
    estimatedMinutes: 85,
    maxSlopeDeg: 8.4,
    avgSlopeDeg: 4.1,
    oxygenUsedPercent: 38,
    caloriesBurnedKcal: 620,
    safetyScore: 96,
    hazardsAvoided: 3,
    waypoints: [
      [18.4447, 77.4508], // Hab
      [18.4400, 77.4470], // Circumventing Seetah dunes
      [18.4350, 77.4420], // Stop at Seitah Outcrop (SCI-03)
      [18.4280, 77.4350], // Low-gradient ramp approach
      [18.4230, 77.4300], // Kodiak Butte (SCI-01)
      [18.4350, 77.4210], // Traverse around scarp
      [18.4550, 77.4120], // Three Forks Delta Front (SCI-02)
      [18.4580, 77.4300], // Safe valley corridor return
      [18.4447, 77.4508]  // Return to Hab
    ]
  },
  direct: {
    name: "Direct Linear Path (Hazardous / High Slope)",
    color: "#f43f5e", // Rose red
    distanceKm: 2.95,
    estimatedMinutes: 120, // Takes longer due to steep terrain climbing
    maxSlopeDeg: 26.2, // EXCEEDS LIMIT!
    avgSlopeDeg: 12.8,
    oxygenUsedPercent: 68,
    caloriesBurnedKcal: 1140,
    safetyScore: 42,
    hazardsAvoided: 0,
    waypoints: [
      [18.4447, 77.4508], // Hab
      [18.4320, 77.4480], // Directly through deep dust dunes (DANGER)
      [18.4410, 77.4190], // Directly up 26° cliff scarp (CRITICAL HAZARD)
      [18.4550, 77.4120], // Three Forks
      [18.4447, 77.4508]  // Return
    ]
  }
};

// Environmental Telemetry (Simulated Sol conditions from MEDA weather station)
export const SOL_TELEMETRY = {
  solNumber: 1320,
  airTempC: -58.2,
  groundTempC: -14.6,
  pressurePa: 742, // Pascals (Mars atmosphere is ~0.6% of Earth)
  uvIndex: "HIGH (Unshielded)",
  dustOpticalDepthTau: 0.44, // Low dust storm risk
  radiationMilliSievertsPerDay: 0.62, // Curiosity RAD baseline
  windSpeedMs: 4.8,
  windDirection: "ENE"
};
