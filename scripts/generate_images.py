"""
Generates local, dependency-free SVG image assets for OpenVerse.

Why SVG instead of downloaded photos:
This sandbox has no general internet access, so we cannot fetch or license
real photographs. Hand-authored SVGs let us ship real, local, themed image
files (not broken links, not placeholders-that-don't-exist) that match the
dark/purple/violet OpenVerse identity exactly, render crisply at any size,
and add zero external network dependency.

Run with: python3 scripts/generate_images.py
"""
import json
import math
import os
import random

ROOT = os.path.join(os.path.dirname(__file__), "..")
IMG_DIR = os.path.join(ROOT, "public", "assets", "images")
DATA_DIR = os.path.join(ROOT, "data")

PALETTE = [
    ("#7c3aed", "#3b82f6"), ("#a855f7", "#6366f1"), ("#8b5cf6", "#22d3ee"),
    ("#c026d3", "#7c3aed"), ("#6366f1", "#a855f7"), ("#3b82f6", "#c084fc"),
    ("#9333ea", "#0ea5e9"), ("#a855f7", "#f472b6"), ("#7c3aed", "#06b6d4"),
    ("#6d28d9", "#3b82f6"), ("#8b5cf6", "#a855f7"), ("#4f46e5", "#a855f7"),
    ("#7e22ce", "#38bdf8"), ("#9333ea", "#818cf8"),
]

def ensure_dirs():
    for sub in ["hero", "articles", "authors", "categories", "ui"]:
        d = os.path.join(IMG_DIR, sub)
        os.makedirs(d, exist_ok=True)
        # remove old .gitkeep placeholders now that real assets exist
        gk = os.path.join(d, ".gitkeep")
        if os.path.exists(gk):
            os.remove(gk)

def write(path, content):
    with open(path, "w") as f:
        f.write(content)

def cover_svg(seed, c1, c2, icon, w=900, h=600):
    """A dark, glassy, abstract cover image: gradient wash + soft glow orbs +
    a subtle grid + a large translucent glyph, seeded for per-item variety."""
    rnd = random.Random(seed)
    orbs = []
    for _ in range(4):
        cx = rnd.randint(int(w * 0.05), int(w * 0.95))
        cy = rnd.randint(int(h * 0.05), int(h * 0.95))
        r = rnd.randint(int(h * 0.12), int(h * 0.28))
        op = round(rnd.uniform(0.10, 0.24), 2)
        orbs.append(f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#glow-{seed})" opacity="{op}"/>')
    shards = []
    for _ in range(6):
        x = rnd.randint(0, w)
        y = rnd.randint(0, h)
        s = rnd.randint(6, 22)
        rot = rnd.randint(0, 360)
        op = round(rnd.uniform(0.06, 0.16), 2)
        shards.append(f'<rect x="{x}" y="{y}" width="{s}" height="{s}" rx="3" fill="#c4b5fd" opacity="{op}" transform="rotate({rot} {x} {y})"/>')
    icon_x = w * 0.5
    icon_y = h * 0.56
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
  <defs>
    <linearGradient id="bg-{seed}" x1="0" y1="0" x2="{w}" y2="{h}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0a0a16"/>
      <stop offset="0.55" stop-color="#120c24"/>
      <stop offset="1" stop-color="#0a0a16"/>
    </linearGradient>
    <linearGradient id="accent-{seed}" x1="0" y1="0" x2="{w}" y2="{h}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
    <radialGradient id="glow-{seed}" cx="0.5" cy="0.5" r="0.5">
      <stop offset="0" stop-color="{c1}" stop-opacity="0.9"/>
      <stop offset="1" stop-color="{c1}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="grid-{seed}" width="42" height="42" patternUnits="userSpaceOnUse">
      <path d="M42 0H0V42" fill="none" stroke="#ffffff" stroke-opacity="0.045"/>
    </pattern>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#bg-{seed})"/>
  <rect width="{w}" height="{h}" fill="url(#grid-{seed})"/>
  {''.join(orbs)}
  {''.join(shards)}
  <rect width="{w}" height="{h}" fill="none" stroke="url(#accent-{seed})" stroke-opacity="0.35" stroke-width="2"/>
  <circle cx="{icon_x}" cy="{icon_y}" r="{h*0.30}" fill="url(#accent-{seed})" opacity="0.10"/>
  <text x="{icon_x}" y="{icon_y + h*0.09}" font-size="{int(h*0.34)}" text-anchor="middle" opacity="0.85">{icon}</text>
  <rect width="{w}" height="{h}" fill="url(#bg-{seed})" opacity="0.02"/>
</svg>'''

def avatar_svg(seed, initials, c1, c2, size=240):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img">
  <defs>
    <linearGradient id="av-{seed}" x1="0" y1="0" x2="{size}" y2="{size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="{c1}"/>
      <stop offset="1" stop-color="{c2}"/>
    </linearGradient>
    <radialGradient id="avbg-{seed}" cx="0.3" cy="0.25" r="0.9">
      <stop offset="0" stop-color="#1c1533"/>
      <stop offset="1" stop-color="#0a0a16"/>
    </radialGradient>
  </defs>
  <circle cx="{size/2}" cy="{size/2}" r="{size/2}" fill="url(#avbg-{seed})"/>
  <circle cx="{size/2}" cy="{size/2}" r="{size/2 - 3}" fill="none" stroke="url(#av-{seed})" stroke-width="3" opacity="0.55"/>
  <circle cx="{size/2}" cy="{size*0.42}" r="{size*0.30}" fill="url(#av-{seed})" opacity="0.22"/>
  <text x="50%" y="56%" font-family="'Space Grotesk', sans-serif" font-size="{int(size*0.34)}" font-weight="700" fill="url(#av-{seed})" text-anchor="middle" dominant-baseline="middle">{initials}</text>
</svg>'''

def fallback_cover_svg(w=900, h=600):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img">
  <defs>
    <linearGradient id="fb-bg" x1="0" y1="0" x2="{w}" y2="{h}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#0d0b1a"/>
      <stop offset="1" stop-color="#150f2b"/>
    </linearGradient>
    <linearGradient id="fb-accent" x1="0" y1="0" x2="{w}" y2="0" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#8b5cf6"/>
      <stop offset="1" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#fb-bg)"/>
  <rect width="{w}" height="{h}" fill="none" stroke="url(#fb-accent)" stroke-opacity="0.3" stroke-width="2"/>
  <path d="M{w/2-46} {h/2-30} L{w/2+46} {h/2-30} L{w/2+46} {h/2+30} L{w/2-46} {h/2+30} Z" fill="none" stroke="url(#fb-accent)" stroke-width="4" stroke-opacity="0.7" rx="8"/>
  <circle cx="{w/2-18}" cy="{h/2-10}" r="8" fill="url(#fb-accent)" opacity="0.7"/>
  <path d="M{w/2-46} {h/2+18} L{w/2-10} {h/2-8} L{w/2+14} {h/2+10} L{w/2+46} {h/2-14} L{w/2+46} {h/2+30} L{w/2-46} {h/2+30} Z" fill="url(#fb-accent)" opacity="0.35"/>
  <text x="50%" y="{h/2+64}" font-family="'Inter', sans-serif" font-size="20" fill="#a6a2bd" text-anchor="middle">OpenVerse</text>
</svg>'''

def fallback_avatar_svg(size=240):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}" width="{size}" height="{size}" role="img">
  <defs>
    <linearGradient id="fba" x1="0" y1="0" x2="{size}" y2="{size}" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#6d6a86"/>
      <stop offset="1" stop-color="#4b4864"/>
    </linearGradient>
  </defs>
  <circle cx="{size/2}" cy="{size/2}" r="{size/2}" fill="#14101f"/>
  <circle cx="{size/2}" cy="{size/2}" r="{size/2-3}" fill="none" stroke="url(#fba)" stroke-width="3" opacity="0.5"/>
  <circle cx="{size/2}" cy="{size*0.4}" r="{size*0.17}" fill="url(#fba)" opacity="0.8"/>
  <path d="M{size*0.22} {size*0.86} a{size*0.28} {size*0.28} 0 0 1 {size*0.56} 0 Z" fill="url(#fba)" opacity="0.8"/>
</svg>'''

def hero_bg_svg(w=1600, h=1000):
    stars = []
    rnd = random.Random(7)
    for _ in range(70):
        x, y = rnd.randint(0, w), rnd.randint(0, h)
        r = round(rnd.uniform(0.6, 1.8), 1)
        op = round(rnd.uniform(0.25, 0.8), 2)
        stars.append(f'<circle cx="{x}" cy="{y}" r="{r}" fill="#e9e4ff" opacity="{op}"/>')
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" preserveAspectRatio="xMidYMid slice">
  <defs>
    <radialGradient id="hero-a" cx="0.18" cy="0.22" r="0.6"><stop offset="0" stop-color="#7c3aed" stop-opacity="0.55"/><stop offset="1" stop-color="#7c3aed" stop-opacity="0"/></radialGradient>
    <radialGradient id="hero-b" cx="0.86" cy="0.16" r="0.55"><stop offset="0" stop-color="#3b82f6" stop-opacity="0.45"/><stop offset="1" stop-color="#3b82f6" stop-opacity="0"/></radialGradient>
    <radialGradient id="hero-c" cx="0.5" cy="1" r="0.7"><stop offset="0" stop-color="#a855f7" stop-opacity="0.25"/><stop offset="1" stop-color="#a855f7" stop-opacity="0"/></radialGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="#06060d"/>
  <rect width="{w}" height="{h}" fill="url(#hero-a)"/>
  <rect width="{w}" height="{h}" fill="url(#hero-b)"/>
  <rect width="{w}" height="{h}" fill="url(#hero-c)"/>
  {''.join(stars)}
</svg>'''

def initials_of(name):
    parts = [p for p in name.split() if p]
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    return name[:2].upper()

def main():
    ensure_dirs()

    categories = json.load(open(os.path.join(DATA_DIR, "categories.json")))
    authors = json.load(open(os.path.join(DATA_DIR, "authors.json")))
    posts = json.load(open(os.path.join(DATA_DIR, "posts.json")))

    # UI fallbacks (used by onerror handlers site-wide)
    write(os.path.join(IMG_DIR, "ui", "fallback-cover.svg"), fallback_cover_svg())
    write(os.path.join(IMG_DIR, "ui", "fallback-avatar.svg"), fallback_avatar_svg())

    # Hero decorative background layer
    write(os.path.join(IMG_DIR, "hero", "hero-bg.svg"), hero_bg_svg())

    # Category cover art
    for i, cat in enumerate(categories):
        c1, c2 = PALETTE[i % len(PALETTE)]
        svg = cover_svg(f"cat{i}", c1, c2, cat["icon"], w=800, h=520)
        write(os.path.join(IMG_DIR, "categories", f"{cat['slug']}.svg"), svg)

    # Author avatars
    cat_index = {c["slug"]: i for i, c in enumerate(categories)}
    for i, author in enumerate(authors):
        c1, c2 = PALETTE[(i * 3) % len(PALETTE)]
        svg = avatar_svg(f"auth{i}", initials_of(author["name"]), c1, c2)
        write(os.path.join(IMG_DIR, "authors", f"{author['slug']}.svg"), svg)
        author["avatar"] = f"/assets/images/authors/{author['slug']}.svg"

    # Article cover art — unique per post, colored/iconed by its category
    for i, post in enumerate(posts):
        cat = next((c for c in categories if c["slug"] == post["categorySlug"]), None)
        icon = cat["icon"] if cat else "✦"
        palette_idx = (cat_index.get(post["categorySlug"], 0) + i) % len(PALETTE)
        c1, c2 = PALETTE[palette_idx]
        svg = cover_svg(f"post{i}", c1, c2, icon, w=900, h=600)
        write(os.path.join(IMG_DIR, "articles", f"{post['id']}.svg"), svg)
        post["image"] = f"/assets/images/articles/{post['id']}.svg"

    json.dump(authors, open(os.path.join(DATA_DIR, "authors.json"), "w"), indent=2)
    json.dump(posts, open(os.path.join(DATA_DIR, "posts.json"), "w"), indent=2)

    print(f"Generated {len(categories)} category covers, {len(authors)} author avatars, "
          f"{len(posts)} article covers, 1 hero background, 2 UI fallbacks.")

if __name__ == "__main__":
    main()
