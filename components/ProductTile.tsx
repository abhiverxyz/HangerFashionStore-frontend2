"use client";

import Image from "next/image";
import Link from "next/link";
import type { ProductSummary } from "@/lib/api/products";
import { HeartFilledIconTile, HeartOutlineIconTile } from "@/components/icons/ProductActionsIcons";
import { IMAGE_BLUR_DATA_URL } from "@/lib/constants";
import { formatRoundedPrice } from "@/lib/utils/price";

export interface ProductTileProps {
  product: ProductSummary;
  /** Optional display price (e.g. "₹999" or "From ₹599") */
  price?: string | null;
  isInWishlist?: boolean;
  onWishlistClick?: (e: React.MouseEvent) => void;
  /** If provided, tile click opens modal; else tile is a Link to detail page */
  onClick?: (e: React.MouseEvent) => void;
  /** Set to true for above-the-fold tiles so the image loads with priority */
  priority?: boolean;
}

export function ProductTile({
  product,
  price,
  isInWishlist = false,
  onWishlistClick,
  onClick,
  priority = false,
}: ProductTileProps) {
  const variantPrice = product.variants?.[0];
  const rawPrice =
    variantPrice != null && variantPrice.price != null
      ? String(variantPrice.price)
      : null;
  const displayPrice =
    price ?? product.price ?? (rawPrice != null ? `₹${rawPrice}` : null);
  const displayPriceRounded = formatRoundedPrice(displayPrice);
  const hasClickHandler = typeof onClick === "function";

  const imageBlock = (
    <div className="aspect-[4/5] sm:aspect-square bg-neutral-100 relative">
      {product.images?.[0] ? (
        <Image
          src={product.images[0].src}
          alt={product.images[0].alt || product.title}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          placeholder="blur"
          blurDataURL={IMAGE_BLUR_DATA_URL}
          {...(priority ? { priority: true } : {})}
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
          No image
        </span>
      )}
      {onWishlistClick && (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onWishlistClick(e);
          }}
          aria-label={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
          className={`absolute top-2 right-2 p-1.5 rounded-full bg-card/90 backdrop-blur-sm transition-opacity focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary z-10 ${
            isInWishlist ? "opacity-100 text-red-500" : "opacity-0 group-hover:opacity-100"
          }`}
        >
          {isInWishlist ? (
            <HeartFilledIconTile className="text-red-500 w-5 h-5" />
          ) : (
            <HeartOutlineIconTile className="text-foreground w-5 h-5" />
          )}
        </button>
      )}
    </div>
  );

  const bottomBar = (
    <div className="p-4 min-h-[6rem] flex flex-col justify-end gap-2">
      <p className="font-medium text-sm text-foreground line-clamp-2">{product.title}</p>
      {product.brand && (
        <p className="text-xs text-neutral-500">{product.brand.name}</p>
      )}
      <p className="text-sm font-medium text-foreground">
        {displayPriceRounded ?? "—"}
      </p>
    </div>
  );

  const cardClass =
    "border border-border rounded-soft-xl overflow-hidden bg-card shadow-soft hover:shadow-soft-hover transition-shadow group " +
    (hasClickHandler ? "cursor-pointer" : "");

  if (hasClickHandler) {
    return (
      <div
        role="button"
        tabIndex={0}
        className={cardClass}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick(e as unknown as React.MouseEvent);
          }
        }}
      >
        {imageBlock}
        {bottomBar}
      </div>
    );
  }

  return (
    <Link href={`/browse/${product.id}`} className={cardClass}>
      {imageBlock}
      {bottomBar}
    </Link>
  );
}
