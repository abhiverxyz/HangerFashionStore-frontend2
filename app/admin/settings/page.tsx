"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getModelConfig,
  updateModelConfig,
  getStyleReportSettings,
  updateStyleReportSettings,
  type ModelConfigMap,
  type StyleReportSettings,
} from "@/lib/api/admin";

const SCOPE_LABELS: Record<string, string> = {
  imageAnalysis: "Image analysis (vision)",
  llm: "LLM (chat / complete)",
  embed: "Embeddings",
  imageGeneration: "Image generation",
};

const SCOPES = ["imageAnalysis", "llm", "embed", "imageGeneration"];

export default function AdminSettingsPage() {
  const [config, setConfig] = useState<ModelConfigMap | null>(null);
  const [styleReportSettings, setStyleReportSettings] = useState<StyleReportSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [styleReportSaving, setStyleReportSaving] = useState(false);
  const [edits, setEdits] = useState<Record<string, { provider: string; model: string }>>({});
  const [styleReportEdits, setStyleReportEdits] = useState<{ minLooks: string; maxLooks: string } | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    Promise.all([getModelConfig(), getStyleReportSettings()])
      .then(([modelData, styleData]) => {
        if (!cancelled) {
          setConfig(modelData);
          setEdits({});
          setStyleReportSettings(styleData);
          setStyleReportEdits(null);
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
  }, []);

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

  const styleReportMin = styleReportEdits?.minLooks ?? String(styleReportSettings?.minLooks ?? 1);
  const styleReportMax = styleReportEdits?.maxLooks ?? String(styleReportSettings?.maxLooks ?? 15);
  const styleReportDirty =
    styleReportSettings != null &&
    (Number(styleReportEdits?.minLooks ?? styleReportSettings.minLooks) !== styleReportSettings.minLooks ||
      Number(styleReportEdits?.maxLooks ?? styleReportSettings.maxLooks) !== styleReportSettings.maxLooks);

  const handleSaveStyleReport = async () => {
    const min = Math.max(1, Math.min(50, Math.floor(Number(styleReportMin) || 1)));
    const max = Math.max(1, Math.min(50, Math.floor(Number(styleReportMax) || 15)));
    setStyleReportSaving(true);
    setError(null);
    try {
      const updated = await updateStyleReportSettings({ minLooks: min, maxLooks: max });
      setStyleReportSettings(updated);
      setStyleReportEdits(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save style report settings");
    } finally {
      setStyleReportSaving(false);
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">AI / Model settings</h1>
      <p className="mt-2 text-neutral-600">
        Choose which provider and model to use for each utility. Changes are stored in the database and override env defaults.
      </p>

      {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-neutral-500">Loading…</p>
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
                  className="p-4 rounded-soft-xl border border-border200 bg-card flex flex-wrap items-end gap-4"
                >
                  <div className="min-w-[180px]">
                    <label className="block text-sm font-medium text-neutral-700 mb-1">
                      {SCOPE_LABELS[scope] ?? scope}
                    </label>
                    <span className="text-xs text-neutral-500">{scope}</span>
                  </div>
                  <div className="flex-1 min-w-[120px]">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Provider</label>
                    <input
                      type="text"
                      value={current.provider}
                      onChange={(e) => setEdit(scope, "provider", e.target.value)}
                      className="w-full rounded border border-border300 px-3 py-2 text-sm"
                      placeholder="e.g. openai, flux"
                    />
                  </div>
                  <div className="flex-1 min-w-[200px]">
                    <label className="block text-xs font-medium text-neutral-500 mb-1">Model</label>
                    <input
                      type="text"
                      value={current.model}
                      onChange={(e) => setEdit(scope, "model", e.target.value)}
                      className="w-full rounded border border-border300 px-3 py-2 text-sm"
                      placeholder="e.g. gpt-4o-mini"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSave(scope)}
                    disabled={!isDirty || isSaving}
                    className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? "Saving…" : "Save"}
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <section className="mt-10 pt-8 border-t border-border200">
          <h2 className="text-lg font-semibold text-neutral-900">Style report</h2>
          <p className="mt-1 text-sm text-neutral-600">
            Minimum and maximum number of looks used when generating a style report. The agent always uses the latest looks in this range.
          </p>
          {!loading && (
            <div className="mt-4 p-4 rounded-soft-xl border border-border200 bg-card flex flex-wrap items-end gap-4">
              <div className="min-w-[100px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Min looks</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={styleReportMin}
                  onChange={(e) =>
                    setStyleReportEdits((prev) => ({
                      ...prev,
                      minLooks: e.target.value,
                      maxLooks: prev?.maxLooks ?? styleReportMax,
                    }))
                  }
                  className="w-full rounded border border-border300 px-3 py-2 text-sm"
                />
                <span className="text-xs text-neutral-500">Minimum looks required to generate a report</span>
              </div>
              <div className="min-w-[100px]">
                <label className="block text-sm font-medium text-neutral-700 mb-1">Max looks</label>
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={styleReportMax}
                  onChange={(e) =>
                    setStyleReportEdits((prev) => ({
                      ...prev,
                      maxLooks: e.target.value,
                      minLooks: prev?.minLooks ?? styleReportMin,
                    }))
                  }
                  className="w-full rounded border border-border300 px-3 py-2 text-sm"
                />
                <span className="text-xs text-neutral-500">Maximum latest looks used for the report</span>
              </div>
              <button
                type="button"
                onClick={handleSaveStyleReport}
                disabled={!styleReportDirty || styleReportSaving}
                className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {styleReportSaving ? "Saving…" : "Save"}
              </button>
            </div>
          )}
        </section>
    </>
  );
}
