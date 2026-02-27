"use client";

import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import type { Look, LookDataParsed } from "@/lib/api/looks";

function parseLookData(look: Look): LookDataParsed {
  try {
    const data = typeof look.lookData === "string" ? JSON.parse(look.lookData) : look.lookData;
    return data || {};
  } catch {
    return {};
  }
}

export interface LookDetailModalProps {
  open: boolean;
  onClose: () => void;
  look: Look | null;
  storageToken: string | null;
}

export function LookDetailModal({ open, onClose, look, storageToken }: LookDetailModalProps) {
  if (!open || !look) return null;

  const parsed = parseLookData(look);
  const displayImageUrl = getImageDisplayUrl(look.imageUrl, storageToken);
  const isAnalyzing = parsed.status === "analyzing";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="look-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card border border-border rounded-soft-xl shadow-soft max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="look-detail-title" className="font-display text-lg text-foreground">
            Look details
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-foreground"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {displayImageUrl && (
            <div className="aspect-[3/4] bg-neutral-100 rounded-lg overflow-hidden">
              <img src={displayImageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          {isAnalyzing ? (
            <p className="text-neutral-500 text-sm">Analyzing your look…</p>
          ) : (
            <div className="space-y-4">
              {parsed.classificationTags && parsed.classificationTags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {parsed.classificationTags.map((t) => (
                    <span key={t} className="px-2 py-1 rounded-full bg-violet-100 text-violet-800 text-xs">
                      {t}
                    </span>
                  ))}
                </div>
              )}
              {parsed.itemsSummary && Array.isArray(parsed.itemsSummary) && parsed.itemsSummary.length > 0 && (
                <div>
                  <h3 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-1">Items</h3>
                  <ul className="text-sm text-foreground space-y-1">
                    {parsed.itemsSummary.map((item: unknown, i: number) => {
                      const desc = typeof item === "object" && item && "description" in item
                        ? String((item as { description?: string }).description ?? "")
                        : String(item);
                      return <li key={i}>{desc || `Item ${i + 1}`}</li>;
                    })}
                  </ul>
                </div>
              )}
              {(() => {
                const summary =
                  parsed.shortSummary?.trim() ||
                  (parsed.comment && parsed.suggestions?.[0]
                    ? `${parsed.comment} ${parsed.suggestions[0]}`.split(/\s+/).slice(0, 30).join(" ")
                    : parsed.comment || parsed.suggestions?.[0] || "");
                return summary ? <p className="text-sm text-foreground">{summary}</p> : null;
              })()}
              {look.updatedAt && (
                <p className="text-xs text-neutral-500" suppressHydrationWarning>
                  {new Date(look.updatedAt).toLocaleDateString("en-US", { dateStyle: "long" })}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
