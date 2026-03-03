import { apiFetchWithAuth } from "./client";
import type { StyleReportData } from "@/lib/types/styleReport";

/** GET /api/style-report — returns cached report when input fingerprint still matches; 404 when no report or stale. */
export async function getStyleReportIfExists(): Promise<{
  reportData: StyleReportData;
  generatedAt: string | null;
} | null> {
  try {
    const res = await apiFetchWithAuth<{ reportData: StyleReportData; generatedAt: string | null }>(
      "/api/style-report"
    );
    return res;
  } catch {
    return null;
  }
}

export interface GenerateStyleReportResponse {
  reportData: StyleReportData | null;
  styleProfileUpdated: boolean;
  cached?: boolean;
  message?: string;
}

/** POST /api/style-report — generate or return cached report. Use forceRegenerate: true to always regenerate. */
export async function generateStyleReport(params?: {
  forceRegenerate?: boolean;
}): Promise<GenerateStyleReportResponse> {
  return apiFetchWithAuth<GenerateStyleReportResponse>("/api/style-report", {
    method: "POST",
    body: JSON.stringify({ forceRegenerate: params?.forceRegenerate === true }),
  });
}
