import { apiFetchWithAuth } from "./client";

export interface Trend {
  id: string;
  trendName: string;
  description: string | null;
  keywords: string;
  category: string | null;
  status: string;
  seasonality: string | null;
  region: string | null;
  isCurated: boolean;
  source: string | null;
  strength: number | null;
  parentId: string | null;
  impactedItemTypes: string | null;
  tellTaleSigns: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StylingRule {
  id: string;
  title: string | null;
  body: string;
  ruleType: string | null;
  category: string | null;
  subject: string | null;
  tags: unknown;
  source: string | null;
  status: string;
  strength: number | null;
  parentId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ListTrendsResponse {
  items: Trend[];
  total: number;
  limit: number;
  offset: number;
}

export interface ListStylingRulesResponse {
  items: StylingRule[];
  total: number;
  limit: number;
  offset: number;
}

export function fetchTrends(params?: {
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  search?: string;
}): Promise<ListTrendsResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.category) sp.set("category", params.category);
  if (params?.status) sp.set("status", params.status);
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return apiFetchWithAuth<ListTrendsResponse>(`/api/fashion-content/trends${qs ? `?${qs}` : ""}`);
}

export function fetchStylingRules(params?: {
  limit?: number;
  offset?: number;
  category?: string;
  status?: string;
  ruleType?: string;
  search?: string;
}): Promise<ListStylingRulesResponse> {
  const sp = new URLSearchParams();
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  if (params?.category) sp.set("category", params.category);
  if (params?.status) sp.set("status", params.status);
  if (params?.ruleType) sp.set("ruleType", params.ruleType);
  if (params?.search) sp.set("search", params.search);
  const qs = sp.toString();
  return apiFetchWithAuth<ListStylingRulesResponse>(`/api/fashion-content/styling-rules${qs ? `?${qs}` : ""}`);
}
