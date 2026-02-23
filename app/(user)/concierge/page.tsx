"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  createConversation,
  deleteConversation as deleteConversationApi,
  getConversation,
  listConversations,
  sendMessage,
  parseFlowContext,
  type ConversationSummary,
  type MessageSummary,
  type FlowContext,
} from "@/lib/api/conversations";
import { uploadUserImage } from "@/lib/api/userImages";
import { fetchStylingAvatars, type StylingAvatar } from "@/lib/api/stylingAvatars";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { FlowContextCards } from "@/components/concierge/FlowContextCards";
import { ConciergeAvatarCircle } from "@/components/concierge/ConciergeAvatarCircle";
import { ConciergeFABIcon } from "@/components/concierge/ConciergeFABIcon";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";
const LIST_PAGE_SIZE = 20;
const MAX_ATTACHMENTS = 5;
const CONCIERGE_AVATAR_STORAGE_KEY = "concierge-avatar-id";

function formatConversationTitle(c: ConversationSummary): string {
  if (c.title && c.title.trim()) return c.title.trim();
  return "New chat";
}

function formatDate(iso: string): string {
  try {
    const d = new Date(iso);
    const now = new Date();
    const sameDay = d.toDateString() === now.toDateString();
    if (sameDay) return d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch {
    return "";
  }
}

/** Resolve avatar for an assistant message: use message metadata.avatarId if set, else fallback (e.g. selected avatar). */
function getAvatarForMessage(
  msg: MessageSummary,
  avatars: StylingAvatar[],
  fallback: StylingAvatar | null
): StylingAvatar | null {
  if (msg.role !== "assistant") return fallback;
  const id = msg.metadata?.avatarId;
  if (id && avatars.length) {
    const a = avatars.find((x) => x.id === id);
    if (a) return a;
  }
  return fallback;
}

export default function ConciergePage() {
  const searchParams = useSearchParams();
  const accessToken = useStorageAccessToken();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [nextOffset, setNextOffset] = useState<number | null>(null);
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<MessageSummary[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [attachedUrls, setAttachedUrls] = useState<string[]>([]);
  const [uploadingCount, setUploadingCount] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [quickViewProductId, setQuickViewProductId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [avatars, setAvatars] = useState<StylingAvatar[]>([]);
  const [selectedAvatarId, setSelectedAvatarIdState] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(CONCIERGE_AVATAR_STORAGE_KEY);
  });
  const listEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesEndRefMobile = useRef<HTMLDivElement>(null);
  const justCreatedConversationIdRef = useRef<string | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const scrollMessagesEnd = useCallback(() => {
    const run = () => {
      [messagesEndRef.current, messagesEndRefMobile.current].forEach((el) =>
        el?.scrollIntoView({ behavior: "smooth" })
      );
    };
    setTimeout(run, 50);
  }, []);

  const setSelectedAvatarId = useCallback((id: string | null) => {
    setSelectedAvatarIdState(id);
    if (typeof window !== "undefined") {
      if (id) window.localStorage.setItem(CONCIERGE_AVATAR_STORAGE_KEY, id);
      else window.localStorage.removeItem(CONCIERGE_AVATAR_STORAGE_KEY);
    }
  }, []);

  const loadList = useCallback(async (offset = 0) => {
    try {
      if (offset === 0) setLoadingList(true);
      else setLoadingMore(true);
      setError(null);
      const res = await listConversations({ limit: LIST_PAGE_SIZE, offset });
      if (offset === 0) {
        setConversations(res.conversations);
      } else {
        setConversations((prev) => [...prev, ...res.conversations]);
      }
      setNextOffset(res.nextOffset);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversations");
    } finally {
      setLoadingList(false);
      setLoadingMore(false);
    }
  }, []);

  const loadConversation = useCallback(async (id: string) => {
    setLoadingMessages(true);
    setError(null);
    try {
      const conv = await getConversation(id);
      setMessages(conv.messages ?? []);
      scrollMessagesEnd();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load conversation");
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, [scrollMessagesEnd]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  useEffect(() => {
    let mounted = true;
    fetchStylingAvatars()
      .then((list) => {
        if (mounted) {
          setAvatars(list);
          setSelectedAvatarIdState((prev) => {
            if (prev && list.some((a) => a.id === prev)) return prev;
            const defaultAvatar = list.find((a) => a.isDefault) ?? list[0];
            const next = defaultAvatar?.id ?? null;
            if (next && typeof window !== "undefined") window.localStorage.setItem(CONCIERGE_AVATAR_STORAGE_KEY, next);
            return next;
          });
        }
      })
      .catch(() => {});
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    if (!selectedId) {
      setMessages([]);
      return;
    }
    if (selectedId === justCreatedConversationIdRef.current) return;
    loadConversation(selectedId);
  }, [selectedId, loadConversation]);

  const selectedAvatar = avatars.find((a) => a.id === selectedAvatarId) ?? avatars[0] ?? null;

  const handleNewChat = async () => {
    setError(null);
    try {
      const conv = await createConversation();
      setConversations((prev) => [conv, ...prev]);
      setSelectedId(conv.id);
      setMessages([]);
      setInputMessage("");
      setAttachedUrls([]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create conversation");
    }
  };

  const handleLoadMore = () => {
    if (nextOffset == null || loadingMore) return;
    loadList(nextOffset);
  };

  const handleDeleteConversation = async (c: ConversationSummary) => {
    if (!confirm("Delete this conversation?")) return;
    setDeletingId(c.id);
    setError(null);
    try {
      await deleteConversationApi(c.id);
      setConversations((prev) => prev.filter((x) => x.id !== c.id));
      if (selectedId === c.id) {
        setSelectedId(null);
        setMessages([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete conversation");
    } finally {
      setDeletingId(null);
    }
  };

  const handleAttach = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length || attachedUrls.length >= MAX_ATTACHMENTS) return;
    setError(null);
    for (let i = 0; i < files.length && attachedUrls.length + i < MAX_ATTACHMENTS; i++) {
      const file = files[i];
      if (!file.type.startsWith("image/")) continue;
      setUploadingCount((c) => c + 1);
      try {
        const record = await uploadUserImage(file);
        setAttachedUrls((prev) => [...prev, record.rawImageUrl]);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploadingCount((c) => c - 1);
      }
    }
    e.target.value = "";
  };

  const removeAttachment = (url: string) => {
    setAttachedUrls((prev) => prev.filter((u) => u !== url));
  };

  const handleSend = async () => {
    const text = inputMessage.trim();
    if (!text && attachedUrls.length === 0) return;
    let convId = selectedId;
    if (!convId) {
      try {
        const source = searchParams.get("source") ?? undefined;
        const prefillMessage = searchParams.get("prefillMessage") ?? undefined;
        const entryPoint = searchParams.get("entryPoint") ?? undefined;
        const conv = await createConversation({
          ...(source && { source }),
          ...(prefillMessage && { prefillMessage }),
          ...(entryPoint && { metadata: { entryPoint } }),
        });
        setConversations((prev) => [conv, ...prev]);
        justCreatedConversationIdRef.current = conv.id;
        setSelectedId(conv.id);
        convId = conv.id;
        setMessages([]);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Failed to create conversation");
        return;
      }
    }
    const userContent = text || "(image)";
    const userImageUrls = [...attachedUrls];
    setSending(true);
    setError(null);
    setInputMessage("");
    setAttachedUrls([]);
    setMessages((prev) => [
      ...prev,
      {
        id: `temp-user-${Date.now()}`,
        role: "user",
        content: userContent,
        imageUrl: userImageUrls[0] ?? null,
        imageUrls: userImageUrls,
        flowType: null,
        flowContext: null,
        createdAt: new Date().toISOString(),
      },
    ]);
    scrollMessagesEnd();

    try {
      const result = await sendMessage(convId, {
        message: text || "(image)",
        imageUrls: userImageUrls.length ? userImageUrls : undefined,
        avatarId: selectedAvatarId ?? undefined,
      });
      setMessages((prev) => [
        ...prev,
        {
          id: result.messageId,
          role: "assistant",
          content: result.reply,
          imageUrl: null,
          imageUrls: [],
          flowType: result.flowType ?? null,
          flowContext: result.flowContext ?? null,
          createdAt: new Date().toISOString(),
          metadata: selectedAvatarId ? { avatarId: selectedAvatarId } : undefined,
        },
      ]);
      scrollMessagesEnd();
      if (result.conversationTitle != null) {
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, title: result.conversationTitle ?? c.title } : c))
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to send message");
      setMessages((prev) => prev.filter((m) => !m.id.startsWith("temp-user-")));
      setInputMessage(userContent);
      setAttachedUrls(userImageUrls);
    } finally {
      setSending(false);
      justCreatedConversationIdRef.current = null;
    }
  };

  const selectedConv = conversations.find((c) => c.id === selectedId);
  const canSend = (inputMessage.trim() || attachedUrls.length > 0) && !sending;

  const closeDrawer = useCallback(() => setDrawerOpen(false), []);

  const inputBar = (
    <div className="p-4 bg-card">
      {error && (
        <p className="text-sm text-red-600 mb-2" role="alert">
          {error}
        </p>
      )}
      {attachedUrls.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2">
          {attachedUrls.map((url) => (
            <div key={url} className="relative">
              <img
                src={url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`}
                alt="Attach"
                className="h-14 w-14 object-cover rounded-soft-md border border-border"
              />
              <button
                type="button"
                aria-label="Remove"
                onClick={() => removeAttachment(url)}
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center hover:bg-red-600"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="flex items-end gap-0 rounded-soft-xl border border-border bg-neutral-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary overflow-hidden">
        <label className="shrink-0 flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-foreground hover:bg-neutral-100 cursor-pointer disabled:opacity-50 transition-colors">
          <input
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={handleAttach}
            disabled={attachedUrls.length >= MAX_ATTACHMENTS || uploadingCount > 0}
          />
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
          </svg>
        </label>
        <textarea
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          placeholder="Message…"
          rows={1}
          className="flex-1 min-h-[2.5rem] max-h-32 py-2.5 px-1 text-sm resize-y bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400 disabled:opacity-50"
          disabled={sending}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className="shrink-0 flex items-center justify-center w-10 h-10 text-primary-cta hover:bg-primary-cta/10 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
          aria-label={sending ? "Sending…" : "Send"}
        >
          {sending ? (
            <span className="text-xs text-neutral-500">…</span>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
              <path d="M8 5v14l11-7L8 5z" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-9rem-env(safe-area-inset-bottom,0px)-120px)] lg:h-[calc(100vh-12rem)] min-h-0 bg-card lg:bg-transparent rounded-soft-xl overflow-hidden">
      {/* Mobile: top bar — drawer trigger, title, FAB icon (no New chat) */}
      <div className="lg:hidden shrink-0 flex items-center justify-between gap-3 px-3 py-2 border border-border border-b-0 rounded-t-soft-xl bg-card">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="p-2 -m-2 rounded-soft-md text-foreground hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label="Open chats"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="3" y1="12" x2="21" y2="12" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <line x1="3" y1="18" x2="21" y2="18" />
          </svg>
        </button>
        <h1 className="font-display text-lg text-foreground flex-1 text-center">Concierge</h1>
        <div
          className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-700 to-purple-700 text-white"
          aria-hidden
        >
          <ConciergeFABIcon className="w-5 h-5" />
        </div>
      </div>

      {/* Mobile: left drawer (historical chats, avatars, New chat) */}
      {drawerOpen && (
        <>
          <button
            type="button"
            onClick={closeDrawer}
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            aria-label="Close drawer"
          />
          <aside
            className="lg:hidden fixed top-0 left-0 z-50 w-[min(85vw,20rem)] h-full flex flex-col bg-card border-r border-border rounded-r-soft-xl shadow-soft"
            aria-modal="true"
            aria-label="Chats"
          >
            <div className="p-3 border-b border-border flex items-center justify-between">
              <h2 className="font-display text-lg text-foreground">Chats</h2>
              <button
                type="button"
                onClick={closeDrawer}
                className="p-2 -m-2 rounded-soft-md text-foreground hover:bg-neutral-100"
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="p-3 border-b border-border">
              <button
                type="button"
                onClick={() => { handleNewChat(); closeDrawer(); }}
                className="w-full px-3 py-2 rounded-soft-md bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90"
              >
                New chat
              </button>
            </div>
            {avatars.length > 0 && (
              <div className="p-3 border-b border-border">
                <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Choose your Concierge</p>
                <div className="flex flex-wrap gap-3">
                  {avatars.map((a) => (
                    <div key={a.id} className="flex flex-col items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setSelectedAvatarId(a.id)}
                        className={`rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                          selectedAvatarId === a.id ? "ring-2 ring-primary" : "hover:opacity-90"
                        }`}
                        title={a.name}
                        aria-label={a.name}
                      >
                        <ConciergeAvatarCircle size={36} imageUrl={a.imageUrl} tintSeed={a.id} initial={a.name} />
                      </button>
                      <span className="text-xs text-neutral-600 max-w-[4.5rem] truncate text-center" title={a.name}>
                        {a.name || "Concierge"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="flex-1 overflow-y-auto">
              {loadingList ? (
                <div className="p-4 text-sm text-neutral-500">Loading…</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-sm text-neutral-500">No conversations yet.</div>
              ) : (
                <ul className="py-2">
                  {conversations.map((c) => (
                    <li key={c.id} className="flex items-stretch border-b border-border/50">
                      <button
                        type="button"
                        onClick={() => { justCreatedConversationIdRef.current = null; setSelectedId(c.id); closeDrawer(); }}
                        className={`flex-1 min-w-0 text-left px-4 py-3 hover:bg-neutral-100 transition-colors ${
                          selectedId === c.id ? "bg-accent-sand/30 border-l-2 border-l-primary" : ""
                        }`}
                      >
                        <p className="text-sm font-medium text-foreground truncate">{formatConversationTitle(c)}</p>
                        <p className="text-xs text-neutral-500 mt-0.5">{formatDate(c.updatedAt)}</p>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleDeleteConversation(c); }}
                        disabled={deletingId === c.id}
                        className="shrink-0 px-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                        aria-label="Delete conversation"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                          <line x1="10" y1="11" x2="10" y2="17" />
                          <line x1="14" y1="11" x2="14" y2="17" />
                        </svg>
                      </button>
                    </li>
                  ))}
                  {nextOffset != null && (
                    <li className="p-2">
                      <button
                        type="button"
                        onClick={handleLoadMore}
                        disabled={loadingMore}
                        className="w-full py-2 text-sm text-neutral-600 hover:text-foreground disabled:opacity-50"
                      >
                        {loadingMore ? "Loading…" : "Load more"}
                      </button>
                    </li>
                  )}
                </ul>
              )}
            </div>
          </aside>
        </>
      )}

      <div className="flex-1 flex flex-col lg:flex-row min-h-0 border border-border rounded-b-soft-xl lg:rounded-soft-xl rounded-t-none shadow-soft overflow-hidden bg-card lg:bg-inherit">
        {/* Conversation list — desktop only; on mobile use drawer above */}
        <aside className="hidden lg:flex w-72 shrink-0 flex-col border-r border-border bg-neutral-50">
          <div className="p-3 border-b border-border flex items-center justify-between">
            <h1 className="font-display text-lg text-foreground">Concierge</h1>
            <div
              className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-gradient-to-r from-pink-700 to-purple-700 text-white"
              aria-hidden
            >
              <ConciergeFABIcon className="w-5 h-5" />
            </div>
          </div>
          {avatars.length > 0 && (
            <div className="p-3 border-b border-border">
              <p className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">Choose your Concierge</p>
              <div className="flex flex-wrap gap-3">
                {avatars.map((a) => (
                  <div key={a.id} className="flex flex-col items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setSelectedAvatarId(a.id)}
                      className={`rounded-full p-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-primary ${
                        selectedAvatarId === a.id ? "ring-2 ring-primary" : "hover:opacity-90"
                      }`}
                      title={a.name}
                      aria-label={a.name}
                    >
                      <ConciergeAvatarCircle size={36} imageUrl={a.imageUrl} tintSeed={a.id} initial={a.name} />
                    </button>
                    <span className="text-xs text-neutral-600 max-w-[4.5rem] truncate text-center" title={a.name}>
                      {a.name || "Concierge"}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div className="p-3 border-b border-border">
            <button
              type="button"
              onClick={handleNewChat}
              className="w-full px-3 py-2 rounded-soft-md bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90"
            >
              New chat
            </button>
          </div>
          <div className="flex-1 overflow-y-auto min-h-0">
            {loadingList ? (
              <div className="p-4 text-sm text-neutral-500">Loading…</div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-sm text-neutral-500">
                No conversations yet. Use the New chat button above to start.
              </div>
            ) : (
              <ul className="py-2">
                {conversations.map((c) => (
                  <li key={c.id} className="flex items-stretch border-b border-border/50">
                    <button
                      type="button"
                      onClick={() => { justCreatedConversationIdRef.current = null; setSelectedId(c.id); }}
                      className={`flex-1 min-w-0 text-left px-4 py-3 hover:bg-neutral-100 transition-colors ${
                        selectedId === c.id ? "bg-accent-sand/30 border-l-2 border-l-primary" : ""
                      }`}
                    >
                      <p className="text-sm font-medium text-foreground truncate">
                        {formatConversationTitle(c)}
                      </p>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        {formatDate(c.updatedAt)}
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteConversation(c);
                      }}
                      disabled={deletingId === c.id}
                      className="shrink-0 px-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 disabled:opacity-50"
                      aria-label="Delete conversation"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        <line x1="10" y1="11" x2="10" y2="17" />
                        <line x1="14" y1="11" x2="14" y2="17" />
                      </svg>
                    </button>
                  </li>
                ))}
                {nextOffset != null && (
                  <li className="p-2">
                    <button
                      type="button"
                      onClick={handleLoadMore}
                      disabled={loadingMore}
                      className="w-full py-2 text-sm text-neutral-600 hover:text-foreground disabled:opacity-50"
                    >
                      {loadingMore ? "Loading…" : "Load more"}
                    </button>
                  </li>
                )}
              </ul>
            )}
            <div ref={listEndRef} />
          </div>
        </aside>

        {/* Thread + input */}
        <div className="flex-1 flex flex-col min-w-0 min-h-0">
          {/* Mobile: always-visible input bar; when !selectedId show welcome */}
          <div className="flex flex-col flex-1 min-h-0 lg:hidden">
            {selectedId && (
              <div className="px-4 py-2 border-b border-border bg-card shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {selectedConv ? formatConversationTitle(selectedConv) : "Chat"}
                </p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {selectedId ? (
                <div className="p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="text-sm text-neutral-500">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-neutral-500">
                      Send a message to get started. Ask for outfit ideas, search for items, or share a photo for feedback.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const messageAvatar = getAvatarForMessage(msg, avatars, selectedAvatar);
                      const parsedFlow = msg.role === "assistant" && msg.flowContext != null ? parseFlowContext(msg.flowContext) ?? {} : null;
                      const hasCards = parsedFlow && (
                        (parsedFlow.looks?.length ?? 0) > 0 ||
                        (parsedFlow.products?.length ?? 0) > 0 ||
                        (parsedFlow.tips?.length ?? 0) > 0 ||
                        (parsedFlow.makeupHair?.length ?? 0) > 0
                      );
                      if (msg.role === "assistant") {
                        return (
                          <div key={msg.id} className="space-y-2">
                            <div className="flex gap-2 justify-start">
                              <div className="shrink-0 pt-1">
                                <ConciergeAvatarCircle
                                  size={32}
                                  imageUrl={messageAvatar?.imageUrl}
                                  tintSeed={messageAvatar?.id}
                                  initial={messageAvatar?.name ?? null}
                                />
                              </div>
                              <div className="max-w-[85%] rounded-soft-lg px-4 py-2.5 bg-neutral-100 text-foreground border border-border">
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                            {hasCards && (
                              <div className="flex gap-2 justify-start">
                                <div className="shrink-0 pt-1 w-8" aria-hidden />
                                <div className="max-w-[85%] rounded-soft-lg px-4 py-2.5 bg-neutral-50 border border-border">
                                  <FlowContextCards
                                    flowContext={parsedFlow!}
                                    flowType={msg.flowType}
                                    onOpenProductQuickView={setQuickViewProductId}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={msg.id}
                          className="flex gap-2 justify-end"
                        >
                          <div className="max-w-[85%] rounded-soft-lg px-4 py-2.5 bg-primary text-neutral-100">
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.imageUrls && msg.imageUrls.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {msg.imageUrls.map((url) => (
                                  <img
                                    key={url}
                                    src={getImageDisplayUrl(url, accessToken)}
                                    alt="Attachment"
                                    className="h-20 w-20 object-cover rounded-soft-md"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRefMobile} />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex gap-2 justify-start">
                    <div className="shrink-0 pt-1">
                      <ConciergeAvatarCircle
                        size={32}
                        imageUrl={selectedAvatar?.imageUrl}
                        tintSeed={selectedAvatar?.id}
                        initial={selectedAvatar?.name ?? null}
                      />
                    </div>
                    <div className="max-w-[85%] rounded-soft-lg px-4 py-2.5 bg-neutral-100 text-foreground border border-border">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedAvatar?.defaultGreeting?.trim() || "What shall we do? Find something, build a look, look at trends — I'm up for anything fashion and style."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {inputBar}
          </div>

          {/* Desktop: right panel — white background; default avatar message when no chat; input bar always at bottom */}
          <div className="hidden lg:flex flex-col flex-1 min-h-0 bg-white">
            {selectedId && (
              <div className="px-4 py-2 border-b border-border bg-white shrink-0">
                <p className="text-sm font-medium text-foreground">
                  {selectedConv ? formatConversationTitle(selectedConv) : "Chat"}
                </p>
              </div>
            )}
            <div className="flex-1 overflow-y-auto min-h-0 bg-white">
              {selectedId ? (
                <div className="p-4 space-y-4">
                  {loadingMessages ? (
                    <div className="text-sm text-neutral-500">Loading messages…</div>
                  ) : messages.length === 0 ? (
                    <div className="text-sm text-neutral-500">
                      Send a message to get started. Ask for outfit ideas, search for items, or share a photo for feedback.
                    </div>
                  ) : (
                    messages.map((msg) => {
                      const messageAvatar = getAvatarForMessage(msg, avatars, selectedAvatar);
                      const parsedFlow = msg.role === "assistant" && msg.flowContext != null ? parseFlowContext(msg.flowContext) ?? {} : null;
                      const hasCards = parsedFlow && (
                        (parsedFlow.looks?.length ?? 0) > 0 ||
                        (parsedFlow.products?.length ?? 0) > 0 ||
                        (parsedFlow.tips?.length ?? 0) > 0 ||
                        (parsedFlow.makeupHair?.length ?? 0) > 0
                      );
                      if (msg.role === "assistant") {
                        return (
                          <div key={msg.id} className="space-y-2">
                            <div className="flex gap-2 justify-start">
                              <div className="shrink-0 pt-1">
                                <ConciergeAvatarCircle
                                  size={32}
                                  imageUrl={messageAvatar?.imageUrl}
                                  tintSeed={messageAvatar?.id}
                                  initial={messageAvatar?.name ?? null}
                                />
                              </div>
                              <div className="max-w-[75%] rounded-soft-lg px-4 py-2.5 bg-neutral-100 text-foreground border border-border">
                                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                              </div>
                            </div>
                            {hasCards && (
                              <div className="flex gap-2 justify-start">
                                <div className="shrink-0 pt-1 w-8" aria-hidden />
                                <div className="max-w-[75%] rounded-soft-lg px-4 py-2.5 bg-neutral-50 border border-border">
                                  <FlowContextCards
                                    flowContext={parsedFlow!}
                                    flowType={msg.flowType}
                                    onOpenProductQuickView={setQuickViewProductId}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      }
                      return (
                        <div
                          key={msg.id}
                          className="flex gap-2 justify-end"
                        >
                          <div className="max-w-[75%] rounded-soft-lg px-4 py-2.5 bg-primary text-neutral-100">
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                            {msg.imageUrls && msg.imageUrls.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {msg.imageUrls.map((url) => (
                                  <img
                                    key={url}
                                    src={getImageDisplayUrl(url, accessToken)}
                                    alt="Attachment"
                                    className="h-20 w-20 object-cover rounded-soft-md"
                                  />
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="p-4">
                  <div className="flex gap-2 justify-start">
                    <div className="shrink-0 pt-1">
                      <ConciergeAvatarCircle
                        size={32}
                        imageUrl={selectedAvatar?.imageUrl}
                        tintSeed={selectedAvatar?.id}
                        initial={selectedAvatar?.name ?? null}
                      />
                    </div>
                    <div className="max-w-[75%] rounded-soft-lg px-4 py-2.5 bg-neutral-100 text-foreground border border-border">
                      <p className="text-sm whitespace-pre-wrap">
                        {selectedAvatar?.defaultGreeting?.trim() || "What shall we do? Find something, build a look, look at trends — I'm up for anything fashion and style."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {inputBar}
          </div>
        </div>
      </div>

      <ProductQuickViewModal
        productId={quickViewProductId}
        onClose={() => setQuickViewProductId(null)}
      />
    </div>
  );
}
