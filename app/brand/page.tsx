"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import {
  fetchBrandMe,
  updateBrandMe,
  fetchBrandMicrostores,
  createBrandMicrostore,
  fetchBrandAnalytics,
} from "@/lib/api/brand";
import type { BrandMe, BrandMicrostoreSummary } from "@/lib/api/brand";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const TILES = [
  { id: "brand-zone", title: "Brand zone", description: "Edit your brand name, description, and website.", href: "#brand-zone" },
  { id: "microstores", title: "Microstores", description: "Create and manage microstores with your brand's products.", href: "#microstores" },
  { id: "analytics", title: "Brand analytics", description: "Views, followers, and engagement.", href: "#analytics" },
] as const;

export default function BrandAdminPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("brand");
  const [brand, setBrand] = useState<BrandMe | null>(null);
  const [microstores, setMicrostores] = useState<BrandMicrostoreSummary[]>([]);
  const [analytics, setAnalytics] = useState<{ pageViews: number; followers: number; products: number; microstores: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editWebsiteUrl, setEditWebsiteUrl] = useState("");
  const [saving, setSaving] = useState(false);

  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreDescription, setNewStoreDescription] = useState("");
  const [creating, setCreating] = useState(false);

  const load = useCallback(async () => {
    if (!user?.brandId) return;
    setLoading(true);
    setError(null);
    try {
      const [meRes, msRes, analyticsRes] = await Promise.all([
        fetchBrandMe(),
        fetchBrandMicrostores({ limit: 50 }),
        fetchBrandAnalytics(),
      ]);
      setBrand(meRes);
      setEditName(meRes.name);
      setEditDescription(meRes.description ?? "");
      setEditWebsiteUrl(meRes.websiteUrl ?? "");
      setMicrostores(msRes.items);
      setAnalytics(analyticsRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [user?.brandId]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const handleSaveZone = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await updateBrandMe({
        name: editName.trim(),
        description: editDescription.trim() || undefined,
        websiteUrl: editWebsiteUrl.trim() || undefined,
      });
      setBrand(updated);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleCreateMicrostore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setCreating(true);
    try {
      await createBrandMicrostore({
        name: newStoreName.trim(),
        description: newStoreDescription.trim() || undefined,
        status: "draft",
      });
      setNewStoreName("");
      setNewStoreDescription("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreating(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Brand Admin" user={user} onLogout={logout} logoHref="/brand" />
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-semibold">Brand Admin</h1>
        <p className="mt-1 text-neutral-600">
          When logged in with a brand account, you can manage your brand zone, create microstores (with your brand&apos;s products only), and view analytics.
        </p>

        {error && <div className="mt-4 p-3 rounded-soft-lg bg-red-50 text-red-800 text-sm">{error}</div>}

        {loading ? (
          <p className="mt-4 text-neutral-500">Loading…</p>
        ) : brand ? (
          <>
            {/* Tiles */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {TILES.map((tile) => (
                <Link
                  key={tile.id}
                  href={tile.href}
                  className="block p-6 rounded-soft-xl border border-border bg-card hover:border-border hover:shadow-sm transition"
                >
                  <h2 className="font-semibold text-neutral-900">{tile.title}</h2>
                  <p className="mt-1 text-sm text-neutral-600">{tile.description}</p>
                </Link>
              ))}
            </div>

            {/* Brand zone */}
            <section id="brand-zone" className="mt-10 scroll-mt-8 p-4 rounded-soft-xl border border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Brand zone</h2>
              <p className="mt-1 text-sm text-neutral-600">Edit your brand profile (name, description, website).</p>
              <form onSubmit={handleSaveZone} className="mt-4 space-y-3 max-w-xl">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Name</label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Description</label>
                  <textarea
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    rows={2}
                    className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Website URL</label>
                  <input
                    type="url"
                    value={editWebsiteUrl}
                    onChange={(e) => setEditWebsiteUrl(e.target.value)}
                    className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <button type="submit" disabled={saving} className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {saving ? "Saving…" : "Save"}
                </button>
              </form>
              <p className="mt-2 text-xs text-neutral-500">Followers: {brand.followerCount} · Products: {brand.productCount}</p>
            </section>

            {/* Microstores */}
            <section id="microstores" className="mt-10 scroll-mt-8 p-4 rounded-soft-xl border border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Microstores</h2>
              <p className="mt-1 text-sm text-neutral-600">Create microstores with products from your brand only. Set products via API: PUT /api/brand/microstores/:id/products.</p>
              <form onSubmit={handleCreateMicrostore} className="mt-4 flex flex-wrap gap-3 items-end">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Name</label>
                  <input
                    type="text"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    placeholder="Store name"
                    className="mt-1 w-48 rounded-soft-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Description</label>
                  <input
                    type="text"
                    value={newStoreDescription}
                    onChange={(e) => setNewStoreDescription(e.target.value)}
                    placeholder="Optional"
                    className="mt-1 w-64 rounded-soft-lg border border-border px-3 py-2 text-sm"
                  />
                </div>
                <button type="submit" disabled={creating || !newStoreName.trim()} className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50">
                  {creating ? "Creating…" : "Create microstore"}
                </button>
              </form>
              {microstores.length === 0 ? (
                <p className="mt-4 text-neutral-500">No microstores yet.</p>
              ) : (
                <ul className="mt-4 space-y-2">
                  {microstores.map((s) => (
                    <li key={s.id} className="flex justify-between items-center py-2 border-b border-border">
                      <span className="font-medium">{s.name}</span>
                      <span className="text-sm text-neutral-500">{s.status} · {s.productCount ?? 0} products</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {/* Brand analytics */}
            <section id="analytics" className="mt-10 scroll-mt-8 p-4 rounded-soft-xl border border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Brand analytics</h2>
              <p className="mt-1 text-sm text-neutral-600">Summary of your brand&apos;s reach and content.</p>
              {analytics ? (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="p-4 rounded-soft-xl bg-neutral-100">
                    <p className="text-2xl font-semibold text-neutral-900">{analytics.pageViews}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Page views</p>
                  </div>
                  <div className="p-4 rounded-soft-xl bg-neutral-100">
                    <p className="text-2xl font-semibold text-neutral-900">{analytics.followers}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Followers</p>
                  </div>
                  <div className="p-4 rounded-soft-xl bg-neutral-100">
                    <p className="text-2xl font-semibold text-neutral-900">{analytics.products}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Products</p>
                  </div>
                  <div className="p-4 rounded-soft-xl bg-neutral-100">
                    <p className="text-2xl font-semibold text-neutral-900">{analytics.microstores}</p>
                    <p className="text-xs text-neutral-500 uppercase tracking-wide">Microstores</p>
                  </div>
                </div>
              ) : (
                <p className="mt-4 text-neutral-500">Loading analytics…</p>
              )}
              <p className="mt-3 text-xs text-neutral-400">More detailed analytics (engagement, trends) coming soon.</p>
            </section>
          </>
        ) : (
          <p className="mt-4 text-neutral-500">No brand linked to your account.</p>
        )}
      </main>
    </div>
  );
}
