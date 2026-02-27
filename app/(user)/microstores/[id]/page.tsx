"use client";

import { useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import useSWR from "swr";
import { getMicrostore, followMicrostore, unfollowMicrostore, resolveMicrostoreCoverUrl } from "@/lib/api/microstores";
import { StyleNoteCard } from "@/components/StyleNoteCard";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import type { ProductSummary } from "@/lib/api/products";

type MicrostoreProductRow = { productId: string; order: number; product: ProductSummary & { variants?: { price: string }[] } };

export default function MicrostoreDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, error, isLoading, mutate } = useSWR(id ? ["microstore", id] : null, () => getMicrostore(id));
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [coverError, setCoverError] = useState(false);
  const wishlist = useWishlist();
  const cart = useCart();
  const styleNotesCarouselRef = useRef<HTMLDivElement>(null);
  const scrollStyleNotes = useCallback((direction: 1 | -1) => {
    const el = styleNotesCarouselRef.current;
    if (!el) return;
    const firstCard = el.querySelector("[data-style-note-card]");
    const cardWidth = firstCard ? (firstCard as HTMLElement).offsetWidth + 12 : 272; // gap-3 = 12
    el.scrollBy({ left: direction * cardWidth, behavior: "smooth" });
  }, []);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (followed) await unfollowMicrostore(id);
      else await followMicrostore(id);
      setFollowed(!followed);
      await mutate();
    } finally {
      setFollowLoading(false);
    }
  };

  if (!id) return <p className="text-neutral-500">Invalid store.</p>;
  if (error) return <p className="text-red-600">Store not found.</p>;
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>;

  const products: (ProductSummary & { price?: string | null })[] = ((data as { products?: MicrostoreProductRow[] }).products ?? []).map((row) => {
    const p = row.product;
    return {
      ...p,
      status: (p as ProductSummary).status ?? "active",
      price: p.variants?.[0] ? `₹${p.variants[0].price}` : null,
    };
  });
  const sections = data.sections ?? [];

  type StyleNoteItem = { title: string; description?: string; url?: string; imageUrl?: string; backgroundColor?: string; fontStyle?: string };
  let styleNotesRaw = (data as { styleNotes?: unknown }).styleNotes;
  if (typeof styleNotesRaw === "string") {
    try {
      styleNotesRaw = JSON.parse(styleNotesRaw as string) as unknown;
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
      backgroundColor: str(item.backgroundColor),
      fontStyle: str(item.fontStyle),
    });
    if (!styleNotesRaw || typeof styleNotesRaw !== "object") return [];
    if (Array.isArray(styleNotesRaw)) {
      return styleNotesRaw
        .filter((n) => (n as Record<string, unknown>).title !== "__STYLE_NOTE_STYLE__")
        .map((n) => one(n as Record<string, unknown>));
    }
    const obj = styleNotesRaw as Record<string, unknown>;
    const links = obj.links;
    if (Array.isArray(links) && links.length > 0) {
      return links
        .filter((l) => (l as Record<string, unknown>).title !== "__STYLE_NOTE_STYLE__")
        .map((l) => one(l as Record<string, unknown>));
    }
    const text = str(obj.text);
    if (text) return [{ title: "Style note", description: text }];
    return [];
  })();

  return (
    <div className="space-y-6">
      <div className="rounded-soft-xl border border-border bg-card overflow-hidden">
        {(() => {
          const coverSrc = resolveMicrostoreCoverUrl(data.coverImageUrl);
          const showPlaceholder = !coverSrc || coverError;
          if (showPlaceholder) return <div className="aspect-[21/9] bg-neutral-200 flex items-center justify-center text-neutral-500 text-sm">No cover</div>;
          return (
            <div className="aspect-[21/9] bg-neutral-100">
              <img src={coverSrc} alt="" className="w-full h-full object-cover" onError={() => setCoverError(true)} />
            </div>
          );
        })()}
        <div className="p-4 md:p-6 space-y-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl lg:text-3xl text-foreground">{data.name}</h1>
              {data.brand?.name && (
                <p className="text-sm text-neutral-600 mt-1">{data.brand.name}</p>
              )}
            </div>
            <button
              type="button"
              onClick={handleFollow}
              disabled={followLoading}
              className="rounded-soft-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {followLoading ? "…" : followed ? "Unfollow" : "Follow"}
            </button>
          </div>
          {data.description && <p className="text-neutral-600">{data.description}</p>}
          {(data as { followerCount?: number }).followerCount != null && (
            <p className="text-xs text-neutral-500">
              {(data as { followerCount: number }).followerCount} followers
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
              className="shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Previous style note"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            </button>
            <div
              ref={styleNotesCarouselRef}
              className="flex gap-3 overflow-x-auto pb-2 -mx-1 scroll-smooth snap-x snap-mandatory flex-1 min-w-0"
            >
              {styleNoteItems.map((item, i) => (
                <StyleNoteCard
                  key={i}
                  item={item}
                  className="snap-start"
                  wide
                  resolveImageUrl={(url) => resolveMicrostoreCoverUrl(url) || url}
                />
              ))}
            </div>
            <button
              type="button"
              onClick={() => scrollStyleNotes(1)}
              className="shrink-0 w-10 h-10 rounded-full border border-border bg-card flex items-center justify-center hover:bg-muted disabled:opacity-40 disabled:pointer-events-none"
              aria-label="Next style note"
            >
              <svg className="w-5 h-5 text-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
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
                      isInWishlist={wishlist.isInWishlist(p.id)}
                      onWishlistClick={(e) => {
                        e.stopPropagation();
                        wishlist.toggleWishlist(p.id);
                      }}
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
              isInWishlist={wishlist.isInWishlist(p.id)}
              onWishlistClick={(e) => {
                e.stopPropagation();
                wishlist.toggleWishlist(p.id);
              }}
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
        onAddToCart={(productId, variantId) => cart.addToCart(productId, variantId ?? null)}
      />
    </div>
  );
}
