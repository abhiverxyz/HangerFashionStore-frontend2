# Colour scheme rethink — premium, vibrant, aspirational

The current Option C palette reads **dull** and **doesn’t gel**: too many muted accents (sage, stone, terracotta, pink, orange) that sit in the same low-saturation band, plus a dark teal CTA that doesn’t tie into the rest. Fashion should feel **premium but also vibrant and aspirational** — refined, not muddy.

Below are **three new directions**. Each has a **clear primary + one or two accents** that work together, with slightly **higher saturation** where it matters so the UI feels alive without losing a premium feel.

---

## Direction 1: Rich jewel

**Idea:** One strong “hero” colour (deep teal or emerald) for CTAs and key UI; warm light base; a single **vibrant** accent (e.g. amber/gold or coral) for highlights and tags. Rest stays neutral so the jewel and accent pop.

| Role | Current (dull) | Proposed |
|------|----------------|----------|
| Background | `#f8f6f3` cream | Keep or slightly warmer `#faf8f5` |
| Foreground | `#1c1917` | Keep or true black `#0a0a0a` for punch |
| Primary CTA | `#1e3a3a` teal | **Richer teal** `#0d5c5c` or **emerald** `#0f766e` — more saturated, still premium |
| Hero accent | (none) | **Amber/gold** `#d97706` or **coral** `#ea580c` — used for key buttons, sale tags, “New” — vibrant but not neon |
| Card / surface | `#ffffff` | Keep |
| Neutrals | Stone grays | Slightly cooler or same; avoid too many beige accents |
| Other accents | Sage, stone, terracotta, pink, orange | **Reduce to one** (e.g. keep only a soft coral or only gold) or drop; avoid 5+ muted tones |

**Vibe:** Luxury brand with one clear signature (teal/emerald) and one warm, aspirational pop (amber or coral).

---

## Direction 2: Editorial pop

**Idea:** Clean, confident base (white or near-white); strong dark text; **one clear accent** used consistently for CTAs, links, and key UI. Feels like a premium editorial site with a single memorable colour.

| Role | Current (dull) | Proposed |
|------|----------------|----------|
| Background | `#f8f6f3` | **White** `#ffffff` or **cool white** `#fafafa` — cleaner, brighter |
| Foreground | `#1c1917` | **Black** `#0a0a0a` — stronger contrast |
| Primary CTA | `#1e3a3a` teal | **One bold accent** — e.g. **coral** `#dc2626` / `#ea580c`, **indigo** `#4f46e5`, or **fuchsia** `#c026d3` — saturated enough to feel vibrant, still usable on white |
| Accents | Many muted | **One accent only** for all “action” and highlight UI; optional second for tags (e.g. soft gold) |
| Card | `#ffffff` | White; borders subtle |
| Neutrals | Stone | Clean gray scale (e.g. 100–900) for text hierarchy only |

**Vibe:** High-fashion editorial: sharp, confident, one colour that says “Hanger”.

---

## Direction 3: Warm glow

**Idea:** Keep “warm” and “premium” but **boost warmth and saturation** so it feels inviting and aspirational, not flat. One warm hero (e.g. deep coral or burnt orange) + cream/ivory base.

| Role | Current (dull) | Proposed |
|------|----------------|----------|
| Background | `#f8f6f3` | **Warmer ivory** `#fdf8f3` or `#fef7ed` — still soft, less gray |
| Foreground | `#1c1917` | **Espresso** `#292524` or keep — readable, warm |
| Primary CTA | `#1e3a3a` teal | **Deep coral / burnt orange** `#c2410c` or **terracotta** `#b45309` — warm, rich, vibrant |
| Hero accent | (scattered) | **Same as CTA** or a **clear rose** `#be123c` — one warm accent family, not five pastels |
| Card | `#ffffff` | White or **soft cream** `#fffbeb` for cards so they glow slightly |
| Neutrals | Stone | Warm grays; avoid cold slate |
| Other accents | Sage, stone, pink, orange… | **One warm accent** (coral/rose/amber); remove sage, stone, multiple pinks/oranges |

**Vibe:** Premium lifestyle / runway: warm, inviting, aspirational; colour feels intentional and cohesive.

---

## Recommendation

- **If you want “one clear hero colour” and maximum cohesion:** go **Direction 2 (Editorial pop)** — pick one accent (coral, indigo, or fuchsia) and use it everywhere for CTAs and highlights.
- **If you want to keep “warm” but fix dullness:** go **Direction 3 (Warm glow)** — warmer base, one rich warm CTA (coral/terracotta), drop the teal and the many muted accents.
- **If you like teal but want it to feel richer:** go **Direction 1 (Rich jewel)** — deepen teal, add one vibrant accent (amber or coral), and trim the rest.

Next step: choose a direction (and, for Direction 2, which accent colour). Then we can replace the current palette in `globals.css` and `tailwind.config.ts` and refresh the design-system showcase so you can see it in the app.
