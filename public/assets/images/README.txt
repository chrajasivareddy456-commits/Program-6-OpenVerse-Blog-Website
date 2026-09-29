OpenVerse Image Strategy
=========================
All images used by this project are LOCAL, hand-generated SVG assets — there
is no dependency on an external image CDN or third-party photo service.

Why SVG instead of photographs:
This project is built and tested in a sandboxed environment with no general
internet access, so real licensed photography can't be downloaded or
fetched. Rather than link to placeholder services (which can go down, rate
limit, or serve inconsistent imagery) or fake filenames that don't exist,
every image shipped in this folder is a real, local, themed SVG file that
renders identically offline and online, at any size, with zero network
requests.

How the assets were generated:
  scripts/generate_images.py programmatically creates:
    - categories/{slug}.svg   — one branded cover per category (icon + gradient)
    - articles/{postId}.svg   — one unique cover per article, colored/iconed
                                  by its category, with seeded variation so
                                  no two articles look identical
    - authors/{slug}.svg      — one avatar per author (initials + gradient)
    - hero/hero-bg.svg        — a starfield/glow layer behind the 3D hero
    - ui/fallback-cover.svg   — generic cover shown if any image fails to load
    - ui/fallback-avatar.svg  — generic avatar shown if an avatar fails to load

All generated files use the OpenVerse palette (deep navy background, purple/
violet/blue gradients) so they blend seamlessly with the rest of the UI.

Regenerating assets:
  python3 scripts/generate_data.py      # (re)builds posts/authors/categories
  python3 scripts/generate_images.py    # (re)builds every SVG + updates the
                                         #  `image` / `avatar` fields in
                                         #  data/posts.json and data/authors.json
                                         #  to point at the new local files

Runtime fallback behavior:
  public/js/main.js attaches a single delegated `error` listener on <img>
  elements site-wide. If any image fails to load for any reason — including
  a custom cover URL a user pastes into the Write page — it is swapped for
  ui/fallback-cover.svg (or ui/fallback-avatar.svg for avatars) instead of
  showing the browser's broken-image icon.

If you want to swap in real photography later, replace the files in this
folder (or point `image`/`avatar` fields in data/*.json at your own URLs) —
no frontend code changes are required.
