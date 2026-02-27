"use client";

import { useState, useEffect, useCallback } from "react";
import {
  extractFromLook,
  acceptWardrobeSuggestions,
  createWardrobeItem,
  type WardrobeExtractSlot,
  type WardrobeSuggestedProduct,
} from "@/lib/api/wardrobe";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";

export interface WardrobeFromLookModalProps {
  open: boolean;
  onClose: () => void;
  lookId: string | null;
  imageUrl?: string | null;
  onSuccess?: () => void;
}

function SlotRow({
  slot,
  slotIndex,
  selectedIds,
  onToggle,
  onAddMyItem,
  addingMyItem,
  storageToken,
}: {
  slot: WardrobeExtractSlot;
  slotIndex: number;
  selectedIds: Set<string>;
  onToggle: (productId: string) => void;
  onAddMyItem: ((slot: WardrobeExtractSlot) => void) | null;
  addingMyItem: boolean;
  storageToken: string | null;
}) {
  const item = slot.item;
  const label = [item.description, item.category_lvl1, item.color_primary].filter(Boolean).join(" · ") || "Item";
  const hasCrop = Boolean(slot.cropImageUrl);
  const cropDisplayUrl = getImageDisplayUrl(slot.cropImageUrl ?? null, storageToken);

  return (
    <div className="border border-border rounded-lg p-3 space-y-2">
      <p className="text-sm font-medium text-foreground">{label}</p>
      {hasCrop && (
        <div className="flex items-center gap-3 flex-wrap">
          {cropDisplayUrl ? (
            <img
              src={cropDisplayUrl}
              alt=""
              className="w-16 h-16 object-cover rounded border border-border"
            />
          ) : (
            <div className="w-16 h-16 rounded border border-border bg-neutral-100 flex items-center justify-center text-xs text-neutral-500">
              Loading…
            </div>
          )}
          {onAddMyItem && (
            <button
              type="button"
              onClick={() => onAddMyItem(slot)}
              disabled={addingMyItem}
              className="px-3 py-1.5 rounded-full border border-border bg-card text-foreground text-xs font-medium hover:bg-neutral-50 disabled:opacity-50"
            >
              {addingMyItem ? "Adding…" : "Add my item"}
            </button>
          )}
        </div>
      )}
      <div className="flex flex-wrap gap-2">
        {slot.suggestedProducts.map((p) => {
          const productImgUrl = getImageDisplayUrl(p.imageUrl ?? null, storageToken) || p.imageUrl;
          return (
            <label
              key={p.productId}
              className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-neutral-50 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <input
                type="checkbox"
                checked={selectedIds.has(p.productId)}
                onChange={() => onToggle(p.productId)}
                className="rounded border-border"
              />
              {productImgUrl && (
                <img src={productImgUrl} alt="" className="w-10 h-10 object-cover rounded" />
              )}
              <span className="text-xs text-foreground line-clamp-2 max-w-[140px]">{p.title}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

export function WardrobeFromLookModal({
  open,
  onClose,
  lookId,
  imageUrl,
  onSuccess,
}: WardrobeFromLookModalProps) {
  const storageToken = useStorageAccessToken();
  const [loading, setLoading] = useState(false);
  const [extractError, setExtractError] = useState<string | null>(null);
  const [slots, setSlots] = useState<WardrobeExtractSlot[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [addingMyItemSlotIdx, setAddingMyItemSlotIdx] = useState<number | null>(null);

  const fetchExtraction = useCallback(async () => {
    if (!open || (!lookId && !imageUrl)) return;
    setLoading(true);
    setExtractError(null);
    setSlots([]);
    setSelectedIds(new Set());
    try {
      const res = await extractFromLook(lookId ? { lookId } : imageUrl ? { imageUrl } : {});
      if (res.error && res.slots.length === 0) {
        setExtractError(res.error);
      } else {
        setSlots(res.slots ?? []);
      }
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Failed to extract items");
    } finally {
      setLoading(false);
    }
  }, [open, lookId, imageUrl]);

  useEffect(() => {
    if (open && (lookId || imageUrl)) fetchExtraction();
  }, [open, lookId, imageUrl, fetchExtraction]);

  const toggleProduct = useCallback((productId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) next.delete(productId);
      else next.add(productId);
      return next;
    });
  }, []);

  const handleAddToWardrobe = useCallback(async () => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    setSubmitting(true);
    try {
      await acceptWardrobeSuggestions(ids);
      setSuccess(true);
      onSuccess?.();
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (e) {
      setExtractError(e instanceof Error ? e.message : "Failed to add to wardrobe");
    } finally {
      setSubmitting(false);
    }
  }, [selectedIds, onSuccess, onClose]);

  const handleAddMyItem = useCallback(
    async (slot: WardrobeExtractSlot) => {
      if (!slot.cropImageUrl) return;
      const idx = slots.findIndex((s) => s === slot);
      setAddingMyItemSlotIdx(idx >= 0 ? idx : null);
      try {
        await createWardrobeItem({
          imageUrl: slot.cropImageUrl,
          category: slot.item.category_lvl1 ?? undefined,
          color: slot.item.color_primary ?? undefined,
          tags: slot.item.description ?? undefined,
        });
        onSuccess?.();
      } catch (e) {
        setExtractError(e instanceof Error ? e.message : "Failed to add item");
      } finally {
        setAddingMyItemSlotIdx(null);
      }
    },
    [slots, onSuccess]
  );

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wardrobe-from-look-title"
    >
      <div
        className="bg-card border border-border rounded-soft-xl shadow-soft max-w-lg w-full max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 id="wardrobe-from-look-title" className="font-display text-lg text-foreground">
            Add detected items to wardrobe?
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
            aria-label="Close"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-4 overflow-y-auto flex-1 min-h-0">
          {loading && (
            <p className="text-neutral-500 text-sm">Detecting items from your look…</p>
          )}
          {extractError && !loading && (
            <p className="text-red-600 text-sm" role="alert">{extractError}</p>
          )}
          {!loading && slots.length === 0 && !extractError && (lookId || imageUrl) && (
            <p className="text-neutral-500 text-sm">No items detected. Try another photo.</p>
          )}
          {!loading && slots.length > 0 && (
            <div className="space-y-3">
              {slots.map((slot, idx) => (
                <SlotRow
                  key={idx}
                  slot={slot}
                  slotIndex={idx}
                  selectedIds={selectedIds}
                  onToggle={toggleProduct}
                  onAddMyItem={slot.cropImageUrl ? handleAddMyItem : null}
                  addingMyItem={addingMyItemSlotIdx === idx}
                  storageToken={storageToken}
                />
              ))}
            </div>
          )}
        </div>
        {!loading && slots.length > 0 && (
          <div className="p-4 border-t border-border flex items-center justify-between gap-3">
            <span className="text-sm text-neutral-500">
              {selectedIds.size} selected
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-full border border-border bg-card text-foreground text-sm font-medium hover:bg-neutral-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAddToWardrobe}
                disabled={selectedIds.size === 0 || submitting}
                className="px-4 py-2 rounded-full bg-primary text-primary-foreground text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? "Adding…" : success ? "Added" : "Add to wardrobe"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
