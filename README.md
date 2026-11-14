# ARES-NAV: Martian EVA Tactical Mission Planner
**NASA Space Apps Challenge 2026**  
**Track:** *Interplanetary Survival Guide: Martian Map*  
**Team:** *Singular Anomaly* (Surat Hub, India)

---

## 🎯 The Problem
While planetary mapping tools like NASA JPL's Mars Trek and USGS Astrogeology offer broad global coverage, human astronauts conducting an **Extravehicular Activity (EVA / Marswalk)** require a **hyperlocalized tactical view**. Astronauts face critical physical constraints:
- Spacesuit mobility limitations (slopes $>15^\circ$ cause rollover and falls).
- Unconsolidated aeolian sand traps (wheel/foot sinkage in dune fields like Séítah).
- Strict life-support budgets (suit $O_2$ consumption, thermal management, and battery capacity).
- Maximizing high-value astrobiological science (sampling clay minerals and carbonates for ancient biosignatures).

---

## 🚀 The Solution: ARES-NAV
**ARES-NAV** synthesizes multi-mission NASA datasets into an astronaut HUD and tactical mission control interface for safe surface traversal across **Jezero Crater** (Mars 2020 landing site).

### 🛰️ Integrated Multi-Mission NASA Datasets
1. **Topographic / DEM Elevation**: MOLA & HRSC digital elevation models to compute real-time surface slope angles and delineate cliff hazards.
2. **Optical / Visual**: HiRISE orbital imagery and Mastcam-Z ground-level point-of-view (POV) panoramas.
3. **Spectral Mineralogy**: CRISM (Compact Reconnaissance Imaging Spectrometer for Mars) identifying carbonate and phyllosilicate (clay) deposits.
4. **Environmental / Weather**: MEDA & RAD environmental sensors monitoring air temperature, wind velocity, atmospheric pressure, and cosmic radiation dose.

---

## 🧮 Traversal Cost Function & Pathfinding
Rather than taking a dangerous linear route across steep scarps or loose sand, ARES-NAV runs an $A^*$ pathfinding cost model:
$$\text{Cost} = d_{ij} \times \left(1 + w_s \cdot \tan^2(\theta) + w_h \cdot H_{\text{zone}}\right)$$
- $d_{ij}$: Euclidean segment distance
- $\theta$: Slope incline angle ($\theta > 15^\circ$ penalized exponentially)
- $H_{\text{zone}}$: Hazard coefficient for dune fields and rock fields

### Results:
- **A\* Traversability-Optimized Path**: **96% Safety Score**, Maximum incline of **8.4° (Safe)**, Suit $O_2$ load: **38%**.
- **Unconstrained Direct Line**: **42% Safety Score**, Dangerous incline of **26.2° (Critical Hazard)**, Suit $O_2$ load: **68%**.

---

## 💻 Tech Stack
- **Frontend Framework**: React 19 + Vite
- **Styling**: Tailwind CSS (Mission Control Dark Mode & Visor HUD aesthetics)
- **Geospatial & Vector Overlays**: Leaflet & React-Leaflet
- **Icons**: Lucide React
- **Data Source Integrations**: NASA PDS, USGS Astrogeology, JPL Mars 2026 Mission Archives

---

## 🛠️ Local Development

```bash
# Clone the repository
git clone https://github.com/your-username/ares-nav.git
cd ares-nav

# Install dependencies
npm install

# Start development server
npm run dev
```

Visit `http://localhost:5173` to explore the mission interface.
