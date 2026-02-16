"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";
import {
  fetchLookClassificationTags,
  seedLookClassificationTags,
  createLookClassificationTag,
  updateLookClassificationTag,
  deleteLookClassificationTag,
} from "@/lib/api/admin";
import type { LookClassificationTagItem } from "@/lib/api/admin";

export default function AdminLookClassificationTagsPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [tags, setTags] = useState<LookClassificationTagItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [seedLoading, setSeedLoading] = useState(false);
  const [addName, setAddName] = useState("");
  const [addLabel, setAddLabel] = useState("");
  const [addDescription, setAddDescription] = useState("");
  const [addSortOrder, setAddSortOrder] = useState<number>(0);
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [saveLoading, setSaveLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetchLookClassificationTags({ limit: 200 });
      setTags(res.items);
      setTotal(res.total);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load tags");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    load();
  }, [user, load]);

  const handleSeed = async () => {
    setSeedLoading(true);
    setError(null);
    try {
      const result = await seedLookClassificationTags();
      if (result.seeded > 0) await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to seed");
    } finally {
      setSeedLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = addName.trim();
    if (!name) {
      setAddError("Name is required");
      return;
    }
    setAddLoading(true);
    setAddError(null);
    try {
      await createLookClassificationTag({
        name,
        label: addLabel.trim() || name,
        description: addDescription.trim() || undefined,
        sortOrder: addSortOrder,
      });
      setAddName("");
      setAddLabel("");
      setAddDescription("");
      setAddSortOrder(0);
      await load();
    } catch (e) {
      setAddError(e instanceof Error ? e.message : "Failed to create tag");
    } finally {
      setAddLoading(false);
    }
  };

  const startEdit = (tag: LookClassificationTagItem) => {
    setEditingId(tag.id);
    setEditLabel(tag.label);
    setEditDescription(tag.description ?? "");
    setEditSortOrder(tag.sortOrder);
  };

  const cancelEdit = () => {
    setEditingId(null);
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    setSaveLoading(true);
    setError(null);
    try {
      await updateLookClassificationTag(editingId, {
        label: editLabel.trim(),
        description: editDescription.trim() || null,
        sortOrder: editSortOrder,
      });
      setEditingId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update tag");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this tag? Looks can still reference it by name until re-analyzed.")) return;
    setDeleteLoading(id);
    setError(null);
    try {
      await deleteLookClassificationTag(id);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete tag");
    } finally {
      setDeleteLoading(null);
    }
  };

  if (authLoading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} />
      <main className="max-w-4xl mx-auto p-8">
        <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-gray-600 hover:text-gray-900">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold">Look classification tags</h1>
        </div>
        <p className="text-gray-600 mb-6">
          Tags used to classify user-submitted looks (e.g. casual, work, party). Used by Look Analysis. Add, edit, or
          delete; seed loads defaults when the list is empty.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded bg-red-50 text-red-800 text-sm">{error}</div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seedLoading || total > 0}
            className="px-4 py-2 rounded border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seedLoading ? "Seeding…" : "Seed default tags"}
          </button>
          {total > 0 && (
            <span className="text-sm text-gray-500 self-center">({total} tags; seed only when empty)</span>
          )}
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">Add tag</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-gray-500 mb-1">Name (slug)</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. smart-casual"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Label</label>
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g. Smart Casual"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Description</label>
              <input
                type="text"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Optional"
                className="border border-gray-300 rounded px-3 py-2 text-sm w-48"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Sort order</label>
              <input
                type="number"
                value={addSortOrder}
                onChange={(e) => setAddSortOrder(Number(e.target.value) || 0)}
                className="border border-gray-300 rounded px-3 py-2 text-sm w-20"
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
            >
              {addLoading ? "Adding…" : "Add"}
            </button>
            {addError && <span className="text-sm text-red-600">{addError}</span>}
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Tags ({total})</h2>
          {loading ? (
            <p className="text-gray-500">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="text-gray-500">No tags yet. Click “Seed default tags” to add defaults.</p>
          ) : (
            <ul className="border border-gray-200 rounded-lg divide-y divide-gray-200 bg-white">
              {tags.map((tag) => (
                <li key={tag.id} className="p-4 flex flex-wrap items-center gap-3">
                  {editingId === tag.id ? (
                    <>
                      <span className="font-mono text-sm text-gray-500 w-32">{tag.name}</span>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm flex-1 min-w-[120px]"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(Number(e.target.value) || 0)}
                        className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={saveLoading}
                        className="px-3 py-1 rounded bg-gray-900 text-white text-sm hover:bg-gray-800 disabled:opacity-50"
                      >
                        {saveLoading ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-sm text-gray-500 w-32">{tag.name}</span>
                      <span className="font-medium w-36">{tag.label}</span>
                      <span className="text-gray-500 text-sm flex-1 min-w-0 truncate">
                        {tag.description || "—"}
                      </span>
                      <span className="text-gray-400 text-sm w-8">{tag.sortOrder}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        className="px-2 py-1 rounded border border-gray-300 text-sm hover:bg-gray-50"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        disabled={deleteLoading === tag.id}
                        className="px-2 py-1 rounded border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
                      >
                        {deleteLoading === tag.id ? "Deleting…" : "Delete"}
                      </button>
                    </>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
