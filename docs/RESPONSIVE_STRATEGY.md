# Responsive strategy (frontend2)

All phases (Design foundation, F1–F7) use the same breakpoint so the shell and content behave consistently.

## Breakpoint: `lg` (1024px)

- **Desktop (wide landscape):** `lg` and up (`min-width: 1024px`)
  - Horizontal nav in header
  - Wide or full-width content; multi-column grids (products, looks, microstores)
  - Optional sidebar/rail for secondary nav (e.g. Concierge vs Shop)
  - Footer full width

- **Mobile (vertical):** Below `lg` (default)
  - Single-column, vertical flow
  - Compact header; primary nav in drawer or bottom tab bar
  - Stacked cards and lists; touch-friendly tap targets (min 44px where possible)
  - Same footer, simplified if needed

## Usage in code

- Use Tailwind’s `lg:` prefix for desktop-only styles.
- Use base (unprefixed) classes for mobile-first; override with `lg:` for desktop.
- Shell components (AppShell, AppHeader, AppFooter) implement this rule; feature pages should not introduce a different breakpoint for “desktop vs mobile” shell behavior.
