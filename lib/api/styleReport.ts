import { apiFetchWithAuth } from "./client";
import type { StyleReportData } from "@/lib/types/styleReport";

export interface GetStyleReportResponse {
  reportData: StyleReportData;
  generatedAt: string | null;
}

export interface GenerateStyleReportResponse {
  reportData: StyleReportData | null;
  styleProfileUpdated: boolean;
  message?: string;
}

export function getStyleReport(): Promise<GetStyleReportResponse> {
  return apiFetchWithAuth<GetStyleReportResponse>("/api/style-report");
}

/** GET style report; returns null when none exists (404). Use for optional display. */
export async function getStyleReportIfExists(): Promise<GetStyleReportResponse | null> {
  try {
    return await getStyleReport();
  } catch {
    return null;
  }
}

/**
 * Generate style report from user's looks. Returns 200 with reportData null and message if not enough looks.
 */
export function generateStyleReport(options?: { forceRegenerate?: boolean }): Promise<GenerateStyleReportResponse> {
  return apiFetchWithAuth<GenerateStyleReportResponse>("/api/style-report", {
    method: "POST",
    body: JSON.stringify({ forceRegenerate: options?.forceRegenerate ?? true }),
  });
}
