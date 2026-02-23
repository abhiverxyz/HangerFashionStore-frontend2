import { apiFetchWithAuth } from "./client";

export const LANDING_CHOICES = {
  STORE_FOR_YOU: "store_for_you",
  FEED: "feed",
  PRODUCTS: "products",
  DISCOVER: "discover",
} as const;

export type LandingChoice = (typeof LANDING_CHOICES)[keyof typeof LANDING_CHOICES];

export interface LandingResponse {
  choice: LandingChoice;
  reason?: string;
}

/** GET /api/landing — which landing section to show (optional auth). */
export function getLandingChoice(): Promise<LandingResponse> {
  return apiFetchWithAuth<LandingResponse>("/api/landing");
}
