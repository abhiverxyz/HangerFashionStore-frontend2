"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import { fetchProduct } from "@/lib/api/products";
import type { ProductDetail } from "@/lib/api/products";
import { useWishlistOptional } from "@/lib/contexts/WishlistContext";
import { useCartOptional } from "@/lib/contexts/CartContext";
import { CartIcon, HeartFilledIcon, HeartOutlineIcon } from "@/components/icons/ProductActionsIcons";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { formatRoundedPrice } from "@/lib/utils/price";

export interface ProductQuickViewModalProps {
  productId: string | null;
  onClose: () => void;
  /** (productId, variantId) => void | Promise<void>. When not provided, modal uses CartContext if available. */
  onAddToCart?: (productId: string, variantId: string) => void | Promise<void>;
}

function getFocusableElements(container: HTMLElement): HTMLElement[] {
  const selector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  return Array.from(container.querySelectorAll<HTMLElement>(selector)).filter(
    (el) => !el.hasAttribute("disabled") && el.offsetParent !== null
  );
}

export function ProductQuickViewModal({
  productId,
  onClose,
  onAddToCart: onAddToCartProp,
}: ProductQuickViewModalProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const [feedback, setFeedback] = useState<"cart" | "wishlist_added" | "wishlist_removed" | null>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const wishlist = useWishlistOptional();
  const cart = useCartOptional();

  const { data: product, error, isLoading: loading, mutate } = useSWR<ProductDetail | null>(
    productId ? ["product", productId] : null,
    () => (productId ? fetchProduct(productId) : null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  useEffect(() => {
    if (product) {
      setImageIndex(0);
      const firstId = product.variants?.[0]?.id ?? null;
      setSelectedVariantId(firstId);
    } else if (!productId) {
      setSelectedVariantId(null);
    }
  }, [productId, product]);

  const isInWishlist = product && wishlist ? wishlist.isInWishlist(product.id) : false;
  const isInCart = product && selectedVariantId && cart ? cart.isInCart(product.id, selectedVariantId) : false;

  useEffect(() => {
    if (!feedback) return;
    const t = setTimeout(() => setFeedback(null), 2500);
    return () => clearTimeout(t);
  }, [feedback]);

  const handleAddToCart = async (productId: string, variantId: string) => {
    if (onAddToCartProp) {
      await Promise.resolve(onAddToCartProp(productId, variantId));
      setFeedback("cart");
    } else if (cart) {
      await cart.addToCart(productId, variantId);
      setFeedback("cart");
    }
  };

  const handleWishlistClick = async () => {
    if (!product || !wishlist) return;
    const wasInWishlist = wishlist.isInWishlist(product.id);
    await wishlist.toggleWishlist(product.id);
    setFeedback(wasInWishlist ? "wishlist_removed" : "wishlist_added");
  };

  useEffect(() => {
    if (!productId) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [productId, onClose]);

  useEffect(() => {
    if (!productId || !contentRef.current) return;
    const el = contentRef.current;
    const focusables = getFocusableElements(el);
    if (focusables.length) focusables[0].focus();
  }, [productId, loading, error, product]);

  useEffect(() => {
    if (!productId || !contentRef.current) return;
    const el = contentRef.current;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      const focusables = getFocusableElements(el);
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    el.addEventListener("keydown", handleKeyDown);
    return () => el.removeEventListener("keydown", handleKeyDown);
  }, [productId, loading, error, product]);

  if (!productId) return null;

  const selectedVariant = product?.variants?.find((v) => v.id === selectedVariantId);
  const rawPrice = selectedVariant
    ? `₹${selectedVariant.price}`
    : product?.variants?.[0]
      ? `₹${product.variants[0].price}`
      : null;
  const displayPrice = formatRoundedPrice(rawPrice);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="quick-view-title"
    >
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        ref={contentRef}
        className="relative w-full max-w-lg sm:max-w-2xl lg:max-w-4xl max-h-[90vh] min-h-[min(24rem,80vh)] overflow-auto rounded-soft-2xl border border-border bg-card shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        {loading && (
          <div className="p-8 flex items-center justify-center min-h-[200px]">
            <p className="text-neutral-500">Loading…</p>
          </div>
        )}
        {error && (
          <div className="p-8">
            <p className="text-red-600">{error instanceof Error ? error.message : "Failed to load product"}</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium"
            >
              Close
            </button>
          </div>
        )}
        {!loading && !error && product && (
          <div className="relative py-6 px-4 sm:px-6">
            <button
              type="button"
              aria-label="Close"
              onClick={onClose}
              className="absolute top-4 right-4 sm:right-6 z-10 p-2 rounded-soft-lg hover:bg-neutral-100 text-neutral-600"
            >
              <span className="text-lg leading-none">×</span>
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 lg:gap-6 sm:items-center">
              <div className="flex justify-center items-center sm:min-h-[320px] lg:min-h-[400px]">
                <ProductImageGallery
                  images={product.images ?? []}
                  imageIndex={imageIndex}
                  onImageIndexChange={setImageIndex}
                  productTitle={product.title}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  priority
                  stopPropagation
                />
              </div>
              <div className="flex flex-col">
                <h2 id="quick-view-title" className="font-display text-xl text-foreground">
                  {product.title}
                </h2>
                {product.brand && (
                  <p className="text-sm text-neutral-500 mt-0.5">{product.brand.name}</p>
                )}
                {displayPrice && (
                  <p className="text-lg font-medium text-foreground mt-2">{displayPrice}</p>
                )}
                {product.variants && product.variants.length > 0 && (
                  <div className="mt-3">
                    <p className="text-xs font-medium text-accent-sand uppercase tracking-wide mb-2">
                      Size
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {product.variants.map((v) => (
                        <button
                          key={v.id}
                          type="button"
                          onClick={() => setSelectedVariantId(v.id)}
                          className={`px-3 py-1.5 rounded-soft-lg border text-sm font-medium transition-colors ${
                            selectedVariantId === v.id
                              ? "border-accent-sand bg-accent-sand text-foreground"
                              : "border-border bg-card text-foreground hover:bg-neutral-100"
                          }`}
                        >
                          {v.option1 ?? v.id.slice(0, 8)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {feedback && (
                  <p
                    role="status"
                    className="mt-2 text-sm font-medium text-green-600"
                    aria-live="polite"
                  >
                    {feedback === "cart"
                      ? "Added to cart"
                      : feedback === "wishlist_added"
                        ? "Added to wishlist"
                        : "Removed from wishlist"}
                  </p>
                )}
                <div className="mt-8 flex flex-row gap-2">
                  <button
                    type="button"
                    disabled={!selectedVariantId}
                    onClick={() => {
                      if (product && selectedVariantId) handleAddToCart(product.id, selectedVariantId);
                    }}
                    className={`flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-soft-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity ${
                      isInCart ? "bg-green-600 text-white" : "bg-accent-blush text-foreground"
                    }`}
                  >
                    <CartIcon className="shrink-0 w-[18px] h-[18px]" />
                    <span className="truncate">{isInCart ? "In cart" : "Add to cart"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleWishlistClick}
                    aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
                    className="flex-1 min-w-0 inline-flex items-center justify-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 rounded-soft-lg bg-accent-blush text-foreground text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    {isInWishlist ? (
                      <HeartFilledIcon className="shrink-0 w-[18px] h-[18px] text-red-500" />
                    ) : (
                      <HeartOutlineIcon className="shrink-0 w-[18px] h-[18px]" />
                    )}
                    <span className="truncate">{isInWishlist ? "In wishlist" : "Add to wishlist"}</span>
                  </button>
                </div>
                <p className="mt-8 text-sm">
                  <Link
                    href={`/browse/${product.id}`}
                    onClick={onClose}
                    className="text-primary-cta hover:underline"
                  >
                    View full details
                  </Link>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
