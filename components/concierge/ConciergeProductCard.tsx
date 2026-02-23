"use client";

import Link from "next/link";
import type { ProductCard } from "@/lib/api/conversations";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

export interface ConciergeProductCardProps {
  product: ProductCard;
  onOpenQuickView?: (productId: string) => void;
}

export function ConciergeProductCard({ product, onOpenQuickView }: ConciergeProductCardProps) {
  const accessToken = useStorageAccessToken();
  const href = `/browse/${product.id}`;
  const src = getImageDisplayUrl(product.imageUrl, accessToken);

  return (
    <div className="rounded-soft-lg border border-border bg-card shadow-soft overflow-hidden transition-shadow hover:shadow-soft-hover">
      <Link
        href={href}
        className="block"
        onClick={(e) => {
          if (onOpenQuickView) {
            e.preventDefault();
            onOpenQuickView(product.id);
          }
        }}
      >
        <div className="aspect-square bg-neutral-100 relative">
          {src ? (
            <img
              src={src}
              alt={product.title || product.id}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
              No image
            </span>
          )}
        </div>
        <div className="p-3 min-h-[4rem]">
          <p className="text-sm font-medium text-foreground line-clamp-2">{product.title || product.id}</p>
          {product.brandName && (
            <p className="text-xs text-neutral-500 mt-0.5">{product.brandName}</p>
          )}
        </div>
      </Link>
    </div>
  );
}
