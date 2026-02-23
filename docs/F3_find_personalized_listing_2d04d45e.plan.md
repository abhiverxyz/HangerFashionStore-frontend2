# F3 Find: Personalized listing order (no search)

## Goal

When the user is on the Find page **without** a search (default catalog / browse), the product listing order should be a **ranking** that accounts for:

- **Diversity** — avoid long runs of same category or brand
- **Freshness** — surface recently updated products
- **User profile and preferences** — style match and followed brands
- **Visit-based refresh** — after every N visits to Find/browse, vary the ranking so the same order is not repeated

## Current state

- **Catalog source:** Browse page calls `fetchProducts({ limit, offset })` when not in search mode. Products API uses `apiFetch` (no auth), so the backend often does not receive `userId` and does not personalize.
- **Backend:** GET /api/products uses `optionalAuth` and, when `req.userId` is set, calls `scoreAndOrderProducts`. Personalization scores by profile (styleKeywords, formality vs mood_vibe, category_lvl1, occasion_primary) and recent product engagement (UserEvent with productId). It does **not** use: diversity, product freshness (updatedAt), followed brands, or visit count.
- **Base order:** `listProducts` returns items with `orderBy: { updatedAt: "desc" }`; that order is then replaced by `scoreAndOrderProducts` when authenticated.
- **Visit tracking:** No "find visit" event exists. Analytics supports `brand_page_view` and `microstore_view` only; UserEvent can be reused for find_visit.

---

## Speed and performance (Find page must stay fast)

### Principles

- **One request blocks first paint:** Only GET /api/products should be on the critical path for "Find page ready". Visit tracking must not block render or user perception of speed.
- **Minimize extra DB work:** Adding findVisitCount must not add a second round of DB calls; keep a single parallel fetch.
- **Keep scoring cheap:** Freshness, diversity, and visit-based refresh run in-memory on the current page only (e.g. 24–100 items); no extra DB or heavy work.

### Frontend — visit tracking must not block

- **trackFindVisit()** is **fire-and-forget**: do **not** await it for rendering or "page ready".
- Call it **after** the catalog request or first paint:
  - After `fetchProducts()` is in flight or resolved, or
  - In `requestIdleCallback` / `setTimeout(..., 0)` so the products request runs first.
- **Result:** One request (GET /api/products with auth) drives what the user sees; the track request runs in the background.

### Backend — minimize extra DB work

- **getPersonalizationContext:** Add `findVisitCount` without a second round-trip:
  - Add one query in the existing `Promise.all`:  
    `prisma.userEvent.count({ where: { userId: uid, eventType: 'find_visit' } })`  
    (one more query in parallel; no extra latency tail.)
- **Optional (later):** Short TTL cache (e.g. 30–60 s) for `getPersonalizationContext(userId)` so rapid reloads or pagination do not hit DB every time.

### Backend — keep scoring cheap

- Scoring and diversity run **in-memory** on the current page. No extra DB.
- Keep algorithms **O(n)** or **O(n log n)** (e.g. one sort, one diversity pass). No embedding or heavy calls in this path.

### Testing for speed

**Manual / dev**

- **Find (browse, no search) load:** Open `/browse` with auth; in DevTools Network:
  - **Waterfall:** GET /api/products is the only request that blocks first paint; POST /api/analytics/track (find_visit) should start after or in parallel and not block.
  - **Timing:** Note TTFB and full response time for GET /api/products. Compare with personalization disabled (no auth); delta should be small (e.g. < 50–100 ms).
- **LCP:** Measure LCP or time until product grid is visible with auth + track; should be effectively the same as without track.

**Automated (optional)**

- **E2E:** Load `/browse` with auth; assert product grid visible within a threshold (e.g. < 3 s). No need to assert on track.
- **Backend:** Unit test that `scoreAndOrderProducts` + diversity + refresh complete in < X ms for 100 items (e.g. X = 50 ms).

**Performance budget (optional)**

- E.g. "GET /api/products (authenticated, personalized) p95 < 400 ms" and "Find page LCP < 2.5 s" on a reference device/network; check in CI or periodically.

---

## Architecture (high level)

- Frontend: fetchProducts with auth; on browse load (no search), call POST /api/analytics/track with `eventType: "find_visit"` once, fire-and-forget.
- Backend: listProducts → getPersonalizationContext (profile, followIds, recentIds, **findVisitCount**) → scoreAndOrderProducts (profile + freshness + preferences + diversity + visit-based refresh) → return ordered items.

---

## Implementation plan

### 1. Frontend: send auth for product list and record find visit

- **Products API:** In `frontend2/lib/api/products.ts`, use `apiFetchWithAuth` instead of `apiFetch` for `fetchProducts` so the backend receives the user.
- **Find visit:** When the browse page mounts and is **not** in search mode, call track once per page load (e.g. after first catalog fetch or in requestIdleCallback). **Do not await** — fire-and-forget. Add `trackFindVisit()` that POSTs to `/api/analytics/track` with `{ eventType: "find_visit" }` using `apiFetchWithAuth`. Call from browse page when `!isSearchMode` on first load only.

### 2. Backend: record find_visit and expose visit count

- **Analytics:** In `backend2/src/routes/analytics.js`, accept `eventType: "find_visit"`. When `eventType === "find_visit"` and `req.userId` is set, call `appendHistory(req.userId, { eventType: "find_visit" })`. Return 200. If no userId, return 200 (no-op).
- **Personalization context:** In `backend2/src/domain/personalization/personalization.js`, extend `getPersonalizationContext(userId)` to return **findVisitCount**: add to the existing `Promise.all` one query: `prisma.userEvent.count({ where: { userId: uid, eventType: "find_visit" } })`. Return `{ profile, followedBrandIds, followedMicrostoreIds, recentProductIds, findVisitCount }`.

### 3. Backend: scoring — freshness and preferences

- **Freshness:** In `scoreAndOrderProducts`, add a score component from `product.updatedAt` (normalize to 0–1 in the current set). Weight e.g. 0.15–0.2.
- **Preferences (followed brands):** If `product.brandId` is in `followedBrandIds`, add a fixed boost (e.g. 0.25).

### 4. Backend: diversity

- After scoring, apply a **diversity pass** when building the ordered list (e.g. greedy: prefer next item whose category_lvl1 or brandId differs from the last K chosen; K = 2). Use only when `context.listingType === "products"`.

### 5. Backend: visit-based refresh

- When `context.listingType === "products"` and `findVisitCount > 0` and `findVisitCount % N === 0` (e.g. N = 5, env `FIND_VISIT_REFRESH_INTERVAL`):
  - **Option A:** Slightly increase freshness weight for this request (e.g. 1.5x).
  - **Option B:** Add small deterministic jitter (hash of productId + floor(findVisitCount / N)).

### 6. Products route

- Pass context that includes `listingType: "products"` and ensure `scoreAndOrderProducts` receives `findVisitCount` (from its internal getPersonalizationContext). No double fetch of context.

---

## Files to touch

| Area | File | Change |
|------|------|--------|
| Frontend | `frontend2/lib/api/products.ts` | Use `apiFetchWithAuth` for `fetchProducts`. |
| Frontend | `frontend2/lib/api/analytics.ts` (new or extend) | Add `trackFindVisit()` → POST `/api/analytics/track` with `{ eventType: "find_visit" }` using `apiFetchWithAuth`. |
| Frontend | `frontend2/app/(user)/browse/page.tsx` | On mount when not in search mode, call `trackFindVisit()` once, **fire-and-forget** (e.g. after data load or requestIdleCallback). |
| Backend | `backend2/src/routes/analytics.js` | Handle `eventType: "find_visit"`; if userId, call `appendHistory(userId, { eventType: "find_visit" })`. |
| Backend | `backend2/src/domain/personalization/personalization.js` | getPersonalizationContext: add findVisitCount (one count query in Promise.all). scoreAndOrderProducts: freshness, followed-brand boost, diversity pass for listingType "products", visit-based refresh when findVisitCount % N === 0. |
| Backend | `backend2/src/domain/product/product.js` | No change; listProducts already returns updatedAt, brandId, category_lvl1. |

---

## Testing

- **Visit count:** Log in, open browse (no search) multiple times; verify UserEvent rows with eventType `find_visit` and findVisitCount increases. After N visits, verify refresh logic runs.
- **Ranking:** As user with style profile and followed brands, load browse; confirm order differs from unauthenticated and followed-brand products are boosted; confirm diversity (no long runs of same category/brand).
- **Speed:** Confirm track does not block; GET /api/products and LCP within budget (see Speed section above).
- **Anonymous:** Browse without auth still works; no find_visit stored, no personalization; order remains updatedAt desc.

---

## Optional follow-ups

- **Pagination:** For stronger diversity across pages, consider fetching a larger pool, scoring/diversifying, then slicing (later phase).
- **Tuning:** Make freshness weight, diversity lookback K, and N (visit refresh interval) configurable via env.
