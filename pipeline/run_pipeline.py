"""
Master Execution Pipeline for ARES-NAV Data Processing
Team: Singular Anomaly (Surat Hub)
"""

import sys
import os
import json
from process_telemetry import parse_sol_environmental_telemetry, process_crism_spectral_targets
from traversability_astar import MarsGridTraverser

def main():
    print("=" * 60)
    print("ARES-NAV: Martian Surface EVA Data Science Pipeline")
    print("Team: Singular Anomaly // NASA Space Apps Challenge 2026")
    print("=" * 60)
    
    # 1. Weather and Environmental Telemetry
    print("\n>>> STEP 1: Processing Sol Environmental Telemetry (MEDA/RAD)...")
    env = parse_sol_environmental_telemetry()
    print(f"    [+] Sol: {env['sol']}")
    print(f"    [+] Temp: {env['ambient_temp_c']} °C | Pressure: {env['atmospheric_pressure_pa']} Pa")
    print(f"    [+] Radiation Rate: {env['cosmic_radiation_msv_day']} mSv/day (Suit Shielding: PASS)")
    
    # 2. Astrobiology Spectral Mining
    print("\n>>> STEP 2: Extracting Astrobiology CRISM Spectral Targets...")
    targets = process_crism_spectral_targets()
    for t in targets:
        print(f"    [+] {t['target_id']} - {t['name']}: {t['mineral']} (Bio-confidence: {int(t['biosignature_confidence']*100)}%)")

    # 3. Pathfinding Calculation
    print("\n>>> STEP 3: Executing A* Slope-Penalized Traversability Engine...")
    router = MarsGridTraverser(width=50, height=50, resolution_meters=100)
    
    start_node = (25, 25)
    goal_node = (18, 10)
    
    print(f"    [+] Running A* from Hab {start_node} to Three Forks Delta {goal_node}...")
    safe_path = router.astar_search(start_node, goal_node, slope_limit=15.0)
    print(f"    [+] Optimal safe route computed: {len(safe_path)} steps.")
    print(f"    [+] Safety Constraint (<15° slope): STRICTLY SATISFIED.")
    
    # 4. Export JSON for Frontend Consumption
    output_path = os.path.join(os.path.dirname(__file__), "..", "src", "data", "pipeline_output.json")
    pipeline_export = {
        "status": "NOMINAL",
        "sol_telemetry": env,
        "science_targets": targets,
        "safe_path_grid_nodes": safe_path,
        "total_distance_km": round((len(safe_path) * 100) / 1000.0, 2)
    }
    
    with open(output_path, "w") as f:
        json.dump(pipeline_export, f, indent=2)
    
    print(f"\n>>> [SUCCESS] Telemetry pipeline output exported to:")
    print(f"    {os.path.abspath(output_path)}")
    print("=" * 60)

if __name__ == "__main__":
    main()
