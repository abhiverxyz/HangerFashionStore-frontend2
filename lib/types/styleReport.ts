/**
 * Style report data and profile types (matches backend format).
 * See backend2/docs/STYLE_REPORT_DATA_FORMAT.md for the canonical schema.
 */

export interface ItemSummary {
  type?: string | null;
  description?: string | null;
  category?: string | null;
  color?: string | null;
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

export interface StyleReportData {
  version: number;
  generatedAt: string;
  headline: string;
  sections: { title: string; content: string }[];
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
