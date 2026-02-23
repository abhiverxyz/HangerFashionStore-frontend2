import { apiFetchWithAuth } from "./client";

export interface WishlistItemProduct {
  id: string;
  title: string;
  brandId: string;
  brand?: { id: string; name: string; logoUrl: string | null };
  images?: { id: string; src: string; alt: string | null; position: number }[];
  variants?: { id: string; price: string; option1: string | null }[];
}

export interface WishlistItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  createdAt: string;
  product?: WishlistItemProduct;
}

export interface ListWishlistResponse {
  items: WishlistItem[];
}

export interface WishlistContainsResponse {
  inWishlist: boolean;
}

/** GET /api/wishlist - list current user's wishlist (auth required) */
export async function listWishlist(): Promise<ListWishlistResponse> {
  return apiFetchWithAuth<ListWishlistResponse>("/api/wishlist");
}

/** POST /api/wishlist - add item; body: { productId, variantId? } (auth required) */
export async function addToWishlist(
  productId: string,
  variantId?: string | null
): Promise<WishlistItem> {
  return apiFetchWithAuth<WishlistItem>("/api/wishlist", {
    method: "POST",
    body: JSON.stringify({ productId, variantId: variantId ?? null }),
  });
}

/** DELETE /api/wishlist - remove item (auth required) */
export async function removeFromWishlist(
  productId: string,
  variantId?: string | null
): Promise<void> {
  return apiFetchWithAuth<void>("/api/wishlist", {
    method: "DELETE",
    body: JSON.stringify({ productId, variantId: variantId ?? null }),
  });
}

/** GET /api/wishlist/contains?productId=&variantId= - check if in wishlist (auth required) */
export async function wishlistContains(
  productId: string,
  variantId?: string | null
): Promise<boolean> {
  const params = new URLSearchParams({ productId });
  if (variantId != null && variantId !== "") params.set("variantId", variantId);
  const res = await apiFetchWithAuth<WishlistContainsResponse>(
    `/api/wishlist/contains?${params.toString()}`
  );
  return res.inWishlist;
}
