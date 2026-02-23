# Brand page → Brand zones: review and plan

## Problem

- **Nav "Brands"** in the header pointed to **`/brand`** (singular), which is the **brand admin** page.
- Brand admin uses `useRequireAuth("brand")`, so only users with role `brand` can see it. Regular users were sent to the login screen or an empty/redirect state.
- The **user-facing brand zones** (list of brands to discover and follow) live at **`/brands`** and **`/brands/[id]`**, but the main nav did not link there.

So the brand page was effectively “pointing to” the wrong experience (admin / login) instead of the brand zones list.

## Fix applied

- **AppHeader** (`components/AppHeader.tsx`): changed the "Brands" nav item from `href: "/brand"` to `href: "/brands"`.
- **Result:** Clicking "Brands" in the main app now goes to the brand zones list (`/brands`). Brand admin stays at `/brand` and is only reached when a brand user logs in (home page redirects them to `/brand`).

## Current behavior (after fix)

| Route        | Purpose                    | Who uses it        |
|-------------|----------------------------|--------------------|
| **`/brands`**   | List of brand zones (discover, follow) | All users (main nav) |
| **`/brands/[id]`** | Single brand zone detail; follow; “View products” → browse by brand | All users          |
| **`/brand`**    | Brand admin (zone edit, microstores, analytics) | Brand users only (redirect from home when `role === "brand"`) |

## Optional follow-ups (per F7)

1. **Brand list personalization**  
   Backend: ensure `GET /api/brands` supports personalized order when the user is authenticated (and returns it). Frontend: use that order as-is (no client reorder).

2. **Search on Brands page**  
   Add the shared SearchBar with `variant="brands"` and placeholder “Discover brands you love by mood, style or anything”; call brand search API and show results (or integrate with Find search if brands are part of the same search).

3. **Brand detail as “zone”**  
   Optionally enrich `/brands/[id]` with:
   - Featured or curated products for that brand (e.g. top N or “picked for you”).
   - Microstores by this brand (if backend exposes them), with links to `/microstores/[id]`.

4. **Auth on `/brands`**  
   If the brands API requires auth, keep using the same auth as the rest of the (user) app; if it can be public, consider `optionalAuth` so the list is visible when logged out (follow button can prompt login).

## Key files

| Area        | File |
|------------|------|
| Nav link   | `frontend2/components/AppHeader.tsx` (updated) |
| Brand zones list | `frontend2/app/(user)/brands/page.tsx` |
| Brand zone detail | `frontend2/app/(user)/brands/[id]/page.tsx` |
| Brand admin | `frontend2/app/brand/page.tsx` |
| Home redirect (brand user) | `frontend2/app/page.tsx` (sends `role === "brand"` to `/brand`) |
