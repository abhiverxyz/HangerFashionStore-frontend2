"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import useSWR from "swr";
import { fetchProducts } from "@/lib/api/products";
import { searchProducts, type SearchProductItem } from "@/lib/api/search";
import { uploadUserImage } from "@/lib/api/userImages";
import { trackFindVisit } from "@/lib/api/analytics";
import type { ProductSummary } from "@/lib/api/products";
import { searchItemToProductSummary } from "@/lib/utils/productSummary";
import { SearchBar } from "@/components/SearchBar";
import { ProductTile } from "@/components/ProductTile";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { useAuth } from "@/lib/auth/AuthProvider";

const limit = 24;

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const brandIdFromUrl = searchParams.get("brandId") ?? undefined;

  const [page, setPage] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);

  // Search state: when set, we show search results instead of catalog
  const [searchQuery, setSearchQuery] = useState("");
  const [searchImageUrl, setSearchImageUrl] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{ items: SearchProductItem[]; total: number } | null>(null);
  const [searchOffset, setSearchOffset] = useState(0);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [refineKeywords, setRefineKeywords] = useState("");

  const wishlist = useWishlist();
  const cart = useCart();
  const { token } = useAuth();
  const offset = page * limit;
  const findVisitTrackedRef = useRef(false);

  // When URL has brandId, run search by brand once
  useEffect(() => {
    if (!brandIdFromUrl) return;
    let cancelled = false;
    setSearching(true);
    searchProducts({ brandId: brandIdFromUrl, limit, offset: 0 })
      .then((res) => {
        if (!cancelled) setSearchResult({ items: res.items, total: res.total });
      })
      .catch(() => {
        if (!cancelled) setSearchResult({ items: [], total: 0 });
      })
      .finally(() => {
        if (!cancelled) setSearching(false);
      });
    return () => { cancelled = true; };
  }, [brandIdFromUrl]);

  const isSearchMode = searchResult !== null;

  // Fire-and-forget: track Find/browse visit once per load when showing catalog (for visit-based personalization)
  useEffect(() => {
    if (isSearchMode || findVisitTrackedRef.current) return;
    findVisitTrackedRef.current = true;
    const schedule =
      typeof requestIdleCallback !== "undefined"
        ? requestIdleCallback
        : (cb: () => void) => setTimeout(cb, 0);
    schedule(() => trackFindVisit());
  }, [isSearchMode]);
  const hasSearchInput = searchQuery.trim().length > 0 || Boolean(searchImageUrl?.trim());

  // First request: fast diversity-only (no personalized) for quick first paint (C+ Phase 1).
  const { data, error, isLoading } = useSWR(
    isSearchMode ? null : ["products", "list", limit, offset, retryKey, token ?? ""],
    () => fetchProducts({ limit, offset }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );

  // When logged in and on first page, optionally fetch personalized order and use for first page (C+ Phase 4).
  const [personalizedFirstPage, setPersonalizedFirstPage] = useState<{ items: ProductSummary[]; total: number } | null>(null);
  useEffect(() => {
    if (!token) {
      setPersonalizedFirstPage(null);
      return;
    }
    if (isSearchMode || brandIdFromUrl) return;
    let cancelled = false;
    fetchProducts({ limit, offset: 0, personalized: true })
      .then((res) => {
        if (!cancelled) setPersonalizedFirstPage({ items: res.items, total: res.total });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [token, isSearchMode, brandIdFromUrl]);

  const catalogItems = page === 0 && personalizedFirstPage ? personalizedFirstPage.items : (data?.items ?? []);
  const catalogTotal = page === 0 && personalizedFirstPage ? personalizedFirstPage.total : (data?.total ?? 0);
  const searchItems = searchResult?.items ?? [];
  const searchTotal = searchResult?.total ?? 0;

  const total = isSearchMode ? searchTotal : catalogTotal;
  const showPagination = total > limit;

  const runSearch = useCallback(
    async (newOffset: number, queryOverride?: string) => {
      const queryToSend = queryOverride ?? searchQuery.trim();
      const hasInput = queryToSend.length > 0 || Boolean(searchImageUrl?.trim());
      if (!hasInput) return;
      setSearching(true);
      setSearchError(null);
      try {
        const res = await searchProducts({
          query: queryToSend || undefined,
          imageUrl: searchImageUrl?.trim() || undefined,
          limit,
          offset: newOffset,
        });
        setSearchResult({ items: res.items, total: res.total });
        setSearchOffset(newOffset);
      } catch (err) {
        setSearchError(err instanceof Error ? err.message : "Search failed");
        setSearchResult(null);
      } finally {
        setSearching(false);
      }
    },
    [searchQuery, searchImageUrl]
  );

  const handleSearchSubmit = () => {
    if (!hasSearchInput) return;
    void runSearch(0);
  };

  const handleImageAttach = async (file: File) => {
    setUploadingImage(true);
    setSearchError(null);
    try {
      const record = await uploadUserImage(file);
      setSearchImageUrl(record.rawImageUrl);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageClear = () => setSearchImageUrl(null);

  const clearSearch = () => {
    setSearchResult(null);
    setSearchQuery("");
    setSearchImageUrl(null);
    setRefineKeywords("");
    setSearchOffset(0);
    setSearchError(null);
  };

  const handleRefineSearch = () => {
    const combined = [searchQuery.trim(), refineKeywords.trim()].filter(Boolean).join(" ");
    if (!combined.trim() && !searchImageUrl?.trim()) return;
    setSearchQuery(combined);
    setRefineKeywords("");
    void runSearch(0, combined || undefined);
  };

  const searchPage = Math.floor(searchOffset / limit) + 1;
  const searchTotalPages = Math.ceil(searchTotal / limit);

  return (
    <div className="space-y-6">
      <SearchBar
        variant="find"
        value={searchQuery}
        onChange={setSearchQuery}
        onSubmit={handleSearchSubmit}
        imageUrl={searchImageUrl ?? undefined}
        onImageAttach={handleImageAttach}
        onImageClear={handleImageClear}
        disabled={searching || uploadingImage}
        aria-label="Search products"
      />

      {isSearchMode && (
        <div className="space-y-2">
          <label htmlFor="refine-keywords" className="block text-sm font-medium text-foreground">
            Refine your search
          </label>
          {/* Mobile: bar below label with triangle inside; desktop: same bar, "Search again" visible in row */}
          <div className="flex flex-col gap-2 md:flex-row md:flex-wrap md:items-center">
            <div className="flex flex-1 min-w-0 items-center rounded-soft-lg border border-border bg-card overflow-hidden focus-within:ring-2 focus-within:ring-primary">
              <input
                id="refine-keywords"
                type="text"
                value={refineKeywords}
                onChange={(e) => setRefineKeywords(e.target.value)}
                placeholder="Add keywords, e.g. colour, style"
                disabled={searching}
                className="min-w-0 flex-1 border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-neutral-500 focus:outline-none focus:ring-0"
                onKeyDown={(e) => e.key === "Enter" && handleRefineSearch()}
              />
              <button
                type="button"
                onClick={handleRefineSearch}
                disabled={searching}
                className="flex shrink-0 p-2.5 text-neutral-500 hover:bg-neutral-100 disabled:opacity-50 md:hidden"
                aria-label="Search again"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              </button>
            </div>
            <button
              type="button"
              onClick={handleRefineSearch}
              disabled={searching}
              className="hidden rounded-soft-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground hover:bg-neutral-100 disabled:opacity-50 md:block"
            >
              Search again
            </button>
          </div>
        </div>
      )}

      {searchError && (
        <div className="rounded-soft-xl bg-red-50 border border-red-200 p-4 text-red-700" role="alert">
          <p>{searchError}</p>
          <button type="button" onClick={() => setSearchError(null)} className="mt-2 text-sm font-medium text-red-800 hover:underline">
            Dismiss
          </button>
        </div>
      )}

      {isSearchMode && (
        <div className="flex flex-wrap items-center justify-end gap-4">
          <button
            type="button"
            onClick={clearSearch}
            className="text-sm font-medium text-primary hover:underline"
          >
            Show all products
          </button>
        </div>
      )}

      {!isSearchMode && error && (
        <div className="rounded-soft-xl bg-red-50 border border-red-200 p-4 text-red-700">
          <p>{error instanceof Error ? error.message : "Failed to load products"}</p>
          <button
            type="button"
            onClick={() => setRetryKey((k) => k + 1)}
            className="mt-2 text-sm font-medium text-red-800 hover:underline"
          >
            Retry
          </button>
          <Link href="/" className="ml-4 text-sm font-medium text-red-800 hover:underline">
            Go home
          </Link>
        </div>
      )}

      {(searching && !searchResult) && <p className="text-neutral-500">Searching…</p>}

      {!isSearchMode && isLoading && <p className="text-neutral-500">Loading…</p>}

      {((isSearchMode && searchResult && searchItems.length === 0) || (!isSearchMode && !isLoading && !error && catalogItems.length === 0)) && (
        <div className="rounded-soft-xl bg-neutral-50 border border-border p-6 text-center">
          <p className="text-foreground">
            {isSearchMode ? "No results for your search." : "No products yet."}
          </p>
          {isSearchMode && (
            <button type="button" onClick={clearSearch} className="mt-2 text-sm font-medium text-primary hover:underline">
              Show all products
            </button>
          )}
        </div>
      )}

      {((isSearchMode && searchItems.length > 0) || (!isSearchMode && !isLoading && !error && catalogItems.length > 0)) && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {isSearchMode
              ? searchItems.map((p, i) => (
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
                ))
              : catalogItems.map((p, i) => (
                  <ProductTile
                    key={p.id}
                    product={p}
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
            onAddToCart={(productId, variantId) => cart.addToCart(productId, variantId ?? null)}
          />
          {showPagination && (
            <div className="flex gap-2 justify-center items-center pt-4">
              {isSearchMode ? (
                <>
                  <button
                    type="button"
                    disabled={searchOffset === 0 || searching}
                    onClick={() => void runSearch(Math.max(0, searchOffset - limit))}
                    className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
                  >
                    Previous
                  </button>
                  <span className="py-2 text-sm text-neutral-600">
                    Page {searchPage} of {searchTotalPages}
                  </span>
                  <button
                    type="button"
                    disabled={searchOffset + limit >= searchTotal || searching}
                    onClick={() => void runSearch(searchOffset + limit)}
                    className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
                  >
                    Next
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={page === 0}
                    onClick={() => setPage((p) => p - 1)}
                    className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
                  >
                    Previous
                  </button>
                  <span className="py-2 text-sm text-neutral-600">
                    Page {page + 1} of {Math.ceil(total / limit)}
                  </span>
                  <button
                    type="button"
                    disabled={(page + 1) * limit >= total}
                    onClick={() => setPage((p) => p + 1)}
                    className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-foreground disabled:opacity-50 hover:bg-neutral-100"
                  >
                    Next
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
