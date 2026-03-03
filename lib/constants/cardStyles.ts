/**
 * Shared card background texture (SVG data URL). Used by looks page and style report.
 * Parameterized by opacity for lighter (0.06) vs stronger (0.08) overlay.
 */
function cardTextureSvg(opacity: number): string {
  const o = Math.max(0, Math.min(1, opacity));
  return `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='${o}'/%3E%3C/svg%3E")`;
}

/** Lighter texture (opacity 0.06) — e.g. looks landing cards */
export const CARD_TEXTURE = cardTextureSvg(0.06);

/** Stronger texture (opacity 0.08) — e.g. style report section cards */
export const CARD_TEXTURE_STRONG = cardTextureSvg(0.08);
