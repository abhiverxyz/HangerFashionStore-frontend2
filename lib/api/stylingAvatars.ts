import { apiFetchWithAuth } from "./client";

export interface StylingAvatar {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  systemPromptAddition: string;
  defaultGreeting?: string | null;
  goalsAddition?: string | null;
  preferencesOverride?: string | null;
  sortOrder: number;
  isDefault: boolean;
  imageUrl?: string | null;
  createdAt: string;
  updatedAt: string;
}

/**
 * List styling avatars for Concierge (user-facing, auth required).
 * GET /api/styling-avatars
 */
export function fetchStylingAvatars(): Promise<StylingAvatar[]> {
  return apiFetchWithAuth<StylingAvatar[]>("/api/styling-avatars");
}
