import { apiFetchWithAuth, apiFetch } from "./client";

export interface FeedPost {
  id: string;
  type: string;
  title: string;
  subtitle: string | null;
  imageUrl: string;
  videoUrl: string | null;
  contentType: string;
  href: string | null;
  meta: unknown;
  isActive: boolean;
  order: number;
  publishedAt: string | null;
  brand?: { id: string; name: string; logoUrl: string | null };
  createdAt: string;
  updatedAt: string;
}

export interface ListFeedPostsResponse {
  posts: FeedPost[];
  total: number;
}

/** List feed posts. For public feed use active=true (returns approved+active). */
export function listFeedPosts(params?: {
  active?: boolean;
  type?: string;
  limit?: number;
  offset?: number;
}): Promise<ListFeedPostsResponse> {
  const sp = new URLSearchParams();
  if (params?.active !== undefined) sp.set("active", String(params.active));
  if (params?.type) sp.set("type", params.type);
  if (params?.limit != null) sp.set("limit", String(params.limit));
  if (params?.offset != null) sp.set("offset", String(params.offset));
  const q = sp.toString();
  return apiFetchWithAuth<ListFeedPostsResponse>(`/api/feed-posts${q ? `?${q}` : ""}`);
}

export function getFeedPost(id: string): Promise<{ post: FeedPost }> {
  return apiFetchWithAuth<{ post: FeedPost }>(`/api/feed-posts/${encodeURIComponent(id)}`);
}
