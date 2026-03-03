import { apiFetchWithAuth } from "./client";

export interface StyleReportSettingsResponse {
  minLooks: number;
  maxLooks: number;
  agentObjective: string | null;
  agentTone: string | null;
  cardConfig: {
    cardOrder: string[];
    enabledCardTypes: string[];
  };
  /** Style Identity card: editable word lists for the 2-word identity */
  styleIdentityOptions?: {
    styleSignals: string[];
    expressionModes: string[];
  };
}

export const STYLE_REPORT_CARD_TYPES = [
  { id: "style_identity", label: "Style Identity" },
  { id: "style_code", label: "Style Code" },
  { id: "style_signature", label: "Style Signature" },
  { id: "ideas_for_you", label: "Ideas for you" },
  { id: "colour_analysis", label: "Colour Analysis" },
  { id: "look_recipe", label: "Look recipe" },
  { id: "trends", label: "Trends" },
  { id: "styling", label: "Styling" },
] as const;

/** Default Style Identity: STYLE SIGNAL options (word 1). Shown in admin when none saved. */
export const DEFAULT_STYLE_SIGNALS = [
  "Eclectic", "Adventurous", "Bold", "Maximal", "Creative", "Street", "Sporty", "Trendy", "Modern", "Edgy",
  "Classic", "Timeless", "Elegant", "Sharp", "Tailored", "Relaxed", "Casual", "Minimal", "Understated", "Practical",
];

/** Default Style Identity: EXPRESSION MODE options (word 2). Shown in admin when none saved. */
export const DEFAULT_EXPRESSION_MODES = [
  "Understated", "Quiet", "Subtle", "Relaxed", "Natural", "Effortless", "Balanced", "Intentional",
  "Confident", "Poised", "Playful", "Expressive", "Dramatic", "Glamorous", "Flamboyant", "Mysterious", "Enigmatic", "Approachable",
];

export function getAdminStyleReportSettings(): Promise<StyleReportSettingsResponse> {
  return apiFetchWithAuth<StyleReportSettingsResponse>("/api/admin/style-report-settings");
}

export function putAdminStyleReportSettings(body: {
  minLooks?: number;
  maxLooks?: number;
  agentObjective?: string | null;
  agentTone?: string | null;
  cardConfig?: { cardOrder: string[]; enabledCardTypes: string[] };
  styleIdentityOptions?: { styleSignals: string[]; expressionModes: string[] };
}): Promise<StyleReportSettingsResponse> {
  return apiFetchWithAuth<StyleReportSettingsResponse>("/api/admin/style-report-settings", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}
