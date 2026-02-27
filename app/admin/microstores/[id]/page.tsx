"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { fetchMicrostore } from "@/lib/api/admin";
import { resolveMicrostoreCoverUrl } from "@/lib/api/microstores";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import type { ProductSummary } from "@/lib/api/products";

type MicrostoreProductRow = { productId: string; order: number; product: ProductSummary & { variants?: { price: string }[] } };

export default function AdminMicrostorePreviewPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, error, isLoading } = useSWR(id ? ["admin-microstore", id] : null, () => fetchMicrostore(id));
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const styleNotesCarouselRef = useRef<HTMLDivElement>(null);
  const STYLE_NOTE_CARD_WIDTH_PX = 272;
  const scrollStyleNotes = useCallback((direction: 1 | -1) => {
    const el = styleNotesCarouselRef.current;
    if (!el) return;
    el.scrollBy({ left: direction * STYLE_NOTE_CARD_WIDTH_PX, behavior: "smooth" });
  }, []);

  if (!id) return <p className="text-neutral-500">Invalid store.</p>;
  if (error) return <p className="text-red-600">Store not found.</p>;
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>;

  const store = data as typeof data & {
    products?: MicrostoreProductRow[];
    sections?: { label: string; productIds: string[] }[];
    styleNotes?: unknown;
  };
  const products: (ProductSummary & { price?: string | null })[] = (store.products ?? []).map((row) => {
    const p = row.product;
    return {
      ...p,
      status: (p as ProductSummary).status ?? "active",
      price: p.variants?.[0] ? `₹${p.variants[0].price}` : null,
    };
  });
  const sections = store.sections ?? [];

  type StyleNoteItem = { title: string; description?: string; url?: string; imageUrl?: string };
  type StyleNotesRaw = string | null | undefined | Record<string, unknown> | unknown[];
  let styleNotesRaw: StyleNotesRaw = store.styleNotes;
  if (typeof styleNotesRaw === "string") {
    try {
      styleNotesRaw = JSON.parse(styleNotesRaw) as Record<string, unknown> | unknown[];
    } catch {
      styleNotesRaw = (styleNotesRaw as string).trim() ? { text: (styleNotesRaw as string).trim() } : null;
    }
  }
  const styleNoteItems: StyleNoteItem[] = (() => {
    const pickImageUrl = (o: Record<string, unknown>): string | undefined => {
      const u = o.imageUrl ?? o.referenceImageUrl ?? o.image;
      return typeof u === "string" && u.trim() ? u.trim() : undefined;
    };
    const str = (v: unknown): string | undefined => (typeof v === "string" && v.trim() ? v.trim() : undefined);
    const one = (item: Record<string, unknown>) => ({
      title: str(item.title) ?? str(item.text) ?? "Style tip",
      description: str(item.description) ?? (str(item.text) && !str(item.title) ? str(item.text) : undefined),
      url: str(item.url),
      imageUrl: pickImageUrl(item),
    });
    const isStyleMetadata = (item: StyleNoteItem) =>
      item.title === "__STYLE_NOTE_STYLE__" || item.url === "data:style-note-style";
    const sanitize = (item: StyleNoteItem): StyleNoteItem => {
      const desc = item.description?.trim();
      if (desc && desc.startsWith("{") && desc.includes("backgroundColor") && desc.includes("fontStyle")) {
        return { ...item, description: undefined };
      }
      return item;
    };
    let items: StyleNoteItem[] = [];
    if (!styleNotesRaw || typeof styleNotesRaw !== "object") return [];
    if (Array.isArray(styleNotesRaw)) {
      items = styleNotesRaw.map((n) => one(n as Record<string, unknown>));
    } else {
      const obj = styleNotesRaw as Record<string, unknown>;
      const links = obj.links;
      if (Array.isArray(links) && links.length > 0) {
        items = links.map((l) => one(l as Record<string, unknown>));
      } else {
        const text = str(obj.text);
        if (text) items = [{ title: "Style note", description: text }];
      }
    }
    return items.filter((i) => !isStyleMetadata(i)).map(sanitize);
  })();

  const status = (store as { status?: string }).status ?? "draft";

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-soft-lg border border-border bg-muted/30 px-4 py-3">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/microstores"
            className="text-sm font-medium text-primary hover:underline"
          >
            ← Back to list
          </Link>
          <span className="text-neutral-500">·</span>
          <span className="text-sm text-neutral-600">
            Preview {status === "draft" ? "(Draft)" : status === "published" ? "(Published)" : `(${status})`}
          </span>
        </div>
        <Link
          href={`/microstores/${encodeURIComponent(id)}/edit`}
          className="rounded-soft-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          Edit store (full wizard)
        </Link>
      </div>

      <div className="rounded-soft-xl border border-border bg-card overflow-hidden">
        {(() => {
          const coverSrc = resolveMicrostoreCoverUrl(store.coverImageUrl);
          return coverSrc ? (
            <div className="aspect-[21/9] bg-neutral-100">
              <img src={coverSrc} alt="" className="w-full h-full object-cover" />
            </div>
          ) : null;
        })()}
        <div className="p-4 md:p-6 space-y-3">
          <div>
            <h1 className="font-display text-2xl lg:text-3xl text-foreground">{store.name}</h1>
            {(store as { brand?: { name?: string } }).brand?.name && (
              <p className="text-sm text-neutral-600 mt-1">{(store as { brand?: { name?: string } }).brand!.name}</p>
            )}
          </div>
          {store.description && <p className="text-neutral-600">{store.description}</p>}
          {(store as { followerCount?: number }).followerCount != null && (
            <p className="text-xs text-neutral-500">
              {(store as { followerCount: number }).followerCount} followers
            </p>
          )}
        </div>
      </div>

      {styleNoteItems.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-medium text-foreground">Style notes</h2>
          <div className="relative flex items-center gap-2">
            <button
              type="button"
              onClick={() => scrollStyleNotes(-1)}
              className="shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted"
              aria-label="Previous style note"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div
              ref={styleNotesCarouselRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-1 scroll-smooth snap-x snap-mandatory flex-1 min-w-0"
            >
              {styleNoteItems.map((item, i) => (
                <div
                  key={i}
                  className="shrink-0 w-64 snap-start rounded-soft-lg border border-border bg-muted/50 overflow-hidden flex flex-col"
                >
                  {item.imageUrl ? (
                    <div className="aspect-[3/4] bg-neutral-200 relative">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="aspect-[3/4] bg-muted/80 flex items-center justify-center" aria-hidden>
                      <span className="text-neutral-400 text-4xl">◆</span>
                    </div>
                  )}
                  <div className="p-3 flex flex-col min-h-0 flex-1">
                    {item.url ? (
                      <a href={item.url} target="_blank" rel="noopener noreferrer" className="block font-medium text-primary hover:underline line-clamp-2">
                        {item.title}
                      </a>
                    ) : (
                      <span className="block font-medium text-foreground line-clamp-2">{item.title}</span>
                    )}
                    {item.description && item.description !== item.title && (
                      <p className="mt-1 text-sm text-neutral-600 line-clamp-3 flex-1 min-h-0">{item.description}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollStyleNotes(1)}
              className="shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted"
              aria-label="Next style note"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
            </button>
          </div>
        </section>
      )}

      {sections.length > 0 ? (
        <div className="space-y-6">
          {sections.map((sec: { label: string; productIds: string[] }, i: number) => {
            const secProducts = sec.productIds
              .map((pid) => products.find((p) => p.id === pid))
              .filter(Boolean) as (ProductSummary & { price?: string | null })[];
            if (secProducts.length === 0) return null;
            return (
              <section key={i}>
                <h2 className="font-medium text-foreground mb-3">{sec.label}</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                  {secProducts.map((p) => (
                    <ProductTile
                      key={p.id}
                      product={p}
                      price={p.price ?? null}
                      isInWishlist={false}
                      onWishlistClick={() => {}}
                      onClick={() => setSelectedProductId(p.id)}
                    />
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      ) : products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p) => (
            <ProductTile
              key={p.id}
              product={p}
              price={p.price ?? null}
              isInWishlist={false}
              onWishlistClick={() => {}}
              onClick={() => setSelectedProductId(p.id)}
            />
          ))}
        </div>
      ) : (
        <p className="text-neutral-500">No products in this store.</p>
      )}

      <ProductQuickViewModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={() => {}}
      />
    </div>
  );
}
