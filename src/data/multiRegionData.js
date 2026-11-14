// Multi-Region Planetary Exploration Data (Jezero Crater & Gale Crater)

export const MARS_REGIONS = {
  jezero: {
    id: "jezero",
    name: "Jezero Crater (Ancient Delta)",
    rover: "Perseverance",
    solNumber: 1320,
    coordinates: "18.4447°N, 77.4508°E",
    elevationBase: -2570,
    description: "Ancient 45-km-wide impact basin with a preserved river delta system, primary astrobiology exploration target for fossilized microbial life.",
    habBase: {
      id: "HAB-01",
      name: "Artemis Hab Alpha (Butler Site)",
      lat: 18.4447,
      lng: 77.4508,
      elevation: -2570,
      description: "Primary pressurized habitat and rover docking facility. Landing coordinate of Mars 2020 mission.",
      type: "base"
    },
    scienceTargets: [
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
    ],
    hazardZones: [
      {
        id: "HAZ-01",
        name: "Séítah Dune Fields (Mobility Trap)",
        type: "Terrain / Wheel Sinkage",
        severity: "HIGH",
        risk: "Unconsolidated fine aeolian dust & ripple dunes. Severe rover immobilization and astronaut slip hazard.",
        center: [18.4320, 77.4480],
        radius: 750,
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
    ]
  },
  gale: {
    id: "gale",
    name: "Gale Crater & Mount Sharp",
    rover: "Curiosity",
    solNumber: 4320,
    coordinates: "4.5895°S, 137.4417°E",
    elevationBase: -4500,
    description: "Deep 154-km-wide crater featuring Aeolis Mons (Mount Sharp), a 5.5-km-high layered mountain recording billions of years of climatic transition from wet to arid Mars.",
    habBase: {
      id: "HAB-GALE",
      name: "Bradbury Landing Hab Station",
      lat: -4.5895,
      lng: 137.4417,
      elevation: -4500,
      description: "Historic landing ellipse of MSL Curiosity, located in the northern alluvial fan.",
      type: "base"
    },
    scienceTargets: [
      {
        id: "SCI-G01",
        name: "Yellowknife Bay Mudstone",
        lat: -4.6050,
        lng: 137.4600,
        elevation: -4520,
        priority: "CRITICAL",
        scienceDomain: "Fluvio-lacustrine Habitable Environment",
        instrument: "SAM & CheMin",
        targetMineral: "Smectite Clay & Iron-Sulfates",
        biosignaturePotential: "95%",
        description: "Fine-grained sedimentary rocks deposited in an ancient freshwater lake bed with neutral pH, confirming Mars had habitable environments.",
        image: "https://images-assets.nasa.gov/image/PIA16837/PIA16837~orig.jpg"
      },
      {
        id: "SCI-G02",
        name: "Vera Rubin Ridge (Hematite Ridge)",
        lat: -4.6800,
        lng: 137.3800,
        elevation: -4200,
        priority: "HIGH",
        scienceDomain: "Hydrothermal Oxidation Stratigraphy",
        instrument: "APXS & ChemCam",
        targetMineral: "Crystalline Gray Hematite",
        biosignaturePotential: "89%",
        description: "Prominent topographic ridge resisting erosion due to mineral cementation by groundwater fluids.",
        image: "https://images-assets.nasa.gov/image/PIA22325/PIA22325~orig.jpg"
      },
      {
        id: "SCI-G03",
        name: "Gediz Vallis Ridge (Debris Flow)",
        lat: -4.7200,
        lng: 137.3500,
        elevation: -3900,
        priority: "HIGH",
        scienceDomain: "Late-Stage Water Surges",
        instrument: "Mastcam & ChemCam",
        targetMineral: "Coarse Conglomerates & Hydrated Silica",
        biosignaturePotential: "84%",
        description: "Chute formed by torrential wet debris flows that transported gigantic car-sized boulders down Mount Sharp.",
        image: "https://images-assets.nasa.gov/image/PIA26300/PIA26300~orig.jpg"
      }
    ],
    hazardZones: [
      {
        id: "HAZ-G01",
        name: "Bagnold Dune Field (Active Ripples)",
        type: "Active Sand Dune Trap",
        severity: "CRITICAL",
        risk: "Active basaltic sand dunes with 3-meter crests. Extreme wheel sinkage risk.",
        center: [-4.6300, 137.4200],
        radius: 800,
        color: "#dc2626"
      },
      {
        id: "HAZ-G02",
        name: "Mount Sharp Foothill Scarps",
        type: "Topographic Incline",
        severity: "HIGH",
        risk: "Slopes exceeding 28 degrees with loose talus scree.",
        center: [-4.7000, 137.3600],
        radius: 700,
        color: "#ef4444"
      }
    ]
  }
};
