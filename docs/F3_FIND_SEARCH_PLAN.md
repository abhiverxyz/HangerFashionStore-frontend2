# F3: Find (Search) — Implementation Plan

This document is the single reference for implementing Frontend Phase F3 (Find / Search), including the shared search bar used on Find, Stores, and Brands pages, personalization, and extensibility for stores/brands.

**Reference:** [backend2/docs/IMPLEMENTATION_PLAN_PHASES.md](../../backend2/docs/IMPLEMENTATION_PLAN_PHASES.md) — Part C Frontend Phase F3.

---

## Summary

**Goal:** 2.1 Find items — natural language and image search; products (and later microstores/brands). **Backend:** B3 Search API (implemented).
In in
**Deliverables:**

- **F3.1** Search UI — Search bar (shared component); call Search API (text and/or image); display results as products grid.
- **F3.2** Refinement — Refine via search bar; link to Concierge for conversational refinement.
- **F3.3** Browse — Keep `/browse`; add clear entry from search (e.g. "Browse all").
- **Search bar in three places** — Same bar on Find, Stores, and Brands pages with context-specific placeholder and image-in-bar support.
- **Personalization** — Backend orders search results by user profile when authenticated; frontend sends auth and does not reorder.

---

## Search bar: three placements and copy

### One search bar, three pages

The **same search bar component** is used in three places:

- **Find page** (`/search`) — product search
- **Stores page** (`/microstores`) — F6, microstore search
- **Brands page** (`/brands`) — F7, brand search

**Shared behavior and UI:**

- Single **text input** (the main search field).
- An **image icon inside the bar** (e.g. right side of the input) to attach an image (upload or paste). User can search by text, by image, or both from within the same bar.
- **Context-specific placeholder** only (no separate label); the placeholder is the sole hint.

**Exact placeholder copy (source of truth):**

| Page    | Placeholder |
|---------|-------------|
| **Find**  | `Search products by vibe, category, occasion or anything` |
| **Store**  | `Find microstores by trend, vibe or anything` |
| **Brands** | `Discover brands you love by mood, style or anything` |

**Implementation:**

- Build a **reusable search bar component** (e.g. `SearchBar` or `ContextSearchBar` in `frontend2/components/`) that accepts:
  - **Variant/context:** `"find"` | `"store"` | `"brands"` (or a `placeholder` string prop).
  - **Value / onChange** for the text input.
  - **Image:** `imageUrl` (or file) and `onImageAttach` / `onImageClear` (or `onImageChange`).
  - **onSubmit** (and submit on Enter).
- Placeholder is set from variant using the strings above.
- **F3:** Use this component on the Find page with the Find placeholder; product search (text + image); product results grid.
- **F6 / F7:** Reuse the same component on Stores and Brands pages with Store and Brands placeholders and their respective search APIs.

---

## Personalization

**Requirement:** Search and ordering of results use user profile when the user is authenticated.

**Backend:**

- `POST /api/search` uses `optionalAuth` but currently does not apply personalization to product results.
- **Change:** After `searchProducts(...)` returns `{ items, total }`, if `req.userId` is set, call `scoreAndOrderProducts(req.userId, items, { listingType: 'search', searchQuery: query })` and return the **ordered** list in the same response shape.
- Microstore search already receives `userId`; brand search can be extended similarly when needed.

**Frontend:**

- Use `apiFetchWithAuth` for search requests so the backend receives the user. **Do not reorder** results on the client; preserve backend order.

---

## Search scope: one entry point, multiple result types

- **One Find/Search experience** at `/search` for products; the **same search bar component** is reused on Stores and Brands pages with different placeholder and API.
- **F3:** Ship with **products-only** on the Find page. Design the result area so it can later show tabs/sections (Products | Stores | Brands) if we add them to the Find page, or keep Stores/Brands search on their own pages (current intent: bar on each of Find, Stores, Brands).
- **Later (F6/F7):** Stores and Brands pages use the shared search bar with Store/Brands placeholders and call `GET /api/search/microstores?q=...` and `GET /api/search/brands?q=...` (or product search with `includeMicrostores`/`includeBrands` if we unify on one endpoint). No separate search pages; same component, different context.

---

## Current state

| Area | Status |
|------|--------|
| **Backend** | `POST /api/search` in `backend2/src/routes/search.js`: body `{ query?, imageUrl?, limit?, offset?, brandId?, category_lvl1?, includeMicrostores?, includeBrands? }` → `{ items, total, microstores?, brands? }`. Product search uses semantic/text + optional image. Personalization not yet applied to product search results (see above). |
| **Frontend API** | `frontend2/lib/api/search.ts`: `searchProducts(params)` with `SearchParams` / `SearchResponse`. |
| **Search page** | `frontend2/app/(user)/search/page.tsx` — stub. |
| **Shared product UX** | ProductTile, ProductQuickViewModal, browse page implemented. |
| **Nav** | AppHeader: Find → `/browse`; change to Find → `/search`. |

---

## Implementation steps

### 1. Backend: personalization for product search

- In `backend2/src/routes/search.js`, after `searchProducts(...)` returns:
  - If `req.userId` and `result.items.length > 0`, call `scoreAndOrderProducts(req.userId, result.items, { listingType: 'search', searchQuery: query })` and set `result.items = ordered`.
- Return same response shape.

### 2. Reusable search bar component

- **File:** `frontend2/components/SearchBar.tsx` (or `ContextSearchBar.tsx`).
- **Props:** `variant: "find" | "store" | "brands"` (or `placeholder?: string`), `value`, `onChange`, `onSubmit`, `imageUrl?: string | null`, `onImageAttach`, `onImageClear`, optional `disabled`, `aria-label`.
- **UI:** Text input with placeholder from variant (see table above); image icon button inside the bar (e.g. right); submit on Enter and optional "Search" button. When image is attached, show thumbnail + clear control (inside or next to bar).
- **Placeholder copy:** Use exact strings from the table in "Search bar: three placements and copy" above.

### 3. Update navigation

- In `frontend2/components/AppHeader.tsx`, change Find nav item from `href: "/browse"` to `href: "/search"`.

### 4. Find page (`frontend2/app/(user)/search/page.tsx`)

- Use **SearchBar** with `variant="find"` and placeholder: "Search products by vibe, category, occasion or anything".
- State: query, imageUrl (from upload via `uploadUserImage`), optional offset for pagination.
- On submit: call `searchProducts({ query, imageUrl, limit, offset })`; display results in a products grid (same layout as browse).
- Grid: ProductTile for each item; onClick opens ProductQuickViewModal; use WishlistContext and CartContext.
- States: initial (prompt to search), loading, empty results, error. "Refine with Concierge" link to `/concierge`. "Browse all products" link to `/browse`.
- Pagination: load more or next/prev using `offset`/`limit` and `total`. Do not reorder; preserve backend order.

### 5. Refinement and browse

- **Refinement:** User can change text/image and search again. Link "Refine with Concierge" to `/concierge`.
- **Browse:** Link "Browse all products" to `/browse`.

### 6. F6 / F7 (later)

- **Stores page:** Add SearchBar with `variant="store"` and placeholder "Find microstores by trend, vibe or anything"; call microstore search API; show microstore results.
- **Brands page:** Add SearchBar with `variant="brands"` and placeholder "Discover brands you love by mood, style or anything"; call brand search API; show brand results.

---

## Files to touch (F3)

| File | Change |
|------|--------|
| `backend2/src/routes/search.js` | Apply `scoreAndOrderProducts` to product results when `req.userId` is set. |
| `frontend2/components/SearchBar.tsx` | New: reusable search bar with variant, placeholder, text + image icon in bar. |
| `frontend2/components/AppHeader.tsx` | Find nav: `href` from `/browse` to `/search`. |
| `frontend2/app/(user)/search/page.tsx` | Full search UI using SearchBar (find), product grid, modal, pagination, refinement link, browse link. |
| `frontend2/lib/api/search.ts` | Optionally extend `SearchProductItem` for ProductTile compatibility. |

---

## Testing

- Find in nav goes to `/search`; search page shows SearchBar with Find placeholder.
- Text search: enter query, submit → results grid; pagination; tile click opens quick view; wishlist/cart work.
- Image search: image icon in bar → upload → search with imageUrl → results; clear image and search again.
- Empty query + no image: prompt to search; empty results: message + Concierge link.
- "Browse all products" → `/browse`; "Refine with Concierge" → `/concierge`.
- When F6/F7 exist: Stores/Brands pages show same SearchBar with Store/Brands placeholders.
