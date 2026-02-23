"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  createConversation,
  sendMessage,
  type SendMessageResponse,
  type FlowContext,
  type LookCard,
  type ProductCard,
  type TipCard,
  type MakeupHairCard,
} from "@/lib/api/conversations";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

function parseImageUrls(value: string): string[] {
  return value
    .split(/[\n,]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default function AdminStylingTestPage() {
  const accessToken = useStorageAccessToken();
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [imageUrlsInput, setImageUrlsInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [response, setResponse] = useState<SendMessageResponse | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    document.title = "Styling Agent Test | Hanger Admin";
    return () => {
      document.title = "Hanger Admin";
    };
  }, []);

  const handleCreateConversation = async () => {
    setError(null);
    setResponse(null);
    try {
      const conv = await createConversation({ title: "Styling Agent Test" });
      setConversationId(conv.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create conversation");
    }
  };

  const handleSend = async () => {
    const text = message.trim();
    if (!text) {
      setError("Enter a message");
      return;
    }
    if (!conversationId) {
      setError("Start a test conversation first");
      return;
    }
    setError(null);
    setSending(true);
    setResponse(null);
    try {
      const imageUrls = parseImageUrls(imageUrlsInput);
      const result = await sendMessage(conversationId, {
        message: text,
        ...(imageUrls.length > 0 ? { imageUrls } : {}),
      });
      setResponse(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setSending(false);
    }
  };

  const flowContext = response?.flowContext as FlowContext | undefined | null;
  const hasCards = flowContext && (
    (flowContext.looks?.length ?? 0) > 0 ||
    (flowContext.products?.length ?? 0) > 0 ||
    (flowContext.tips?.length ?? 0) > 0 ||
    (flowContext.makeupHair?.length ?? 0) > 0
  );

  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Styling Agent Test</h1>
        <p className="mt-2 text-neutral-600">
          Test the Conversation API and Styling Agent: send a message (and optional image URLs), then view reply and cards (looks, products, tips, makeup/hair).
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          {!conversationId ? (
            <div>
              <button
                type="button"
                onClick={handleCreateConversation}
                className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90"
              >
                Start test conversation
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-500">Conversation ID: {conversationId}</p>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="e.g. Suggest a casual weekend look"
                  rows={3}
                  className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Image URLs (optional, one per line or comma-separated)</label>
                <textarea
                  value={imageUrlsInput}
                  onChange={(e) => setImageUrlsInput(e.target.value)}
                  placeholder="https://... or leave empty"
                  rows={2}
                  className="mt-1 block w-full rounded border border-border px-3 py-2 text-sm font-mono"
                />
              </div>
              <button
                type="button"
                onClick={handleSend}
                disabled={sending || !message.trim()}
                className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? "Sending…" : "Send"}
              </button>
            </>
          )}
        </div>

        {response && (
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">Response</h2>
            <p className="mt-2 text-sm text-neutral-600">
              <span className="font-medium">flowType:</span> {response.flowType ?? "—"}
            </p>
            <div className="mt-3">
              <span className="font-medium text-neutral-700">Reply:</span>
              <p className="mt-1 text-neutral-800 whitespace-pre-wrap">{response.reply}</p>
            </div>

            {hasCards && flowContext && (
              <div className="mt-6 space-y-6">
                {flowContext.looks && flowContext.looks.length > 0 && (
                  <div>
                    <h3 className="font-medium text-neutral-800">Looks</h3>
                    <div className="mt-2 space-y-4">
                      {(flowContext.looks as LookCard[]).map((look, i) => (
                        <div key={i} className="rounded border border-border bg-card p-4">
                          <span className="text-xs text-neutral-500">
                            {look.lookImageStyle === "on_model" ? "Styled on model" : look.lookImageStyle === "flat_lay" ? "Flat lay" : look.lookImageStyle ?? "—"}
                          </span>
                          {look.vibe && <p className="text-sm text-neutral-600">Vibe: {look.vibe}</p>}
                          {look.occasion && <p className="text-sm text-neutral-600">Occasion: {look.occasion}</p>}
                          {look.imageUrl && (
                            <img src={getImageDisplayUrl(look.imageUrl, accessToken)!} alt="Look" className="mt-2 max-h-64 object-contain rounded" />
                          )}
                          {look.products && look.products.length > 0 && (
                            <p className="mt-2 text-sm text-neutral-500">
                              Products: {look.products.map((p) => p.title || p.id).join(", ")}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {flowContext.products && flowContext.products.length > 0 && (
                  <div>
                    <h3 className="font-medium text-neutral-800">Products</h3>
                    <ul className="mt-2 space-y-2">
                      {(flowContext.products as ProductCard[]).map((p) => (
                        <li key={p.id} className="flex items-center gap-3 rounded border border-border bg-card p-2">
                          {p.imageUrl && (
                            <img src={getImageDisplayUrl(p.imageUrl, accessToken)} alt="" className="h-12 w-12 object-cover rounded" />
                          )}
                          <span className="text-sm">{p.title ?? p.id}</span>
                          {p.brandName && <span className="text-xs text-neutral-500">{p.brandName}</span>}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {flowContext.tips && flowContext.tips.length > 0 && (
                  <div>
                    <h3 className="font-medium text-neutral-800">Tips</h3>
                    <ul className="mt-2 space-y-2">
                      {(flowContext.tips as TipCard[]).map((t, i) => (
                        <li key={i} className="rounded border border-border bg-card p-2 text-sm">
                          {t.title && <span className="font-medium">{t.title}</span>}
                          {(t.description ?? t.body) && ` — ${t.description ?? t.body}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {flowContext.makeupHair && flowContext.makeupHair.length > 0 && (
                  <div>
                    <h3 className="font-medium text-neutral-800">Makeup / Hair</h3>
                    <ul className="mt-2 space-y-2">
                      {(flowContext.makeupHair as MakeupHairCard[]).map((m, i) => (
                        <li key={i} className="rounded border border-border bg-card p-2 text-sm">
                          <span className="text-neutral-500">{m.type}:</span> {m.title ?? m.text ?? "—"}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="text-sm text-neutral-600 hover:text-foreground"
              >
                {showRawJson ? "Hide" : "Show"} raw JSON
              </button>
              {showRawJson && (
                <pre className="mt-2 p-3 rounded bg-neutral-100 text-xs overflow-auto max-h-96">
                  {JSON.stringify(response, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
    </>
  );
}
