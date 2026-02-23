"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import useSWR from "swr";
import { fetchProduct } from "@/lib/api/products";
import type { ProductDetail } from "@/lib/api/products";
import { useWishlist } from "@/lib/contexts/WishlistContext";
import { useCart } from "@/lib/contexts/CartContext";
import { CartIcon, HeartFilledIcon, HeartOutlineIcon } from "@/components/icons/ProductActionsIcons";
import { ProductImageGallery } from "@/components/ProductImageGallery";
import { formatRoundedPrice } from "@/lib/utils/price";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [imageIndex, setImageIndex] = useState(0);
  const wishlist = useWishlist();
  const cart = useCart();

  const { data: product, error, isLoading: loading } = useSWR<ProductDetail | null>(
    id ? ["product", id] : null,
    () => (id ? fetchProduct(id) : null),
    { revalidateOnFocus: false, dedupingInterval: 60000 }
  );

  useEffect(() => {
    if (product) {
      setImageIndex(0);
      const firstId = product.variants?.[0]?.id ?? null;
      setSelectedVariantId(firstId);
    }
  }, [product]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-12">
        <p className="text-red-600">{error instanceof Error ? error.message : "Not found"}</p>
        <Link href="/browse" className="text-primary-cta hover:underline">
          Back to browse
        </Link>
      </div>
    );
  }

  const images = product.images ?? [];
  const selectedVariant = product.variants?.find((v) => v.id === selectedVariantId);
  const rawPrice = selectedVariant
    ? `₹${selectedVariant.price}`
    : product.variants?.[0]
      ? `From ₹${product.variants[0].price}`
      : null;
  const displayPrice = rawPrice != null ? (rawPrice.startsWith("From ") ? `From ${formatRoundedPrice(rawPrice.slice(5))}` : formatRoundedPrice(rawPrice)) : null;

  const catalogFields: { label: string; value: string | null | undefined }[] = [
    { label: "Product type", value: product.product_type },
    { label: "Category", value: [product.category_lvl1, product.category_lvl2, product.category_lvl3].filter(Boolean).join(" › ") || null },
    { label: "Gender", value: product.gender },
    { label: "Color", value: product.color_primary ?? product.color_family },
    { label: "Fabric", value: product.fabric_primary },
    { label: "Pattern", value: product.pattern },
    { label: "Fit", value: product.fit },
    { label: "Length", value: product.length },
    { label: "Coverage", value: product.coverage },
    { label: "Sleeve", value: product.sleeve_length ?? product.sleeve_style },
    { label: "Style", value: product.style_family },
    { label: "Occasion", value: product.occasion_primary ?? product.occasion_secondary },
    { label: "Mood / vibe", value: product.mood_vibe },
    { label: "Price band", value: product.price_band },
    { label: "Vendor", value: product.vendor },
    { label: "Trends", value: product.trend_tags },
  ].filter((f) => f.value);

  return (
    <div className="space-y-6">
      <Link
        href="/browse"
        className="text-sm text-neutral-600 hover:text-foreground"
      >
        ← Back to browse
      </Link>
      <div className="grid lg:grid-cols-2 gap-8 bg-card rounded-soft-2xl border border-border p-6 lg:p-8 shadow-soft">
        <div className="min-w-0">
          <ProductImageGallery
            images={images}
            imageIndex={imageIndex}
            onImageIndexChange={setImageIndex}
            productTitle={product.title}
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div className="min-w-0">
          <h1 className="font-display text-2xl lg:text-3xl text-foreground">
            {product.title}
          </h1>
          {product.brand && (
            <p className="text-neutral-600 mt-1">{product.brand.name}</p>
          )}
          {displayPrice && (
            <p className="mt-4 text-lg font-medium text-foreground">
              {displayPrice}
            </p>
          )}
          {product.variants && product.variants.length > 0 && (
            <div className="mt-4">
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
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              disabled={!selectedVariantId}
              onClick={() => {
                if (product && selectedVariantId) cart.addToCart(product.id, selectedVariantId);
              }}
              className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-soft-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity ${
                product && selectedVariantId && cart.isInCart(product.id, selectedVariantId)
                  ? "bg-green-600 text-white"
                  : "bg-accent-blush text-foreground"
              }`}
            >
              <CartIcon className="shrink-0 w-[18px] h-[18px]" />
              {product && selectedVariantId && cart.isInCart(product.id, selectedVariantId)
                ? "In cart"
                : "Add to cart"}
            </button>
            <button
              type="button"
              onClick={() => product && wishlist.toggleWishlist(product.id)}
              aria-label={product && wishlist.isInWishlist(product.id) ? "Remove from wishlist" : "Add to wishlist"}
              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-soft-lg bg-accent-blush text-foreground text-sm font-medium hover:opacity-90 transition-opacity"
            >
              {product && wishlist.isInWishlist(product.id) ? (
                <HeartFilledIcon className="shrink-0 w-[18px] h-[18px] text-red-500" />
              ) : (
                <HeartOutlineIcon className="shrink-0 w-[18px] h-[18px]" />
              )}
              {product && wishlist.isInWishlist(product.id) ? "In wishlist" : "Add to wishlist"}
            </button>
          </div>
          {catalogFields.length > 0 && (
            <div className="mt-6 pt-6 border-t border-border">
              <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide mb-3">
                Product details
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {catalogFields.map(({ label, value }) => (
                  <div key={label}>
                    <dt className="text-neutral-500">{label}</dt>
                    <dd className="font-medium text-foreground">{value}</dd>
                  </div>
                ))}
              </dl>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide mb-3">
              Product description
            </h2>
            {product.descriptionHtml ? (
              <div
                className="text-neutral-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            ) : (
              <p className="text-sm text-neutral-500">No description available.</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-border">
            <h2 className="text-sm font-medium text-neutral-600 uppercase tracking-wide mb-3">
              Delivery timelines
            </h2>
            <ul className="text-sm text-neutral-700 space-y-2">
              <li><span className="font-medium text-foreground">Standard delivery:</span> 3–5 business days</li>
              <li><span className="font-medium text-foreground">Express:</span> 1–2 business days</li>
              <li><span className="font-medium text-foreground">Free delivery</span> on orders above ₹2,000</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
