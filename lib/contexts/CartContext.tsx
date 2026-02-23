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
  listCart,
  addToCart as apiAddToCart,
  removeFromCart as apiRemoveFromCart,
} from "@/lib/api/cart";
import type { CartItem } from "@/lib/api/cart";

type CartState = {
  /** Whether the list has been loaded (for current auth state). */
  ready: boolean;
  /** Product/variant is in cart. When not authenticated, always false. */
  isInCart: (productId: string, variantId?: string | null) => boolean;
  /** Add product (and optional variant) to cart. No-op when not authenticated. */
  addToCart: (productId: string, variantId?: string | null, quantity?: number) => Promise<void>;
  /** Remove from cart. No-op when not authenticated. */
  removeFromCart: (productId: string, variantId?: string | null) => Promise<void>;
  /** Raw items for "my cart" page. */
  items: CartItem[];
  /** Total item count (sum of quantities). */
  totalCount: number;
  /** Revalidate list from server. */
  mutate: () => void;
  /** True when a mutation is in progress. */
  mutating: boolean;
};

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  const isAuthenticated = Boolean(token);

  const { data, mutate, isLoading, isValidating } = useSWR(
    isAuthenticated ? ["cart", token] : null,
    () => listCart(),
    { revalidateOnFocus: true, dedupingInterval: 5000 }
  );

  const items = data?.items ?? [];
  const ready = !isAuthenticated || !isLoading;
  const totalCount = items.reduce((sum, i) => sum + (i.quantity ?? 1), 0);

  const isInCart = useCallback(
    (productId: string, variantId?: string | null): boolean => {
      if (!isAuthenticated) return false;
      const vid = variantId != null && variantId !== "" ? variantId : null;
      return items.some(
        (c) => c.productId === productId && (vid === null ? c.variantId == null : c.variantId === vid)
      );
    },
    [isAuthenticated, items]
  );

  const addToCart = useCallback(
    async (productId: string, variantId?: string | null, quantity?: number) => {
      if (!isAuthenticated) return;
      const vid = variantId != null && variantId !== "" ? variantId : null;
      const qty = quantity ?? 1;
      const existing = items.find(
        (c) => c.productId === productId && (vid === null ? c.variantId == null : c.variantId === vid)
      );
      const optimisticItems = existing
        ? items.map((c) =>
            c.productId === productId && (vid === null ? c.variantId == null : c.variantId === vid)
              ? { ...c, quantity: c.quantity + qty }
              : c
          )
        : [
            ...items,
            {
              id: `opt-${productId}-${vid ?? "p"}`,
              userId: "",
              productId,
              variantId: vid,
              quantity: qty,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
              product: undefined,
            } as CartItem,
          ];
      mutate({ items: optimisticItems }, false);
      try {
        await apiAddToCart(productId, variantId ?? null, qty);
      } finally {
        await mutate();
      }
    },
    [isAuthenticated, items, mutate]
  );

  const removeFromCart = useCallback(
    async (productId: string, variantId?: string | null) => {
      if (!isAuthenticated) return;
      await apiRemoveFromCart(productId, variantId ?? null);
      await mutate();
    },
    [isAuthenticated, mutate]
  );

  const value = useMemo<CartState>(
    () => ({
      ready,
      isInCart,
      addToCart,
      removeFromCart,
      items,
      totalCount,
      mutate,
      mutating: isValidating,
    }),
    [ready, isInCart, addToCart, removeFromCart, items, totalCount, mutate, isValidating]
  );

  return (
    <CartContext.Provider value={value}>{children}</CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/** Optional hook: returns null when outside provider. */
export function useCartOptional(): CartState | null {
  return useContext(CartContext);
}
