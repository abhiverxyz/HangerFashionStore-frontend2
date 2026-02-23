import { apiFetchWithAuth } from "./client";

export interface PlannedLookProduct {
  id: string;
  title?: string;
  imageUrl?: string;
  brandId?: string;
}

export interface PlannedLook {
  label: string;
  vibe?: string;
  occasion?: string;
  products: PlannedLookProduct[];
  productIds: string[];
  imageUrl?: string | null;
  lookImageStyle?: string;
  error?: string;
}

export interface LookPlanningResponse {
  looks: PlannedLook[];
  planSummary?: string;
}

/** POST /api/look-planning — plan diverse looks for an occasion. */
export function planLooks(body: {
  occasion: string;
  numberOfLooks?: number;
  vibe?: string;
  days?: number;
  generateImages?: boolean;
  imageStyle?: "flat_lay" | "on_model";
}): Promise<LookPlanningResponse> {
  return apiFetchWithAuth<LookPlanningResponse>("/api/look-planning", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
