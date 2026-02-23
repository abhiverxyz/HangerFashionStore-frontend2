# Shared product UX (finalized plan) — **COMPLETE**

**Goal:** Implement the shared product tile, product quick-view modal, and align the product detail page so the same pattern is used everywhere (browse, search, microstores, Concierge, wardrobe, wishlist).

**Status:** Shared product UX is complete. ProductTile, ProductQuickViewModal, and product detail page are implemented with consistent wishlist/cart state, accent styling (sand/blush), and sections (Product details, Product description, Delivery timelines).

**Requirements summary:**

| # | Requirement | Where |
|---|-------------|--------|
| 1 | **Price in bottom bar** of product tile (title, brand, **price**) | ProductTile |
| 2 | **Wishlist icon on the product photo**; visible **on hover**; when in wishlist, show **different colour** (e.g. filled heart) | ProductTile (image overlay) |
| 3 | **Add to cart from modal** by **selecting size** (variant) in the modal, then Add to cart | ProductQuickViewModal |

**Current status:**
- **Shared product UX: complete.** Design foundation and F1 (auth, shell, profile) are done.
- Browse page uses `ProductTile` and `ProductQuickViewModal`; product detail page has wishlist and cart CTAs, Product description, and Delivery timelines (Tags removed).
- **Wishlist and cart state persist** via backend and are shared across product tile, quick-view modal, and product detail page (see **Persistence** below).
- Styling: size indicator accent-sand; Add to cart / Add to wishlist buttons accent-blush; cart button turns green when item is in cart; feedback toasts in modal (“Added to cart”, “Added to wishlist”).

**Persistence (wishlist & cart):**
- Backend: `GET/POST/DELETE /api/wishlist`, `GET /api/wishlist/contains`; `GET/POST/DELETE /api/cart`, `GET /api/cart/contains`. Same data is used for "My wishlist" and "My cart" pages later.
- Frontend: `WishlistProvider` and `CartProvider` (in root layout) hold server-backed state; `useWishlist()` and `useCart()` expose `isInWishlist(productId, variantId?)`, `isInCart(productId, variantId?)`, `toggleWishlist`, `addToCart`, `removeFromCart`, and `items` for list pages.
- When not authenticated, wishlist/cart appear empty and add/toggle are no-ops.

**Reference:** [backend2/docs/IMPLEMENTATION_PLAN_PHASES.md](../backend2/docs/IMPLEMENTATION_PLAN_PHASES.md) — “Shared product UX (tile, modal, detail page)” and implementation order.

---

## Step 1: ProductTile component

**File:** `frontend2/components/ProductTile.tsx`

**Props:**
- `product`: `ProductSummary` (from `@/lib/api/products`) — has `id`, `title`, `brand`, `images`. Extend or accept optional `price?: string` for display (see below).
- `price?: string | null` — optional display price (e.g. "₹999" or "From ₹599"). If list API does not return price, add to backend list response later or pass from parent; until then omit or show only in modal/detail.
- `isInWishlist?: boolean` — when true, wishlist icon shows in **selected** state (e.g. filled heart, accent colour). When false, outline heart.
- `onWishlistClick?: (e: React.MouseEvent) => void` — called when user clicks wishlist icon. Call `e.stopPropagation()` in handler so tile click (modal open) does not fire.
- `onClick?: (e: React.MouseEvent) => void` — if provided, call on tile click (open modal); prevent default navigation. If not provided, tile is a `Link` to `/browse/[id]`.

**Layout:**
- Wrapper: card style — `border border-border rounded-soft-xl overflow-hidden bg-card shadow-soft hover:shadow-soft-hover transition-shadow`. Add `group` for hover. Cursor pointer when `onClick` provided.
- **Image block (top):** aspect-square, relative. `next/image` with `fill`, `sizes` as before. Placeholder if no image.
  - **Wishlist icon on photo:** Absolutely positioned (e.g. top-right) **on the image**. Visible **on hover**: use `opacity-0 group-hover:opacity-100 transition-opacity` (and on touch, consider always visible or show on first tap). Icon: heart outline when `!isInWishlist`; **filled heart** in distinct colour (e.g. `text-red-500` or primary) when `isInWishlist`. Button has `aria-label`; on click call `onWishlistClick?.(e)` and `e.stopPropagation()`.
- **Bottom bar:** padding `p-3` — **title** `font-medium text-sm text-foreground line-clamp-2`, **brand** `text-xs text-neutral-500 mt-0.5`, **price** `text-sm font-medium text-foreground mt-0.5`. Show price when `price` prop or `product.price` is available; otherwise omit line.

**Click behavior:** If `onClick` provided: wrapper is `div`, call `onClick` on click. Else: wrapper is `Link` to `/browse/[product.id]`.

**Export:** Named export `ProductTile`. Use design tokens (no raw gray).

**Price on tile:** Backend list may not return price yet. Options: extend backend to return a display price (e.g. min/first variant); or extend `ProductSummary` with `price?: string` and pass when available. Prefer backend so tile can show price without extra requests.

---

## Step 2: ProductQuickViewModal component

**File:** `frontend2/components/ProductQuickViewModal.tsx`

**Props:**
- `productId: string | null` — when non-null, modal is open and content is for this product.
- `onClose: () => void` — called when user closes modal (backdrop click, close button, or after "View full details").
- `onAddToCart?: (variantId: string) => void` — optional; called when user clicks Add to cart with selected variant id. No-op until cart API is wired.

**Behavior:**
- When `productId` is null: render nothing (or null).
- When `productId` is set: fetch product by id (`fetchProduct(productId)` from `@/lib/api/products`), show loading state inside modal, then show content.
- Modal: overlay (backdrop) + centered card. Backdrop click or explicit close button calls `onClose`. Accessible: focus trap, Escape to close, aria-modal, role="dialog".

**Content (once loaded):**
- Product image, title, brand. Price from first variant or **selected variant** (update when size changes).
- **Size / variant selector:** If `product.variants` exists and length > 0, show size selector (e.g. buttons using `variant.option1` as label; store `variant.id`). State: `selectedVariantId: string | null` (default first variant). Single variant: show as one option or no selector.
- Short description or "View full details for more".
- **Actions:** (1) **Add to cart** — enabled when a variant is selected; on click call `onAddToCart(selectedVariantId)`. (2) Add to wishlist (optional, no-op until API). (3) **View full details** — navigate to `/browse/[id]`, then `onClose()`.

**Layout:**
- Modal overlay: fixed inset, z-50, semi-transparent backdrop. Content box: max-w-lg, max-h-[90vh] overflow-auto, centered, bg-card, rounded-soft-2xl, border, shadow. Inner: image + details (title, brand, price, size selector, short text, action buttons); padding p-6.

---

## Step 3: Wire browse page to tile + modal

**File:** `frontend2/app/(user)/browse/page.tsx`

**Changes:**
- Import `ProductTile` and `ProductQuickViewModal`.
- Add state: `selectedProductId: string | null`. When user clicks a tile, set `selectedProductId` to that product’s id (and do not navigate).
- Render grid of `ProductTile` for each item; pass `product={p}`, `onClick={(e) => { e.preventDefault(); setSelectedProductId(p.id); }}`. Use a wrapper: either each tile is a `Link` with `onClick` that prevents default and sets state, or each tile is a `ProductTile` with `onClick` so it doesn’t render a Link (recommended: `ProductTile` with `onClick` so it doesn’t navigate).
- Render `ProductQuickViewModal productId={selectedProductId} onClose={() => setSelectedProductId(null)} />`.
- **Mobile:** Either (a) same modal (scrollable), or (b) on small screens don’t pass `onClick` so tile links straight to `/browse/[id]`. Plan says “choose one and keep consistent” — recommend (a) same modal for consistency.

**Result:** Clicking a product on browse opens the quick-view modal; “View full details” goes to `/browse/[id]`.

---

## Step 4: Product detail page — add CTAs and align with plan

**File:** `frontend2/app/(user)/browse/[id]/page.tsx`

**Changes:**
- Add “Add to wishlist” and “Add to cart” buttons (or placeholders). If backend APIs are not yet integrated, render buttons as disabled or with a tooltip “Coming soon” so the layout is in place.
- Ensure back link is “← Back to browse” (already present). Optional: breadcrumb or context (e.g. “From Search”) later.
- No modal on this page; this is the full product experience. Optional: ensure meta title/description use product title for SEO.

---

## Step 5: Optional — URL for modal (deep link / share)

- If you want the modal to be open when the user lands with a query (e.g. `/browse?product=123`), then on browse page read `searchParams.product`, set initial `selectedProductId` from it, and when opening modal update the URL (e.g. `router.replace('/browse?product=123')`) and on close clear it. “View full details” then goes to `/browse/123` and clears query. This step can be deferred.

---

## Step 6: Reuse checklist (for later phases)

After this step, when implementing F2 (Concierge), F3 (Search), F5 (Closet), F6 (MicroStores), use:
- **ProductTile** for every product in a grid/list (pass `product`, optional `onClick` to open modal, optional `showWishlist` / `showCart` when those APIs exist).
- **ProductQuickViewModal** with a single `selectedProductId` in parent state; open it when a tile is clicked.

No new product card or modal variants; one tile, one modal, one detail page.

---

## Implementation order (this step only)

1. **ProductTile.tsx** — Card with image (wishlist icon on photo, visible on hover; filled/different colour when `isInWishlist`), bottom bar (title, brand, price). Optional `onClick` for modal; `onWishlistClick` with stopPropagation. Props: `price?`, `isInWishlist?`.
2. **ProductQuickViewModal.tsx** — Fetch by id; image, title, brand, price; size/variant selector; Add to cart with selected variant; Add to wishlist; View full details. Prop: `onAddToCart?(variantId)`. Accessible.
3. **browse/page.tsx** — Use ProductTile (price if available; wishlist state later); modal state; ProductQuickViewModal; optional `onAddToCart` stub.
4. **browse/[id]/page.tsx** — Wishlist and cart CTAs; size selector for cart when multiple variants.
5. (Optional) `docs/PRODUCT_UX.md` — Reference for tile/modal/detail and reuse.
6. (Optional) Query param `?product=id` for modal deep link.

---

## Files to create or modify

| Action | File |
|--------|------|
| Create | `frontend2/components/ProductTile.tsx` |
| Create | `frontend2/components/ProductQuickViewModal.tsx` |
| Modify | `frontend2/app/(user)/browse/page.tsx` (use ProductTile, add modal state and ProductQuickViewModal) |
| Modify | `frontend2/app/(user)/browse/[id]/page.tsx` (add wishlist/cart CTAs or placeholders) |
| Optional | `frontend2/docs/PRODUCT_UX.md` (short reference for tile/modal/detail) |

---

## Types and API

- **ProductSummary** and **ProductDetail** are in `frontend2/lib/api/products.ts`. `ProductDetail` has `variants?: { id, price, option1 }[]` for size selector and Add to cart. ProductQuickViewModal uses `fetchProduct(id)` for full detail.
- **Price on tile:** Backend list API may not return price. Extend `ProductSummary` with optional `price?: string` when backend adds it, or omit on tile until then; modal and detail page already have price from variants.
- **Wishlist:** `isInWishlist` can come from a wishlist API (e.g. list of product ids) or context; for now parent can pass `false` and `onWishlistClick` can be a no-op or call a stub. When F5 (Closet) wires wishlist API, connect here.
- **Cart:** `onAddToCart(variantId)` can be no-op or show toast "Added" until cart API is wired in F5. Modal and detail page both need variant selection when product has multiple variants.
