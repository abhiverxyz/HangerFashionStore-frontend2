"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import { SearchBar } from "@/components/SearchBar";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { searchProducts, type SearchProductItem } from "@/lib/api/search";
import { uploadUserImage } from "@/lib/api/userImages";
import { searchItemToProductSummary } from "@/lib/utils/productSummary";
import { useRefineSearchOnFilters } from "@/lib/hooks/useRefineSearchOnFilters";

const limit = 24;

const OCCASION_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "work", label: "Work" },
  { value: "party", label: "Party" },
  { value: "date", label: "Date" },
  { value: "travel", label: "Travel" },
];

const VIBE_OPTIONS = [
  { value: "casual", label: "Casual" },
  { value: "elegant", label: "Elegant" },
  { value: "minimal", label: "Minimal" },
  { value: "bold", label: "Bold" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ items: SearchProductItem[]; total: number } | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [filterOccasion, setFilterOccasion] = useState<string | null>(null);
  const [filterVibe, setFilterVibe] = useState<string | null>(null);

  const wishlist = useWishlist();
  const cart = useCart();

  const hasQuery = query.trim().length > 0;
  const hasImage = Boolean(imageUrl?.trim());
  const canSearch = hasQuery || hasImage;

  const runSearch = useCallback(
    async (newOffset: number) => {
      if (!canSearch) return;
      setSearching(true);
      setError(null);
      try {
        const data = await searchProducts({
          query: query.trim() || undefined,
          imageUrl: imageUrl?.trim() || undefined,
          limit,
          offset: newOffset,
          occasion_primary: filterOccasion || undefined,
          mood_vibe: filterVibe || undefined,
        });
        setResult({ items: data.items, total: data.total });
        setOffset(newOffset);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Search failed");
        setResult(null);
      } finally {
        setSearching(false);
      }
    },
    [query, imageUrl, canSearch, filterOccasion, filterVibe]
  );

  const handleSubmit = () => {
    if (!canSearch) return;
    setSubmitted(true);
    void runSearch(0);
  };

  useRefineSearchOnFilters(filterOccasion, filterVibe, {
    submitted,
    canSearch,
    runSearch,
  });

  const handleImageAttach = async (file: File) => {
    setUploadingImage(true);
    setError(null);
    try {
      const record = await uploadUserImage(file);
      setImageUrl(record.rawImageUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClear = () => {
    setImageUrl(null);
  };

  const items = result?.items ?? [];
  const total = result?.total ?? 0;
  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">
        Find
      </h1>

      <SearchBar
        variant="find"
        value={query}
        onChange={setQuery}
        onSubmit={handleSubmit}
        imageUrl={imageUrl ?? undefined}
        onImageAttach={handleImageAttach}
        onImageClear={handleImageClear}
        disabled={searching || uploadingImage}
        aria-label="Search products"
      />

      {error && (
        <div
          className="rounded-soft-xl bg-red-50 border border-red-200 p-4 text-red-700"
          role="alert"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={() => setError(null)}
            className="mt-2 text-sm font-medium text-red-800 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {!submitted && !result && (
        <p className="text-neutral-500">
          Search by keyword or upload an image to find products.
        </p>
      )}

      {submitted && searching && !result && (
        <p className="text-neutral-500">Searching…</p>
      )}

      {submitted && !searching && result && items.length === 0 && (
        <div className="rounded-soft-xl bg-neutral-50 border border-border p-6 text-center space-y-4">
          <p className="text-foreground">
            No results for {hasQuery ? `"${query.trim()}"` : "this image"}.
          </p>
          <p className="text-sm text-neutral-600">
            Try different words or refine your search with the Concierge.
          </p>
          <Link
            href="/concierge"
            className="inline-block text-sm font-medium text-primary hover:underline"
          >
            Refine with Concierge
          </Link>
        </div>
      )}

      {submitted && !searching && result && items.length > 0 && (
        <>
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-sm text-neutral-600">
              {total} result{total !== 1 ? "s" : ""}
            </p>
            <Link
              href="/browse"
              className="text-sm font-medium text-primary hover:underline"
            >
              Browse all products
            </Link>
            <Link
              href="/concierge"
              className="text-sm font-medium text-primary hover:underline"
            >
              Refine with Concierge
            </Link>
          </div>

          {/* D.7: refinement filters — occasion & vibe chips; re-run search without losing query */}
          <div className="flex flex-wrap gap-4 items-center">
            <span className="text-sm font-medium text-foreground">Occasion:</span>
            <div className="flex flex-wrap gap-2">
              {OCCASION_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setFilterOccasion((prev) => (prev === value ? null : value));
                    setOffset(0);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterOccasion === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  disabled={searching}
                >
                  {label}
                </button>
              ))}
            </div>
            <span className="text-sm font-medium text-foreground ml-2">Vibe:</span>
            <div className="flex flex-wrap gap-2">
              {VIBE_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setFilterVibe((prev) => (prev === value ? null : value));
                    setOffset(0);
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                    filterVibe === value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground hover:bg-muted/80"
                  }`}
                  disabled={searching}
                >
                  {label}
                </button>
              ))}
            </div>
            {(filterOccasion || filterVibe) && (
              <button
                type="button"
                onClick={() => {
                  setFilterOccasion(null);
                  setFilterVibe(null);
                  setOffset(0);
                }}
                className="text-sm font-medium text-primary hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>


          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((p, i) => (
              <ProductTile
                key={p.id}
                product={searchItemToProductSummary(p)}
                price={p.price ?? (p.variants?.[0] ? `₹${p.variants[0].price}` : null)}
                isInWishlist={wishlist.isInWishlist(p.id)}
                onWishlistClick={(e) => {
                  e.stopPropagation();
                  wishlist.toggleWishlist(p.id);
                }}
                onClick={() => setSelectedProductId(p.id)}
                priority={i < 8}
              />
            ))}
          </div>

          <ProductQuickViewModal
            productId={selectedProductId}
            onClose={() => setSelectedProductId(null)}
            onAddToCart={(productId, variantId) =>
              cart.addToCart(productId, variantId ?? null)
            }
          />

          {totalPages > 1 && (
            <div className="flex gap-2 justify-center items-center pt-4">
              <button
                type="button"
                disabled={offset === 0 || searching}
                onClick={() => void runSearch(Math.max(0, offset - limit))}
                className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
              >
                Previous
              </button>
              <span className="py-2 text-sm text-neutral-600">
                Page {currentPage} of {totalPages}
              </span>
              <button
                type="button"
                disabled={offset + limit >= total || searching}
                onClick={() => void runSearch(offset + limit)}
                className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
