"use client";

import { AppHeader } from "@/components/AppHeader";
import { fetchProducts } from "@/lib/api/products";
import { useAuth } from "@/lib/auth/AuthProvider";
import type { ProductSummary } from "@/lib/api/products";
import Link from "next/link";
import { useState } from "react";
import useSWR from "swr";

const limit = 24;

export default function BrowsePage() {
  const { user, logout } = useAuth();
  const [page, setPage] = useState(0);
  const [retryKey, setRetryKey] = useState(0);
  const offset = page * limit;

  const { data, error, isLoading, mutate } = useSWR(
    ["products", "list", limit, offset, retryKey],
    () => fetchProducts({ limit, offset }),
    {
      revalidateOnFocus: false,
      dedupingInterval: 30000,
      keepPreviousData: true,
    }
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const loading = isLoading;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Fashion" user={user} onLogout={logout} />
      <main className="max-w-6xl mx-auto p-4">
        <h1 className="text-2xl font-semibold mb-6">Browse products</h1>
        {error ? (
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-red-700">
            <p>{error instanceof Error ? error.message : "Failed to load products"}</p>
            <button
              type="button"
              onClick={() => setRetryKey((k) => k + 1)}
              className="mt-2 text-sm font-medium text-red-800 hover:underline"
            >
              Retry
            </button>
            <Link href="/" className="ml-4 text-sm font-medium text-red-800 hover:underline">
              Go home
            </Link>
          </div>
        ) : loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
              {items.map((p) => (
                <Link
                  key={p.id}
                  href={`/browse/${p.id}`}
                  className="border rounded-lg overflow-hidden bg-white hover:shadow-md transition"
                >
                  <div className="aspect-square bg-gray-100 relative">
                    {p.images?.[0] ? (
                      <img
                        src={p.images[0].src}
                        alt={p.images[0].alt || p.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="absolute inset-0 flex items-center justify-center text-gray-400 text-sm">
                        No image
                      </span>
                    )}
                  </div>
                  <div className="p-2">
                    <p className="font-medium text-sm line-clamp-2">{p.title}</p>
                    {p.brand && (
                      <p className="text-xs text-gray-500">{p.brand.name}</p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
            {total > limit && (
              <div className="mt-6 flex gap-2 justify-center">
                <button
                  type="button"
                  disabled={page === 0}
                  onClick={() => setPage((p) => p - 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Previous
                </button>
                <span className="py-1 text-sm text-gray-600">
                  Page {page + 1} of {Math.ceil(total / limit)}
                </span>
                <button
                  type="button"
                  disabled={(page + 1) * limit >= total}
                  onClick={() => setPage((p) => p + 1)}
                  className="px-3 py-1 border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
