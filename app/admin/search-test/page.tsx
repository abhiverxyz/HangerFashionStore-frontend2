"use client";

import { useState, useEffect } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";
import { searchProducts, type SearchResponse, type SearchProductItem } from "@/lib/api/search";

export default function AdminSearchTestPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
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

  if (authLoading || !user) return null;

  const items = result?.items ?? [];
  const total = result?.total ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} />
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Search Test</h1>
        <p className="mt-2 text-gray-600">
          Test the Search API (B3.4): natural language and image-based product search. Enter a text query and/or an image URL.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        <div className="mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Query (text)</label>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. blue summer dress, casual white sneakers"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Image URL (optional, for image search)</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://... (find similar products)"
              className="mt-1 block w-full rounded border border-gray-300 px-3 py-2 text-sm font-mono"
            />
          </div>
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700">Limit</label>
              <input
                type="number"
                min={1}
                max={100}
                value={limit}
                onChange={(e) => setLimit(Number(e.target.value) || 12)}
                className="mt-1 block w-20 rounded border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Category (optional)</label>
              <input
                type="text"
                value={categoryLvl1}
                onChange={(e) => setCategoryLvl1(e.target.value)}
                placeholder="e.g. tops, dresses"
                className="mt-1 block w-40 rounded border border-gray-300 px-2 py-2 text-sm"
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handleSearch}
            disabled={searching || (!query.trim() && !imageUrl.trim())}
            className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </div>

        {result && (
          <div className="mt-8 border-t border-gray-200 pt-8">
            <h2 className="text-lg font-semibold">Results</h2>
            <p className="mt-1 text-sm text-gray-600">
              Found <strong>{total}</strong> product{total !== 1 ? "s" : ""} (showing {items.length}).
            </p>

            {items.length > 0 ? (
              <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((p: SearchProductItem) => (
                  <li key={p.id} className="rounded border border-gray-200 bg-white overflow-hidden">
                    <Link href={`/browse/${p.id}`} className="block p-3 hover:bg-gray-50">
                      {p.images?.[0]?.src ? (
                        <img
                          src={p.images[0].src}
                          alt={p.title || ""}
                          className="w-full h-40 object-cover rounded"
                        />
                      ) : (
                        <div className="w-full h-40 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-sm">
                          No image
                        </div>
                      )}
                      <p className="mt-2 text-sm font-medium text-gray-900 line-clamp-2">{p.title || p.id}</p>
                      {p.brand?.name && (
                        <p className="mt-0.5 text-xs text-gray-500">{p.brand.name}</p>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-4 text-gray-500">No products returned. Try a different query or ensure products have embeddings.</p>
            )}

            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowRawJson((v) => !v)}
                className="text-sm text-gray-600 hover:text-gray-900"
              >
                {showRawJson ? "Hide" : "Show"} raw JSON
              </button>
              {showRawJson && (
                <pre className="mt-2 p-3 rounded bg-gray-100 text-xs overflow-auto max-h-96">
                  {JSON.stringify(result, null, 2)}
                </pre>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
