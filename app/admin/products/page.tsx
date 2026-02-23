"use client";

import {
  fetchSyncStatus,
  createBrand,
  fetchProductsFromStoreUrl,
  importPublicBrandPayload,
  triggerSyncShopify,
  enqueueEnrichProduct,
  deleteBrand,
  deleteProduct,
} from "@/lib/api/admin";
import { fetchProducts } from "@/lib/api/products";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import type { BrandSummary } from "@/lib/api/admin";
import type { ProductSummary } from "@/lib/api/products";

export default function AdminProductsPage() {
  const [syncStatus, setSyncStatus] = useState<{
    brands: BrandSummary[];
    enrichmentQueue: { pending: number; processing: number; failed: number; completed: number };
  } | null>(null);
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [productsTotal, setProductsTotal] = useState(0);
  const [productsOffset, setProductsOffset] = useState(0);
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");
  const [syncStatusLoading, setSyncStatusLoading] = useState(true);
  const [productsLoading, setProductsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mode 1: Add brand
  const [shopDomain, setShopDomain] = useState("");
  const [brandName, setBrandName] = useState("");
  const [addBrandLoading, setAddBrandLoading] = useState(false);
  const [addBrandError, setAddBrandError] = useState<string | null>(null);
  const [addBrandSuccess, setAddBrandSuccess] = useState<string | null>(null);

  // Mode 1: Sync
  const [syncBrandId, setSyncBrandId] = useState("");
  const [accessToken, setAccessToken] = useState("");
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [syncSuccess, setSyncSuccess] = useState<string | null>(null);

  // Mode 2: Import from public URL
  const [publicUrl, setPublicUrl] = useState("");
  const [publicBrandName, setPublicBrandName] = useState("");
  const [importPublicLoading, setImportPublicLoading] = useState(false);
  const [importPublicError, setImportPublicError] = useState<string | null>(null);
  const [importPublicSuccess, setImportPublicSuccess] = useState<string | null>(null);

  // Enrich / Delete
  const [enrichingId, setEnrichingId] = useState<string | null>(null);
  const [enrichError, setEnrichError] = useState<string | null>(null);
  const [deletingProductId, setDeletingProductId] = useState<string | null>(null);
  const [deletingBrandId, setDeletingBrandId] = useState<string | null>(null);

  const loadSyncStatus = useCallback(async () => {
    try {
      const data = await fetchSyncStatus();
      setSyncStatus(data);
      if (data.brands.length && !syncBrandId) setSyncBrandId(data.brands[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sync status");
    } finally {
      setSyncStatusLoading(false);
    }
  }, [syncBrandId]);

  useEffect(() => {
    loadSyncStatus();
  }, [loadSyncStatus]);

  useEffect(() => {
    if (!selectedBrandId) {
      setProducts([]);
      setProductsTotal(0);
      setProductsOffset(0);
      return;
    }
    setProductsLoading(true);
    fetchProducts({ brandId: selectedBrandId, limit: 50, offset: 0 })
      .then((r) => {
        setProducts(r.items);
        setProductsTotal(r.total);
        setProductsOffset(0);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load products"))
      .finally(() => setProductsLoading(false));
  }, [selectedBrandId]);

  const loadMoreProducts = () => {
    const next = productsOffset + 50;
    fetchProducts({ brandId: selectedBrandId, limit: 50, offset: next })
      .then((r) => {
        setProducts((prev) => [...prev, ...r.items]);
        setProductsOffset(next);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load more"));
  };

  const handleAddBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddBrandError(null);
    setAddBrandSuccess(null);
    setAddBrandLoading(true);
    try {
      const created = await createBrand({
        shopDomain: shopDomain.trim(),
        name: brandName.trim(),
        importMode: "shopify_sync",
      });
      setAddBrandSuccess(`Brand "${created.name}" created. Sync products below.`);
      setShopDomain("");
      setBrandName("");
      await loadSyncStatus();
      setSyncBrandId(created.id);
    } catch (e) {
      setAddBrandError(e instanceof Error ? e.message : "Failed to create brand");
    } finally {
      setAddBrandLoading(false);
    }
  };

  const handleSync = async (e: React.FormEvent) => {
    e.preventDefault();
    setSyncError(null);
    setSyncSuccess(null);
    if (!syncBrandId || !accessToken.trim()) {
      setSyncError("Select a brand and enter access token.");
      return;
    }
    setSyncLoading(true);
    try {
      await triggerSyncShopify(syncBrandId, accessToken.trim());
      setSyncSuccess("Queued for sync. Worker will process shortly.");
      await loadSyncStatus();
    } catch (e) {
      setSyncError(e instanceof Error ? e.message : "Failed to queue sync");
    } finally {
      setSyncLoading(false);
    }
  };

  const handleImportPublic = async (e: React.FormEvent) => {
    e.preventDefault();
    setImportPublicError(null);
    setImportPublicSuccess(null);
    const url = publicUrl.trim();
    if (!url) {
      setImportPublicError("Store URL is required.");
      return;
    }
    const fullUrl = url.startsWith("http") ? url : `https://${url}`;
    setImportPublicLoading(true);
    let products: unknown[];
    try {
      products = await fetchProductsFromStoreUrl(fullUrl);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed to fetch";
      setImportPublicError(
        `Could not load products from the store (check URL or try the CLI script). ${msg}`
      );
      setImportPublicLoading(false);
      return;
    }
    if (products.length === 0) {
      setImportPublicError("No products found at that URL. Check the store root URL.");
      setImportPublicLoading(false);
      return;
    }
    try {
      const result = await importPublicBrandPayload({
        url: fullUrl,
        brandName: publicBrandName.trim() || undefined,
        products,
      });
      setImportPublicSuccess(
        `Imported ${result.summary.total} products (${result.summary.enqueuedForEnrichment} enqueued for enrichment).`
      );
      setPublicUrl("");
      setPublicBrandName("");
      await loadSyncStatus();
    } catch (e) {
      setImportPublicError(
        `Products loaded but import failed: ${e instanceof Error ? e.message : "Request failed"}`
      );
    } finally {
      setImportPublicLoading(false);
    }
  };

  const handleEnrich = async (productId: string) => {
    setEnrichError(null);
    setEnrichingId(productId);
    try {
      await enqueueEnrichProduct(productId);
      await loadSyncStatus();
      setProducts((prev) =>
        prev.map((p) => (p.id === productId ? { ...p, enrichmentStatus: "pending" } : p))
      );
    } catch (e) {
      setEnrichError(e instanceof Error ? e.message : "Failed to enqueue enrichment");
    } finally {
      setEnrichingId(null);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setDeletingProductId(productId);
    try {
      await deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      setProductsTotal((n) => Math.max(0, n - 1));
      await loadSyncStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete product");
    } finally {
      setDeletingProductId(null);
    }
  };

  const handleDeleteBrand = async (brandId: string) => {
    if (!confirm("Delete this brand and all its products? This cannot be undone.")) return;
    setDeletingBrandId(brandId);
    try {
      await deleteBrand(brandId);
      if (selectedBrandId === brandId) setSelectedBrandId("");
      await loadSyncStatus();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete brand");
    } finally {
      setDeletingBrandId(null);
    }
  };

  return (
    <>
      <div className="mb-6">
          <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Products</h1>
        {error && (
          <div className="mt-2 p-3 rounded-soft-xl bg-red-50 text-red-700 text-sm">{error}</div>
        )}

        {/* Add / Import brand */}
        <section className="mt-8">
          <h2 className="text-lg font-medium text-neutral-900">Add or import brand</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Two modes: sync with Shopify (app/token) or import from public store URL (no token).
          </p>

          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="p-4 rounded-soft-xl border border-border bg-card">
              <h3 className="font-medium text-neutral-800">1. Sync with Shopify</h3>
              <p className="mt-1 text-xs text-neutral-500">Add brand, then sync with Admin API token.</p>
              <form onSubmit={handleAddBrand} className="mt-3 space-y-2">
                <input
                  type="text"
                  value={shopDomain}
                  onChange={(e) => setShopDomain(e.target.value)}
                  placeholder="store.myshopify.com"
                  className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                  required
                />
                <input
                  type="text"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Brand name"
                  className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                  required
                />
                {addBrandError && <p className="text-sm text-red-600">{addBrandError}</p>}
                {addBrandSuccess && <p className="text-sm text-green-700">{addBrandSuccess}</p>}
                <button
                  type="submit"
                  disabled={addBrandLoading}
                  className="px-3 py-2 bg-primary-cta text-neutral-100 text-sm rounded-soft-lg hover:opacity-90 disabled:opacity-50"
                >
                  {addBrandLoading ? "Creating…" : "Add brand"}
                </button>
              </form>
              <div className="mt-3 pt-3 border-t border-border">
                <form onSubmit={handleSync} className="space-y-2">
                  <select
                    value={syncBrandId}
                    onChange={(e) => setSyncBrandId(e.target.value)}
                    className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                  >
                    <option value="">Select brand</option>
                    {syncStatus?.brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.shopDomain})
                      </option>
                    ))}
                  </select>
                  <input
                    type="password"
                    value={accessToken}
                    onChange={(e) => setAccessToken(e.target.value)}
                    placeholder="Admin API token (shpat_…)"
                    className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                  />
                  {syncError && <p className="text-sm text-red-600">{syncError}</p>}
                  {syncSuccess && <p className="text-sm text-green-700">{syncSuccess}</p>}
                  <button
                    type="submit"
                    disabled={syncLoading || !syncStatus?.brands.length}
                    className="px-3 py-2 bg-primary-cta text-neutral-100 text-sm rounded-soft-lg hover:opacity-90 disabled:opacity-50"
                  >
                    {syncLoading ? "Queuing…" : "Sync products"}
                  </button>
                </form>
              </div>
            </div>

            <div className="p-4 rounded-soft-xl border border-border bg-card">
              <h3 className="font-medium text-neutral-800">2. Import from public URL</h3>
              <p className="mt-1 text-xs text-neutral-500">No token. Uses store’s public products.json. Use the store’s root URL (e.g. https://yourstore.com). If you see a network or CORS error, use the CLI script: <code className="bg-neutral-200 px-1 rounded">node backend2/scripts/import-from-public-url.js &lt;store-url&gt;</code></p>
              <form onSubmit={handleImportPublic} className="mt-3 space-y-2">
                <input
                  type="url"
                  value={publicUrl}
                  onChange={(e) => setPublicUrl(e.target.value)}
                  placeholder="https://example-store.com"
                  className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={publicBrandName}
                  onChange={(e) => setPublicBrandName(e.target.value)}
                  placeholder="Brand name (optional)"
                  className="w-full border border-border rounded-soft-lg px-3 py-2 text-sm"
                />
                {importPublicError && <p className="text-sm text-red-600">{importPublicError}</p>}
                {importPublicSuccess && <p className="text-sm text-green-700">{importPublicSuccess}</p>}
                <button
                  type="submit"
                  disabled={importPublicLoading}
                  className="px-3 py-2 bg-primary-cta text-neutral-100 text-sm rounded-soft-lg hover:opacity-90 disabled:opacity-50"
                >
                  {importPublicLoading ? "Importing…" : "Import from URL"}
                </button>
              </form>
            </div>
          </div>
        </section>

        {/* Brands table */}
        <section className="mt-10">
          <h2 className="text-lg font-medium text-neutral-900">Brands</h2>
          {syncStatus && syncStatus.brands.length > 0 && (
            <p className="mt-1 text-sm text-neutral-700">
              Total: <strong>{(syncStatus.brands.reduce((s, b) => s + (b.productCount ?? 0), 0)).toLocaleString()}</strong> products,{" "}
              <strong>{(syncStatus.brands.reduce((s, b) => s + (b.enrichedCount ?? 0), 0)).toLocaleString()}</strong> enriched
            </p>
          )}
          <div className="mt-4 overflow-x-auto border border-border rounded-soft-xl bg-card">
            {syncStatusLoading ? (
              <p className="p-4 text-neutral-500">Loading…</p>
            ) : !syncStatus?.brands.length ? (
              <p className="p-4 text-neutral-500">No brands yet. Add or import one above.</p>
            ) : (
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-neutral-100">
                    <th className="text-left p-3 font-medium text-neutral-700 w-10">#</th>
                    <th className="text-left p-3 font-medium text-neutral-700">Name</th>
                    <th className="text-left p-3 font-medium text-neutral-700">Shop domain</th>
                    <th className="text-left p-3 font-medium text-neutral-700 w-20">Upload</th>
                    <th className="text-left p-3 font-medium text-neutral-700 w-20">Products</th>
                    <th className="text-left p-3 font-medium text-neutral-700 w-20">Enriched</th>
                    <th className="text-left p-3 font-medium text-neutral-700">Last synced</th>
                    <th className="text-left p-3 font-medium text-neutral-700 w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {syncStatus.brands.map((b, index) => (
                    <tr
                      key={b.id}
                      className={`border-b border-border ${selectedBrandId === b.id ? "bg-neutral-100" : ""} ${selectedBrandId === b.id ? "cursor-default" : "cursor-pointer hover:bg-neutral-100"}`}
                      onClick={() => setSelectedBrandId(selectedBrandId === b.id ? "" : b.id)}
                    >
                      <td className="p-3 text-neutral-500">{index + 1}</td>
                      <td className="p-3 font-medium text-neutral-900">{b.name}</td>
                      <td className="p-3 text-neutral-600">{b.shopDomain}</td>
                      <td className="p-3">
                        <span className={b.importMode === "shopify_public_import" ? "text-blue-600" : "text-neutral-600"}>
                          {b.importMode === "shopify_public_import" ? "Public" : "Sync"}
                        </span>
                      </td>
                      <td className="p-3 text-neutral-600">{b.productCount ?? 0}</td>
                      <td className="p-3 text-neutral-600">{b.enrichedCount ?? 0}</td>
                      <td className="p-3 text-neutral-600">
                        {b.lastSyncedAt ? new Date(b.lastSyncedAt).toLocaleString() : "Never"}
                      </td>
                      <td className="p-3" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          onClick={() => setSelectedBrandId(selectedBrandId === b.id ? "" : b.id)}
                          className="px-2 py-1 mr-1 text-xs border border-border rounded-soft-lg hover:bg-neutral-200"
                        >
                          {selectedBrandId === b.id ? "Hide products" : "View products"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteBrand(b.id)}
                          disabled={deletingBrandId === b.id}
                          className="px-2 py-1 text-xs border border-red-200 text-red-700 rounded-soft-lg hover:bg-red-50 disabled:opacity-50"
                        >
                          {deletingBrandId === b.id ? "Deleting…" : "Delete"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        {/* Product list (when brand selected) */}
        {selectedBrandId && (
          <section className="mt-10">
            <h2 className="text-lg font-medium text-neutral-900">Products</h2>
            <p className="mt-1 text-sm text-neutral-600">
              Enrichment queue: {syncStatus?.enrichmentQueue.pending ?? 0} pending,{" "}
              {syncStatus?.enrichmentQueue.processing ?? 0} processing
            </p>
            {enrichError && <p className="mt-2 text-sm text-red-600">{enrichError}</p>}
            <div className="mt-4 overflow-x-auto border border-border rounded-soft-xl bg-card">
              {productsLoading ? (
                <p className="p-4 text-neutral-500">Loading products…</p>
              ) : products.length === 0 ? (
                <p className="p-4 text-neutral-500">No products for this brand.</p>
              ) : (
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-neutral-100">
                      <th className="text-left p-3 font-medium text-neutral-700">Title</th>
                      <th className="text-left p-3 font-medium text-neutral-700">Enrichment</th>
                      <th className="text-left p-3 font-medium text-neutral-700 w-48">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-border">
                        <td className="p-3 max-w-xs truncate" title={p.title}>{p.title}</td>
                        <td className="p-3">
                          {p.enrichmentStatus ?? "—"}
                          {p.enrichedAt && (
                            <span className="text-neutral-500 ml-1">
                              ({new Date(p.enrichedAt).toLocaleDateString()})
                            </span>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() => handleEnrich(p.id)}
                            disabled={enrichingId === p.id}
                            className="px-2 py-1 mr-1 border border-border rounded-soft-lg text-xs hover:bg-neutral-200 disabled:opacity-50"
                          >
                            {enrichingId === p.id ? "Queuing…" : "Enrich"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(p.id)}
                            disabled={deletingProductId === p.id}
                            className="px-2 py-1 border border-red-200 text-red-700 rounded-soft-lg text-xs hover:bg-red-50 disabled:opacity-50"
                          >
                            {deletingProductId === p.id ? "Deleting…" : "Delete"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
              {productsTotal > products.length && (
                <div className="p-3 border-t border-border">
                  <button
                    type="button"
                    onClick={loadMoreProducts}
                    className="text-sm text-neutral-600 hover:text-foreground"
                  >
                    Load more ({products.length} of {productsTotal})
                  </button>
                </div>
              )}
            </div>
          </section>
        )}
    </>
  );
}
