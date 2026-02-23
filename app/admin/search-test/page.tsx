"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { searchProducts, type SearchResponse, type SearchProductItem } from "@/lib/api/search";

export default function AdminSearchTestPage() {
  const [query, setQuery] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [limit, setLimit] = useState(12);
  const [categoryLvl1, setCategoryLvl1] = useState("");
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SearchResponse | null>(null);
  const [showRawJson, setShowRawJson] = useState(false);

  useEffect(() => {
    document.title = "Search Test | Hanger Admin";
    return () => {
      document.title = "Hanger Admin";
    };
  }, []);

  const handleSearch = async () => {
    const hasQuery = query.trim().length > 0;
    const hasImage = imageUrl.trim().length > 0;
    if (!hasQuery && !hasImage) {
      setError("Enter a search query and/or an image URL");
      return;
    }
    setError(null);
    setSearching(true);
    setResult(null);
    try {
      const data = await searchProducts({
        query: query.trim() || undefined,
        imageUrl: imageUrl.trim() || undefined,
        limit: limit || 12,
        offset: 0,
        category_lvl1: categoryLvl1.trim() || undefined,
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  };

  const items = result?.items ?? [];
  const total = result?.total ?? 0;

  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Search Test</h1>
        <p className="mt-2 text-neutral-600">
          Test the Search API (B3.4): natural language and image-based product search. Enter a text query and/or an image URL.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-neutral-700">Query (text)</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. blue summer dress, casual white sneakers"
              className="mt-1 block w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Image URL (optional, for image search)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (find similar products)"
              className="mt-1 block w-full rounded-soft-lg border border-border px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Limit</label>
              <input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 12)}
                className="mt-1 block w-20 rounded-soft-lg border border-border px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Category (optional)</label>
              <input
                type="text"
                value={categoryLvl1}
                onChange={(e) => setCategoryLvl1(e.target.value)}
                placeholder="e.g. tops, dresses"
                className="mt-1 block w-40 rounded-soft-lg border border-border px-2 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || (!query.trim() && !imageUrl.trim())}
            className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {result && (
          <div className="mt-8 border-t border-border pt-8">
            <h2 className="text-lg font-semibold">Results</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Found <strong>{total}</strong> product{total !== 1 ? "s" : ""} (showing {items.length}).
            </p>

            {items.length > 0 ? (
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((p: SearchProductItem) => (
                  <li key={p.id} className="rounded-soft-lg border border-border bg-card overflow-hidden">
                    <Link href={`/browse/${p.id}`} className="block p-3 hover:bg-neutral-100">
                      {p.images?.[0]?.src ? (
                        <img
                          src={p.images[0].src}
                          alt={p.title || ""}
                          className="w-full h-40 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-40 bg-neutral-100 rounded flex items-center justify-center text-neutral-400 text-sm">
                          No image
                        </div>
                      )}
                      <p className="mt-2 text-sm font-medium text-neutral-900 line-clamp-2">{p.title || p.id}</p>
                      {p.brand?.name && (
                        <p className="mt-0.5 text-xs text-neutral-500">{p.brand.name}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-neutral-500">No products returned. Try a different query or ensure products have embeddings.</p>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="text-sm text-neutral-600 hover:text-foreground"
              >
                {showRawJson ? "Hide" : "Show"} raw JSON
              </button>
              {showRawJson && (
                <pre className="mt-2 p-3 rounded bg-neutral-100 text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
    </>
  );
}
