# Hanger Design System — Three Options

This document presents **three design system options** for frontend2. Part C (Design foundation) requires: typography, color palette, spacing, radius, shadows; single source of truth in `tailwind.config.ts` and `globals.css`; **premium, editorial** feel. Choose one option; then we implement the full design foundation (tokens, responsive strategy, App shell, Profile shell).

---

## Option A: Warm Editorial (reference-aligned)

**Vibe:** Warm, inviting, magazine-like. Close to the existing `frontend` reference (warm neutrals, sand/blush accents). Feels like a high-end lifestyle magazine — approachable but refined.

| Token category | Values |
|----------------|--------|
| **Typography** | **Display/headline:** Serif (e.g. Playfair Display or Cormorant) for “Hanger” and section titles. **Body/UI:** Sans (e.g. Inter or Source Sans 3). Clear hierarchy: display (serif, large), headline (sans or serif), body (sans). |
| **Colors** | **Background:** Warm off-white `#f5f3f0`. **Foreground:** Near-black `#111827`. **Card/surface:** White `#ffffff`. **Primary:** Same as foreground for text/buttons. **Accents:** Sand `#d0bfa6`, Blush `#f5e3da` for highlights, tags, subtle backgrounds. **Border:** `rgba(15,23,42,0.08)`. **Neutrals:** Slate grays for secondary text and muted UI. |
| **Spacing** | Tailwind default scale (1–96); use consistent steps (2, 4, 6, 8, 12, 16, 24, 32) for padding/margins. Content max-width e.g. `max-w-4xl` or `max-w-6xl` for readability. |
| **Radius** | Soft: `rounded-lg` (8px) for cards/buttons; `rounded-xl` (12px) for modals/panels; `rounded-full` for pills/avatars. |
| **Shadows** | Subtle elevation: `shadow-sm`, `shadow` for cards; `shadow-md` for hover/dropdowns. No heavy shadows — editorial, not “app-y”. |

**Best for:** If you want continuity with the current frontend look and a safe, proven premium feel.

---

## Option B: Minimal Monochrome

**Vibe:** Stripped-down, confident, fashion-editorial. Mostly black, white, and gray with one restrained accent. Strong typography and whitespace; feels like a luxury brand site or Vogue digital.

| Token category | Values |
|----------------|--------|
| **Typography** | **Display:** Strong serif (e.g. Libre Baskerville or Lora) for “Hanger” and hero headlines. **Body/UI:** Clean sans (e.g. DM Sans or Work Sans). Large size differential between display and body; generous line-height for body. |
| **Colors** | **Background:** Pure white `#ffffff` or very light gray `#fafafa`. **Foreground:** True black `#0a0a0a`. **Primary:** Black. **Accent:** Single accent only — e.g. warm gray `#737373` for secondary actions, or a single bold hue (e.g. deep burgundy `#722f37`) for links/CTAs. **Neutrals:** Gray scale (100–900) only; no sand/blush. **Card:** White with subtle border. |
| **Spacing** | Generous whitespace. Larger base spacing (e.g. 6, 8, 12, 16, 24, 32, 48); wide gutters; content max-width for readability. |
| **Radius** | Minimal: `rounded-none` or `rounded-sm` (4px) for inputs/cards; slightly more for buttons. Sharp, not soft. |
| **Shadows** | Very subtle or none for flat surfaces; light `shadow-sm` only for floating elements (modals, dropdowns). Emphasis on line and contrast, not depth. |

**Best for:** Maximum “fashion” credibility and a bold, memorable identity; works well for desktop and mobile if hierarchy is clear.

---

## Option C: Soft Premium (elevated warmth)

**Vibe:** Premium but softer than Option B; warmer than Option A. Cream and stone tones, gentle gradients possible, refined and contemporary. Feels like Net-a-Porter or a premium lifestyle app.

| Token category | Values |
|----------------|--------|
| **Typography** | **Display:** Elegant serif (e.g. Fraunces or Crimson Pro) for “Hanger” and key headlines. **Body/UI:** Friendly but refined sans (e.g. Nunito Sans or Outfit). Slightly rounded sans for approachability; serif for authority. |
| **Colors** | **Background:** Cream/stone `#f8f6f3` or `#faf8f5`; optional very subtle gradient (cream to white). **Foreground:** Charcoal `#1c1917` (softer than black). **Card:** White `#ffffff` with soft shadow. **Primary:** Charcoal or a deep teal/bronze (e.g. `#1e3a3a` or `#5c4033`) for CTAs. **Accents:** Muted sage `#9ca98a`, warm stone `#c4b8a8`, or soft terracotta `#c4956a` for tags and highlights. **Border:** `rgba(28,25,23,0.06)`. **Neutrals:** Stone/warm gray scale. |
| **Spacing** | Balanced: Tailwind scale with preference for 4, 6, 8, 12, 16, 24, 32. Comfortable padding on cards and sections. |
| **Radius** | Medium-soft: `rounded-md` (6px) to `rounded-xl` (12px) for cards and buttons; `rounded-2xl` for hero cards or modals. Consistent but not sharp. |
| **Shadows** | Soft, diffuse shadows: custom `shadow-soft` (e.g. `0 2px 12px rgba(0,0,0,0.06)`) for cards; slightly stronger for hover. Layered, gentle depth. |

**Best for:** A modern premium feel that’s warm and inviting without leaning “magazine” (A) or “strict monochrome” (B).

---

## Summary comparison

| Aspect | Option A: Warm Editorial | Option B: Minimal Monochrome | Option C: Soft Premium |
|--------|--------------------------|------------------------------|-------------------------|
| **Background** | Warm off-white | White / light gray | Cream / stone |
| **Palette** | Warm neutrals + sand/blush | Black/white/gray + one accent | Cream, charcoal, muted accents |
| **Typography** | Serif + Inter-style | Strong serif + clean sans | Elegant serif + friendly sans |
| **Radius** | Soft (lg, xl) | Minimal (none, sm) | Medium-soft (md to 2xl) |
| **Shadows** | Subtle | Very subtle / none | Soft, diffuse |
| **Feel** | Magazine, approachable | Fashion editorial, bold | Premium app, refined |

---

## Next step

After you choose **A**, **B**, or **C**, we will:

1. Implement the chosen design system in `frontend2/tailwind.config.ts` and `frontend2/app/globals.css` (tokens only).
2. Then complete the rest of the Design foundation: responsive strategy, App shell (AppShell, Header, Footer, background), and Profile shell.

No code changes will be made until you select an option.
