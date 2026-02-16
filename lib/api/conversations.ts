import { apiFetchWithAuth } from "./client";

export interface ConversationSummary {
  id: string;
  userId: string;
  title: string | null;
  metadata: string | null;
  createdAt: string;
  updatedAt: string;
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
  metadata?: object;
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

export function createConversation(body?: { title?: string; metadata?: object }): Promise<ConversationSummary> {
  return apiFetchWithAuth<ConversationSummary>("/api/conversations", {
    method: "POST",
    body: JSON.stringify(body ?? {}),
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

export function sendMessage(
  conversationId: string,
  payload: { message: string; imageUrl?: string; imageUrls?: string[] }
): Promise<SendMessageResponse> {
  const body: { message: string; imageUrl?: string; imageUrls?: string[] } = { message: payload.message.trim() };
  if (payload.imageUrls?.length) {
    body.imageUrls = payload.imageUrls;
  } else if (payload.imageUrl?.trim()) {
    body.imageUrl = payload.imageUrl.trim();
  }
  return apiFetchWithAuth<SendMessageResponse>(`/api/conversations/${encodeURIComponent(conversationId)}/messages`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}
