"use client";

import {
  fetchMicrostores,
  fetchMicrostoreCreationContexts,
  createMicrostoreCreationContext,
  updateMicrostoreCreationContext,
  deleteMicrostoreCreationContext,
  publishMicrostore,
  archiveMicrostore,
  deleteMicrostore,
  bulkMicrostores,
  createSystemMicrostoresBatch,
  runSystemMicrostoresBatch,
  setMicrostoreVisibility,
  fetchAllowedMicrostoreCreators,
  addAllowedMicrostoreCreator,
  removeAllowedMicrostoreCreator,
} from "@/lib/api/admin";
import type { MicrostoreSummary, MicrostoreCreationContextItem, AllowedMicrostoreCreatorItem } from "@/lib/api/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

type Tab = "stores" | "create" | "context" | "allowed";

export default function AdminMicrostoresPage() {
  const [tab, setTab] = useState<Tab>("stores");
  const [stores, setStores] = useState<MicrostoreSummary[]>([]);
  const [storesTotal, setStoresTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [storesLoading, setStoresLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  const [visibilityModal, setVisibilityModal] = useState<{ storeId: string; storeName: string; scope: string; visibilityUserId: string; userIds: string } | null>(null);
  const [visibilitySaving, setVisibilitySaving] = useState(false);

  // Creation context
  const [contextItems, setContextItems] = useState<MicrostoreCreationContextItem[]>([]);
  const [contextLoading, setContextLoading] = useState(false);

  // Batch generate
  const [batchCount, setBatchCount] = useState(5);
  const [batchLoading, setBatchLoading] = useState(false);
  const [batchMessage, setBatchMessage] = useState<string | null>(null);
  const [runAndWait, setRunAndWait] = useState(false);

  // Creation context form
  const [ctxTitle, setCtxTitle] = useState("");
  const [ctxDescription, setCtxDescription] = useState("");
  const [ctxVibe, setCtxVibe] = useState("");
  const [ctxCategory, setCtxCategory] = useState("");
  const [ctxTrend, setCtxTrend] = useState("");
  const [ctxSaving, setCtxSaving] = useState(false);
  const [ctxEditingId, setCtxEditingId] = useState<string | null>(null);

  // Allowed creators (users who can create microstores)
  const [allowedCreators, setAllowedCreators] = useState<AllowedMicrostoreCreatorItem[]>([]);
  const [allowedLoading, setAllowedLoading] = useState(false);
  const [allowedInput, setAllowedInput] = useState("");
  const [allowedAdding, setAllowedAdding] = useState(false);
  const [allowedRemoving, setAllowedRemoving] = useState<string | null>(null);

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
    loadStores();
  }, [loadStores]);

  const loadAllowedCreators = useCallback(async () => {
    setAllowedLoading(true);
    try {
      const data = await fetchAllowedMicrostoreCreators({ limit: 200 });
      setAllowedCreators(data.items);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load allowed creators");
    } finally {
      setAllowedLoading(false);
    }
  }, []);

  useEffect(() => {
    if (tab !== "context") return;
    loadContext();
  }, [tab, loadContext]);

  useEffect(() => {
    if (tab !== "allowed") return;
    loadAllowedCreators();
  }, [tab, loadAllowedCreators]);

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

  const openVisibilityModal = (s: MicrostoreSummary & { visibilityUserId?: string | null; visibleTo?: { userId: string }[] }) => {
    const scope = s.visibilityScope === "single_user" ? "single_user" : s.visibilityScope === "select_users" ? "select_users" : "all";
    const visibilityUserId = (s as { visibilityUserId?: string | null }).visibilityUserId ?? "";
    const userIds = ((s as { visibleTo?: { userId: string }[] }).visibleTo ?? []).map((x) => x.userId).join(", ");
    setVisibilityModal({ storeId: s.id, storeName: s.name, scope, visibilityUserId, userIds });
  };

  const handleSaveVisibility = async () => {
    if (!visibilityModal) return;
    setVisibilitySaving(true);
    try {
      const body: { scope: string; visibilityUserId?: string; userIds?: string[] } = { scope: visibilityModal.scope };
      if (visibilityModal.scope === "single_user" && visibilityModal.visibilityUserId.trim()) {
        body.visibilityUserId = visibilityModal.visibilityUserId.trim();
      }
      if (visibilityModal.scope === "select_users" && visibilityModal.userIds.trim()) {
        body.userIds = visibilityModal.userIds.split(",").map((id) => id.trim()).filter(Boolean);
      }
      await setMicrostoreVisibility(visibilityModal.storeId, body);
      setVisibilityModal(null);
      await loadStores();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update visibility");
    } finally {
      setVisibilitySaving(false);
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

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === stores.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(stores.map((s) => s.id)));
  };

  const handleBulkAction = async (action: "archive" | "publish" | "delete") => {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;
    if (action === "delete" && !confirm(`Delete ${ids.length} store(s)? This will soft-delete them.`)) return;
    setBulkLoading(true);
    try {
      const result = await bulkMicrostores(action, ids);
      if (result.errors.length > 0) {
        alert(`${result.successCount} succeeded, ${result.errors.length} failed: ${result.errors.map((e) => e.error).join("; ")}`);
      }
      setSelectedIds(new Set());
      await loadStores();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bulk action failed");
    } finally {
      setBulkLoading(false);
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

  return (
    <>
      <div className="mb-6">
          <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Microstores</h1>
        <p className="mt-1 text-neutral-600">Create and manage microstores. Use creation context to guide AI when generating names and descriptions.</p>

        {/* Tabs */}
        <div className="mt-6 flex gap-2 border-b border-border">
          {(["stores", "create", "context", "allowed"] as Tab[]).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium rounded-t ${tab === t ? "bg-card border border-b-0 border-border -mb-px text-neutral-900" : "text-neutral-600 hover:text-foreground"}`}
            >
              {t === "stores" ? "Stores" : t === "create" ? "Create store" : t === "context" ? "Creation context" : "Allowed creators"}
            </button>
          ))}
        </div>

        {error && (
          <div className="mt-4 p-3 rounded-soft-lg bg-red-50 text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Tab: Stores */}
        {tab === "stores" && (
          <>
            {/* Auto-generate */}
            <section className="mt-6 p-4 rounded-soft-xl border border-border bg-card">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Auto-generate microstores</h2>
              <p className="mt-1 text-sm text-neutral-600">Agent creates full stores (name, description, hero image, style notes, products) and saves them as drafts.</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={batchCount}
                  onChange={(e) => setBatchCount(Number(e.target.value) || 5)}
                  className="w-16 rounded-soft-lg border border-border px-2 py-1 text-sm"
                />
                <label className="flex items-center gap-2 text-sm">
                  <input type="checkbox" checked={runAndWait} onChange={(e) => setRunAndWait(e.target.checked)} />
                  Wait for result (slower)
                </label>
                <button
                  type="button"
                  onClick={handleBatch}
                  disabled={batchLoading}
                  className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {batchLoading ? "Running…" : `Generate ${batchCount} microstores`}
                </button>
              </div>
              {batchMessage && <p className="mt-2 text-sm text-neutral-700">{batchMessage}</p>}
            </section>

            {/* List */}
            <section className="mt-6 p-4 rounded-soft-xl border border-border bg-card">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">All stores</h2>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-600">Status:</span>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="rounded-soft-lg border border-border px-2 py-1 text-sm"
                  >
                    <option value="all">All</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
              </div>
              {selectedIds.size > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="text-sm text-neutral-600">{selectedIds.size} selected</span>
                  <button
                    type="button"
                    onClick={() => handleBulkAction("publish")}
                    disabled={bulkLoading}
                    className="rounded-soft-lg bg-blue-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
                  >
                    Publish selected
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction("archive")}
                    disabled={bulkLoading}
                    className="rounded-soft-lg bg-amber-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
                  >
                    Archive selected
                  </button>
                  <button
                    type="button"
                    onClick={() => handleBulkAction("delete")}
                    disabled={bulkLoading}
                    className="rounded-soft-lg bg-red-600 text-white px-3 py-1.5 text-sm font-medium hover:bg-red-700 disabled:opacity-50"
                  >
                    Delete selected
                  </button>
                </div>
              )}
              {storesLoading ? (
                <p className="mt-4 text-neutral-500">Loading…</p>
              ) : stores.length === 0 ? (
                <p className="mt-4 text-neutral-500">No microstores. Create one or run auto-generate.</p>
              ) : (
                <div className="mt-4 overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-neutral-600">
                        <th className="pb-2 pr-2 w-8">
                          <input
                            type="checkbox"
                            checked={stores.length > 0 && selectedIds.size === stores.length}
                            onChange={toggleSelectAll}
                            aria-label="Select all"
                          />
                        </th>
                        <th className="pb-2 pr-4">Name</th>
                        <th className="pb-2 pr-4">Status</th>
                        <th className="pb-2 pr-4">Products</th>
                        <th className="pb-2 pr-4">Created by</th>
                        <th className="pb-2 pr-4">Display</th>
                        <th className="pb-2 pr-4">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stores.map((s) => {
                        const scope = (s as { visibilityScope?: string | null }).visibilityScope;
                        const displayLabel = scope === "single_user" ? "One user" : scope === "select_users" ? "Select users" : "All users";
                        return (
                        <tr key={s.id} className="border-b border-border">
                          <td className="py-2 pr-2">
                            <input
                              type="checkbox"
                              checked={selectedIds.has(s.id)}
                              onChange={() => toggleSelect(s.id)}
                              aria-label={`Select ${s.name}`}
                            />
                          </td>
                          <td className="py-2 pr-4 font-medium">
                            <Link href={`/admin/microstores/${encodeURIComponent(s.id)}`} className="text-primary hover:underline">
                              {s.name}
                            </Link>
                            <span className="ml-1 text-neutral-400">·</span>
                            <Link href={`/microstores/${encodeURIComponent(s.id)}/edit`} className="ml-1 text-sm text-primary hover:underline">
                              Edit wizard
                            </Link>
                          </td>
                          <td className="py-2 pr-4">{s.status}</td>
                          <td className="py-2 pr-4">{s.productCount ?? 0}</td>
                          <td className="py-2 pr-4">{s.createdBy ?? "—"}</td>
                          <td className="py-2 pr-4">
                            <span className="text-neutral-600">{displayLabel}</span>
                            <button
                              type="button"
                              onClick={() => openVisibilityModal(s as MicrostoreSummary & { visibilityUserId?: string | null; visibleTo?: { userId: string }[] })}
                              className="ml-1 text-xs text-primary hover:underline"
                            >
                              Edit
                            </button>
                          </td>
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
                      );})}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </>
        )}

        {/* Tab: Create store */}
        {tab === "create" && (
          <section className="mt-6 p-4 rounded-soft-xl border border-border bg-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Create store</h2>
            <p className="mt-1 text-sm text-neutral-600">Stores can only be created through the full wizard (all 5 steps) or via auto-generate below. A store cannot be published until it has name, cover image, at least 20 products, and style notes.</p>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/microstores/create"
                className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90"
              >
                Create store (full wizard)
              </Link>
            </div>
            <p className="mt-4 text-sm text-neutral-500">To auto-generate stores (full flow, then submit for approval), use the <strong>Stores</strong> tab and the &quot;Auto-generate microstores&quot; section.</p>
          </section>
        )}

        {/* Tab: Creation context */}
        {tab === "context" && (
          <section className="mt-6 p-4 rounded-soft-xl border border-border bg-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Reference titles & descriptions (for AI)</h2>
            <p className="mt-1 text-sm text-neutral-600">These examples are sent to the LLM when generating store names and descriptions (manual suggest and auto-generate).</p>
            <div className="mt-4 space-y-3 max-w-xl">
              <input
                type="text"
                value={ctxTitle}
                onChange={(e) => setCtxTitle(e.target.value)}
                placeholder="Title"
                className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={ctxDescription}
                onChange={(e) => setCtxDescription(e.target.value)}
                placeholder="Description (optional)"
                className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
              />
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={ctxVibe}
                  onChange={(e) => setCtxVibe(e.target.value)}
                  placeholder="Vibe"
                  className="flex-1 min-w-[120px] rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={ctxCategory}
                  onChange={(e) => setCtxCategory(e.target.value)}
                  placeholder="Category"
                  className="flex-1 min-w-[120px] rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
                <input
                  type="text"
                  value={ctxTrend}
                  onChange={(e) => setCtxTrend(e.target.value)}
                  placeholder="Trend"
                  className="flex-1 min-w-[120px] rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveContext}
                disabled={ctxSaving || !ctxTitle.trim()}
                className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {ctxSaving ? "Saving…" : ctxEditingId ? "Update" : "Add reference"}
              </button>
              {ctxEditingId && (
                <button
                  type="button"
                  onClick={() => { setCtxEditingId(null); setCtxTitle(""); setCtxDescription(""); setCtxVibe(""); setCtxCategory(""); setCtxTrend(""); }}
                  className="ml-2 rounded-soft-lg border border-border px-3 py-1.5 text-sm"
                >
                  Cancel edit
                </button>
              )}
            </div>
            {contextLoading ? (
              <p className="mt-4 text-neutral-500">Loading…</p>
            ) : contextItems.length === 0 ? (
              <p className="mt-4 text-neutral-500">No reference entries. Add some to improve AI suggestions.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {contextItems.map((item) => (
                  <li key={item.id} className="flex items-start justify-between gap-2 py-2 border-b border-border">
                    <div>
                      <span className="font-medium">{item.title}</span>
                      {item.description && <span className="text-neutral-600 text-sm ml-2">— {item.description}</span>}
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

        {/* Tab: Allowed creators */}
        {tab === "allowed" && (
          <section className="mt-6 p-4 rounded-soft-xl border border-border bg-card">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Users allowed to create microstores</h2>
            <p className="mt-1 text-sm text-neutral-600">These users see a &quot;Create store&quot; button on the Stores page. Admin and brand users can always create; add regular users here.</p>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={allowedInput}
                onChange={(e) => setAllowedInput(e.target.value)}
                placeholder="User ID or username"
                className="rounded-soft-lg border border-border px-3 py-2 text-sm w-56"
              />
              <button
                type="button"
                onClick={async () => {
                  const v = allowedInput.trim();
                  if (!v) return;
                  setAllowedAdding(true);
                  try {
                    await addAllowedMicrostoreCreator(v.includes("@") || v.length > 30 ? { username: v } : { userId: v });
                    setAllowedInput("");
                    await loadAllowedCreators();
                  } catch (e) {
                    alert(e instanceof Error ? e.message : "Add failed");
                  } finally {
                    setAllowedAdding(false);
                  }
                }}
                disabled={allowedAdding || !allowedInput.trim()}
                className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {allowedAdding ? "Adding…" : "Add"}
              </button>
            </div>
            {allowedLoading ? (
              <p className="mt-4 text-neutral-500">Loading…</p>
            ) : allowedCreators.length === 0 ? (
              <p className="mt-4 text-neutral-500">No allowed creators. Add a user ID or username.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {allowedCreators.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 border-b border-border">
                    <span className="text-sm">
                      {a.user?.username ?? a.user?.email ?? a.userId}
                      {a.user?.firstName || a.user?.lastName ? ` (${[a.user.firstName, a.user.lastName].filter(Boolean).join(" ")})` : ""}
                    </span>
                    <button
                      type="button"
                      onClick={async () => {
                        setAllowedRemoving(a.userId);
                        try {
                          await removeAllowedMicrostoreCreator(a.userId);
                          await loadAllowedCreators();
                        } catch (e) {
                          alert(e instanceof Error ? e.message : "Remove failed");
                        } finally {
                          setAllowedRemoving(null);
                        }
                      }}
                      disabled={allowedRemoving === a.userId}
                      className="text-red-600 hover:underline text-sm disabled:opacity-50"
                    >
                      {allowedRemoving === a.userId ? "…" : "Remove"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {/* Visibility modal */}
        {visibilityModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => !visibilitySaving && setVisibilityModal(null)}>
            <div className="bg-card border border-border rounded-soft-xl p-6 max-w-md w-full shadow-soft" onClick={(e) => e.stopPropagation()}>
              <h3 className="font-semibold text-foreground">Display: {visibilityModal.storeName}</h3>
              <p className="text-sm text-neutral-600 mt-1">Who can see this store on the Stores page.</p>
              <div className="mt-4 space-y-3">
                <div>
                  <label className="block text-sm font-medium text-neutral-700">Scope</label>
                  <select
                    value={visibilityModal.scope}
                    onChange={(e) => setVisibilityModal((m) => m ? { ...m, scope: e.target.value } : null)}
                    className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                  >
                    <option value="all">All users</option>
                    <option value="single_user">One user</option>
                    <option value="select_users">Select users</option>
                  </select>
                </div>
                {visibilityModal.scope === "single_user" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">User ID</label>
                    <input
                      type="text"
                      value={visibilityModal.visibilityUserId}
                      onChange={(e) => setVisibilityModal((m) => m ? { ...m, visibilityUserId: e.target.value } : null)}
                      placeholder="User ID (cuid)"
                      className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                )}
                {visibilityModal.scope === "select_users" && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-700">User IDs (comma-separated)</label>
                    <textarea
                      value={visibilityModal.userIds}
                      onChange={(e) => setVisibilityModal((m) => m ? { ...m, userIds: e.target.value } : null)}
                      placeholder="id1, id2, id3"
                      rows={3}
                      className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                    />
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveVisibility}
                  disabled={visibilitySaving}
                  className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {visibilitySaving ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => !visibilitySaving && setVisibilityModal(null)}
                  className="rounded-soft-lg border border-border px-4 py-2 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
    </>
  );
}
