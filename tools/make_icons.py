#!/usr/bin/env python3
"""Generate Cool UP app icons (tree shading from the sun) into icons/."""
import os, sys
from PIL import Image, ImageDraw

OUT = sys.argv[1] if len(sys.argv) > 1 else "icons"
S = 2048  # draw large, downsample for anti-aliasing

TEAL_TOP, TEAL_BOT = (79, 179, 207), (11, 93, 117)
SUN, GREEN, GREEN_D, TRUNK = (255, 179, 71), (61, 171, 99), (45, 138, 78), (122, 74, 40)

def base(maskable):
    img = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    grad = Image.new("RGBA", (S, S))
    gd = ImageDraw.Draw(grad)
    for y in range(S):
        t = y / (S - 1)
        gd.line([(0, y), (S, y)], fill=tuple(int(a + (b - a) * t) for a, b in zip(TEAL_TOP, TEAL_BOT)) + (255,))
    mask = Image.new("L", (S, S), 0)
    md = ImageDraw.Draw(mask)
    if maskable:
        md.rectangle([0, 0, S, S], fill=255)          # full bleed; OS applies its own mask
    else:
        md.rounded_rectangle([0, 0, S - 1, S - 1], radius=int(S * 0.22), fill=255)
    img.paste(grad, (0, 0), mask)
    return img

def art(img, scale):
    d = ImageDraw.Draw(img)
    c = S / 2
    u = S * scale / 100.0  # 1 unit = 1% of the safe area
    def circ(x, y, r, fill):
        d.ellipse([c + (x - r) * u, c + (y - r) * u, c + (x + r) * u, c + (y + r) * u], fill=fill)
    # sun, upper right, with rays
    sx, sy = 22, -22
    for i in range(12):
        import math
        a = i * math.pi / 6
        d.line([c + (sx + 17 * math.cos(a)) * u, c + (sy + 17 * math.sin(a)) * u,
                c + (sx + 24 * math.cos(a)) * u, c + (sy + 24 * math.sin(a)) * u],
               fill=SUN, width=int(4.5 * u))
    circ(sx, sy, 13, SUN)
    # ground shadow (the cool spot), blended rather than painted over
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    ImageDraw.Draw(sh).ellipse([c - 30 * u, c + 33 * u, c + 30 * u, c + 43 * u], fill=(0, 30, 40, 80))
    img.alpha_composite(sh)
    d = ImageDraw.Draw(img)
    # trunk
    d.rounded_rectangle([c - 5 * u, c + 4 * u, c + 5 * u, c + 38 * u], radius=int(3 * u), fill=TRUNK)
    # canopy
    for x, y, r, col in [(-20, 2, 18, GREEN_D), (16, 4, 17, GREEN_D), (-2, -6, 24, GREEN),
                         (-18, -2, 16, GREEN), (14, 0, 15, GREEN), (-4, -22, 16, GREEN)]:
        circ(x, y, r, col)

def make(maskable, scale):
    img = base(maskable)
    art(img, scale)
    return img

os.makedirs(OUT, exist_ok=True)
std = make(False, 0.92)        # art spans ~92% of the icon
mask = make(True, 0.70)        # keep art inside the 80% maskable safe zone
for size in (512, 192):
    std.resize((size, size), Image.LANCZOS).save(f"{OUT}/icon-{size}.png", optimize=True)
    mask.resize((size, size), Image.LANCZOS).save(f"{OUT}/icon-maskable-{size}.png", optimize=True)
# Apple ignores transparency, so use the full-bleed version
mask.resize((180, 180), Image.LANCZOS).convert("RGB").save(f"{OUT}/apple-touch-icon.png", optimize=True)
std.resize((32, 32), Image.LANCZOS).save(f"{OUT}/favicon-32.png", optimize=True)
print("icons written to", OUT)
