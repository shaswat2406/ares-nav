#!/usr/bin/env python3
"""
ARES-NAV 30-Second Mission Presentation Video Generator
NASA Space Apps Challenge 2026 // Team Singular Anomaly
Outputs 1920x1080 30fps MP4 with custom synthesized aerospace soundtrack.
"""

import os
import sys
import math
import subprocess
import numpy as np
import scipy.io.wavfile as wav
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance
import imageio_ffmpeg

WIDTH = 1920
HEIGHT = 1080
FPS = 30
DURATION_SEC = 30.0
TOTAL_FRAMES = int(FPS * DURATION_SEC) # 900 frames

BASE_DIR = r"C:\Users\asus\.gemini\antigravity\scratch\ares-nav"
ASSETS_DIR = os.path.join(BASE_DIR, "scripts", "video_assets")
AUDIO_PATH = os.path.join(BASE_DIR, "scripts", "soundtrack.wav")
OUTPUT_VIDEO = os.path.join(BASE_DIR, "ARES_NAV_MISSION_DEMO_30S.mp4")

# Load Fonts
FONT_TITLE = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 64)
FONT_SUBTITLE = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 32)
FONT_HEADING = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 26)
FONT_BODY = ImageFont.truetype(r"C:\Windows\Fonts\segoeuib.ttf", 20)
FONT_MONO = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 20)
FONT_MONO_SM = ImageFont.truetype(r"C:\Windows\Fonts\consolab.ttf", 16)
FONT_BIG = ImageFont.truetype(r"C:\Windows\Fonts\arialbd.ttf", 84)

# Load screenshot images
img_s3d = Image.open(os.path.join(ASSETS_DIR, "step_2.png")).convert("RGBA")
img_gis = Image.open(os.path.join(ASSETS_DIR, "step_4.png")).convert("RGBA")
img_globe = Image.open(os.path.join(ASSETS_DIR, "step_6.png")).convert("RGBA")
img_wiki = Image.open(os.path.join(ASSETS_DIR, "step_8.png")).convert("RGBA")

# ─────────────────────────────────────────────────────────────────────────────
# 1. AUDIO SYNTHESIZER (30 Seconds Stereo Aerospace Soundscape)
# ─────────────────────────────────────────────────────────────────────────────
def generate_audio(output_path, duration=30.0, sr=44100):
    print(f"Synthesizing {duration}s tactical aerospace soundtrack...")
    n_samples = int(duration * sr)
    t = np.linspace(0, duration, n_samples, endpoint=False)
    
    # Low-frequency spacecraft ambient drone (55Hz + 110Hz harmonics)
    hum = 0.20 * np.sin(2 * np.pi * 55 * t) + 0.09 * np.sin(2 * np.pi * 110 * t)
    lfo = 0.85 + 0.15 * np.sin(2 * np.pi * 0.2 * t)
    audio = hum * lfo
    
    # Filtered life support airflow / thermal circulation noise
    np.random.seed(42)
    noise = np.random.normal(0, 0.018, n_samples)
    audio += noise
    
    # Periodic radar sweep chirps
    radar_times = [0.4, 4.5, 9.5, 15.5, 21.0, 26.0]
    for rt in radar_times:
        idx = int(rt * sr)
        dur = int(0.35 * sr)
        if idx + dur < n_samples:
            tr = np.linspace(0, 0.35, dur)
            freq = np.linspace(1100, 1550, dur)
            env = np.exp(-tr * 9.0)
            chirp = 0.16 * np.sin(2 * np.pi * freq * tr) * env
            audio[idx:idx+dur] += chirp
            
    # Digital telemetry data chatter at scene transitions
    transition_times = [4.6, 9.6, 15.6, 21.1]
    for tt in transition_times:
        idx = int(tt * sr)
        for b in range(10):
            b_start = idx + int(b * 0.035 * sr)
            b_dur = int(0.018 * sr)
            if b_start + b_dur < n_samples:
                tb = np.linspace(0, 0.018, b_dur)
                freq_b = 1900 + (b % 4) * 400
                env_b = np.exp(-tb * 140)
                audio[b_start:b_start+b_dur] += 0.07 * np.sin(2 * np.pi * freq_b * tb) * env_b
                
    # Final affirmative mission confirmation chime at 26.5s
    c_start = int(26.5 * sr)
    c_dur = int(3.2 * sr)
    if c_start + c_dur <= n_samples:
        tc = np.linspace(0, 3.2, c_dur)
        env_c = np.exp(-tc * 1.3)
        # C-major 9 chord
        chord = (
            0.13 * np.sin(2 * np.pi * 523.25 * tc) +
            0.11 * np.sin(2 * np.pi * 659.25 * tc) +
            0.11 * np.sin(2 * np.pi * 783.99 * tc) +
            0.09 * np.sin(2 * np.pi * 987.77 * tc) +
            0.08 * np.sin(2 * np.pi * 1174.66 * tc)
        ) * env_c
        audio[c_start:c_start+c_dur] += chord
        
    # Fade in / fade out
    fade_in = np.minimum(1.0, np.linspace(0, 1.0, int(0.4 * sr)))
    fade_out = np.minimum(1.0, np.linspace(1.0, 0, int(0.6 * sr)))
    audio[:len(fade_in)] *= fade_in
    audio[-len(fade_out):] *= fade_out
    
    audio = np.clip(audio, -0.95, 0.95)
    audio_int16 = (audio * 32767).astype(np.int16)
    stereo = np.column_stack((audio_int16, audio_int16))
    wav.write(output_path, sr, stereo)
    print("Audio soundtrack synthesized successfully.")

# ─────────────────────────────────────────────────────────────────────────────
# 2. DRAWING HELPERS
# ─────────────────────────────────────────────────────────────────────────────
def draw_hud_header(draw, t, section_title="TACTICAL EVA MISSION PLANNER"):
    # Dark carbon header bar
    draw.rectangle([0, 0, WIDTH, 64], fill=(2, 6, 23, 230))
    draw.line([0, 64, WIDTH, 64], fill=(0, 240, 255, 180), width=2)
    
    # Left brand
    draw.rectangle([24, 14, 56, 46], fill=(0, 240, 255, 40), outline=(0, 240, 255, 200), width=1)
    draw.polygon([(40, 18), (30, 42), (50, 42)], fill=(0, 240, 255, 240))
    draw.text((68, 18), "ARES-NAV", font=FONT_HEADING, fill=(248, 250, 252))
    draw.text((215, 23), "// NASA SPACE APPS CHALLENGE 2026", font=FONT_MONO_SM, fill=(0, 240, 255))
    
    # Center section
    draw.text((WIDTH//2 - 160, 22), f"● {section_title}", font=FONT_BODY, fill=(147, 197, 253))
    
    # Right telemetry
    sec = int(t)
    ms = int((t - sec) * 100)
    clock_str = f"T+{sec:02d}:{ms:02d}s | SOL 1328 | SURAT HUB"
    draw.text((WIDTH - 420, 22), clock_str, font=FONT_MONO_SM, fill=(52, 211, 153))

def draw_hud_footer(draw, t):
    # Dark carbon footer bar
    draw.rectangle([0, HEIGHT - 52, WIDTH, HEIGHT], fill=(2, 6, 23, 230))
    draw.line([0, HEIGHT - 52, WIDTH, HEIGHT - 52], fill=(0, 240, 255, 140), width=1)
    
    # Footer telemetry info
    draw.text((32, HEIGHT - 36), "JEZERO CRATER [18.4447°N, 77.4508°E]", font=FONT_MONO_SM, fill=(148, 163, 184))
    draw.text((450, HEIGHT - 36), "ELEV: -2570m", font=FONT_MONO_SM, fill=(251, 191, 36))
    draw.text((620, HEIGHT - 36), "LIFE SUPPORT O₂: 88% NOMINAL", font=FONT_MONO_SM, fill=(52, 211, 153))
    draw.text((950, HEIGHT - 36), "MAX PITCH: 8.4° (SAFE)", font=FONT_MONO_SM, fill=(52, 211, 153))
    
    # Blinking status indicator
    blink = int(t * 3) % 2 == 0
    dot_color = (52, 211, 153) if blink else (16, 78, 50)
    draw.ellipse([WIDTH - 360, HEIGHT - 34, WIDTH - 348, HEIGHT - 22], fill=dot_color)
    draw.text((WIDTH - 340, HEIGHT - 36), "MISSION CONTROL: ONLINE", font=FONT_MONO_SM, fill=(226, 232, 240))

def draw_floating_badge(draw, x, y, title, subtitle, color=(0, 240, 255), icon="●", width=420):
    draw.rectangle([x, y, x + width, y + 68], fill=(4, 8, 22, 225), outline=color, width=1)
    # Accent strip on left
    draw.rectangle([x, y, x + 4, y + 68], fill=color)
    draw.text((x + 16, y + 10), f"{icon} {title}", font=FONT_BODY, fill=color)
    draw.text((x + 16, y + 38), subtitle, font=FONT_MONO_SM, fill=(203, 213, 225))

# ─────────────────────────────────────────────────────────────────────────────
# 3. SCENE RENDERING PIPELINE
# ─────────────────────────────────────────────────────────────────────────────
def render_frame(f_idx):
    t = f_idx / FPS
    img = Image.new("RGBA", (WIDTH, HEIGHT), (2, 6, 23, 255))
    draw = ImageDraw.Draw(img)
    
    # ── SCENE 1: (0.0s – 4.5s) INTRO & TITLE ──
    if t < 4.5:
        progress = t / 4.5
        # Subtle starfield
        np.random.seed(101)
        for _ in range(120):
            sx = (np.random.randint(0, WIDTH) + int(t * 8)) % WIDTH
            sy = np.random.randint(70, HEIGHT - 60)
            sb = np.random.randint(120, 255)
            draw.point((sx, sy), fill=(sb, sb, sb))
            
        # Martian glowing curved horizon at bottom
        for dy in range(120):
            alpha = int(90 * (1.0 - dy / 120.0))
            draw.line([0, HEIGHT - 180 + dy, WIDTH, HEIGHT - 180 + dy], fill=(194, 65, 12, alpha), width=1)
            
        # Challenge Category Tag
        draw.rectangle([WIDTH//2 - 380, 180, WIDTH//2 + 380, 226], fill=(0, 240, 255, 25), outline=(0, 240, 255, 180), width=1)
        draw.text((WIDTH//2 - 350, 192), "NASA SPACE APPS CHALLENGE 2026 // INTERPLANETARY SURVIVAL GUIDE: MARTIAN MAP", font=FONT_MONO_SM, fill=(0, 240, 255))
        
        # Giant Title with drop glow
        draw.text((WIDTH//2 - 275, 270), "ARES-NAV", font=FONT_BIG, fill=(0, 240, 255, 80))
        draw.text((WIDTH//2 - 270, 265), "ARES-NAV", font=FONT_BIG, fill=(255, 255, 255))
        
        # Subtitle
        draw.text((WIDTH//2 - 470, 380), "MARTIAN EXTRAVEHICULAR ACTIVITY (EVA) TACTICAL MISSION PLANNER", font=FONT_SUBTITLE, fill=(226, 232, 240))
        
        # Team Tag
        draw.text((WIDTH//2 - 300, 440), "TEAM: SINGULAR ANOMALY · SURAT HUB, INDIA", font=FONT_BODY, fill=(52, 211, 153))
        draw.text((WIDTH//2 - 240, 475), "ASTRONAUT & MISSION ENGINEER: SHASWAT SINHA", font=FONT_MONO_SM, fill=(148, 163, 184))
        
        # Core Pitch Box
        box_y = 560
        draw.rectangle([WIDTH//2 - 500, box_y, WIDTH//2 + 500, box_y + 130], fill=(15, 23, 42, 220), outline=(59, 130, 246, 160), width=1)
        draw.text((WIDTH//2 - 470, box_y + 20), "“Global orbital maps show where Mars is.", font=FONT_BODY, fill=(203, 213, 225))
        draw.text((WIDTH//2 - 450, box_y + 55), "ARES-NAV shows an astronaut where their next footstep should go.”", font=FONT_HEADING, fill=(0, 240, 255))
        draw.text((WIDTH//2 - 470, box_y + 95), "Integrated Multi-Mission Planetary Geospatial & Life Support Intelligence for Jezero Crater", font=FONT_MONO_SM, fill=(148, 163, 184))
        
        draw_hud_header(draw, t, "MISSION INITIALIZATION // JEZERO CRATER")
        draw_hud_footer(draw, t)
        
        # Fade out into next scene
        if t > 4.0:
            fade = int(255 * (t - 4.0) / 0.5)
            overlay = Image.new("RGBA", (WIDTH, HEIGHT), (2, 6, 23, fade))
            img = Image.alpha_composite(img, overlay)
            
        return img.convert("RGB")

    # ── SCENE 2: (4.5s – 9.5s) 3D TACTICAL SURFACE HUD ──
    elif t < 9.5:
        rel_t = (t - 4.5) / 5.0
        # Ken Burns zoom on step_2.png
        scale = 1.05 + 0.10 * rel_t
        w_crop = int(1024 / scale)
        h_crop = int(938 / scale)
        x_crop = int(rel_t * 80)
        y_crop = int(rel_t * 60)
        cropped = img_s3d.crop((x_crop, y_crop, x_crop + w_crop, y_crop + h_crop))
        scaled_bg = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        img.paste(scaled_bg, (0, 0))
        draw = ImageDraw.Draw(img)
        
        # Dark vignette overlay
        draw.rectangle([0, 0, 520, HEIGHT], fill=(2, 6, 23, 160))
        
        # Scene Tag
        draw.rectangle([40, 90, 480, 130], fill=(249, 115, 22, 40), outline=(249, 115, 22, 220), width=1)
        draw.text((56, 100), "01 // 3D SURFACE TACTICAL CANYON VIEW", font=FONT_MONO, fill=(251, 146, 60))
        
        # Feature Badges
        draw_floating_badge(draw, 40, 150, "FIRST-PERSON VISOR POV", "Interactive astronaut camera view with Rayleigh rim glow", color=(0, 240, 255), icon="🥽", width=460)
        draw_floating_badge(draw, 40, 235, "SOL 1328 LIVE WEATHER", "MEDA Telemetry: -58.2°C · 610 Pa · 4.2 m/s Wind", color=(251, 191, 36), icon="🌡️", width=460)
        draw_floating_badge(draw, 40, 320, "SURFACE COSMIC RADIATION", "Perseverance RAD Baseline: 0.62 mSv/day (Continuous)", color=(239, 68, 68), icon="☢️", width=460)
        draw_floating_badge(draw, 40, 405, "DYNAMIC DUST STORM SIMULATION", "Atmospheric opacity & optical depth (tau) stress-testing", color=(168, 85, 247), icon="🌪️", width=460)
        
        # Radar scanline animation
        scan_y = int(70 + (rel_t * 800) % 750)
        draw.line([0, scan_y, WIDTH, scan_y], fill=(0, 240, 255, 90), width=2)
        
        draw_hud_header(draw, t, "JEZERO CRATER 3D TACTICAL SURFACE HUD")
        draw_hud_footer(draw, t)
        return img.convert("RGB")

    # ── SCENE 3: (9.5s – 15.5s) MULTI-ALGORITHM PATHFINDING COMPARISON ──
    elif t < 15.5:
        rel_t = (t - 9.5) / 6.0
        # Background: Dimmed 3D surface
        scaled_bg = img_s3d.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        img.paste(scaled_bg, (0, 0))
        overlay = Image.new("RGBA", (WIDTH, HEIGHT), (2, 6, 23, 195))
        img = Image.alpha_composite(img, overlay)
        draw = ImageDraw.Draw(img)
        
        # Header banner
        draw.rectangle([WIDTH//2 - 380, 85, WIDTH//2 + 380, 130], fill=(16, 185, 129, 30), outline=(16, 185, 129, 220), width=1)
        draw.text((WIDTH//2 - 350, 97), "02 // SLOPE-PENALIZED A* PATHFINDING VS UNCONSTRAINED ROUTE", font=FONT_MONO, fill=(52, 211, 153))
        
        # Left Box: A* Safe Path (Emerald Winner)
        card_w = 700
        card_h = 490
        card_y = 155
        left_x = 180
        draw.rectangle([left_x, card_y, left_x + card_w, card_y + card_h], fill=(4, 18, 14, 235), outline=(16, 185, 129), width=2)
        draw.rectangle([left_x, card_y, left_x + card_w, card_y + 50], fill=(16, 185, 129, 50))
        draw.text((left_x + 24, card_y + 12), "✓ A* OPTIMIZED SAFE CORRIDOR (EMERALD)", font=FONT_HEADING, fill=(52, 211, 153))
        
        metrics_safe = [
            ("SAFETY CONFIDENCE SCORE", "96% (CRITICAL HAZARDS AVOIDED)", (52, 211, 153)),
            ("TRAVERSE DISTANCE", "3.82 km", (248, 250, 252)),
            ("MAXIMUM TERRAIN PITCH", "8.4° (WELL UNDER 15° SUIT LIMIT)", (52, 211, 153)),
            ("ESTIMATED WALKING TIME", "85 MIN (NOMINAL 3.0 KM/H SPEED)", (203, 213, 225)),
            ("OXYGEN CONSUMPTION", "38% EXPENDED (SUIT RESERVES > 60%)", (52, 211, 153)),
            ("HAZARD MITIGATION", "Circumnavigates Séítah Dunes & Delta Cliffs", (147, 197, 253))
        ]
        for idx, (label, val, col) in enumerate(metrics_safe):
            yy = card_y + 70 + idx * 68
            draw.text((left_x + 24, yy), label, font=FONT_MONO_SM, fill=(148, 163, 184))
            draw.text((left_x + 24, yy + 22), val, font=FONT_BODY, fill=col)
            draw.line([left_x + 24, yy + 54, left_x + card_w - 24, yy + 54], fill=(16, 185, 129, 50), width=1)
            
        # Right Box: Unconstrained Direct Line (Red Hazard)
        right_x = 1040
        draw.rectangle([right_x, card_y, right_x + card_w, card_y + card_h], fill=(24, 6, 10, 235), outline=(239, 68, 68), width=2)
        draw.rectangle([right_x, card_y, right_x + card_w, card_y + 50], fill=(239, 68, 68, 50))
        draw.text((right_x + 24, card_y + 12), "⚠ UNCONSTRAINED DIRECT LINE (RED HAZARD)", font=FONT_HEADING, fill=(248, 113, 113))
        
        metrics_danger = [
            ("SAFETY CONFIDENCE SCORE", "42% (HIGH SEVERE RISK)", (248, 113, 113)),
            ("TRAVERSE DISTANCE", "3.20 km (Shorter straight-line)", (203, 213, 225)),
            ("MAXIMUM TERRAIN PITCH", "26.2° (CRITICAL ROLLOVER SCARP)", (239, 68, 68)),
            ("ESTIMATED WALKING TIME", "112 MIN (SEVERE SLOPE DELAY)", (248, 113, 113)),
            ("OXYGEN CONSUMPTION", "68% EXPENDED (DANGEROUS SUIT LOAD)", (239, 68, 68)),
            ("HAZARD MITIGATION", "Traps explorer in deep dune sands & scarps", (248, 113, 113))
        ]
        for idx, (label, val, col) in enumerate(metrics_danger):
            yy = card_y + 70 + idx * 68
            draw.text((right_x + 24, yy), label, font=FONT_MONO_SM, fill=(148, 163, 184))
            draw.text((right_x + 24, yy + 22), val, font=FONT_BODY, fill=col)
            draw.line([right_x + 24, yy + 54, right_x + card_w - 24, yy + 54], fill=(239, 68, 68, 50), width=1)
            
        # Mathematical Equation Banner
        draw.rectangle([left_x, card_y + card_h + 16, right_x + card_w, card_y + card_h + 65], fill=(15, 23, 42, 240), outline=(0, 240, 255, 160), width=1)
        eq_text = "A* ENERGY-OPTIMIZED COST ENGINE: Cost = d_ij × (1 + w_slope · tan²θ + w_hazard · H_zone)  |  25% SAFETY O₂ RESERVE POLICY"
        draw.text((left_x + 40, card_y + card_h + 30), eq_text, font=FONT_MONO_SM, fill=(0, 240, 255))
        
        draw_hud_header(draw, t, "PATHFINDING BENCHMARK // A* VS DIJKSTRA VS DIRECT")
        draw_hud_footer(draw, t)
        return img.convert("RGB")

    # ── SCENE 4: (15.5s – 21.0s) NASA MARS TREK GIS RECONNAISSANCE ──
    elif t < 21.0:
        rel_t = (t - 15.5) / 5.5
        # Ken Burns pan over GIS map
        scale = 1.08 + 0.12 * rel_t
        w_crop = int(1024 / scale)
        h_crop = int(938 / scale)
        x_crop = int(rel_t * 60)
        y_crop = int(40 + rel_t * 40)
        cropped = img_gis.crop((x_crop, y_crop, x_crop + w_crop, y_crop + h_crop))
        scaled_bg = cropped.resize((WIDTH, HEIGHT), Image.Resampling.BILINEAR)
        img.paste(scaled_bg, (0, 0))
        draw = ImageDraw.Draw(img)
        
        # Left overlay panel
        draw.rectangle([40, 90, 560, HEIGHT - 80], fill=(2, 6, 23, 215), outline=(0, 240, 255, 120), width=1)
        
        # Section Tag
        draw.rectangle([60, 110, 540, 150], fill=(0, 240, 255, 30), outline=(0, 240, 255, 200), width=1)
        draw.text((75, 120), "03 // NASA JPL MARS TREK GIS RECON", font=FONT_MONO, fill=(0, 240, 255))
        
        # Dataset callouts
        draw_floating_badge(draw, 60, 175, "MGS MOLA DEM ELEVATION", "Global Color-Shaded Elevation Tiles (463 m/px datum)", color=(251, 191, 36), icon="🛰️", width=480)
        draw_floating_badge(draw, 60, 260, "MRO HiRISE ORBITAL MOSAIC", "25 cm/pixel Ultra-High-Resolution Surface Morphology", color=(52, 211, 153), icon="📷", width=480)
        draw_floating_badge(draw, 60, 345, "MRO CRISM MINERALOGY", "Smectite clays, carbonates & hydrated mineral detections", color=(192, 132, 252), icon="💎", width=480)
        draw_floating_badge(draw, 60, 430, "PERSEVERANCE ROVER TRAVERSE", "Sols 1–1328 actual empirical waypoint navigation line", color=(251, 146, 60), icon="🚜", width=480)
        draw_floating_badge(draw, 60, 515, "UNCLUTTERED RESPONSIVE HUD", "Collapsible Sites & Layers dropdowns + Instant EyeOff pure map view", color=(0, 240, 255), icon="👁️", width=480)
        
        draw_hud_header(draw, t, "NASA JPL MARS TREK // MULTI-LAYER GIS INTEGRATION")
        draw_hud_footer(draw, t)
        return img.convert("RGB")

    # ── SCENE 5: (21.0s – 26.0s) 3D MARS GLOBE & WIKIPEDIA DOSSIERS ──
    elif t < 26.0:
        rel_t = (t - 21.0) / 5.0
        # Composite: Left half shows 3D Globe, Right half shows Wikipedia Dossier
        scaled_globe = img_globe.resize((960, HEIGHT), Image.Resampling.BILINEAR)
        scaled_wiki = img_wiki.resize((960, HEIGHT), Image.Resampling.BILINEAR)
        img.paste(scaled_globe, (0, 0))
        img.paste(scaled_wiki, (960, 0))
        draw = ImageDraw.Draw(img)
        
        # Center dividing glowing line
        draw.line([960, 64, 960, HEIGHT - 52], fill=(168, 85, 247, 220), width=3)
        
        # Left tag: 3D Globe
        draw.rectangle([40, 90, 520, 130], fill=(168, 85, 247, 40), outline=(168, 85, 247, 220), width=1)
        draw.text((55, 100), "04 // 3D MARS GLOBE DIGITAL TWIN", font=FONT_MONO, fill=(216, 180, 254))
        
        draw_floating_badge(draw, 40, 150, "4K PROCEDURAL SURFACE", "Valles Marineris, Olympus Mons & Rayleigh Atmosphere", color=(216, 180, 254), icon="🪐", width=460)
        draw_floating_badge(draw, 40, 235, "18+ HISTORICAL MISSIONS", "Radar pins for all NASA, ESA & CNSA rovers and landers", color=(52, 211, 153), icon="📍", width=460)
        draw_floating_badge(draw, 40, 320, "AI MISSION COMMANDER", "Integrated Gemini 1.5 Flash tactical advisor in suit HUD", color=(99, 102, 241), icon="🤖", width=460)
        
        # Right tag: Wikipedia Dossier
        draw.rectangle([1000, 90, 1520, 130], fill=(0, 240, 255, 40), outline=(0, 240, 255, 220), width=1)
        draw.text((1015, 100), "05 // INTERACTIVE WIKIPEDIA DOSSIERS", font=FONT_MONO, fill=(0, 240, 255))
        
        draw_floating_badge(draw, 1000, HEIGHT - 180, "COMPREHENSIVE SCIENTIFIC ARCHIVES", "Payload, instruments, landing coords & discoveries", color=(0, 240, 255), icon="📚", width=500)
        
        draw_hud_header(draw, t, "GLOBAL MARS TWIN // HISTORICAL SITES & DOSSIERS")
        draw_hud_footer(draw, t)
        return img.convert("RGB")

    # ── SCENE 6: (26.0s – 30.0s) TEST VERIFICATION & OUTRO ──
    else:
        rel_t = (t - 26.0) / 4.0
        # Deep space background with glowing emerald & cyan accents
        draw.rectangle([0, 0, WIDTH, HEIGHT], fill=(2, 6, 23, 255))
        
        # Glowing verification box
        box_w = 1100
        box_h = 580
        bx = (WIDTH - box_w) // 2
        by = 180
        draw.rectangle([bx, by, bx + box_w, by + box_h], fill=(4, 15, 24, 245), outline=(16, 185, 129), width=2)
        draw.rectangle([bx, by, bx + box_w, by + 70], fill=(16, 185, 129, 40))
        
        draw.text((bx + 120, by + 18), "✓ 70 / 70 SCIENTIFIC & ALGORITHMIC TESTS VERIFIED (100%)", font=FONT_HEADING, fill=(52, 211, 153))
        
        test_highlights = [
            "✓ Topography & DEM Slope Bounded [0°, 90°] (Flat, Gentle, Cliff)",
            "✓ Multi-Algorithm Cost Matrix: A* Safe Score >= Direct Line",
            "✓ Biophysical Suit Life Support: Dynamic O₂ Burn & Metabolic Scaling",
            "✓ Real-time Telemetry: Perseverance RAD Sol 1328 Ground Truth (0.62 mSv/day)",
            "✓ NASA PDS Archives: MOLA, HiRISE, CRISM, MEDA, THEMIS, MAVEN Citing"
        ]
        for i, th in enumerate(test_highlights):
            draw.text((bx + 80, by + 95 + i * 44), th, font=FONT_BODY, fill=(226, 232, 240))
            
        # URLs & Links
        draw.rectangle([bx + 60, by + 340, bx + box_w - 60, by + 460], fill=(15, 23, 42, 240), outline=(0, 240, 255, 180), width=1)
        draw.text((bx + 90, by + 355), "LIVE DEPLOYMENT:", font=FONT_MONO_SM, fill=(148, 163, 184))
        draw.text((bx + 280, by + 352), "https://ares-nav.netlify.app", font=FONT_HEADING, fill=(0, 240, 255))
        
        draw.text((bx + 90, by + 410), "OPEN SOURCE CODE:", font=FONT_MONO_SM, fill=(148, 163, 184))
        draw.text((bx + 280, by + 408), "https://github.com/shaswat2406/ares-nav", font=FONT_BODY, fill=(52, 211, 153))
        
        # Closing credits
        draw.text((bx + 180, by + 490), "TEAM: SINGULAR ANOMALY  ·  SURAT HUB, INDIA", font=FONT_HEADING, fill=(248, 250, 252))
        draw.text((bx + 230, by + 530), "NASA SPACE APPS CHALLENGE 2026 // MARTIAN MAP", font=FONT_MONO_SM, fill=(251, 191, 36))
        
        draw_hud_header(draw, t, "MISSION EVALUATION COMPLETE // ALL SYSTEMS GO")
        draw_hud_footer(draw, t)
        
        # Subtle fade out at final 0.5s
        if t > 29.5:
            fade = int(255 * (t - 29.5) / 0.5)
            overlay = Image.new("RGBA", (WIDTH, HEIGHT), (0, 0, 0, fade))
            img = Image.alpha_composite(img, overlay)
            
        return img.convert("RGB")

# ─────────────────────────────────────────────────────────────────────────────
# 4. MAIN ENCODING LOOP VIA FFMPEG PIPE
# ─────────────────────────────────────────────────────────────────────────────
def main():
    print(f"=== ARES-NAV 30-SECOND MISSION PRESENTATION VIDEO GENERATOR ===")
    print(f"Target: {OUTPUT_VIDEO}")
    print(f"Resolution: {WIDTH}x{HEIGHT} @ {FPS}fps | Total Frames: {TOTAL_FRAMES}")
    
    # 1. Synthesize audio
    generate_audio(AUDIO_PATH, DURATION_SEC)
    
    # 2. Setup ffmpeg pipeline
    ffmpeg_exe = imageio_ffmpeg.get_ffmpeg_exe()
    cmd = [
        ffmpeg_exe,
        "-y",
        "-loglevel", "error",          # Suppress continuous progress to prevent buffer blockage
        "-f", "rawvideo",
        "-vcodec", "rawvideo",
        "-s", f"{WIDTH}x{HEIGHT}",
        "-pix_fmt", "rgb24",
        "-r", str(FPS),
        "-i", "-",                     # Pipe raw frames from stdin
        "-i", AUDIO_PATH,              # Audio soundtrack
        "-c:v", "libx264",
        "-preset", "fast",
        "-crf", "18",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac",
        "-b:a", "192k",
        "-shortest",
        OUTPUT_VIDEO
    ]
    
    print(f"Launching FFmpeg: {' '.join(cmd[:8])}...")
    proc = subprocess.Popen(cmd, stdin=subprocess.PIPE, stderr=subprocess.DEVNULL)
    
    start_time = time.time()
    for f in range(TOTAL_FRAMES):
        frame_img = render_frame(f)
        proc.stdin.write(frame_img.tobytes())
        if f % 90 == 0 or f == TOTAL_FRAMES - 1:
            elapsed = time.time() - start_time
            fps_proc = (f + 1) / max(elapsed, 0.001)
            pct = ((f + 1) / TOTAL_FRAMES) * 100
            print(f"Rendering frame {f+1}/{TOTAL_FRAMES} ({pct:.1f}%) - Speed: {fps_proc:.1f} fps")
            
    proc.stdin.close()
    proc.wait()
    
    elapsed = time.time() - start_time
    file_size_mb = os.path.getsize(OUTPUT_VIDEO) / (1024 * 1024)
    print(f"\n===============================================================")
    print(f" SUCCESS: 30-SECOND PRESENTATION VIDEO GENERATED!")
    print(f" Output File : {OUTPUT_VIDEO}")
    print(f" File Size   : {file_size_mb:.2f} MB")
    print(f" Elapsed Time: {elapsed:.1f} seconds")
    print(f"===============================================================")

if __name__ == "__main__":
    import time
    main()
