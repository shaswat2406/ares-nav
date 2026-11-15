# ARES-NAV — Martian EVA Tactical Mission Planner

**NASA Space Apps Challenge 2026**  
**Track:** *Interplanetary Survival Guide: Martian Map*  
**Team:** *Singular Anomaly* | **Lead Astronaut:** *Shaswat Sinha* | **Hub:** *Surat, India*  
**Live Deployment:** [https://ares-nav.netlify.app](https://ares-nav.netlify.app)  
**Official Repository:** [https://github.com/shaswat2406/ares-nav](https://github.com/shaswat2406/ares-nav)

---

## 🎯 Executive Summary & Problem Statement

Human exploration of Mars represents the most challenging operational frontier in aerospace history. When astronauts step onto the Martian surface for an Extravehicular Activity (EVA / Marswalk), they encounter a hostile, low-pressure ($~742\text{ Pa}$), freezing ($-48.2^\circ\text{C}$), unshielded radiation environment where every step consumes limited consumables.

While existing planetary mapping systems (such as NASA JPL's Mars Trek or USGS Astrogeology) provide orbital macroscopic context, they lack the **tactical, real-time micro-navigation intelligence** needed for human foot traversal. Spacesuit mobility is severely constrained:
- Slopes steeper than **$15^\circ$** cause catastrophic slip and suit tumbling hazards.
- Unconsolidated aeolian sand dunes (e.g., the Séítah formation) cause boot and rover wheel sinkage.
- Terrain ridges induce **radio line-of-sight (LoS) communication shadows** blocking direct RF contact with the habitat base.
- Finite Portable Life Support System (PLSS) reserves of **$O_2$ (862L)** and **battery power (45 kWh)** demand rigorous metabolic expenditure modeling.

**ARES-NAV** transforms raw multi-mission NASA planetary science datasets into an integrated, interactive tactical EVA mission control and astronaut heads-up display (HUD) centered on **Jezero Crater** (Mars 2020 landing site).

---

## 🛰️ NASA Scientific Datasets Integrated

ARES-NAV ingests and processes scientific data from **9 authoritative NASA and ESA planetary instruments**:

| Mission | Instrument | Dataset Name | Resolution | Scientific Role in ARES-NAV | PDS Repository Citation |
|---|---|---|---|---|---|
| **MGS** | **MOLA** | Mars Orbiter Laser Altimeter DEM | 463 m/px global | Macro-elevation baseline & crater morphology | [PDS Geosciences](https://pds-geosciences.wustl.edu/mgs/mgs-m-mola-5-megdr-l3-v1/) |
| **Mars Express** | **HRSC** | High Resolution Stereo Camera DEM | 50–100 m/px | Regional topographic slope gradients & scarp delineation | [ESA PSA / PDS](https://pds-geosciences.wustl.edu/mex/) |
| **MRO** | **CRISM** | Compact Reconnaissance Imaging Spectrometer | 18–36 m/px | Spectral identification of Mg-carbonates, phyllosilicates & smectites | [PDS Geosciences](https://pds-geosciences.wustl.edu/mro/mro-m-crism-3-rdr-targeted-v1/) |
| **MRO** | **HiRISE** | High Resolution Imaging Science Experiment | 25 cm/px | Visual surface morphology, meter-scale boulder hazards | [HiRISE Operations](https://www.uahirise.org/jezero.php) |
| **Mars 2020** | **MEDA** | Mars Environmental Dynamics Analyzer | Point sensor | Ground truth Sol 1328 temperature, wind, dust optical depth ($\tau$) | [PDS Atmospheres](https://atmos.nmsu.edu/PDS/data/PDS4/MEDA/) |
| **Mars 2020** | **RAD** | Radiation Assessment Detector | Point sensor | Surface cosmic ray & solar particle radiation dose ($0.62\text{ mSv/day}$) | [PDS Geosciences](https://pds-geosciences.wustl.edu/m2020/) |
| **Mars Odyssey** | **THEMIS** | Thermal Emission Imaging System | 100 m/px | Infrared thermal inertia; distinguishing bedrock vs. fine sand | [ASU THEMIS](https://themis.asu.edu/maps) |
| **Mars 2020** | **Perseverance** | Rover Traverse & Science Waypoints | ±1 m GPS-eq | Historic rover traverse route (Sol 1 to 1328) | [NASA Mars 2020](https://mars.nasa.gov/mars2020/mission/where-is-the-rover/) |
| **MAVEN** | **NGIMS/IUVS** | Upper Atmosphere & Escape Dynamics | Neutral / Ion | Atmospheric evolution context & seasonal dust storm dynamics | [PDS PPI](https://pds-ppi.igpp.ucla.edu/) |

---

## 🧮 Mathematical & Computational Architecture

### 1. Digital Elevation Gradient & Slope Calculation
For any continuous or gridded digital elevation model $z(x, y)$, slope $\theta$ is derived using central finite difference gradients $p = \frac{\partial z}{\partial x}$ and $q = \frac{\partial z}{\partial y}$:

$$\theta = \tan^{-1}\left(\sqrt{p^2 + q^2}\right)$$

Terrain cells exceeding $\theta > 15^\circ$ receive critical hazard flags, as Apollo lunar and simulated Martian biomechanical studies demonstrate that spacesuit mobility degrades exponentially beyond $15^\circ$.

### 2. Multi-Objective 8-Directional $A^*$ Pathfinding Cost Function
Rather than navigating in a direct straight line across perilous cliffs, ARES-NAV uses an 8-directional graph traversal engine with no diagonal corner-cutting through blocked cells:

$$C_{ij} = d_{ij} \times \left(1 + w_s \cdot f(\theta) + w_r \cdot R + w_h \cdot H + w_u \cdot U - w_{sci} \cdot S\right)$$

Where:
- $d_{ij}$: Euclidean segment step distance ($1.0 \times \text{step}$ for orthogonal, $\sqrt{2} \times \text{step}$ for diagonal).
- $f(\theta) = \tan^2(\theta)$: Non-linear penalty for slope incline.
- $R$: Surface micro-roughness coefficient derived from local neighbor elevation variance.
- $H$: Geological hazard coefficient (high sinkage sand in Séítah dunes, cliff drops, boulder fields).
- $U$: Epistemic uncertainty penalty for unmapped or coarse-resolution areas.
- $S$: Scientific proximity bonus attracting the path toward verified CRISM mineral targets.
- $w_s=3.5, w_r=1.2, w_h=4.0, w_u=2.0, w_{sci}=1.5$: Calibrated heuristic weighting factors.

### 3. Five-Algorithm Benchmark Comparison
ARES-NAV directly implements and compares five distinct pathfinding algorithms across identical terrain:
1. **Direct Straight-Line**: Baseline Euclidean vector ignoring hazards ($2.95\text{ km}$, $26.2^\circ\text{ max slope}$, $42\%\text{ safety score}$).
2. **Dijkstra Shortest Path**: Exhaustive uniform-cost search guaranteeing minimal distance.
3. **$A^*$ Distance-Only**: Fast Euclidean-heuristic search with minimal terrain weighting.
4. **$A^*$ Safety-Aware**: Full slope and hazard avoidance with comms shadow bypass ($3.82\text{ km}$, $8.4^\circ\text{ max slope}$, $96\%\text{ safety score}$).
5. **$A^*$ Science-Aware**: Multi-objective routing optimizing both astronaut survival constraints and scientific discovery value.

### 4. Astronaut Life Support (PLSS) Consumption Model
Metabolic oxygen consumption is calculated dynamically based on grade incline and crew exertion:

$$\dot{V}_{O_2} = \dot{V}_{\text{base}} \times \left(1 + 0.05 \cdot \theta + 0.35 \cdot \text{isDustStorm}\right)$$

Where $\dot{V}_{\text{base}} = 0.84\text{ L/min}$ (standard NASA EMU PLSS rate). Total consumables reserve is enforced at a mandatory **25% Apollo safety margin**. When consumables approach the threshold, an automatic **Emergency Return-to-Base (RTB)** vector is synthesized.

---

## 🚀 Key System Features

### 1. Multi-Tiered Viewport Canvas
- **3D Martian Surface View**: Real-time Three.js WebGL rendering of Jezero Crater West with dynamic vertex shader coloring (crimson steep slope highlighting, purple CRISM mineral heatmaps, MOLA elevation contour lines).
- **First-Person Visor POV (Indian Astronaut)**: Articulated 3D astronaut model wearing an ISRO Gaganyaan/Artemis-class EVA spacesuit with the Indian Tricolour patch, gold-coated UV-reflective helmet visor, and first-person helmet HUD reticle.
- **NASA JPL Mars Trek GIS**: Real-time tile streaming from `trek.nasa.gov`, interactive coordinate inspector, elevation on hover, distance measurement tool, quick-nav jumps, and 20+ toggleable science layers.
- **Global 3D Mars Globe**: Interactive planetary globe with atmospheric Rayleigh scattering, polar ice caps, and major geological landmarks (Olympus Mons, Valles Marineris, Gale Crater, Jezero).

### 2. Survival & Contingency Engineering
- **Radio Line-of-Sight (LoS) Comms Shadow Detection**: Scans terrain elevation between every route waypoint and Hab Alpha. When crater scarps block direct RF paths, a HUD alert flags: `COMMS SHADOW DETECTED // DEPLOY RELAY BEACON`.
- **Dust Storm Emergency Simulation**: Triggers a simulated Martian dust event, spiking dust optical depth ($\tau$ from $0.62$ to $2.85+$), increasing wind velocity to $18.6\text{ m/s}$, engaging amber volumetric atmospheric fog, accelerating PLSS battery/O2 drain, and calculating an emergency low-gradient return vector.
- **Astrobiology Lab Modal**: Raman spectroscopy simulation of Jezero core samples, rendering UV fluorescence emission curves and confirming biosignature preservation in Three Forks magnesium carbonates.

### 3. Mission Planning & Data Export
- **Mission Simulator Mode**: A 10-step automated demonstration walking competition judges through the end-to-end EVA workflow in under 2 minutes.
- **Science Target Discovery Engine**: Prioritizes Jezero science locations based on mineralogical proxy indicators and peer-reviewed CRISM detections (Horgan et al. 2020, Goudge et al. 2015).
- **NASA Dataset Explorer**: Comprehensive database detailing provenance, resolution, quality metrics, and PDS source repositories for all 9 data layers.
- **Flight Order Dispatch**: Downloadable, timestamped EVA mission flight plan checklist with printable/PDF report generation.
- **AI Mission Commander (Gemini 1.5 Flash)**: Tactical mission advisory assistant that ingests live telemetry, route coordinates, and CRISM detections to provide instant military-brevity safety advisories and abort calculations.
- **Official 30-Second Mission Demo Video**: High-production Full HD presentation video (`ARES_NAV_MISSION_DEMO_30S.mp4`) showcasing end-to-end mission planning, algorithm benchmarking, and NASA GIS workflows.

---

## 🛠️ Local Development & Quick Start

```bash
# Clone the repository
git clone https://github.com/shaswat2406/ares-nav.git
cd ares-nav

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore the mission interface.

### Automated Scientific & Algorithmic Validation Suite
```bash
npm test
```
Executes `node tests/test_scientific_engine.js`, verifying **70 / 70 automated tests (100% passing)** across terrain gradients, A* slope penalties, Dijkstra benchmark comparisons, Apollo life-support reserves, and NASA PDS dataset citations.

### Production Build
```bash
npm run build
```

---

## 👥 Scientific Team & Attribution
- **Team**: Singular Anomaly
- **Lead Astronaut & Software Architect**: Shaswat Sinha
- **Location**: Surat, Gujarat, India
- **Hackathon Track**: NASA Space Apps Challenge 2026 — Interplanetary Survival Guide: Martian Map

### Scientific References Cited
1. **Horgan, B. H. N., et al. (2020)**. *The Mineral Diversity of Jezero Crater and its Delta*. Icarus, 339, 113526.
2. **Goudge, T. A., et al. (2015)**. *Stratigraphy and Evolution of the Jezero Crater Delta*. Journal of Geophysical Research: Planets, 120(4), 775–805.
3. **Grotzinger, J. P., et al. (2021)**. *Mars 2020 Perseverance Rover Mission Overview*. Space Science Reviews, 216(8), 1–48.
4. **Carr, C. E., & Newman, D. J. (2008)**. *Characterization of Walking Energetics in Partial Gravity*. Journal of Biomechanics, 41(10), 2235–2241.
5. **NASA-STD-3001**. *NASA Space Flight Human-System Standard: Volume 2 — Human Factors, Habitability, and Environmental Health*.

---

*Scientific Disclaimer: ARES-NAV is an advanced research prototype and mission planning model developed for the NASA Space Apps Challenge 2026. Consumables models and risk indices represent computational approximations based on published aerospace literature and are not certified for live extraterrestrial flight operations.*
