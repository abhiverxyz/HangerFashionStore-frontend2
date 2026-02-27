"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { fetchStoreForYouConstruct, updateStoreForYouConstruct, type StoreForYouConstruct } from "@/lib/api/admin";

export default function AdminWardrobePage() {
  const [config, setConfig] = useState<StoreForYouConstruct | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startingImageUrl, setStartingImageUrl] = useState("");
  const [bannerImageUrl, setBannerImageUrl] = useState("");
  const [styleNotesTemplate, setStyleNotesTemplate] = useState("");
  const [productSelectionRules, setProductSelectionRules] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchStoreForYouConstruct();
      setConfig(data);
      setStartingImageUrl(data.startingImageUrl ?? "");
      setBannerImageUrl(data.bannerImageUrl ?? "");
      setStyleNotesTemplate(data.styleNotesTemplate ?? "");
      setProductSelectionRules(data.productSelectionRules ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load construct");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSave = async () => {
    setSaving(true);
    setError(null);
    try {
      await updateStoreForYouConstruct({
        startingImageUrl: startingImageUrl.trim() || null,
        bannerImageUrl: bannerImageUrl.trim() || null,
        styleNotesTemplate: styleNotesTemplate.trim() || null,
        productSelectionRules: productSelectionRules.trim() || null,
      });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading && !config) {
    return (
      <div className="space-y-6">
        <h1 className="font-display text-2xl text-foreground">Store for you construct</h1>
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl text-foreground">Store for you construct</h1>
      <p className="text-neutral-600 max-w-2xl">
        &quot;Store for you&quot; is a permanent section in each user&apos;s Wardrobe (not a microstore).
        Configure the three elements below. Content is personalized per user from this construct.
      </p>

      {error && (
        <div className="rounded-soft-lg bg-red-50 border border-red-200 text-red-800 px-4 py-2 text-sm">
          {error}
        </div>
      )}

      <section className="rounded-soft-xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">(a) Starting image and banner</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Starting image URL</label>
          <input
            type="url"
            value={startingImageUrl}
            onChange={(e) => setStartingImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">Default hero/cover when creating a user&apos;s Store for you.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Banner image URL</label>
          <input
            type="url"
            value={bannerImageUrl}
            onChange={(e) => setBannerImageUrl(e.target.value)}
            placeholder="https://…"
            className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-neutral-500">Banner shown in the Wardrobe Store for you section.</p>
        </div>
      </section>

      <section className="rounded-soft-xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">(b) Style notes template</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Template or default style notes</label>
          <textarea
            value={styleNotesTemplate}
            onChange={(e) => setStyleNotesTemplate(e.target.value)}
            placeholder="e.g. Structure or prompts used to personalize style notes per user…"
            rows={4}
            className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
          />
        </div>
      </section>

      <section className="rounded-soft-xl border border-border bg-card p-6 max-w-2xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">(c) Product selection rules</h2>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-1">Rules (JSON, optional)</label>
          <textarea
            value={productSelectionRules}
            onChange={(e) => setProductSelectionRules(e.target.value)}
            placeholder='e.g. { "minProducts": 20, "maxProducts": 50 }'
            rows={4}
            className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm font-mono"
          />
          <p className="mt-1 text-xs text-neutral-500">Criteria for which products to display; used by curation. Per-user product list is personalized.</p>
        </div>
      </section>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save construct"}
        </button>
      </div>

      {config?.updatedAt && (
        <p className="text-xs text-neutral-500">Last updated: {new Date(config.updatedAt).toLocaleString()}</p>
      )}

      <section className="rounded-soft-xl border border-border bg-card p-6 max-w-2xl mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Related</h2>
        <ul className="mt-4 space-y-3 text-sm">
          <li>
            <Link href="/admin/microstores" className="text-primary hover:underline font-medium">
              Microstore creation context
            </Link>
            <span className="text-neutral-600 ml-1">— Creation context tab: reference titles and descriptions for AI when generating Store for you content.</span>
          </li>
          <li>
            <Link href="/admin/fashion-content" className="text-primary hover:underline font-medium">
              Trends and styling
            </Link>
            <span className="text-neutral-600 ml-1">— Fashion content and styling rules used by the curation agent.</span>
          </li>
          <li>
            <Link href="/admin/styling-agent" className="text-primary hover:underline font-medium">
              Styling Agent
            </Link>
            <span className="text-neutral-600 ml-1">— Agent goals and tone.</span>
          </li>
        </ul>
      </section>
    </div>
  );
}
