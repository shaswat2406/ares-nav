import os
import numpy as np
from PIL import Image

def generate_seamless_mars_pbr(out_dir, size=2048):
    os.makedirs(out_dir, exist_ok=True)
    print(f"Generating authentic 2048x2048 Mars PBR texture maps in {out_dir}...")

    # Set deterministic random seed
    np.random.seed(42)

    # 1. Base Multi-Octave Noise for Martian Topography
    x = np.linspace(0, 4 * np.pi, size, endpoint=False)
    y = np.linspace(0, 4 * np.pi, size, endpoint=False)
    X, Y = np.meshgrid(x, y)

    # Large bedrock undulations
    height = (
        np.sin(X) * np.cos(Y) * 0.35 +
        np.sin(X * 2.3 + Y * 1.7) * 0.18 +
        np.cos(X * 4.1 - Y * 3.2) * 0.10
    )

    # 2. Aeolian Sand Ripples (Wind-driven dunes characteristic of Jezero floor)
    ripple_angle = np.pi / 5.5
    X_rot = X * np.cos(ripple_angle) + Y * np.sin(ripple_angle)
    ripples = np.sin(X_rot * 24.0) * 0.08
    ripples += np.sin(X_rot * 48.0) * 0.03
    height += ripples

    # 3. High-Frequency Regolith & Basalt Pebble Synthesis (Cellular Noise)
    # Generate scattered pebble seed points with periodic wrapping
    num_pebbles = 1200
    px = np.random.uniform(0, 4 * np.pi, num_pebbles)
    py = np.random.uniform(0, 4 * np.pi, num_pebbles)
    pr = np.random.uniform(0.04, 0.18, num_pebbles)
    ph = np.random.uniform(0.12, 0.38, num_pebbles)

    # Use a 2D grid kernel to add pebbles with wrapping
    pebble_map = np.zeros((size, size), dtype=np.float32)
    step = 4 * np.pi / size

    for i in range(num_pebbles):
        cx, cy, r, h = px[i], py[i], pr[i], ph[i]
        # Radius in pixels
        r_pix = int(r / step) + 1
        gx = int(cx / step)
        gy = int(cy / step)

        y_indices = np.arange(gy - r_pix, gy + r_pix + 1) % size
        x_indices = np.arange(gx - r_pix, gx + r_pix + 1) % size
        
        dy = (y_indices - gy) * step
        # Handle wrapped distance
        dy = np.where(dy > 2 * np.pi, dy - 4 * np.pi, np.where(dy < -2 * np.pi, dy + 4 * np.pi, dy))
        dx = (x_indices - gx) * step
        dx = np.where(dx > 2 * np.pi, dx - 4 * np.pi, np.where(dx < -2 * np.pi, dx + 4 * np.pi, dx))

        DX, DY = np.meshgrid(dx, dy)
        dist_sq = DX**2 + DY**2
        mask = dist_sq < (r**2)
        p_height = np.where(mask, np.cos((np.sqrt(dist_sq) / r) * (np.pi / 2)) * h, 0)
        
        # Accumulate pebble height
        for iy, orig_y in enumerate(y_indices):
            for ix, orig_x in enumerate(x_indices):
                if p_height[iy, ix] > 0:
                    pebble_map[orig_y, orig_x] = max(pebble_map[orig_y, orig_x], p_height[iy, ix])

    height += pebble_map

    # 4. Micro-grit noise (fine crunchy regolith particles)
    micro_grit = np.random.normal(0, 0.035, (size, size))
    height += micro_grit

    # Normalize height map to [0, 1]
    h_min, h_max = height.min(), height.max()
    norm_height = (height - h_min) / (h_max - h_min)

    # =========================================================================
    # 5. Generate Photorealistic Martian Albedo / BaseColor Map
    # =========================================================================
    # Palette based on NASA Perseverance Mastcam-Z ground truth
    # Ferric Iron Oxide Dust: (188, 78, 36)
    # Dark Basaltic Rock: (58, 34, 22)
    # Tan Siltstone & Clay: (204, 128, 72)
    # Shadowed Fissures: (32, 16, 10)

    albedo = np.zeros((size, size, 3), dtype=np.uint8)

    # Color blending based on height, pebble presence, and micro-texture
    base_r = 188.0 + (norm_height - 0.5) * 45.0
    base_g = 78.0 + (norm_height - 0.5) * 38.0
    base_b = 36.0 + (norm_height - 0.5) * 26.0

    # Darken pebbles into basaltic stones
    pebble_factor = np.clip(pebble_map * 2.2, 0, 1)
    base_r = base_r * (1.0 - pebble_factor * 0.55) + 65.0 * (pebble_factor * 0.55)
    base_g = base_g * (1.0 - pebble_factor * 0.55) + 42.0 * (pebble_factor * 0.55)
    base_b = base_b * (1.0 - pebble_factor * 0.55) + 28.0 * (pebble_factor * 0.55)

    # Crevice ambient occlusion darkening in deep valleys
    crevice_factor = np.clip((0.35 - norm_height) * 2.0, 0, 1)
    base_r *= (1.0 - crevice_factor * 0.4)
    base_g *= (1.0 - crevice_factor * 0.4)
    base_b *= (1.0 - crevice_factor * 0.4)

    # Add realistic photographic grain
    grain = np.random.normal(1.0, 0.04, (size, size))
    base_r = np.clip(base_r * grain, 0, 255)
    base_g = np.clip(base_g * grain, 0, 255)
    base_b = np.clip(base_b * grain, 0, 255)

    albedo[..., 0] = base_r.astype(np.uint8)
    albedo[..., 1] = base_g.astype(np.uint8)
    albedo[..., 2] = base_b.astype(np.uint8)

    albedo_img = Image.fromarray(albedo)
    albedo_path = os.path.join(out_dir, "mars_surface_albedo.jpg")
    albedo_img.save(albedo_path, quality=94)
    print(f"Saved: {albedo_path} ({os.path.getsize(albedo_path) / 1024:.1f} KB)")

    # =========================================================================
    # 6. Generate High-Fidelity Tangent-Space Normal Map
    # =========================================================================
    # Tangent Space: R = (Nx + 1)/2, G = (Ny + 1)/2, B = Nz
    strength = 3.5
    # Periodic finite difference
    dx = (np.roll(norm_height, -1, axis=1) - np.roll(norm_height, 1, axis=1)) * strength
    dy = (np.roll(norm_height, -1, axis=0) - np.roll(norm_height, 1, axis=0)) * strength
    dz = np.ones_like(norm_height)

    # Normalize vectors
    length = np.sqrt(dx**2 + dy**2 + dz**2)
    nx = -dx / length
    ny = -dy / length
    nz = dz / length

    normal_map = np.zeros((size, size, 3), dtype=np.uint8)
    normal_map[..., 0] = np.clip((nx + 1.0) * 127.5, 0, 255).astype(np.uint8)
    normal_map[..., 1] = np.clip((ny + 1.0) * 127.5, 0, 255).astype(np.uint8)
    normal_map[..., 2] = np.clip(nz * 255.0, 0, 255).astype(np.uint8)

    normal_img = Image.fromarray(normal_map)
    normal_path = os.path.join(out_dir, "mars_surface_normal.jpg")
    normal_img.save(normal_path, quality=94)
    print(f"Saved: {normal_path} ({os.path.getsize(normal_path) / 1024:.1f} KB)")

    # =========================================================================
    # 7. Generate Roughness Map
    # =========================================================================
    # Fine dust = high roughness (0.92 = 235), hard basalt rock = lower roughness (0.55 = 140)
    roughness = (0.88 - pebble_factor * 0.32 + np.random.normal(0, 0.02, (size, size))) * 255.0
    roughness = np.clip(roughness, 0, 255).astype(np.uint8)
    roughness_img = Image.fromarray(roughness)
    roughness_path = os.path.join(out_dir, "mars_surface_roughness.jpg")
    roughness_img.save(roughness_path, quality=90)
    print(f"Saved: {roughness_path} ({os.path.getsize(roughness_path) / 1024:.1f} KB)")

    print("All Mars PBR textures generated successfully!")

if __name__ == "__main__":
    generate_seamless_mars_pbr("public/textures", size=2048)
