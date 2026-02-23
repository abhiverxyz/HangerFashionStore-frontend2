import type { SearchProductItem } from "@/lib/api/search";
import type { ProductSummary } from "@/lib/api/products";

/**
 * Map a search/browse list item (e.g. SearchProductItem) to ProductSummary for ProductTile.
 * Centralized to avoid duplication across browse, search, and future listing surfaces.
 */
export function searchItemToProductSummary(p: SearchProductItem): ProductSummary {
  return {
    id: p.id,
    title: p.title,
    status: p.status ?? "active",
    brandId: p.brandId ?? p.brand?.id ?? "",
    brand: p.brand,
    images: p.images,
    variants: p.variants,
    price: p.price ?? (p.variants?.[0] ? `₹${p.variants[0].price}` : null),
  };
}
