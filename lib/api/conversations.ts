import { apiFetchWithAuth } from "./client";

export interface ConversationSummary {
  id: string;
  userId: string;
  title: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MessageMetadata {
  avatarId?: string;
}

export interface MessageSummary {
  id: string;
  role: string;
  content: string;
  imageUrl: string | null;
  imageUrls?: string[];
  flowType: string | null;
  flowContext: string | object | null;
  createdAt: string;
  metadata?: MessageMetadata;
}

export interface ListConversationsResponse {
  conversations: ConversationSummary[];
  nextOffset: number | null;
}

export interface SendMessageResponse {
  reply: string;
  flowType?: string;
  flowContext?: FlowContext | null;
  messageId: string;
  conversationTitle?: string;
}

export interface FlowContext {
  looks?: LookCard[];
  products?: ProductCard[];
  tips?: TipCard[];
  makeupHair?: MakeupHairCard[];
}

export interface LookCard {
  type: string;
  vibe?: string;
  occasion?: string;
  products?: { id: string; title?: string; brandName?: string; imageUrl?: string; handle?: string }[];
  productIds?: string[];
  imageUrl?: string | null;
  lookImageStyle?: "flat_lay" | "on_model";
}

export interface ProductCard {
  id: string;
  title?: string;
  brandName?: string;
  imageUrl?: string | null;
  handle?: string;
}

export interface TipCard {
  type: "trend" | "tip";
  title?: string;
  description?: string | null;
  body?: string | null;
}

export interface MakeupHairCard {
  type: "hair" | "makeup" | "tip";
  title?: string;
  text?: string;
}

/**
 * Parse flowContext from a message (may be stored as JSON string from API/DB).
 */
export function parseFlowContext(raw: string | object | null | undefined): FlowContext | null {
  if (raw == null) return null;
  if (typeof raw === "object") return raw as FlowContext;
  try {
    const parsed = JSON.parse(String(raw));
    return typeof parsed === "object" ? parsed : null;
  } catch {
    return null;
  }
}

/** Optional entry context for embedded flows (e.g. Concierge from Looks/diary/Find). */
export interface CreateConversationBody {
  title?: string;
  metadata?: { entryPoint?: string; [k: string]: unknown };
  source?: string;
  prefillMessage?: string;
}

export function createConversation(body?: CreateConversationBody): Promise<ConversationSummary> {
  const payload: Record<string, unknown> = {};
  if (body?.title != null) payload.title = body.title;
  if (body?.metadata != null) payload.metadata = body.metadata;
  if (body?.source != null) payload.source = body.source;
  if (body?.prefillMessage != null) payload.prefillMessage = body.prefillMessage;
  return apiFetchWithAuth<ConversationSummary>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(Object.keys(payload).length ? payload : {}),
  });
}

export function listConversations(params?: { limit?: number; offset?: number }): Promise<ListConversationsResponse> {
  const qs = new URLSearchParams();
  if (params?.limit != null) qs.set("limit", String(params.limit));
  if (params?.offset != null) qs.set("offset", String(params.offset));
  const query = qs.toString();
  return apiFetchWithAuth<ListConversationsResponse>(`/api/conversations${query ? `?${query}` : ""}`);
}

export function getConversation(id: string, opts?: { includeMessages?: boolean }): Promise<ConversationSummary & { messages?: MessageSummary[] }> {
  return apiFetchWithAuth(`/api/conversations/${encodeURIComponent(id)}`);
}

export function deleteConversation(id: string): Promise<void> {
  return apiFetchWithAuth<void>(`/api/conversations/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}

export function sendMessage(
  conversationId: string,
  payload: { message: string; imageUrl?: string; imageUrls?: string[]; avatarId?: string | null; avatarSlug?: string | null }
): Promise<SendMessageResponse> {
  const body: { message: string; imageUrl?: string; imageUrls?: string[]; avatarId?: string; avatarSlug?: string } = { message: payload.message.trim() };
  if (payload.imageUrls?.length) {
    body.imageUrls = payload.imageUrls;
  } else if (payload.imageUrl?.trim()) {
    body.imageUrl = payload.imageUrl.trim();
  }
  if (payload.avatarId != null && payload.avatarId.trim() !== "") {
    body.avatarId = payload.avatarId.trim();
  } else if (payload.avatarSlug != null && payload.avatarSlug.trim() !== "") {
    body.avatarSlug = payload.avatarSlug.trim();
  }
  return apiFetchWithAuth<SendMessageResponse>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
