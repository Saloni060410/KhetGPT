import os
from PIL import Image, ImageDraw, ImageFont

public_dir = r"c:\Users\maste.DARSH\OneDrive\Desktop\KhetGpt\KhetGPT\frontend\public"
os.makedirs(public_dir, exist_ok=True)

# 1. Generate icon.svg
svg_content = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34D399" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E2E1E" />
      <stop offset="100%" stop-color="#070B0E" />
    </linearGradient>
  </defs>
  <rect width="100" height="100" rx="24" fill="url(#bgGrad)" />
  <circle cx="50" cy="50" r="46" fill="none" stroke="#10B981" stroke-width="1.5" stroke-opacity="0.25" />
  <!-- Soil Strata / Furrow Lines -->
  <path d="M22 72 Q50 68 78 72" stroke="#D97706" stroke-width="3" stroke-linecap="round" fill="none" opacity="0.8" />
  <path d="M26 80 Q50 77 74 80" stroke="#059669" stroke-width="2.5" stroke-linecap="round" fill="none" opacity="0.6" />
  <!-- Sprout Stem & Leaves -->
  <path d="M50 70 C50 48 50 35 50 25" stroke="#34D399" stroke-width="4.5" stroke-linecap="round" fill="none" />
  <!-- Right Leaf -->
  <path d="M50 42 C62 38 74 46 72 58 C60 62 52 52 50 42 Z" fill="url(#leafGrad)" />
  <!-- Left Leaf -->
  <path d="M50 32 C38 28 26 36 28 48 C40 52 48 42 50 32 Z" fill="url(#leafGrad)" />
  <!-- Dew / Sensor Node -->
  <circle cx="50" cy="22" r="3.5" fill="#F59E0B" />
</svg>'''

with open(os.path.join(public_dir, "icon.svg"), "w", encoding="utf-8") as f:
    f.write(svg_content)
print("Saved icon.svg")

# 2. Generate apple-touch-icon.png (180x180)
ati = Image.new("RGBA", (180, 180), (14, 46, 30, 255))
ati_draw = ImageDraw.Draw(ati)

# Draw subtle gradient / background elements
for y in range(180):
    ratio = y / 180.0
    r = int(14 * (1 - ratio * 0.5))
    g = int(46 * (1 - ratio * 0.7))
    b = int(30 * (1 - ratio * 0.6) + 14 * ratio)
    ati_draw.line([(0, y), (180, y)], fill=(r, g, b, 255))

# Draw border
ati_draw.rounded_rectangle([(3, 3), (176, 176)], radius=40, outline=(16, 185, 129, 90), width=3)

# Furrow Lines
ati_draw.line([(38, 130), (142, 130)], fill=(217, 119, 6, 220), width=5)
ati_draw.line([(48, 144), (132, 144)], fill=(5, 150, 105, 180), width=4)

# Stem
ati_draw.line([(90, 130), (90, 48)], fill=(52, 211, 153, 255), width=8)

# Right leaf
ati_draw.polygon([(90, 78), (115, 72), (134, 88), (128, 108), (105, 112), (90, 78)], fill=(16, 185, 129, 255))
# Left leaf
ati_draw.polygon([(90, 60), (65, 54), (46, 70), (52, 90), (75, 94), (90, 60)], fill=(52, 211, 153, 255))
# Node circle
ati_draw.ellipse([(83, 40), (97, 54)], fill=(245, 158, 11, 255))

ati_path = os.path.join(public_dir, "apple-touch-icon.png")
ati.save(ati_path, format="PNG")
print(f"Saved apple-touch-icon.png: {os.path.getsize(ati_path)} bytes")

# 3. Generate favicon.ico (multi-size: 16x16, 32x32, 48x48)
ico_sizes = [(16, 16), (32, 32), (48, 48)]
ico_images = [ati.resize(s, Image.Resampling.LANCZOS) for s in ico_sizes]
ico_path = os.path.join(public_dir, "favicon.ico")
ico_images[0].save(ico_path, format="ICO", sizes=ico_sizes)
print(f"Saved favicon.ico: {os.path.getsize(ico_path)} bytes")

# 4. Generate og-image.jpg (1200x630, < 1 MB)
width, height = 1200, 630
og = Image.new("RGB", (width, height), (7, 11, 14))
og_draw = ImageDraw.Draw(og)

# Background gradient & technical grid lines
for y in range(height):
    ratio = y / height
    r = int(7 + ratio * 7)
    g = int(11 + ratio * 20)
    b = int(14 + ratio * 12)
    og_draw.line([(0, y), (width, y)], fill=(r, g, b))

# Subtle grid
for x in range(0, width, 40):
    og_draw.line([(x, 0), (x, height)], fill=(20, 35, 28, 50), width=1)
for y in range(0, height, 40):
    og_draw.line([(0, y), (width, y)], fill=(20, 35, 28, 50), width=1)

# Outer card frame
og_draw.rounded_rectangle([(30, 30), (width - 30, height - 30)], radius=24, outline=(16, 185, 129, 60), width=2)

# Glow orbs
og_draw.ellipse([(800, 50), (1150, 400)], fill=(16, 185, 129, 20), outline=None)

# Brand Badge (Top-left)
og_draw.rounded_rectangle([(70, 70), (280, 118)], radius=24, fill=(14, 46, 30), outline=(16, 185, 129, 120), width=2)
# Sprout icon in badge
og_draw.line([(96, 102), (96, 84)], fill=(52, 211, 153), width=3)
og_draw.ellipse([(92, 80), (100, 88)], fill=(245, 158, 11))
# Title text fallback using standard fonts or drawn glyphs
# Try to find a nice system TTF font
font_title = None
font_sub = None
font_sm = None
font_mono = None

system_fonts = [
    r"C:\Windows\Fonts\segoeui.ttf",
    r"C:\Windows\Fonts\arial.ttf",
    r"C:\Windows\Fonts\calibri.ttf"
]
system_bold_fonts = [
    r"C:\Windows\Fonts\segoeuib.ttf",
    r"C:\Windows\Fonts\arialbd.ttf",
    r"C:\Windows\Fonts\calibrib.ttf"
]

for f in system_bold_fonts:
    if os.path.exists(f):
        font_title = ImageFont.truetype(f, 54)
        break

for f in system_fonts:
    if os.path.exists(f):
        font_sub = ImageFont.truetype(f, 26)
        font_sm = ImageFont.truetype(f, 20)
        font_mono = ImageFont.truetype(f, 18)
        break

if not font_title:
    font_title = ImageFont.load_default()
if not font_sub:
    font_sub = ImageFont.load_default()
if not font_sm:
    font_sm = ImageFont.load_default()
if not font_mono:
    font_mono = ImageFont.load_default()

# Text inside badge
og_draw.text((115, 83), "KHETGPT", fill=(245, 245, 245), font=font_sm)

# Tagline pill
og_draw.rounded_rectangle([(300, 74), (560, 114)], radius=20, fill=(20, 30, 24), outline=(40, 70, 50), width=1)
og_draw.text((315, 84), "PRECISION AGRONOMY OS", fill=(110, 231, 183), font=font_mono)

# Main Headline
og_draw.text((70, 155), "Soil Health & Fertilizer Intelligence", fill=(255, 255, 255), font=font_title)
og_draw.text((70, 225), "Calculated from Real ICAR Deficit Equations", fill=(52, 211, 153), font=font_title)

# Description text
og_draw.text((70, 310), "Transform Soil Health Card tests into field-calibrated fertilizer prescriptions.", fill=(203, 213, 225), font=font_sub)
og_draw.text((70, 350), "Zero black-box math: split-dose stages, prior organic credits, and 48h rain delay holds.", fill=(148, 163, 184), font=font_sub)

# 4 Key Capability Badges across the bottom-left
badges = [
    ("ICAR STCR Equations", "#10B981"),
    ("N-P-K Deficit Balancer", "#34D399"),
    ("48h Rain Forecast Delay", "#F59E0B"),
    ("30-Sec Dealer Schedule", "#60A5FA")
]

bx = 70
by = 440
for text, color in badges:
    tw = len(text) * 11 + 36
    og_draw.rounded_rectangle([(bx, by), (bx + tw, by + 44)], radius=12, fill=(15, 23, 21), outline=(30, 55, 45), width=1)
    og_draw.ellipse([(bx + 14, by + 17), (bx + 24, by + 27)], fill=color)
    og_draw.text((bx + 32, by + 12), text, fill=(240, 240, 240), font=font_mono)
    bx += tw + 18

# Interactive UI Preview Card on the right side
rx, ry, rw, rh = 720, 140, 420, 430
og_draw.rounded_rectangle([(rx, ry), (rx + rw, ry + rh)], radius=20, fill=(11, 19, 25), outline=(30, 60, 50), width=2)

# Card header
og_draw.text((rx + 24, ry + 24), "FIELD RECOMMENDATION #102", fill=(110, 231, 183), font=font_mono)
og_draw.text((rx + 24, ry + 50), "North Plot • Wheat (HD-2967)", fill=(255, 255, 255), font=font_sub)

# Status Badge
og_draw.rounded_rectangle([(rx + rw - 130, ry + 20), (rx + rw - 24, ry + 54)], radius=8, fill=(14, 46, 30), outline=(16, 185, 129), width=1)
og_draw.text((rx + rw - 116, ry + 27), "LOW RISK", fill=(110, 231, 183), font=font_mono)

# Metric 1: Fertilizer Needed
og_draw.rounded_rectangle([(rx + 24, ry + 100), (rx + rw - 24, ry + 180)], radius=14, fill=(15, 28, 36), outline=(24, 48, 60), width=1)
og_draw.text((rx + 40, ry + 112), "RECOMMENDED DOSE (BASAL)", fill=(148, 163, 184), font=font_mono)
og_draw.text((rx + 40, ry + 136), "55 kg/acre DAP + 35 kg Urea", fill=(255, 255, 255), font=font_sub)

# Metric 2: Nutrient Balance Breakdown
og_draw.rounded_rectangle([(rx + 24, ry + 196), (rx + rw - 24, ry + 320)], radius=14, fill=(15, 28, 36), outline=(24, 48, 60), width=1)
og_draw.text((rx + 40, ry + 208), "NUTRIENT DEFICIT VS SOIL TEST", fill=(148, 163, 184), font=font_mono)

# NPK Bars
nutrients = [
    ("Nitrogen (N)", 0.85, (52, 211, 153), "Deficit (-32 kg/ha)"),
    ("Phosphorus (P)", 0.50, (245, 158, 11), "Balanced (Soil High)"),
    ("Potassium (K)", 0.65, (96, 165, 250), "Standard Dose")
]
ny = ry + 235
for name, pct, col, note in nutrients:
    og_draw.text((rx + 40, ny), name, fill=(226, 232, 240), font=font_mono)
    og_draw.text((rx + rw - 180, ny), note, fill=(148, 163, 184), font=font_mono)
    # Track
    og_draw.rounded_rectangle([(rx + 40, ny + 18), (rx + rw - 40, ny + 24)], radius=3, fill=(30, 41, 59))
    # Fill
    bar_w = int((rw - 80) * pct)
    og_draw.rounded_rectangle([(rx + 40, ny + 18), (rx + 40 + bar_w, ny + 24)], radius=3, fill=col)
    ny += 28

# Weather alert
og_draw.rounded_rectangle([(rx + 24, ry + 336), (rx + rw - 24, ry + 406)], radius=12, fill=(24, 30, 20), outline=(180, 83, 9), width=1)
og_draw.text((rx + 40, ry + 346), "WEATHER SYNCHRONIZED", fill=(245, 158, 11), font=font_mono)
og_draw.text((rx + 40, ry + 372), "No rain (>15mm) expected in 48h. Clear to apply.", fill=(203, 213, 225), font=font_mono)

# Bottom site branding
og_draw.text((70, 560), "https://khetgpt.in  •  Open Standards & Science-Backed Agronomy", fill=(100, 116, 139), font=font_mono)

og_path = os.path.join(public_dir, "og-image.jpg")
og.save(og_path, format="JPEG", quality=90, optimize=True)
size_bytes = os.path.getsize(og_path)
print(f"Saved og-image.jpg: {size_bytes} bytes ({size_bytes / 1024:.1f} KB)")
