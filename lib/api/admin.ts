import { apiFetchWithAuth } from "./client";

export type ImportMode = "shopify_sync" | "shopify_public_import";

export interface BrandSummary {
  id: string;
  name: string;
  shopDomain: string;
  lastSyncedAt: string | null;
  importMode: ImportMode;
  productCount: number;
  enrichedCount: number;
}

export interface EnrichmentQueueStats {
  pending: number;
  processing: number;
  failed: number;
  completed: number;
}

export interface SyncStatusResponse {
  brands: BrandSummary[];
  enrichmentQueue: EnrichmentQueueStats;
}

export interface EnrichmentJobStatus {
  status: "pending" | "processing" | "completed" | "failed" | "unknown";
  priority?: number;
  attempts?: number;
  completedAt?: number;
  error?: string;
  failedAt?: number;
}

export function fetchSyncStatus(): Promise<SyncStatusResponse> {
  return apiFetchWithAuth<SyncStatusResponse>("/api/admin/sync-status");
}

export function createBrand(body: {
  shopDomain: string;
  name: string;
  description?: string;
  websiteUrl?: string;
  importMode?: ImportMode;
}): Promise<{ id: string; shopDomain: string; name: string; importMode: ImportMode; lastSyncedAt: null }> {
  return apiFetchWithAuth("/api/admin/brands", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Fetch all products from a store's public products.json in the browser (avoids server DNS issues). */
export async function fetchProductsFromStoreUrl(baseUrl: string): Promise<unknown[]> {
  const base = baseUrl.replace(/\/+$/, "");
  const all: unknown[] = [];
  let page = 1;
  for (;;) {
    const res = await fetch(`${base}/products.json?page=${page}&limit=250`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      if (page === 1) throw new Error(`Store returned ${res.status}. Check the URL.`);
      break;
    }
    const data = (await res.json()) as { products?: unknown[] };
    const products = data?.products && Array.isArray(data.products) ? data.products : [];
    all.push(...products);
    if (products.length < 250) break;
    page++;
    await new Promise((r) => setTimeout(r, 300));
  }
  return all;
}

/** Import from public URL by having the backend fetch (fails if server can't resolve store DNS). */
export function importPublicBrand(body: {
  url: string;
  brandName?: string;
}): Promise<{
  success: boolean;
  message: string;
  summary: { total: number; newProducts: number; updatedProducts: number; errors: number; enqueuedForEnrichment: number };
  brand: { id: string; name: string; shopDomain: string; totalProducts: number };
}> {
  return apiFetchWithAuth("/api/admin/import-public", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Import from pre-fetched products (browser fetches store, then sends payload). Use when server can't resolve store hostname. */
export function importPublicBrandPayload(body: {
  url: string;
  brandName?: string;
  products: unknown[];
}): Promise<{
  success: boolean;
  message: string;
  summary: { total: number; newProducts: number; updatedProducts: number; errors: number; enqueuedForEnrichment: number };
  brand: { id: string; name: string; shopDomain: string; totalProducts: number };
}> {
  return apiFetchWithAuth("/api/admin/import-public-payload", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function triggerSyncShopify(brandId: string, accessToken: string): Promise<{ enqueued: string; message: string }> {
  return apiFetchWithAuth("/api/admin/sync-shopify", {
    method: "POST",
    body: JSON.stringify({ brandId, accessToken }),
  });
}

export function deleteBrand(id: string): Promise<void> {
  return apiFetchWithAuth(`/api/admin/brands/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetchWithAuth(`/api/admin/products/${encodeURIComponent(id)}`, { method: "DELETE" });
}

export function enqueueEnrichProduct(productId: string): Promise<{ enqueued: string; message: string }> {
  return apiFetchWithAuth(`/api/admin/enrich-product/${encodeURIComponent(productId)}`, {
    method: "POST",
  });
}

export function fetchEnrichStatus(productId: string): Promise<EnrichmentJobStatus> {
  return apiFetchWithAuth(`/api/admin/enrich-status/${encodeURIComponent(productId)}`);
}

/** Model config: scope -> { provider, model }. Used by admin AI/Model settings. */
export type ModelConfigMap = Record<string, { provider: string; model: string }>;

export function getModelConfig(): Promise<ModelConfigMap> {
  return apiFetchWithAuth<ModelConfigMap>("/api/admin/model-config");
}

export function updateModelConfig(
  scope: string,
  config: { provider: string; model: string }
): Promise<ModelConfigMap> {
  return apiFetchWithAuth<ModelConfigMap>("/api/admin/model-config", {
    method: "PUT",
    body: JSON.stringify({ scope, ...config }),
  });
}

// ---------- B1.3 Fashion Content: sources, allowlist, run agent ----------

export interface FashionContentSourceItem {
  id: string;
  type: string;
  payload: string;
  status: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export function fetchFashionContentSources(params?: {
  status?: string;
  limit?: number;
}): Promise<{ items: FashionContentSourceItem[]; total: number }> {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  const qs = sp.toString();
  return apiFetchWithAuth(`/api/admin/fashion-content-sources${qs ? `?${qs}` : ""}`);
}

export function addFashionContentSource(body: {
  type: "url" | "text" | "image";
  payload: string;
}): Promise<FashionContentSourceItem> {
  return apiFetchWithAuth("/api/admin/fashion-content-sources", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export interface AllowedFashionDomainItem {
  id: string;
  domain: string;
  createdAt: string;
}

export function fetchFashionContentAllowlist(): Promise<AllowedFashionDomainItem[]> {
  return apiFetchWithAuth("/api/admin/fashion-content-allowlist");
}

export function addFashionContentAllowlistDomain(domain: string): Promise<AllowedFashionDomainItem> {
  return apiFetchWithAuth("/api/admin/fashion-content-allowlist", {
    method: "POST",
    body: JSON.stringify({ domain }),
  });
}

export function removeFashionContentAllowlistDomain(
  idOrDomain: string
): Promise<AllowedFashionDomainItem> {
  return apiFetchWithAuth(`/api/admin/fashion-content-allowlist/${encodeURIComponent(idOrDomain)}`, {
    method: "DELETE",
  });
}

export function runFashionContentAgent(seed?: string): Promise<{
  success: boolean;
  result: {
    trendsCreated: number;
    trendsUpdated: number;
    rulesCreated: number;
    rulesUpdated: number;
    trendsPruned: number;
    rulesPruned: number;
    droppedTrends: number;
    droppedRules: number;
    webUrlsFetched: string[];
    errors: string[];
  };
}> {
  return apiFetchWithAuth("/api/admin/run-fashion-content-agent", {
    method: "POST",
    body: JSON.stringify(seed != null ? { seed } : {}),
  });
}

// ---------- Styling Agent improvement loop ----------

export interface StylingAvatar {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  systemPromptAddition: string;
  sortOrder: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StylingPlaybookEntry {
  id: string;
  type: string;
  content: string;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export function fetchStylingAvatars(): Promise<StylingAvatar[]> {
  return apiFetchWithAuth<StylingAvatar[]>("/api/admin/styling-avatars");
}

export function fetchDefaultStylingAvatar(): Promise<StylingAvatar> {
  return apiFetchWithAuth<StylingAvatar>("/api/admin/styling-avatars/default");
}

export function setDefaultStylingAvatar(avatarId: string): Promise<StylingAvatar> {
  return apiFetchWithAuth<StylingAvatar>("/api/admin/styling-avatars/default", {
    method: "PUT",
    body: JSON.stringify({ avatarId }),
  });
}

export function updateStylingAvatar(
  idOrSlug: string,
  data: Partial<Pick<StylingAvatar, "name" | "slug" | "description" | "systemPromptAddition" | "sortOrder" | "isDefault">>
): Promise<StylingAvatar> {
  return apiFetchWithAuth<StylingAvatar>(`/api/admin/styling-avatars/${encodeURIComponent(idOrSlug)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function fetchStylingPlaybook(params?: { type?: string; isActive?: boolean }): Promise<StylingPlaybookEntry[]> {
  const qs = new URLSearchParams();
  if (params?.type) qs.set("type", params.type);
  if (params?.isActive !== undefined) qs.set("isActive", String(params.isActive));
  const query = qs.toString();
  return apiFetchWithAuth<StylingPlaybookEntry[]>(`/api/admin/styling-playbook${query ? `?${query}` : ""}`);
}

export function fetchStylingGoals(): Promise<{ content: string }> {
  return apiFetchWithAuth<{ content: string }>("/api/admin/styling-playbook/goals");
}

export function updateStylingGoals(content: string): Promise<{ content: string }> {
  return apiFetchWithAuth<{ content: string }>("/api/admin/styling-playbook/goals", {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

export function createStylingPlaybookEntry(data: {
  type: "instruction" | "example_flow";
  content: string;
  sortOrder?: number;
  isActive?: boolean;
}): Promise<StylingPlaybookEntry> {
  return apiFetchWithAuth<StylingPlaybookEntry>("/api/admin/styling-playbook", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateStylingPlaybookEntry(
  id: string,
  data: Partial<Pick<StylingPlaybookEntry, "content" | "sortOrder" | "isActive">>
): Promise<StylingPlaybookEntry> {
  return apiFetchWithAuth<StylingPlaybookEntry>(`/api/admin/styling-playbook/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(data),
  });
}

export function deleteStylingPlaybookEntry(id: string): Promise<void> {
  return apiFetchWithAuth(`/api/admin/styling-playbook/${encodeURIComponent(id)}`, { method: "DELETE" });
}

// ---------- Look classification tags ----------

export interface LookClassificationTagItem {
  id: string;
  name: string;
  label: string;
  description: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ListLookClassificationTagsResponse {
  items: LookClassificationTagItem[];
  total: number;
  limit: number;
  offset: number;
}

export function fetchLookClassificationTags(params?: {
  limit?: number;
  offset?: number;
}): Promise<ListLookClassificationTagsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiFetchWithAuth<ListLookClassificationTagsResponse>(
    `/api/admin/look-classification-tags${query ? `?${query}` : ""}`
  );
}

export function seedLookClassificationTags(): Promise<{ seeded: number }> {
  return apiFetchWithAuth<{ seeded: number }>("/api/admin/look-classification-tags/seed", { method: "POST" });
}

export function createLookClassificationTag(data: {
  name: string;
  label?: string;
  description?: string | null;
  sortOrder?: number;
}): Promise<LookClassificationTagItem> {
  return apiFetchWithAuth<LookClassificationTagItem>("/api/admin/look-classification-tags", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export function updateLookClassificationTag(
  id: string,
  data: Partial<Pick<LookClassificationTagItem, "name" | "label" | "description" | "sortOrder">>
): Promise<LookClassificationTagItem> {
  return apiFetchWithAuth<LookClassificationTagItem>(
    `/api/admin/look-classification-tags/${encodeURIComponent(id)}`,
    { method: "PUT", body: JSON.stringify(data) }
  );
}

export function deleteLookClassificationTag(id: string): Promise<void> {
  return apiFetchWithAuth(`/api/admin/look-classification-tags/${encodeURIComponent(id)}`, { method: "DELETE" });
}
