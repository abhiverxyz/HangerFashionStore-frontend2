"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
} from "react";
import useSWR from "swr";
import { useAuth } from "@/lib/auth/AuthProvider";
import {
  listWishlist,
  addToWishlist as apiAddToWishlist,
  removeFromWishlist as apiRemoveFromWishlist,
} from "@/lib/api/wishlist";
import type { WishlistItem } from "@/lib/api/wishlist";

type WishlistState = {
  /** Whether the list has been loaded (for current auth state). */
  ready: boolean;
  /** Product is in wishlist (any variant or product-level). When not authenticated, always false. */
  isInWishlist: (productId: string, variantId?: string | null) => boolean;
  /** Add product (and optional variant) to wishlist. No-op when not authenticated. */
  addToWishlist: (productId: string, variantId?: string | null) => Promise<void>;
  /** Remove from wishlist. No-op when not authenticated. */
  removeFromWishlist: (productId: string, variantId?: string | null) => Promise<void>;
  /** Toggle: add if not in wishlist, remove if in. No-op when not authenticated. */
  toggleWishlist: (productId: string, variantId?: string | null) => Promise<void>;
  /** Raw items for "my wishlist" page. */
  items: WishlistItem[];
  /** Revalidate list from server. */
  mutate: () => void;
  /** True when a mutation is in progress. */
  mutating: boolean;
};

const WishlistContext = createContext<WishlistState | null>(null);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const isAuthenticated = Boolean(token);

  const { data, mutate, isLoading, isValidating } = useSWR(
    isAuthenticated ? ["wishlist", token] : null,
    () => listWishlist(),
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const items = data?.items ?? [];
  const ready = !isAuthenticated || !isLoading;

  const isInWishlist = useCallback(
    (productId: string, variantId?: string | null): boolean => {
      if (!isAuthenticated) return false;
      const vid = variantId != null && variantId !== "" ? variantId : null;
      return items.some(
        (w) => w.productId === productId && (vid === null ? w.variantId == null : w.variantId === vid)
      );
    },
    [isAuthenticated, items]
  );

  const addToWishlist = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!isAuthenticated) return;
      await apiAddToWishlist(productId, variantId ?? null);
      await mutate();
    },
    [isAuthenticated, mutate]
  );

  const removeFromWishlist = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!isAuthenticated) return;
      await apiRemoveFromWishlist(productId, variantId ?? null);
      await mutate();
    },
    [isAuthenticated, mutate]
  );

  const toggleWishlist = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!isAuthenticated) return;
      const vid = variantId != null && variantId !== "" ? variantId : null;
      const inList = items.some(
        (w) => w.productId === productId && (vid === null ? w.variantId == null : w.variantId === vid)
      );
      // Optimistic update so tile/modal update immediately
      const optimisticItems = inList
        ? items.filter(
            (w) => !(w.productId === productId && (vid === null ? w.variantId == null : w.variantId === vid))
          )
        : [
            ...items,
            {
              id: `opt-${productId}-${vid ?? "p"}`,
              userId: "",
              productId,
              variantId: vid,
              createdAt: new Date().toISOString(),
              product: undefined,
            } as WishlistItem,
          ];
      mutate({ items: optimisticItems }, false);
      try {
        if (inList) await apiRemoveFromWishlist(productId, variantId ?? null);
        else await apiAddToWishlist(productId, variantId ?? null);
      } finally {
        await mutate();
      }
    },
    [isAuthenticated, items, mutate]
  );

  const value = useMemo<WishlistState>(
    () => ({
      ready,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      items,
      mutate,
      mutating: isValidating,
    }),
    [
      ready,
      isInWishlist,
      addToWishlist,
      removeFromWishlist,
      toggleWishlist,
      items,
      mutate,
      isValidating,
    ]
  );

  return (
    <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
  );
}

export function useWishlist(): WishlistState {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

/** Optional hook: returns null when outside provider (e.g. admin layout). */
export function useWishlistOptional(): WishlistState | null {
  return useContext(WishlistContext);
}
