"use client";

import { AppHeader } from "@/components/AppHeader";
import {
  fetchMicrostores,
  fetchMicrostoreCreationContexts,
  createMicrostore,
  createMicrostoreCreationContext,
  updateMicrostoreCreationContext,
  deleteMicrostoreCreationContext,
  publishMicrostore,
  archiveMicrostore,
  deleteMicrostore,
  suggestMicrostoreName,
  createSystemMicrostoresBatch,
  runSystemMicrostoresBatch,
} from "@/lib/api/admin";
import type { MicrostoreSummary, MicrostoreCreationContextItem } from "@/lib/api/admin";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Tab = "stores" | "create" | "context";

export default function AdminMicrostoresPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [tab, setTab] = useState<Tab>("stores");
  const [stores, setStores] = useState<MicrostoreSummary[]>([]);
  const [storesTotal, setStoresTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  // Creation context
  const [contextItems, setContextItems] = useState<MicrostoreCreationContextItem[]>([]);
  const [contextLoading, setContextLoading] = useState(false);

  // Batch generate
  const [batchCount, setBatchCount] = useState(5);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [runAndWait, setRunAndWait] = useState(false);

  // Create store form
  const [createDescription, setCreateDescription] = useState("");
  const [createName, setCreateName] = useState("");
  const [createVibe, setCreateVibe] = useState("");
  const [suggestNameLoading, setSuggestNameLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);

  // Creation context form
  const [ctxTitle, setCtxTitle] = useState("");
  const [ctxDescription, setCtxDescription] = useState("");
  const [ctxVibe, setCtxVibe] = useState("");
  const [ctxCategory, setCtxCategory] = useState("");
  const [ctxTrend, setCtxTrend] = useState("");
  const [ctxSaving, setCtxSaving] = useState(false);
  const [ctxEditingId, setCtxEditingId] = useState<string | null>(null);

  const loadStores = useCallback(async () => {
    setStoresLoading(true);
    setError(null);
    try {
      const params: { status?: string; limit?: number } = { limit: 100 };
      if (statusFilter !== "all") params.status = statusFilter;
      const data = await fetchMicrostores(params);
      setStores(data.items);
      setStoresTotal(data.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load microstores");
    } finally {
      setStoresLoading(false);
    }
  }, [statusFilter]);

  const loadContext = useCallback(async () => {
    setContextLoading(true);
    try {
      const data = await fetchMicrostoreCreationContexts({ limit: 200 });
      setContextItems(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load creation context");
    } finally {
      setContextLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    loadStores();
  }, [user, loadStores]);

  useEffect(() => {
    if (!user || tab !== "context") return;
    loadContext();
  }, [user, tab, loadContext]);

  const handleBatch = async () => {
    setBatchLoading(true);
    setBatchMessage(null);
    try {
      if (runAndWait) {
        const result = await runSystemMicrostoresBatch(batchCount);
        setBatchMessage(`Created ${result.created} stores. ${result.errors?.length ? `${result.errors.length} errors.` : ""}`);
        await loadStores();
      } else {
        await createSystemMicrostoresBatch(batchCount);
        setBatchMessage(`Started creating ${batchCount} microstores in the background.`);
      }
    } catch (e) {
      setBatchMessage(e instanceof Error ? e.message : "Batch failed");
    } finally {
      setBatchLoading(false);
    }
  };

  const handlePublish = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await publishMicrostore(id);
      await loadStores();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Publish failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleArchive = async (id: string) => {
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await archiveMicrostore(id);
      await loadStores();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Archive failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This will soft-delete the store.`)) return;
    setActionLoading((prev) => ({ ...prev, [id]: true }));
    try {
      await deleteMicrostore(id);
      await loadStores();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setActionLoading((prev) => ({ ...prev, [id]: false }));
    }
  };

  const handleSuggestName = async () => {
    if (!createDescription.trim()) return;
    setSuggestNameLoading(true);
    try {
      const result = await suggestMicrostoreName({
        description: createDescription,
        vibe: createVibe || undefined,
      });
      setCreateName(result.name);
      setCreateVibe(result.vibe || "");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Suggest name failed");
    } finally {
      setSuggestNameLoading(false);
    }
  };

  const handleCreateStore = async () => {
    if (!createName.trim()) {
      alert("Enter a name or use Suggest name from description.");
      return;
    }
    setCreateLoading(true);
    setCreatedId(null);
    try {
      const store = await createMicrostore({
        name: createName.trim(),
        description: createDescription.trim() || undefined,
        vibe: createVibe.trim() || undefined,
        status: "draft",
      });
      setCreatedId(store.id);
      setCreateDescription("");
      setCreateName("");
      setCreateVibe("");
      await loadStores();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Create failed");
    } finally {
      setCreateLoading(false);
    }
  };

  const handleSaveContext = async () => {
    if (!ctxTitle.trim()) return;
    setCtxSaving(true);
    try {
      if (ctxEditingId) {
        await updateMicrostoreCreationContext(ctxEditingId, {
          title: ctxTitle.trim(),
          description: ctxDescription.trim() || undefined,
          vibe: ctxVibe.trim() || undefined,
          category: ctxCategory.trim() || undefined,
          trend: ctxTrend.trim() || undefined,
        });
        setCtxEditingId(null);
      } else {
        await createMicrostoreCreationContext({
          title: ctxTitle.trim(),
          description: ctxDescription.trim() || undefined,
          vibe: ctxVibe.trim() || undefined,
          category: ctxCategory.trim() || undefined,
          trend: ctxTrend.trim() || undefined,
        });
      }
      setCtxTitle("");
      setCtxDescription("");
      setCtxVibe("");
      setCtxCategory("");
      setCtxTrend("");
      await loadContext();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Save failed");
    } finally {
      setCtxSaving(false);
    }
  };

  const handleDeleteContext = async (id: string) => {
    if (!confirm("Remove this reference entry?")) return;
    try {
      await deleteMicrostoreCreationContext(id);
      await loadContext();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Delete failed");
    }
  };

  const startEditContext = (item: MicrostoreCreationContextItem) => {
    setCtxEditingId(item.id);
    setCtxTitle(item.title);
    setCtxDescription(item.description || "");
    setCtxVibe(item.vibe || "");
    setCtxCategory(item.category || "");
    setCtxTrend(item.trend || "");
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} />
      <main className="max-w-5xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Microstores</h1>
        <p className="mt-1 text-gray-600">Create and manage microstores. Use creation context to guide AI when generating names and descriptions.</p>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-gray-200">
          {(["stores", "create", "context"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t ${tab === t ? "bg-white border border-b-0 border-gray-200 -mb-px text-gray-900" : "text-gray-600 hover:text-gray-900"}`}
            >
              {t === "stores" ? "Stores" : t === "create" ? "Create store" : "Creation context"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Tab: Stores */}
        {tab === "stores" && (
          <>
            {/* Auto-generate */}
            <section className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Auto-generate microstores</h2>
              <p className="mt-1 text-sm text-gray-600">Agent creates full stores (name, description, hero image, style notes, products) and saves them as drafts.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value) || 5)}
                  className="w-16 rounded border border-gray-300 px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={runAndWait} onChange={(e) => setRunAndWait(e.target.checked)} />
                  Wait for result (slower)
                </label>
                <button
                  type="button"
                  onClick={handleBatch}
                  disabled={batchLoading}
                  className="rounded bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {batchLoading ? "Running…" : `Generate ${batchCount} microstores`}
                </button>
              </div>
              {batchMessage && <p className="mt-2 text-sm text-gray-700">{batchMessage}</p>}
            </section>

            {/* List */}
            <section className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">All stores</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded border border-gray-300 px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              {storesLoading ? (
                <p className="mt-4 text-gray-500">Loading…</p>
              ) : stores.length === 0 ? (
                <p className="mt-4 text-gray-500">No microstores. Create one or run auto-generate.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-left text-gray-600">
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Products</th>
                        <th className="pb-2 pr-4">Created by</th>
                        <th className="pb-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((s) => (
                        <tr key={s.id} className="border-b border-gray-100">
                          <td className="py-2 pr-4 font-medium">{s.name}</td>
                          <td className="py-2 pr-4">{s.status}</td>
                          <td className="py-2 pr-4">{s.productCount ?? 0}</td>
                          <td className="py-2 pr-4">{s.createdBy ?? "—"}</td>
                          <td className="py-2 pr-4 flex flex-wrap gap-1">
                            {s.status === "draft" && (
                              <button
                                type="button"
                                onClick={() => handlePublish(s.id)}
                                disabled={actionLoading[s.id]}
                                className="text-blue-600 hover:underline disabled:opacity-50"
                              >
                                Publish
                              </button>
                            )}
                            {s.status === "published" && (
                              <button
                                type="button"
                                onClick={() => handleArchive(s.id)}
                                disabled={actionLoading[s.id]}
                                className="text-amber-600 hover:underline disabled:opacity-50"
                              >
                                Archive
                              </button>
                            )}
                            {s.status === "archived" && (
                              <button
                                type="button"
                                onClick={() => handlePublish(s.id)}
                                disabled={actionLoading[s.id]}
                                className="text-blue-600 hover:underline disabled:opacity-50"
                              >
                                Publish again
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => handleDelete(s.id, s.name)}
                              disabled={actionLoading[s.id]}
                              className="text-red-600 hover:underline disabled:opacity-50"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Tab: Create store */}
        {tab === "create" && (
          <section className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Manual create</h2>
            <p className="mt-1 text-sm text-gray-600">Describe the store, get a suggested name from the agent, then create. You can add products later via the API or edit flow.</p>
            <div className="mt-4 space-y-3 max-w-xl">
              <div>
                <label className="block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={createDescription}
                  onChange={(e) => setCreateDescription(e.target.value)}
                  placeholder="e.g. Casual denim for work, dark wash, office-appropriate"
                  rows={2}
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSuggestName}
                disabled={suggestNameLoading || !createDescription.trim()}
                className="rounded bg-gray-200 text-gray-800 px-3 py-1.5 text-sm font-medium hover:bg-gray-300 disabled:opacity-50"
              >
                {suggestNameLoading ? "Suggesting…" : "Suggest name"}
              </button>
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  placeholder="Store name"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Vibe (optional)</label>
                <input
                  type="text"
                  value={createVibe}
                  onChange={(e) => setCreateVibe(e.target.value)}
                  placeholder="e.g. casual work"
                  className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleCreateStore}
                disabled={createLoading || !createName.trim()}
                className="rounded bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {createLoading ? "Creating…" : "Create store"}
              </button>
              {createdId && (
                <p className="text-sm text-green-700">
                  Created. Store ID: <code className="bg-gray-100 px-1 rounded">{createdId}</code> — use API to add products or edit.
                </p>
              )}
            </div>
          </section>
        )}

        {/* Tab: Creation context */}
        {tab === "context" && (
          <section className="mt-6 p-4 rounded-lg border border-gray-200 bg-white">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Reference titles & descriptions (for AI)</h2>
            <p className="mt-1 text-sm text-gray-600">These examples are sent to the LLM when generating store names and descriptions (manual suggest and auto-generate).</p>
            <div className="mt-4 space-y-3 max-w-xl">
              <input
                type="text"
                value={ctxTitle}
                onChange={(e) => setCtxTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={ctxDescription}
                onChange={(e) => setCtxDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={ctxVibe}
                  onChange={(e) => setCtxVibe(e.target.value)}
                  placeholder="Vibe"
                  className="flex-1 min-w-[120px] rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={ctxCategory}
                  onChange={(e) => setCtxCategory(e.target.value)}
                  placeholder="Category"
                  className="flex-1 min-w-[120px] rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={ctxTrend}
                  onChange={(e) => setCtxTrend(e.target.value)}
                  placeholder="Trend"
                  className="flex-1 min-w-[120px] rounded border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveContext}
                disabled={ctxSaving || !ctxTitle.trim()}
                className="rounded bg-gray-900 text-white px-4 py-2 text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {ctxSaving ? "Saving…" : ctxEditingId ? "Update" : "Add reference"}
              </button>
              {ctxEditingId && (
                <button
                  type="button"
                  onClick={() => { setCtxEditingId(null); setCtxTitle(""); setCtxDescription(""); setCtxVibe(""); setCtxCategory(""); setCtxTrend(""); }}
                  className="ml-2 rounded border border-gray-300 px-3 py-1.5 text-sm"
                >
                  Cancel edit
                </button>
              )}
            </div>
            {contextLoading ? (
              <p className="mt-4 text-gray-500">Loading…</p>
            ) : contextItems.length === 0 ? (
              <p className="mt-4 text-gray-500">No reference entries. Add some to improve AI suggestions.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {contextItems.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2 py-2 border-b border-gray-100">
                    <div>
                      <span className="font-medium">{item.title}</span>
                      {item.description && <span className="text-gray-600 text-sm ml-2">— {item.description}</span>}
                      {!item.isActive && <span className="ml-2 text-xs text-amber-600">(inactive)</span>}
                    </div>
                    <div className="flex gap-2 shrink-0 items-center">
                      <label className="flex items-center gap-1 text-sm">
                        <input
                          type="checkbox"
                          checked={item.isActive}
                          onChange={async () => {
                            try {
                              await updateMicrostoreCreationContext(item.id, { isActive: !item.isActive });
                              await loadContext();
                            } catch (e) {
                              alert(e instanceof Error ? e.message : "Update failed");
                            }
                          }}
                        />
                        Active
                      </label>
                      <button type="button" onClick={() => startEditContext(item)} className="text-blue-600 hover:underline text-sm">Edit</button>
                      <button type="button" onClick={() => handleDeleteContext(item.id)} className="text-red-600 hover:underline text-sm">Delete</button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
      </main>
    </div>
  );
}
