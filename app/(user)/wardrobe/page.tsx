"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  listWardrobe,
  listWardrobeExtractions,
  deleteWardrobeItem,
  deleteWardrobeExtraction,
  createWardrobeItem,
  acceptWardrobeSuggestions,
  uploadWardrobeImage,
  type WardrobeExtractSlot,
  type WardrobeItem,
} from "@/lib/api/wardrobe";
import { getStoreForMe, refreshStoreForMe, type MicrostoreDetail } from "@/lib/api/microstores";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";
import { WardrobeItemDetailModal } from "@/components/wardrobe/WardrobeItemDetailModal";
import { IdeasForYouCarousel } from "@/components/wardrobe/IdeasForYouCarousel";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { CartIcon, TrashIcon, HeartOutlineIconTile } from "@/components/icons/ProductActionsIcons";
import type { ProductSummary } from "@/lib/api/products";

const TAB_WARDROBE = "wardrobe";
const TAB_SHOPPING_BAG = "shopping-bag";
const TAB_STORE_FOR_YOU = "store-for-you";
type TabId = typeof TAB_WARDROBE | typeof TAB_SHOPPING_BAG | typeof TAB_STORE_FOR_YOU;


function ExtractedSlotCard({
  slot,
  extractionId,
  slotIndex,
  displayUrl,
  onAdd,
  onDeleteExtraction,
  adding,
  deleting,
}: {
  slot: WardrobeExtractSlot;
  extractionId: string;
  slotIndex: number;
  displayUrl: string | null;
  onAdd: () => void;
  onDeleteExtraction: () => void;
  adding: boolean;
  deleting: boolean;
}) {
  const label = [slot.item?.description, slot.item?.category_lvl1].filter(Boolean).join(" · ") || "Item";
  return (
    <div className="relative rounded-soft-xl border border-border bg-card overflow-hidden w-[140px] sm:w-[160px] flex-shrink-0 snap-start group">
      <div className="aspect-square bg-neutral-100 relative">
        {displayUrl ? (
          <img src={displayUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">No image</div>
        )}
        <div className="absolute top-1.5 right-1.5 flex gap-1">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAdd(); }}
            disabled={adding || deleting}
            className="w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-foreground font-medium hover:bg-white disabled:opacity-60"
            title="Add to wardrobe"
            aria-label="Add to wardrobe"
          >
            +
          </button>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDeleteExtraction(); }}
            disabled={adding || deleting}
            className="w-8 h-8 rounded-full bg-white/95 shadow flex items-center justify-center text-red-600 hover:bg-red-50 disabled:opacity-60"
            title="Remove this extracted look"
            aria-label="Remove this extracted look"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <line x1="10" y1="11" x2="10" y2="17" />
              <line x1="14" y1="11" x2="14" y2="17" />
            </svg>
          </button>
        </div>
      </div>
      <p className="p-2 text-xs text-foreground line-clamp-2">{label}</p>
    </div>
  );
}

function WardrobeSection() {
  const storageToken = useStorageAccessToken();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const { data, mutate } = useSWR("wardrobe", () => listWardrobe({ limit: 100 }));
  const { data: extractionsData, mutate: mutateExtractions } = useSWR("wardrobe-extractions", () =>
    listWardrobeExtractions({ status: "done", limit: 50 })
  );
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [addingSlotKey, setAddingSlotKey] = useState<string | null>(null);
  const [deletingExtractionId, setDeletingExtractionId] = useState<string | null>(null);
  const [detailItem, setDetailItem] = useState<WardrobeItem | null>(null);

  const items = data?.items ?? [];
  const extractions = extractionsData?.items ?? [];
  const allSlots: { slot: WardrobeExtractSlot; extractionId: string; slotIndex: number }[] = extractions.flatMap(
    (ex) =>
      (ex.slots ?? [])
        .map((slot, i) => ({ slot, extractionId: ex.id, slotIndex: i }))
        .filter(({ slot }) => !slot.added)
  );
  const mid = Math.ceil(allSlots.length / 2);
  const row1 = allSlots.slice(0, mid);
  const row2 = allSlots.slice(mid);

  const handleUploadClick = () => {
    setUploadError(null);
    uploadInputRef.current?.click();
  };
  const handleUploadChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    const count = fileList?.length ?? 0;
    if (count === 0) {
      e.target.value = "";
      setUploadError("Select one or more images, then click Open to upload.");
      return;
    }
    // Copy to array before clearing input – in some browsers clearing the input clears the live FileList
    const filesToUpload = Array.from(fileList);
    e.target.value = "";
    console.log("[Wardrobe] Upload: selected", filesToUpload.length, "file(s)");
    setUploading(true);
    setUploadError(null);
    try {
      const createdItems: typeof items[0][] = [];
      for (let i = 0; i < filesToUpload.length; i++) {
        const item = await uploadWardrobeImage(filesToUpload[i]);
        createdItems.push(item);
      }
      console.log("[Wardrobe] Upload: created", createdItems.length, "item(s)");
      // Optimistic update: prepend new items so they appear immediately
      const createdIds = createdItems.map((i) => i.id);
      mutate(
        (prev) =>
          prev
            ? {
                ...prev,
                items: [...createdItems, ...prev.items],
                total: (prev.total ?? 0) + createdItems.length,
              }
            : prev,
        false
      );
      // Revalidate but merge by id so newly created items stay visible if server response is delayed
      await mutate(
        async (prev) => {
          const fresh = await listWardrobe({ limit: 100 });
          const prevItems = prev?.items ?? [];
          const missing = prevItems.filter(
            (it) => createdIds.includes(it.id) && !fresh.items.some((f) => f.id === it.id)
          );
          if (missing.length === 0) return fresh;
          return { ...fresh, items: [...missing, ...fresh.items], total: fresh.total + missing.length };
        },
        { revalidate: true }
      );
      // Refetch after a delay so analysis labels (category, tags) appear when ready
      setTimeout(
        () =>
          mutate(
            async (prev) => {
              const fresh = await listWardrobe({ limit: 100 });
              const prevItems = prev?.items ?? [];
              const missing = prevItems.filter(
                (it) => createdIds.includes(it.id) && !fresh.items.some((f) => f.id === it.id)
              );
              if (missing.length === 0) return fresh;
              return { ...fresh, items: [...missing, ...fresh.items], total: fresh.total + missing.length };
            },
            { revalidate: true }
          ),
        4000
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Upload failed";
      setUploadError(message);
      console.error("[Wardrobe] Upload failed:", message, err);
    } finally {
      setUploading(false);
    }
  };

  const handleAddSlotToWardrobe = async (slot: WardrobeExtractSlot, extractionId: string, slotIndex: number) => {
    const key = `${extractionId}-${slotIndex}`;
    setAddingSlotKey(key);
    try {
      if (slot.cropImageUrl) {
        await createWardrobeItem({
          imageUrl: slot.cropImageUrl,
          category: slot.item?.category_lvl1 ?? undefined,
          color: slot.item?.color_primary ?? undefined,
          tags: slot.item?.description ?? undefined,
          extractionId,
          extractionSlotIndex: slotIndex,
        });
      } else if (slot.suggestedProducts?.length) {
        await acceptWardrobeSuggestions([slot.suggestedProducts[0].productId], {
          extractionId,
          extractionSlotIndex: slotIndex,
        });
      }
      await mutate();
      await mutateExtractions();
    } catch (err) {
      console.error(err);
    } finally {
      setAddingSlotKey(null);
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

  const handleDeleteExtraction = async (extractionId: string) => {
    if (!confirm("Remove this extracted look? Its slots will disappear from here (items already added to wardrobe stay).")) return;
    setDeletingExtractionId(extractionId);
    try {
      await deleteWardrobeExtraction(extractionId);
      await mutateExtractions();
      await mutate();
    } catch (e) {
      console.error(e);
    } finally {
      setDeletingExtractionId(null);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-end">
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-hidden
          onChange={handleUploadChange}
        />
        {uploadError && (
          <p className="text-sm text-red-600 mr-3 self-center">{uploadError}</p>
        )}
        <button
          type="button"
          onClick={handleUploadClick}
          disabled={uploading}
          className="inline-flex items-center gap-2 rounded-full border-2 border-violet-300 bg-violet-100 px-4 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-200 transition-colors disabled:opacity-60"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          {uploading ? "Uploading…" : "Upload images for wardrobe"}
        </button>
      </div>

      {allSlots.length > 0 && (
        <section className="space-y-3">
          <h2 className="font-display text-lg text-foreground">Extracted looks</h2>
          <div className="space-y-3">
            <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
              {row1.map(({ slot, extractionId, slotIndex }) => (
                <ExtractedSlotCard
                  key={`${extractionId}-${slotIndex}`}
                  slot={slot}
                  extractionId={extractionId}
                  slotIndex={slotIndex}
                  displayUrl={getImageDisplayUrl(slot.cropImageUrl ?? null, storageToken)}
                  onAdd={() => handleAddSlotToWardrobe(slot, extractionId, slotIndex)}
                  onDeleteExtraction={() => handleDeleteExtraction(extractionId)}
                  adding={addingSlotKey === `${extractionId}-${slotIndex}`}
                  deleting={deletingExtractionId === extractionId}
                />
              ))}
            </div>
            {row2.length > 0 && (
              <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                {row2.map(({ slot, extractionId, slotIndex }) => (
                  <ExtractedSlotCard
                    key={`${extractionId}-${slotIndex}`}
                    slot={slot}
                    extractionId={extractionId}
                    slotIndex={slotIndex}
                    displayUrl={getImageDisplayUrl(slot.cropImageUrl ?? null, storageToken)}
                    onAdd={() => handleAddSlotToWardrobe(slot, extractionId, slotIndex)}
                    onDeleteExtraction={() => handleDeleteExtraction(extractionId)}
                    adding={addingSlotKey === `${extractionId}-${slotIndex}`}
                    deleting={deletingExtractionId === extractionId}
                  />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <section className="space-y-3">
        {items.length === 0 ? (
          <p className="text-neutral-500">No items yet. Upload images or add from extracted looks above.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => {
              const displayUrl = getImageDisplayUrl(item.imageUrl, storageToken);
              return (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailItem(item)}
                  onKeyDown={(e) => e.key === "Enter" && setDetailItem(item)}
                  className="rounded-soft-xl border border-border bg-card overflow-hidden cursor-pointer hover:border-violet-300 transition-colors focus:outline-none focus:ring-2 focus:ring-violet-400 focus:ring-offset-2"
                >
                  <div className="aspect-square bg-neutral-100 relative">
                    <div className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">No image</div>
                    {displayUrl ? (
                      <img
                        src={displayUrl}
                        alt=""
                        className="w-full h-full object-cover relative z-10"
                        onError={(e) => e.currentTarget.classList.add("hidden")}
                      />
                    ) : null}
                  </div>
                  <div className="p-2 flex justify-between items-center">
                    <span className="text-xs text-neutral-600 truncate">{item.tags ?? item.category ?? "Item"}</span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemove(item.id);
                      }}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <WardrobeItemDetailModal
          open={!!detailItem}
          onClose={() => setDetailItem(null)}
          item={detailItem}
          storageToken={storageToken}
          onRemove={async (id) => {
            try {
              await deleteWardrobeItem(id);
              setDetailItem(null);
              mutate();
            } catch (e) {
              console.error(e);
            }
          }}
        />
      </section>
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
            <div key={w.id} className="group relative">
              <ProductTile
                product={product}
                price={p.variants?.[0] ? `₹${p.variants[0].price}` : null}
                isInWishlist
                onClick={() => setSelectedProductId(p.id)}
              />
              <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await cart.addToCart(p.id, w.variantId ?? null);
                      wishlist.removeFromWishlist(p.id, w.variantId ?? undefined);
                    }}
                    aria-label="Move to cart"
                    title="Move to cart"
                    className="p-2 rounded-full bg-card/95 shadow border border-border text-foreground hover:bg-neutral-100"
                  >
                    <CartIcon className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      wishlist.removeFromWishlist(p.id, w.variantId ?? undefined);
                    }}
                    aria-label="Remove from wishlist"
                    title="Remove from wishlist"
                    className="p-2 rounded-full bg-card/95 shadow border border-border text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
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

  const ideasForYou = (data as MicrostoreDetail).ideasForYou ?? [];

  return (
    <div className="space-y-6">
      <div
        className="w-full rounded-soft-xl overflow-hidden aspect-[4/1] max-h-24 sm:max-h-28 flex items-center justify-center bg-gradient-to-br from-black via-neutral-800 to-neutral-700"
        aria-hidden
      >
        <span className="font-display text-2xl sm:text-3xl font-medium text-amber-400 tracking-tight">
          Your Own Store
        </span>
      </div>
      {ideasForYou.length > 0 && (
        <IdeasForYouCarousel ideas={ideasForYou} />
      )}
      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleRefresh}
          disabled={refreshing}
          className="rounded-soft-lg border border-border bg-card px-3 py-1.5 text-sm disabled:opacity-50"
        >
          {refreshing ? "Refreshing…" : "Refresh"}
        </button>
      </div>
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
      <p className="text-sm text-neutral-600">
        {items.length} item(s) in cart
        {cart.totalCount !== items.length && ` (${cart.totalCount} total)`}
      </p>
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
            <div key={c.id} className="group relative">
              <ProductTile
                product={product}
                price={p.variants?.[0] ? `₹${p.variants[0].price}` : null}
                onClick={() => setSelectedProductId(p.id)}
              />
              <div className="absolute inset-0 pointer-events-none opacity-0 transition-opacity group-hover:opacity-100">
                <div className="absolute top-2 right-2 flex flex-col gap-1.5 pointer-events-auto">
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.stopPropagation();
                      await wishlist.addToWishlist(p.id, c.variantId ?? null);
                      await cart.removeFromCart(p.id, c.variantId ?? undefined);
                    }}
                    aria-label="Move to wishlist"
                    title="Move to wishlist"
                    className="p-2 rounded-full bg-card/95 shadow border border-border text-foreground hover:bg-red-50 hover:text-red-600"
                  >
                    <HeartOutlineIconTile className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      cart.removeFromCart(p.id, c.variantId ?? undefined);
                    }}
                    aria-label="Remove from cart"
                    title="Remove from cart"
                    className="p-2 rounded-full bg-card/95 shadow border border-border text-red-600 hover:bg-red-50"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </div>
              </div>
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

  const mainTabs: { id: TabId; label: string }[] = [
    { id: TAB_WARDROBE, label: "Wardrobe" },
    { id: TAB_SHOPPING_BAG, label: "Shopping Bag" },
    { id: TAB_STORE_FOR_YOU, label: "Store for you" },
  ];

  return (
    <div className="space-y-6">
      <nav className="flex gap-2 border-b border-border" aria-label="Sections">
        {mainTabs.map((t) => (
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

      {tab === TAB_SHOPPING_BAG && (
        <div className="space-y-8">
          <section className="space-y-3">
            <h2 className="font-display text-lg text-foreground">Wishlist</h2>
            <WishlistSection />
          </section>
          <section className="space-y-3">
            <h2 className="font-display text-lg text-foreground">Cart</h2>
            <CartSection />
          </section>
        </div>
      )}

      {tab === TAB_STORE_FOR_YOU && <StoreForYouSection />}
    </div>
  );
}
