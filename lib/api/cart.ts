import { apiFetchWithAuth } from "./client";

export interface CartItemProduct {
  id: string;
  title: string;
  brandId: string;
  brand?: { id: string; name: string; logoUrl: string | null };
  images?: { id: string; src: string; alt: string | null; position: number }[];
  variants?: { id: string; price: string; option1: string | null }[];
}

export interface CartItem {
  id: string;
  userId: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: CartItemProduct;
}

export interface ListCartResponse {
  items: CartItem[];
}

export interface CartContainsResponse {
  inCart: boolean;
}

/** GET /api/cart - list current user's cart (auth required) */
export async function listCart(): Promise<ListCartResponse> {
  return apiFetchWithAuth<ListCartResponse>("/api/cart");
}

/** POST /api/cart - add item; body: { productId, variantId?, quantity? } (auth required) */
export async function addToCart(
  productId: string,
  variantId?: string | null,
  quantity?: number
): Promise<CartItem> {
  return apiFetchWithAuth<CartItem>("/api/cart", {
    method: "POST",
    body: JSON.stringify({ productId, variantId: variantId ?? null, quantity: quantity ?? 1 }),
  });
}

/** DELETE /api/cart - remove item (auth required) */
export async function removeFromCart(
  productId: string,
  variantId?: string | null
): Promise<void> {
  return apiFetchWithAuth<void>("/api/cart", {
    method: "DELETE",
    body: JSON.stringify({ productId, variantId: variantId ?? null }),
  });
}

/** GET /api/cart/contains?productId=&variantId= - check if in cart (auth required) */
export async function cartContains(
  productId: string,
  variantId?: string | null
): Promise<boolean> {
  const params = new URLSearchParams({ productId });
  if (variantId != null && variantId !== "") params.set("variantId", variantId);
  const res = await apiFetchWithAuth<CartContainsResponse>(
    `/api/cart/contains?${params.toString()}`
  );
  return res.inCart;
}
