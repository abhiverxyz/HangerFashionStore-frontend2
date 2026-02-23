"use client";

import { useCallback, useEffect, useState } from "react";
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
    setLoading(true);
    load();
  }, [load]);

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

  return (
    <>
      <div className="flex items-center gap-4 mb-6">
          <Link href="/admin" className="text-neutral-600 hover:text-foreground">
            ← Dashboard
          </Link>
          <h1 className="text-2xl font-semibold">Look classification tags</h1>
        </div>
        <p className="text-neutral-600 mb-6">
          Tags used to classify user-submitted looks (e.g. casual, work, party). Used by Look Analysis. Add, edit, or
          delete; seed loads defaults when the list is empty.
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-soft-lg bg-red-50 text-red-800 text-sm">{error}</div>
        )}

        <div className="mb-6 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleSeed}
            disabled={seedLoading || total > 0}
            className="px-4 py-2 rounded-soft-lg border border-border bg-card text-sm font-medium text-neutral-700 hover:bg-neutral-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {seedLoading ? "Seeding…" : "Seed default tags"}
          </button>
          {total > 0 && (
            <span className="text-sm text-neutral-500 self-center">({total} tags; seed only when empty)</span>
          )}
        </div>

        <section className="mb-8">
          <h2 className="text-lg font-medium mb-3">Add tag</h2>
          <form onSubmit={handleAdd} className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Name (slug)</label>
              <input
                type="text"
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                placeholder="e.g. smart-casual"
                className="border border-border rounded-soft-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Label</label>
              <input
                type="text"
                value={addLabel}
                onChange={(e) => setAddLabel(e.target.value)}
                placeholder="e.g. Smart Casual"
                className="border border-border rounded-soft-lg px-3 py-2 text-sm w-40"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Description</label>
              <input
                type="text"
                value={addDescription}
                onChange={(e) => setAddDescription(e.target.value)}
                placeholder="Optional"
                className="border border-border rounded-soft-lg px-3 py-2 text-sm w-48"
              />
            </div>
            <div>
              <label className="block text-xs text-neutral-500 mb-1">Sort order</label>
              <input
                type="number"
                value={addSortOrder}
                onChange={(e) => setAddSortOrder(Number(e.target.value) || 0)}
                className="border border-border rounded-soft-lg px-3 py-2 text-sm w-20"
              />
            </div>
            <button
              type="submit"
              disabled={addLoading}
              className="px-4 py-2 rounded-soft-lg bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {addLoading ? "Adding…" : "Add"}
            </button>
            {addError && <span className="text-sm text-red-600">{addError}</span>}
          </form>
        </section>

        <section>
          <h2 className="text-lg font-medium mb-3">Tags ({total})</h2>
          {loading ? (
            <p className="text-neutral-500">Loading…</p>
          ) : tags.length === 0 ? (
            <p className="text-neutral-500">No tags yet. Click “Seed default tags” to add defaults.</p>
          ) : (
            <ul className="border border-border rounded-soft-xl divide-y divide-border bg-card">
              {tags.map((tag) => (
                <li key={tag.id} className="p-4 flex flex-wrap items-center gap-3">
                  {editingId === tag.id ? (
                    <>
                      <span className="font-mono text-sm text-neutral-500 w-32">{tag.name}</span>
                      <input
                        type="text"
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        className="border border-border rounded-soft-lg px-2 py-1 text-sm w-36"
                        placeholder="Label"
                      />
                      <input
                        type="text"
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="border border-border rounded-soft-lg px-2 py-1 text-sm flex-1 min-w-[120px]"
                        placeholder="Description"
                      />
                      <input
                        type="number"
                        value={editSortOrder}
                        onChange={(e) => setEditSortOrder(Number(e.target.value) || 0)}
                        className="border border-border rounded-soft-lg px-2 py-1 text-sm w-16"
                      />
                      <button
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={saveLoading}
                        className="px-3 py-1 rounded-soft-lg bg-primary-cta text-neutral-100 text-sm hover:opacity-90 disabled:opacity-50"
                      >
                        {saveLoading ? "Saving…" : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1 rounded-soft-lg border border-border text-sm hover:bg-neutral-100"
                      >
                        Cancel
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="font-mono text-sm text-neutral-500 w-32">{tag.name}</span>
                      <span className="font-medium w-36">{tag.label}</span>
                      <span className="text-neutral-500 text-sm flex-1 min-w-0 truncate">
                        {tag.description || "—"}
                      </span>
                      <span className="text-neutral-400 text-sm w-8">{tag.sortOrder}</span>
                      <button
                        type="button"
                        onClick={() => startEdit(tag)}
                        className="px-2 py-1 rounded-soft-lg border border-border text-sm hover:bg-neutral-100"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(tag.id)}
                        disabled={deleteLoading === tag.id}
                        className="px-2 py-1 rounded-soft-lg border border-red-200 text-red-700 text-sm hover:bg-red-50 disabled:opacity-50"
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
    </>
  );
}
