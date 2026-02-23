import { useEffect, useRef } from "react";

/**
 * Re-runs search when refinement filters (occasion/vibe) change after the user has
 * already run a search. Uses a ref to avoid running on initial mount or when
 * filters haven't actually changed (e.g. when runSearch identity changes).
 * Prevents duplicate requests and keeps results in sync with the current filters.
 */
export function useRefineSearchOnFilters(
  filterOccasion: string | null,
  filterVibe: string | null,
  options: { submitted: boolean; canSearch: boolean; runSearch: (offset: number) => void }
) {
  const { submitted, canSearch, runSearch } = options;
  const filterRef = useRef({ occasion: filterOccasion, vibe: filterVibe });

  useEffect(() => {
    if (!submitted || !canSearch) return;
    const prev = filterRef.current;
    filterRef.current = { occasion: filterOccasion, vibe: filterVibe };
    if (prev.occasion === filterOccasion && prev.vibe === filterVibe) return;
    void runSearch(0);
  }, [filterOccasion, filterVibe, submitted, canSearch, runSearch]);
}
