"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  listWardrobe,
  extractFromLook,
  acceptSuggestions,
  deleteWardrobeItem,
  type ExtractSlot,
} from "@/lib/api/wardrobe";
import { listLooks } from "@/lib/api/looks";
import { getStoreForMe, refreshStoreForMe } from "@/lib/api/microstores";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import type { ProductSummary } from "@/lib/api/products";

const TAB_WARDROBE = "wardrobe";
const TAB_WISHLIST = "wishlist";
const TAB_STORE_FOR_YOU = "store-for-you";
const TAB_CART = "cart";
type TabId = typeof TAB_WARDROBE | typeof TAB_WISHLIST | typeof TAB_STORE_FOR_YOU | typeof TAB_CART;

function WardrobeSection() {
  const { data, mutate } = useSWR("wardrobe", () => listWardrobe({ limit: 100 }));
  const [addFromLook, setAddFromLook] = useState(false);
  const [selectedLookId, setSelectedLookId] = useState<string>("");
  const [extractResult, setExtractResult] = useState<{ slots: ExtractSlot[]; look: { id: string; imageUrl?: string } | null } | null>(null);
  const [accepting, setAccepting] = useState(false);

  const items = data?.items ?? [];
  const { data: looksData } = useSWR(addFromLook ? "looks-for-wardrobe" : null, () => listLooks({ limit: 50 }));

  const handleExtract = async () => {
    if (!selectedLookId) return;
    try {
      const res = await extractFromLook({ lookId: selectedLookId });
      setExtractResult({ slots: res.slots, look: res.look });
    } catch (e) {
      console.error(e);
    }
  };

  const handleAccept = async (productIds: string[]) => {
    if (productIds.length === 0) return;
    setAccepting(true);
    try {
      await acceptSuggestions({ productIds });
      await mutate();
      setExtractResult(null);
      setAddFromLook(false);
    } catch (e) {
      console.error(e);
    } finally {
      setAccepting(false);
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await deleteWardrobeItem(id);
      await mutate();
    } catch (e) {
      console.error(e);
    }
  };

  const allSuggestedIds = extractResult?.slots?.flatMap((s) => s.suggestedProductIds ?? []) ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <button
          type="button"
          onClick={() => setAddFromLook(!addFromLook)}
          className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
        >
          {addFromLook ? "Cancel" : "Add from look"}
        </button>
      </div>

      {addFromLook && (
        <div className="rounded-soft-xl border border-border bg-card p-4 space-y-4">
          <h3 className="font-medium text-foreground">Extract items from a look</h3>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={selectedLookId}
              onChange={(e) => setSelectedLookId(e.target.value)}
              className="rounded-soft-lg border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a look</option>
              {(looksData?.items ?? []).map((l) => (
                <option key={l.id} value={l.id}>
                  {l.occasion ?? l.vibe ?? l.id.slice(0, 8)}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={handleExtract}
              disabled={!selectedLookId}
              className="rounded-soft-lg border border-border bg-card px-3 py-2 text-sm font-medium disabled:opacity-50"
            >
              Extract
            </button>
          </div>
          {extractResult && extractResult.slots.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm text-neutral-600">
                Found {extractResult.slots.length} item(s). Suggested products per slot (first ID per slot):
              </p>
              <ul className="text-sm list-disc pl-5">
                {extractResult.slots.map((slot, i) => (
                  <li key={i}>
                    {slot.description ?? slot.type ?? "Item"} —{" "}
                    {(slot.suggestedProductIds ?? []).slice(0, 3).join(", ")}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => handleAccept(allSuggestedIds.slice(0, 10))}
                disabled={accepting || allSuggestedIds.length === 0}
                className="rounded-soft-lg bg-primary text-primary-foreground px-3 py-2 text-sm font-medium disabled:opacity-50"
              >
                {accepting ? "Adding…" : "Add first suggestions to wardrobe"}
              </button>
            </div>
          )}
        </div>
      )}

      <h3 className="font-medium text-foreground">Your wardrobe ({items.length})</h3>
      {items.length === 0 ? (
        <p className="text-neutral-500">No items yet. Add from a look above or upload in a future flow.</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((item) => (
            <div key={item.id} className="rounded-soft-xl border border-border bg-card overflow-hidden">
              <div className="aspect-square bg-neutral-100">
                <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
              </div>
              <div className="p-2 flex justify-between items-center">
                <span className="text-xs text-neutral-600 truncate">{item.category ?? "Item"}</span>
                <button
                  type="button"
                  onClick={() => handleRemove(item.id)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function WishlistSection() {
  const wishlist = useWishlist();
  const cart = useCart();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const items = wishlist.items;

  if (!wishlist.ready) return <p className="text-neutral-500">Loading wishlist…</p>;
  if (items.length === 0) {
    return (
      <p className="text-neutral-500">
        Your wishlist is empty.{" "}
        <Link href="/browse" className="text-primary hover:underline">
          Browse products
        </Link>{" "}
        to add items.
      </p>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((w) => {
          const p = w.product;
          if (!p) return null;
          const product: ProductSummary = {
            id: p.id,
            title: p.title,
            status: "active",
            brandId: p.brandId,
            brand: p.brand,
            images: p.images,
            variants: p.variants,
          };
          return (
            <ProductTile
              key={w.id}
              product={product}
              price={p.variants?.[0] ? `₹${p.variants[0].price}` : null}
              isInWishlist
              onWishlistClick={(e) => {
                e.stopPropagation();
                wishlist.removeFromWishlist(p.id, w.variantId ?? undefined);
              }}
              onClick={() => setSelectedProductId(p.id)}
            />
          );
        })}
      </div>
      <ProductQuickViewModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={(productId, variantId) => cart.addToCart(productId, variantId ?? null)}
      />
    </>
  );
}

function StoreForYouSection() {
  const { data, error, isLoading, mutate } = useSWR("store-for-me", () => getStoreForMe(), {
    revalidateOnFocus: false,
  });
  const [refreshing, setRefreshing] = useState(false);
  const wishlist = useWishlist();
  const cart = useCart();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshStoreForMe();
      await mutate();
    } finally {
      setRefreshing(false);
    }
  };

  if (isLoading && !data) return <p className="text-neutral-500">Loading your store…</p>;
  if (error) return <p className="text-red-600">Sign in to see your personalized store.</p>;
  if (!data) return null;

  type StoreProduct = { product: ProductSummary & { variants?: { price: string }[] } };
  const productList: StoreProduct[] = (data as { products?: StoreProduct[] }).products ?? [];
  const products = productList.map((mp) => {
    const p = mp.product;
    return {
      ...p,
      status: (p as ProductSummary).status ?? "active",
      price: p.variants?.[0] ? `₹${p.variants[0].price}` : null,
    };
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-foreground">{data.name}</h3>
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-soft-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
      {data.description && <p className="text-sm text-neutral-600">{data.description}</p>}
      {products.length === 0 ? (
        <p className="text-neutral-500">Your store is being curated. Try refreshing in a moment.</p>
      ) : (
        <>
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
          <ProductQuickViewModal
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
            onAddToCart={(productId, variantId) => cart.addToCart(productId, variantId ?? null)}
          />
        </>
      )}
    </div>
  );
}

function CartSection() {
  const cart = useCart();
  const wishlist = useWishlist();
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const items = cart.items;

  if (!cart.ready) return <p className="text-neutral-500">Loading cart…</p>;
  if (items.length === 0) {
    return (
      <p className="text-neutral-500">
        Your cart is empty.{" "}
        <Link href="/browse" className="text-primary hover:underline">
          Browse products
        </Link>{" "}
        to add items.
      </p>
    );
  }

  return (
    <>
      <p className="text-sm text-neutral-600">{cart.totalCount} item(s) in cart</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((c) => {
          const p = c.product;
          if (!p) return null;
          const product: ProductSummary = {
            id: p.id,
            title: p.title,
            status: "active",
            brandId: p.brandId,
            brand: p.brand,
            images: p.images,
            variants: p.variants,
          };
          return (
            <div key={c.id} className="relative">
              <ProductTile
                product={product}
                price={p.variants?.[0] ? `₹${p.variants[0].price}` : null}
                isInWishlist={wishlist.isInWishlist(p.id)}
                onWishlistClick={(e) => {
                  e.stopPropagation();
                  wishlist.toggleWishlist(p.id);
                }}
                onClick={() => setSelectedProductId(p.id)}
              />
              <span className="absolute top-2 right-2 rounded-full bg-primary text-primary-foreground text-xs px-2 py-0.5">
                ×{c.quantity}
              </span>
              <button
                type="button"
                onClick={() => cart.removeFromCart(p.id, c.variantId ?? undefined)}
                className="mt-1 text-xs text-red-600 hover:underline"
              >
                Remove
              </button>
            </div>
          );
        })}
      </div>
      <ProductQuickViewModal
        productId={selectedProductId}
        onClose={() => setSelectedProductId(null)}
        onAddToCart={(productId, variantId) => cart.addToCart(productId, variantId ?? null)}
      />
    </>
  );
}

export default function WardrobePage() {
  const [tab, setTab] = useState<TabId>(TAB_WARDROBE);
  const tabs: { id: TabId; label: string }[] = [
    { id: TAB_WARDROBE, label: "Wardrobe" },
    { id: TAB_WISHLIST, label: "Wishlist" },
    { id: TAB_STORE_FOR_YOU, label: "Store for you" },
    { id: TAB_CART, label: "Cart" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Closet</h1>
      <nav className="flex gap-2 border-b border-border" aria-label="Closet sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px ${
              tab === t.id ? "border-primary text-primary" : "border-transparent text-neutral-600 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>
      {tab === TAB_WARDROBE && <WardrobeSection />}
      {tab === TAB_WISHLIST && <WishlistSection />}
      {tab === TAB_STORE_FOR_YOU && <StoreForYouSection />}
      {tab === TAB_CART && <CartSection />}
    </div>
  );
}
