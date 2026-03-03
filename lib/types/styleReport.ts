/**
 * Style report data and profile types (matches backend format).
 * See backend2/docs/STYLE_REPORT_DATA_FORMAT.md for the canonical schema.
 */

/** Per docs/COLOR_TERMINOLOGY.md: hex is canonical; brightness (dark/medium/light), saturation (muted/medium/vivid), isNeutral (black/white/grey). */
export interface ItemSummary {
  type?: string | null;
  description?: string | null;
  category?: string | null;
  color?: string | null;
  /** 6-digit hex (e.g. #1a1a1a). Canonical colour; do not derive from name. */
  color_hex?: string | null;
  /** dark | medium | light */
  color_brightness?: string | null;
  /** muted | medium | vivid */
  color_saturation?: string | null;
  /** 0-100, computed from hex */
  color_saturation_percent?: number | null;
  /** 0-100, computed from hex */
  color_lightness_percent?: number | null;
  /** true for black, white, grey */
  color_is_neutral?: boolean | null;
  style?: string | null;
  lookId?: string | null;
}

export interface StyleReportLook {
  lookId: string;
  imageUrl: string | null;
  vibe?: string | null;
  occasion?: string | null;
  timeOfDay?: string | null;
  comment?: string | null;
  labels?: string[];
  itemsSummary?: ItemSummary[];
  itemsByType: {
    clothing: ItemSummary[];
    footwear: ItemSummary[];
    accessory: ItemSummary[];
  };
  pairingSummary?: string | null;
  classificationTags?: string[];
  analysisComment?: string | null;
  suggestions?: string[];
}

export interface StyleReportByItems {
  aggregates: {
    itemCount: number;
    byCategory: Record<string, number>;
    byColor: Record<string, number>;
    byType: Record<string, number>;
    topTypes: { name: string; count: number }[];
  };
  detailedBreakdown: {
    byCategory: Record<string, ItemSummary[]>;
    byColor: Record<string, ItemSummary[]>;
    byType: Record<string, ItemSummary[]>;
  };
}

/** Sub-element value within a dimension (value, scale, position, options, confidence). */
export interface SubElementValue {
  value?: unknown;
  scale?: string[];
  position?: number;
  options?: unknown;
  confidence?: number;
}

/** One dimension in the comprehensive profile (e.g. colour_palette, silhouette_and_fit). */
export interface StyleElement {
  label: string;
  sub_elements: Record<string, SubElementValue>;
}

export interface Synthesis {
  style_descriptor_short?: string | null;
  style_descriptor_long?: string | null;
  style_keywords?: string[];
  one_line_takeaway?: string | null;
  dominant_categories?: string[];
  dominant_colors?: string[];
  dominant_silhouettes?: string[];
}

export interface StyleDna {
  archetype_name?: string | null;
  archetype_tagline?: string | null;
  keywords?: string[];
  dna_line?: string | null;
}

export interface IdeasForYou {
  within_style_zone?: string[];
  adjacent_style_zone?: string[];
}

/** Comprehensive profile block (backend parity): elements, synthesis, style_dna, ideas_for_you. */
export interface ComprehensiveProfile {
  elements?: Record<string, StyleElement>;
  synthesis?: Synthesis;
  style_dna?: StyleDna;
  ideas_for_you?: IdeasForYou;
  meta?: { version?: string; generated_at?: string; generated_from_looks?: number };
}

/**
 * Single card in a v2 style report (card-based).
 * Implemented card types (backend2): style_identity, style_code, style_signature, ideas_for_you,
 * colour_analysis, look_recipe, trends, styling. Cards appear when report.version === 2
 * and report.cards has length; otherwise regenerate the report (needs 7+ looks).
 * For type "style_identity", twoWordIdentity, keywords (pills), and quote are used for the dedicated layout.
 */
export interface StyleReportCard {
  id: string;
  type: string;
  title: string;
  content: string;
  keywords?: string[];
  colors?: string[];
  summary?: string;
  /** Colour Analysis card: base (often used) palette; falls back to first slice of colors */
  basePalette?: string[];
  /** Colour Analysis card: accent palette; falls back to second slice of colors */
  accentPalette?: string[];
  /** Colour Analysis card: 3-colour combination idea; falls back to first 3 of colors */
  combinationIdea?: string[];
  /** Look recipe card: dominant silhouettes as pills */
  dominantSilhouettes?: string[];
  /** Look recipe card: structure sliders 0–10 (structuredFluid: structured↔fluid, relaxedFitted: relaxed↔fitted) */
  structureSliders?: { structuredFluid: number; relaxedFitted: number };
  /** Look recipe card: dominant accessory types */
  dominantAccessories?: string[];
  /** Look recipe card: dominant footwear types */
  dominantFootwear?: string[];
  /** Look recipe card: how the user uses accessories in a look (1-2 sentences) */
  accessoriesInsight?: string;
  /** Look recipe card: footwear preference and variety (1-2 sentences) */
  footwearInsight?: string;
  /** Legacy silhouette card: go-to shapes */
  goToShapes?: string[];
  /** Legacy silhouette card: fit profile label */
  fitProfile?: string;
  /** Legacy silhouette card: one suggestion to try */
  silhouetteIdea?: string;
  /** Style Identity card: two-word identity (e.g. "Minimal Mysterious") */
  twoWordIdentity?: string;
  /** Style Identity card: statement 10–15 words, humorous and endearing */
  quote?: string;
  /** Style Identity card: short analysis of what the style identity means, up to 40 words */
  analysis?: string;
  /** Style Code card: 4 dimensions (or config-driven) with left/right labels and score 0–10 */
  dimensions?: { id: string; labelLeft: string; labelRight: string; score: number }[];
  /** Style Signature (Style Thumbprint) card: exactly 3 observations; serious (max 10 words) + optional humorous (max 10 words, italic). Legacy: text only. */
  observations?: { number: number; text?: string; serious?: string; humorous?: string }[];
  /** Ideas for you card: optional within/adjacent lists (legacy) */
  ideas?: { within?: string[]; adjacent?: string[] };
  /** Ideas for you card: three sections with description + one idea (max 10 words) + optional imageUrl from Look Composition */
  sections?: {
    inYourZone?: { description: string; items?: string[]; imagePrompt?: string; imageUrl?: string };
    zoneAdjacent?: { description: string; items?: string[]; imagePrompt?: string; imageUrl?: string };
    whereIsTheZone?: { description: string; items?: string[]; imagePrompt?: string; imageUrl?: string };
  };
  /** Trends / Styling cards: mood pill (e.g. Classic, Minimal) */
  moodLabel?: string;
  /** Trends / Styling cards: 2–3 short insight bullets */
  insights?: string[];
  /** Trends / Styling cards: optional one-line suggestion (e.g. Idea to try) */
  suggestion?: string;
  /** Look recipe: one trend observed for the user (Trends mini-card) */
  trendObservation?: string;
  /** Look recipe: adaptiveness to trends score 0–10 for bar Classic ↔ Experimental */
  trendAdaptivenessScore?: number;
}

export interface StyleReportData {
  version: number;
  generatedAt: string;
  headline: string;
  sections: { title: string; content: string }[];
  /** Present when version >= 2: ordered cards for vertical scroll. */
  cards?: StyleReportCard[];
  /** Palette variety: narrow-neutral | narrow | moderate | wide. */
  paletteRange?: string | null;
  paletteRangeScore?: number | null;
  /** Contrast: high-neutral | soft | medium | bold. */
  contrastLevel?: string | null;
  contrastLevelScore?: number | null;
  /** Usage-weighted saturation (0-100). */
  weightedSaturationPercent?: number | null;
  byLooks: StyleReportLook[];
  byItems: StyleReportByItems;
  comprehensive?: ComprehensiveProfile;
}

export interface StyleProfileData {
  dominantSilhouettes?: string | null;
  colorPalette?: string | null;
  formalityRange?: string | null;
  styleKeywords?: string[];
  oneLiner?: string | null;
  pairingTendencies?: string | null;
  comprehensive?: ComprehensiveProfile;
}
