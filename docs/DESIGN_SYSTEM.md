# Design system (frontend2)

Single index for design tokens, source files, and usage.

## Token sources

- **CSS variables:** `app/globals.css` — `:root` defines `--background`, `--foreground`, `--card`, `--primary`, `--primary-cta`, `--border`, `--accent-*`, and `--neutral-100` … `--neutral-900`.
- **Tailwind:** `tailwind.config.ts` — maps those variables into Tailwind theme (colors, fontFamily, borderRadius, boxShadow).

Use the Tailwind classes in components; avoid hardcoding hex or raw `gray-*` in favour of design tokens.

## Token categories

### Colors

| Token / class | Purpose |
|---------------|--------|
| `background` / `bg-background` | Page/surface background |
| `foreground` / `text-foreground` | Primary text |
| `card` / `bg-card` | Card/surface background |
| `primary`, `primary-cta` | Buttons, links (e.g. `bg-primary-cta text-neutral-100`) |
| `border` / `border-border` | Borders |
| `neutral-100` … `neutral-900` | Muted backgrounds, secondary text (e.g. `text-neutral-600`, `bg-neutral-100`) |
| `accent-sand`, `accent-blush` | Accent surfaces |

### Typography

- **Display:** `font-display` (serif) for headings.
- **Body:** default sans (from `--font-sans`).

### Radius

- `rounded-soft-md` (6px), `rounded-soft-lg` (8px), `rounded-soft-xl` (12px), `rounded-soft-2xl` (16px).

### Shadows

- `shadow-soft`, `shadow-soft-hover` — used on cards and hover states.

## Responsive strategy

- Breakpoint: **`lg`** (1024px). See `docs/RESPONSIVE_STRATEGY.md`.
- Main content padding: `p-4 lg:p-8` for admin and brand shells.

## Showcase

- **Admin design-system page:** `/admin/design-system` — live preview of tokens (colors, typography, buttons, inputs, cards).

## Files to reference

| File | Role |
|------|------|
| `app/globals.css` | CSS variables (colors, fonts) and utility classes |
| `tailwind.config.ts` | Theme extension (colors, radius, shadows, fontFamily) |
| `docs/RESPONSIVE_STRATEGY.md` | Breakpoint and layout rules |
| `app/admin/design-system/page.tsx` | Token showcase UI |
