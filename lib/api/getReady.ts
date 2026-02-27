import { apiFetchWithAuth } from "./client";

export interface VibeOptionsResponse {
  options: string[];
}

export interface MoodOptionsResponse {
  emojis: string[];
}

export interface LookSummary {
  id: string;
  imageUrl: string | null;
  vibe: string | null;
  occasion: string | null;
  title: string;
}

export interface WardrobeItem {
  id: string;
  imageUrl: string | null;
  title: string;
}

export interface OutfitSuggestionsResponse {
  suggestedLooks: LookSummary[];
  fromWardrobe: WardrobeItem[];
}

export interface SuggestedProductOrLook {
  id: string;
  title?: string;
  imageUrl?: string;
  type: "product" | "look";
}

export interface StyleTipsResponse {
  tips: string[];
  suggestedProductsOrLooks: SuggestedProductOrLook[];
}

export interface HowDoILookResponse {
  response: string;
}

/** GET /api/get-ready/vibe-options. Optional timeOfDay: morning | afternoon | evening */
export function getVibeOptions(params?: { timeOfDay?: string }): Promise<VibeOptionsResponse> {
  const sp = new URLSearchParams();
  if (params?.timeOfDay) sp.set("timeOfDay", params.timeOfDay);
  const q = sp.toString();
  return apiFetchWithAuth<VibeOptionsResponse>(`/api/get-ready/vibe-options${q ? `?${q}` : ""}`);
}

/** GET /api/get-ready/mood-options */
export function getMoodOptions(): Promise<MoodOptionsResponse> {
  return apiFetchWithAuth<MoodOptionsResponse>("/api/get-ready/mood-options");
}

/** GET /api/get-ready/outfit-suggestions. Optional vibe, mood, limit, query (for "more/different" in outfit step) */
export function getOutfitSuggestions(params?: {
  vibe?: string;
  mood?: string;
  limit?: number;
  query?: string;
}): Promise<OutfitSuggestionsResponse> {
  const sp = new URLSearchParams();
  if (params?.vibe) sp.set("vibe", params.vibe);
  if (params?.mood) sp.set("mood", params.mood);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.query) sp.set("query", params.query);
  const q = sp.toString();
  return apiFetchWithAuth<OutfitSuggestionsResponse>(`/api/get-ready/outfit-suggestions${q ? `?${q}` : ""}`);
}

/** GET /api/get-ready/style-tips. Optional vibe, mood, outfitId */
export function getStyleTips(params?: {
  vibe?: string;
  mood?: string;
  outfitId?: string;
}): Promise<StyleTipsResponse> {
  const sp = new URLSearchParams();
  if (params?.vibe) sp.set("vibe", params.vibe);
  if (params?.mood) sp.set("mood", params.mood);
  if (params?.outfitId) sp.set("outfitId", params.outfitId);
  const q = sp.toString();
  return apiFetchWithAuth<StyleTipsResponse>(`/api/get-ready/style-tips${q ? `?${q}` : ""}`);
}

/** POST /api/get-ready/how-do-i-look. Body: text?, imageUrl?, vibe? */
export function submitHowDoILook(body: {
  text?: string;
  imageUrl?: string;
  vibe?: string;
}): Promise<HowDoILookResponse> {
  return apiFetchWithAuth<HowDoILookResponse>("/api/get-ready/how-do-i-look", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
