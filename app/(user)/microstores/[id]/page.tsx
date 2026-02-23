"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { getMicrostore, followMicrostore, unfollowMicrostore } from "@/lib/api/microstores";
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
  const wishlist = useWishlist();
  const cart = useCart();

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

  return (
    <div className="space-y-6">
      <div className="rounded-soft-xl border border-border bg-card overflow-hidden">
        {data.coverImageUrl && (
          <div className="aspect-[21/9] bg-neutral-100">
            <img src={data.coverImageUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
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
          {data.styleNotes && typeof data.styleNotes === "object" && (
            <div className="text-sm text-neutral-600">
              <span className="font-medium">Style notes: </span>
              {JSON.stringify(data.styleNotes)}
            </div>
          )}
          {(data as { followerCount?: number }).followerCount != null && (
            <p className="text-xs text-neutral-500">
              {(data as { followerCount: number }).followerCount} followers
            </p>
          )}
        </div>
      </div>

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
