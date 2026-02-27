"use client";

import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import type { WardrobeItem } from "@/lib/api/wardrobe";

export interface WardrobeItemDetailModalProps {
  open: boolean;
  onClose: () => void;
  item: WardrobeItem | null;
  storageToken: string | null;
  onRemove?: (id: string) => void;
}

function formatDate(iso: string | null | undefined): string {
  if (!iso) return "";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return "";
  }
}

export function WardrobeItemDetailModal({
  open,
  onClose,
  item,
  storageToken,
  onRemove,
}: WardrobeItemDetailModalProps) {
  if (!open || !item) return null;

  const displayImageUrl = getImageDisplayUrl(item.imageUrl, storageToken);
  const details = [
    { label: "Category", value: item.category },
    { label: "Color", value: item.color },
    { label: "Brand", value: item.brand },
    { label: "Size", value: item.size },
    { label: "Description", value: item.tags },
  ].filter((d) => d.value != null && String(d.value).trim());

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wardrobe-item-detail-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        className="bg-card border border-border rounded-soft-xl shadow-soft max-w-md w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h2 id="wardrobe-item-detail-title" className="font-display text-lg text-foreground">
            Item details
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
          {displayImageUrl ? (
            <div className="aspect-square bg-neutral-100 rounded-lg overflow-hidden">
              <img src={displayImageUrl} alt="" className="w-full h-full object-cover" onError={(e) => e.currentTarget.classList.add("hidden")} />
            </div>
          ) : (
            <div className="aspect-square bg-neutral-100 rounded-lg flex items-center justify-center text-neutral-400 text-sm">No image</div>
          )}
          <div className="space-y-3">
            {details.map(({ label, value }) => (
              <div key={label}>
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">{label}</span>
                <p className="text-sm text-foreground mt-0.5">{String(value).trim()}</p>
              </div>
            ))}
            {item.updatedAt && (
              <div>
                <span className="text-xs font-medium text-neutral-500 uppercase tracking-wide">Added</span>
                <p className="text-sm text-foreground mt-0.5">{formatDate(item.updatedAt)}</p>
              </div>
            )}
          </div>
        </div>
        <div className="p-4 border-t border-border flex justify-end gap-2">
          {onRemove && (
            <button
              type="button"
              onClick={() => {
                onRemove(item.id);
                onClose();
              }}
              className="px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              Remove from wardrobe
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-foreground bg-neutral-100 hover:bg-neutral-200 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
