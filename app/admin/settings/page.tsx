"use client";

import { useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";
import { getModelConfig, updateModelConfig, type ModelConfigMap } from "@/lib/api/admin";

const SCOPE_LABELS: Record<string, string> = {
  imageAnalysis: "Image analysis (vision)",
  llm: "LLM (chat / complete)",
  embed: "Embeddings",
  imageGeneration: "Image generation",
};

const SCOPES = ["imageAnalysis", "llm", "embed", "imageGeneration"];

export default function AdminSettingsPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
  const [config, setConfig] = useState<ModelConfigMap | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [edits, setEdits] = useState<Record<string, { provider: string; model: string }>>({});

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    getModelConfig()
      .then((data) => {
        if (!cancelled) {
          setConfig(data);
          setEdits({});
        }
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load config");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  const handleSave = async (scope: string) => {
    const e = edits[scope] ?? config?.[scope];
    if (!e) return;
    setSaving(scope);
    setError(null);
    try {
      const updated = await updateModelConfig(scope, { provider: e.provider, model: e.model });
      setConfig(updated);
      setEdits((prev) => {
        const next = { ...prev };
        delete next[scope];
        return next;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(null);
    }
  };

  const setEdit = (scope: string, field: "provider" | "model", value: string) => {
    setEdits((prev) => {
      const current = { ...(config?.[scope] ?? {}), ...prev[scope] };
      return { ...prev, [scope]: { ...current, [field]: value } };
    });
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
        <h1 className="text-2xl font-semibold">AI / Model settings</h1>
        <p className="mt-2 text-gray-600">
          Choose which provider and model to use for each utility. Changes are stored in the database and override env defaults.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-gray-500">Loading…</p>
        ) : (
          <div className="mt-6 space-y-4">
            {SCOPES.map((scope) => {
              const current = edits[scope] ?? config?.[scope] ?? { provider: "", model: "" };
              const isDirty =
                edits[scope] != null &&
                (edits[scope].provider !== config?.[scope]?.provider || edits[scope].model !== config?.[scope]?.model);
              const isSaving = saving === scope;

              return (
                <div
                  key={scope}
                  className="p-4 rounded-lg border border-gray-200 bg-white flex flex-wrap items-end gap-4"
                >
                  <div className="min-w-[180px]">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      {SCOPE_LABELS[scope] ?? scope}
                    </label>
                    <span className="text-xs text-gray-500">{scope}</span>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Provider</label>
                    <input
                      type="text"
                      value={current.provider}
                      onChange={(e) => setEdit(scope, "provider", e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. openai, flux"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-gray-500 mb-1">Model</label>
                    <input
                      type="text"
                      value={current.model}
                      onChange={(e) => setEdit(scope, "model", e.target.value)}
                      className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                      placeholder="e.g. gpt-4o-mini"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave(scope)}
                    disabled={!isDirty || isSaving}
                    className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
