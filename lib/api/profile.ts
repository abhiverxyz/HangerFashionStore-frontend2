import { apiFetchWithAuth } from "./client";

export interface UserProfileStyle {
  updatedAt: string | null;
  source: string | null;
  data: unknown;
}

export interface UserProfileHistory {
  summary: string | null;
  recentEvents: { id: string; eventType: string; timestamp: string | null }[];
}

export interface UserProfileNeed {
  text: string | null;
  updatedAt: string | null;
}

export interface UserProfileQuiz {
  responses: unknown;
  submittedAt: string | null;
  version: string | null;
}

export interface UserProfileSummary {
  overall?: string;
  sections?: { history?: string; styleProfile?: string; fashionNeed?: string; fashionMotivation?: string };
}

export interface UserProfile {
  userId: string;
  styleProfile: UserProfileStyle;
  history: UserProfileHistory;
  fashionNeed: UserProfileNeed;
  fashionMotivation: UserProfileNeed;
  quiz: UserProfileQuiz;
  summary?: UserProfileSummary;
}

/** GET /api/profile — combined user profile (style, need, motivation, quiz). Auth required. */
export function getProfile(): Promise<UserProfile> {
  return apiFetchWithAuth<UserProfile>("/api/profile");
}

/** POST /api/profile/quiz — submit quiz. Body: { responses, version? }. Auth required. */
export function submitQuiz(body: { responses: unknown; version?: string }): Promise<UserProfile> {
  return apiFetchWithAuth<UserProfile>("/api/profile/quiz", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** POST /api/profile/generate-need-motivation — run agent to refresh need & motivation. Auth required. */
export function generateNeedMotivation(): Promise<unknown> {
  return apiFetchWithAuth("/api/profile/generate-need-motivation", { method: "POST" });
}
