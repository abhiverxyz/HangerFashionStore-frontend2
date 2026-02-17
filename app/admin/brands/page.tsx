"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import { fetchAdminBrands, fetchBrandUsers, createBrandUser } from "@/lib/api/admin";
import type { AdminBrandItem, BrandUserItem } from "@/lib/api/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

export default function AdminBrandsPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [brands, setBrands] = useState<AdminBrandItem[]>([]);
  const [brandUsers, setBrandUsers] = useState<BrandUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [createBrandId, setCreateBrandId] = useState("");
  const [createUsername, setCreateUsername] = useState("");
  const [createPassword, setCreatePassword] = useState("");
  const [createLoading, setCreateLoading] = useState(false);
  const [createMessage, setCreateMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [brandsRes, usersRes] = await Promise.all([fetchAdminBrands(), fetchBrandUsers()]);
      setBrands(brandsRes.items);
      setBrandUsers(usersRes.items);
      if (brandsRes.items.length && !createBrandId) setCreateBrandId(brandsRes.items[0].id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, [createBrandId]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const handleCreateBrandUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createBrandId || !createUsername.trim() || !createPassword) {
      setCreateMessage("Brand, username, and password are required.");
      return;
    }
    setCreateLoading(true);
    setCreateMessage(null);
    try {
      await createBrandUser({ brandId: createBrandId, username: createUsername.trim(), password: createPassword });
      setCreateMessage("Brand user created. They can log in with this username and password.");
      setCreateUsername("");
      setCreatePassword("");
      await load();
    } catch (e) {
      setCreateMessage(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreateLoading(false);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} />
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Brands</h1>
        <p className="mt-1 text-gray-600">Manage brands and create brand user accounts (IDs start with &quot;brand_&quot;). Brand users can edit their brand zone and create microstores with their brand&apos;s products only.</p>

        {error && <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm">{error}</div>}

        {loading ? (
          <p className="mt-4 text-gray-500">Loading…</p>
        ) : (
          <>
            <section className="mt-8 p-4 rounded-lg border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">All brands</h2>
              {brands.length === 0 ? (
                <p className="mt-2 text-gray-500">No brands. Create one via Products import or admin.</p>
              ) : (
                <ul className="mt-2 space-y-1">
                  {brands.map((b) => (
                    <li key={b.id} className="flex gap-2 text-sm">
                      <span className="font-medium">{b.name}</span>
                      <span className="text-gray-500">{b.shopDomain}</span>
                      <span className="text-gray-400">({b.id})</span>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8 p-4 rounded-lg border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Create brand user (login for brand)</h2>
              <p className="mt-1 text-sm text-gray-600">New user ID will start with &quot;brand_&quot;. They can only manage their brand zone and microstores with their brand&apos;s products.</p>
              <form onSubmit={handleCreateBrandUser} className="mt-4 space-y-3 max-w-md">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Brand</label>
                  <select
                    value={createBrandId}
                    onChange={(e) => setCreateBrandId(e.target.value)}
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    required
                  >
                    <option value="">Select brand</option>
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.shopDomain})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Username</label>
                  <input
                    type="text"
                    value={createUsername}
                    onChange={(e) => setCreateUsername(e.target.value)}
                    placeholder="branduser"
                    autoComplete="username"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Password</label>
                  <input
                    type="password"
                    value={createPassword}
                    onChange={(e) => setCreatePassword(e.target.value)}
                    placeholder="••••••••"
                    className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                    required
                  />
                </div>
                <button type="submit" disabled={createLoading} className="rounded bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                  {createLoading ? "Creating…" : "Create brand user"}
                </button>
                {createMessage && <p className="text-sm text-gray-700">{createMessage}</p>}
              </form>
            </section>

            <section className="mt-8 p-4 rounded-lg border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Brand users</h2>
              {brandUsers.length === 0 ? (
                <p className="mt-2 text-gray-500">No brand users yet.</p>
              ) : (
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="pb-2 pr-4">ID</th>
                        <th className="pb-2 pr-4">Username</th>
                        <th className="pb-2 pr-4">Brand</th>
                      </tr>
                    </thead>
                    <tbody>
                      {brandUsers.map((u) => (
                        <tr key={u.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-mono text-xs">{u.id}</td>
                          <td className="py-2 pr-4">{u.username ?? u.email ?? "—"}</td>
                          <td className="py-2 pr-4">{u.brand?.name ?? u.brandId ?? "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
