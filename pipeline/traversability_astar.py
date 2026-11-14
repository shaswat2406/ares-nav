"""
ARES-NAV: Martian Traversal Cost Engine & A* Pathfinding Pipeline
Team: Singular Anomaly (NASA Space Apps Challenge 2026)
Author: Shaswat Sinha

This module models Mars surface traversability on Jezero Crater:
Cost = distance * (1 + w_slope * tan^2(theta) + w_hazard * Hazard_Penalty)
"""

import math
import heapq
import json

class MarsGridTraverser:
    def __init__(self, width=50, height=50, resolution_meters=100):
        self.width = width
        self.height = height
        self.res = resolution_meters
        
        # Origin: Octavia E. Butler Landing Site (Jezero Crater)
        self.origin_lat = 18.4447
        self.origin_lng = 77.4508
        
        # Initialize Digital Elevation Model (DEM) and Hazard grid
        self.elevation_grid = [[0.0 for _ in range(width)] for _ in range(height)]
        self.hazard_grid = [[0.0 for _ in range(width)] for _ in range(height)]
        self._generate_jezero_synthetic_dem()

    def _generate_jezero_synthetic_dem(self):
        """Simulate Jezero Crater western delta topography from MOLA/HRSC profiles."""
        for r in range(self.height):
            for c in range(self.width):
                # Distance from center
                dx = c - self.width // 2
                dy = r - self.height // 2
                dist = math.sqrt(dx*dx + dy*dy)
                
                # Base crater floor elevation (-2570m datum)
                elev = -2570.0
                
                # Delta scarp elevation rise on western quadrant
                if dx < -5 and abs(dy) < 15:
                    elev += (abs(dx) - 5) * 8.5
                
                # Kodiak Butte isolated mesa
                d_kodiak = math.sqrt((dx - 12)**2 + (dy - 10)**2)
                if d_kodiak < 5:
                    elev += math.cos((d_kodiak / 5.0) * (math.pi / 2)) * 60.0
                
                # Micro-topography
                elev += math.sin(dx * 0.4) * math.cos(dy * 0.4) * 3.5
                self.elevation_grid[r][c] = elev

        # Define Séítah high-sinkage dune hazard (center dx: 2, dy: -4)
        for r in range(self.height):
            for c in range(self.width):
                dx = c - self.width // 2
                dy = r - self.height // 2
                d_seitah = math.sqrt((dx - 2)**2 + (dy + 4)**2)
                if d_seitah < 6:
                    self.hazard_grid[r][c] = 1.0 # High mobility penalty

    def compute_slope(self, r1, c1, r2, c2):
        """Calculate terrain slope angle (degrees) between two adjacent grid cells."""
        elev_diff = abs(self.elevation_grid[r2][c2] - self.elevation_grid[r1][c1])
        horiz_dist = self.res if (r1 == r2 or c1 == c2) else self.res * 1.414
        slope_rad = math.atan(elev_diff / horiz_dist)
        return math.degrees(slope_rad)

    def astar_search(self, start, goal, slope_limit=15.0):
        """
        A* pathfinding with astronaut safety constraint:
        Slopes exceeding slope_limit (15°) are impassable or severely penalized.
        """
        frontier = []
        heapq.heappush(frontier, (0, start))
        came_from = {start: None}
        cost_so_far = {start: 0}

        while frontier:
            _, current = heapq.heappop(frontier)

            if current == goal:
                break

            r, c = current
            # 8-directional traversal
            for dr, dc in [(-1,0), (1,0), (0,-1), (0,1), (-1,-1), (-1,1), (1,-1), (1,1)]:
                nr, nc = r + dr, c + dc
                if 0 <= nr < self.height and 0 <= nc < self.width:
                    next_node = (nr, nc)
                    
                    slope = self.compute_slope(r, c, nr, nc)
                    hazard_val = self.hazard_grid[nr][nc]
                    
                    # Slope barrier: prohibit slopes > 15 degrees for suit safety
                    if slope > slope_limit:
                        continue
                    
                    step_dist = self.res if (dr == 0 or dc == 0) else self.res * 1.414
                    
                    # Weighted Cost Function:
                    # Cost = distance * (1 + slope_weight * tan^2(slope) + hazard_weight)
                    slope_penalty = math.tan(math.radians(slope)) ** 2
                    step_cost = step_dist * (1.0 + 3.0 * slope_penalty + 5.0 * hazard_val)
                    
                    new_cost = cost_so_far[current] + step_cost
                    if next_node not in cost_so_far or new_cost < cost_so_far[next_node]:
                        cost_so_far[next_node] = new_cost
                        # Euclidean distance heuristic
                        h = math.sqrt((goal[0] - nr)**2 + (goal[1] - nc)**2) * self.res
                        priority = new_cost + h
                        heapq.heappush(frontier, (priority, next_node))
                        came_from[next_node] = current

        # Reconstruct path
        path = []
        curr = goal
        while curr:
            path.append(curr)
            curr = came_from.get(curr)
        path.reverse()
        return path

    def grid_to_latlng(self, r, c):
        """Convert local grid cell to Mars planetary coordinates."""
        d_north_m = (self.height // 2 - r) * self.res
        d_east_m = (c - self.width // 2) * self.res
        
        # Mars mean radius: 3389.5 km
        lat = self.origin_lat + (d_north_m / 3389500.0) * (180.0 / math.pi)
        lng = self.origin_lng + (d_east_m / (3389500.0 * math.cos(math.radians(self.origin_lat)))) * (180.0 / math.pi)
        return round(lat, 5), round(lng, 5)

if __name__ == "__main__":
    print("Initializing ARES-NAV Mars Planetary Routing Engine...")
    router = MarsGridTraverser(width=50, height=50)
    
    start_cell = (25, 25) # Hab Base
    science_goal = (18, 10) # Delta Front Target
    
    print(f"Running A* pathfinding from Hab {start_cell} to Science Target {science_goal}...")
    safe_path = router.astar_search(start_cell, science_goal, slope_limit=15.0)
    
    print(f"Optimal safe route calculated: {len(safe_path)} waypoints found.")
    gps_waypoints = [router.grid_to_latlng(r, c) for r, c in safe_path]
    print(f"Sample GPS Coordinates: {gps_waypoints[:3]} ... {gps_waypoints[-1]}")
