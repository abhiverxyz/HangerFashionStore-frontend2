"use client";

import { fetchTrends, fetchStylingRules } from "@/lib/api/fashionContent";
import type { Trend, StylingRule } from "@/lib/api/fashionContent";
import {
  fetchFashionContentSources,
  addFashionContentSource,
  fetchFashionContentAllowlist,
  addFashionContentAllowlistDomain,
  removeFashionContentAllowlistDomain,
  runFashionContentAgent,
} from "@/lib/api/admin";
import type { FashionContentSourceItem, AllowedFashionDomainItem } from "@/lib/api/admin";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

/** Flatten trends into display order with depth (0 = root, 1+ = nested). Supports multi-level hierarchy. */
function flattenTrendsWithDepth(items: Trend[]): { item: Trend; depth: number }[] {
  const byParent = new Map<string | null, Trend[]>();
  byParent.set(null, []);
  for (const t of items) {
    const key = t.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(t);
  }
  const out: { item: Trend; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const t of children) {
      out.push({ item: t, depth });
      walk(t.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

/** Flatten styling rules into display order with depth (0 = root, 1+ = nested). */
function flattenRulesWithDepth(items: StylingRule[]): { item: StylingRule; depth: number }[] {
  const byParent = new Map<string | null, StylingRule[]>();
  byParent.set(null, []);
  for (const r of items) {
    const key = r.parentId ?? null;
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(r);
  }
  const out: { item: StylingRule; depth: number }[] = [];
  function walk(parentId: string | null, depth: number) {
    const children = byParent.get(parentId) ?? [];
    for (const r of children) {
      out.push({ item: r, depth });
      walk(r.id, depth + 1);
    }
  }
  walk(null, 0);
  return out;
}

export default function AdminFashionContentPage() {
  const [trends, setTrends] = useState<Trend[]>([]);
  const [trendsTotal, setTrendsTotal] = useState(0);
  const [stylingRules, setStylingRules] = useState<StylingRule[]>([]);
  const [rulesTotal, setRulesTotal] = useState(0);
  const [sources, setSources] = useState<FashionContentSourceItem[]>([]);
  const [sourcesTotal, setSourcesTotal] = useState(0);
  const [allowlist, setAllowlist] = useState<AllowedFashionDomainItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Add source form
  const [sourceType, setSourceType] = useState<"url" | "text" | "image">("url");
  const [sourcePayload, setSourcePayload] = useState("");
  const [addSourceLoading, setAddSourceLoading] = useState(false);
  const [addSourceError, setAddSourceError] = useState<string | null>(null);

  // Add domain form
  const [newDomain, setNewDomain] = useState("");
  const [addDomainLoading, setAddDomainLoading] = useState(false);
  const [addDomainError, setAddDomainError] = useState<string | null>(null);

  // Run agent
  const [runAgentLoading, setRunAgentLoading] = useState(false);
  const [runAgentResult, setRunAgentResult] = useState<{
    trendsCreated: number;
    trendsUpdated: number;
    rulesCreated: number;
    rulesUpdated: number;
    trendsPruned: number;
    rulesPruned: number;
    droppedTrends: number;
    droppedRules: number;
    webUrlsFetched: string[];
    errors: string[];
  } | null>(null);

  const loadData = useCallback(async () => {
    setError(null);
    try {
      const [trendsRes, rulesRes, sourcesRes, allowlistRes] = await Promise.all([
        fetchTrends({ limit: 100 }),
        fetchStylingRules({ limit: 100 }),
        fetchFashionContentSources({ limit: 100 }),
        fetchFashionContentAllowlist(),
      ]);
      setTrends(trendsRes.items);
      setTrendsTotal(trendsRes.total);
      setStylingRules(rulesRes.items);
      setRulesTotal(rulesRes.total);
      setSources(sourcesRes.items);
      setSourcesTotal(sourcesRes.total);
      setAllowlist(allowlistRes);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    loadData();
  }, [loadData]);

  const handleAddSource = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = sourcePayload.trim();
    if (!payload) {
      setAddSourceError("Payload is required");
      return;
    }
    setAddSourceLoading(true);
    setAddSourceError(null);
    try {
      await addFashionContentSource({ type: sourceType, payload });
      setSourcePayload("");
      await loadData();
    } catch (err) {
      setAddSourceError(err instanceof Error ? err.message : "Failed to add source");
    } finally {
      setAddSourceLoading(false);
    }
  };

  const handleAddDomain = async (e: React.FormEvent) => {
    e.preventDefault();
    const domain = newDomain.trim();
    if (!domain) {
      setAddDomainError("Domain is required (e.g. vogue.com)");
      return;
    }
    setAddDomainLoading(true);
    setAddDomainError(null);
    try {
      await addFashionContentAllowlistDomain(domain);
      setNewDomain("");
      await loadData();
    } catch (err) {
      setAddDomainError(err instanceof Error ? err.message : "Failed to add domain");
    } finally {
      setAddDomainLoading(false);
    }
  };

  const handleRemoveDomain = async (idOrDomain: string) => {
    try {
      await removeFashionContentAllowlistDomain(idOrDomain);
      await loadData();
    } catch {
      // ignore
    }
  };

  const handleRunAgent = async () => {
    setRunAgentLoading(true);
    setRunAgentResult(null);
    try {
      const res = await runFashionContentAgent();
      setRunAgentResult(res.result);
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to run agent");
    } finally {
      setRunAgentLoading(false);
    }
  };

  return (
    <>
      <div className="mb-6">
          <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Fashion content</h1>
        <p className="mt-1 text-neutral-600">
          Trends and styling rules (B1.3). Add sources, manage allowlist, run the agent. Agent runs weekly via cron.
        </p>

        {error && (
          <div className="mt-4 p-4 rounded-soft-xl bg-red-50 text-red-800 text-sm">{error}</div>
        )}

        {/* 1. Run agent */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card">
          <h2 className="text-lg font-medium text-neutral-900">Run Fashion Content Agent</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Combines LLM view, web sources (from allowlist), and admin-added content → updates trends and styling rules.
          </p>
          <button
            type="button"
            onClick={handleRunAgent}
            disabled={runAgentLoading}
            className="mt-3 px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {runAgentLoading ? "Running…" : "Run agent now"}
          </button>
          {runAgentResult && (
            <div className="mt-3 p-3 rounded bg-neutral-100 text-sm space-y-1">
              <p>Trends: {runAgentResult.trendsCreated} created, {runAgentResult.trendsUpdated} updated</p>
              <p>Rules: {runAgentResult.rulesCreated} created, {runAgentResult.rulesUpdated} updated</p>
              {((runAgentResult.droppedTrends ?? 0) > 0 || (runAgentResult.droppedRules ?? 0) > 0) && (
                <p className="text-neutral-600">Dropped (validation): {runAgentResult.droppedTrends ?? 0} trends, {runAgentResult.droppedRules ?? 0} rules</p>
              )}
              {(runAgentResult.trendsPruned > 0 || runAgentResult.rulesPruned > 0) && (
                <p className="text-neutral-600">Pruned: {runAgentResult.trendsPruned} trends, {runAgentResult.rulesPruned} rules (over max limit)</p>
              )}
              {runAgentResult.webUrlsFetched && runAgentResult.webUrlsFetched.length > 0 ? (
                <p className="text-neutral-700 mt-1">
                  Web sources fetched: {runAgentResult.webUrlsFetched.length} URL(s) — {runAgentResult.webUrlsFetched.slice(0, 5).join(", ")}
                  {runAgentResult.webUrlsFetched.length > 5 ? ` +${runAgentResult.webUrlsFetched.length - 5} more` : ""}
                </p>
              ) : (
                <p className="text-neutral-500 mt-1">Web sources fetched: none (add domains to the allow list and run again; only allowlist domains are visited)</p>
              )}
              {runAgentResult.errors.length > 0 && (
                <p className="text-amber-700 mt-1">Errors: {runAgentResult.errors.join("; ")}</p>
              )}
            </div>
          )}
        </section>

        {/* 2. Web allowlist (just below agent) */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card">
          <h2 className="text-lg font-medium text-neutral-900">Web allow list</h2>
          <p className="mt-1 text-sm text-neutral-500">
            Domains the agent is allowed to fetch (e.g. vogue.com). Add domains so the agent can use URLs from these sites.
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            The agent only fetches content from domains listed here; no other sites are read.
          </p>
          <form onSubmit={handleAddDomain} className="mt-3 flex gap-3 items-center">
            <input
              type="text"
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value)}
              placeholder="e.g. vogue.com"
              className="flex-1 max-w-xs rounded border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addDomainLoading}
              className="px-4 py-2 rounded-md bg-primary-cta text-neutral-100 text-sm hover:bg-primary-cta disabled:opacity-50"
            >
              {addDomainLoading ? "Adding…" : "Add domain"}
            </button>
          </form>
          {addDomainError && <p className="mt-2 text-sm text-red-600">{addDomainError}</p>}
          <ul className="mt-4 space-y-2">
            {allowlist.map((a) => (
              <li key={a.id} className="flex items-center justify-between py-1 border-b border-border">
                <span className="text-sm font-mono text-neutral-700">{a.domain}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveDomain(a.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
          {allowlist.length === 0 && (
            <p className="mt-2 text-neutral-500 text-sm">No domains in allow list. Add some so the agent can fetch web content.</p>
          )}
        </section>

        {/* 3. Admin-added trends and rules for agent */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card">
          <h2 className="text-lg font-medium text-neutral-900">Add trends and rules for agent</h2>
          <p className="mt-1 text-sm text-neutral-500">
            URL, text, or image URL. The agent combines these with LLM and web (allow list) to produce trends and styling rules.
          </p>
          <form onSubmit={handleAddSource} className="mt-3 flex flex-wrap gap-3 items-end">
            <select
              value={sourceType}
              onChange={(e) => setSourceType(e.target.value as "url" | "text" | "image")}
              className="rounded border border-border px-3 py-2 text-sm"
            >
              <option value="url">URL</option>
              <option value="text">Text</option>
              <option value="image">Image URL</option>
            </select>
            <input
              type="text"
              value={sourcePayload}
              onChange={(e) => setSourcePayload(e.target.value)}
              placeholder={
                sourceType === "url"
                  ? "https://..."
                  : sourceType === "image"
                    ? "https://... image URL"
                    : "Paste text..."
              }
              className="flex-1 min-w-[200px] rounded border border-border px-3 py-2 text-sm"
            />
            <button
              type="submit"
              disabled={addSourceLoading}
              className="px-4 py-2 rounded-md bg-primary-cta text-neutral-100 text-sm hover:bg-primary-cta disabled:opacity-50"
            >
              {addSourceLoading ? "Adding…" : "Add"}
            </button>
          </form>
          {addSourceError && <p className="mt-2 text-sm text-red-600">{addSourceError}</p>}
          <div className="mt-4">
            {sources.length === 0 ? (
              <p className="text-neutral-500 text-sm">No admin-added items yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 text-sm">
                <span className="text-neutral-600 font-medium">Status:</span>
                <span className="rounded bg-amber-100 text-amber-800 px-2 py-0.5">
                  Pending: {sources.filter((s) => s.status === "pending").length}
                </span>
                <span className="rounded bg-green-100 text-green-800 px-2 py-0.5">
                  Processed: {sources.filter((s) => s.status === "processed").length}
                </span>
              </div>
            )}
          </div>
        </section>

        {/* 4. Trends (with hierarchy) */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card">
          <h2 className="text-lg font-medium text-neutral-900">Trends</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {trendsTotal} total. Parent = root trend; Child = under a parent (family). Description and details below.
          </p>
          {loading ? (
            <p className="mt-4 text-neutral-500">Loading…</p>
          ) : trends.length === 0 ? (
            <p className="mt-4 text-neutral-500 text-sm">No trends yet. Run the agent.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Name</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Parent</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Description</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Category</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Strength</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Impacts</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Tell-tale</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Status</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(() => {
                    const trendNameById = new Map(trends.map((t) => [t.id, t.trendName]));
                    return flattenTrendsWithDepth(trends).map(({ item: t, depth }) => {
                      const isChild = depth > 0;
                      const parentName = t.parentId ? trendNameById.get(t.parentId) ?? null : null;
                      return (
                        <tr
                          key={t.id}
                          className={isChild ? "hover:bg-neutral-100 bg-neutral-100/70" : "hover:bg-neutral-100 bg-card"}
                          id={`trend-${t.id}`}
                        >
                          <td className="px-4 py-2 text-neutral-700 font-medium">
                            {isChild ? <span className="text-indigo-600">Child</span> : <span className="text-neutral-900">Parent</span>}
                          </td>
                          <td
                            className={`px-4 py-2 font-medium text-neutral-900 ${isChild ? "border-l-2 border-indigo-200 pl-6" : ""}`}
                            style={isChild ? { paddingLeft: `${12 + depth * 16}px` } : undefined}
                          >
                            {isChild ? "↳ " : ""}{t.trendName}
                          </td>
                          <td className="px-4 py-2 text-neutral-600">{parentName ?? "—"}</td>
                          <td className="px-4 py-2 text-neutral-600 max-w-[200px] truncate" title={t.description ?? undefined}>
                            {t.description ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-neutral-600">{t.category ?? "—"}</td>
                          <td className="px-4 py-2 text-neutral-600">{t.strength ?? "—"}</td>
                          <td className="px-4 py-2 text-neutral-600 max-w-[100px] truncate" title={t.impactedItemTypes ?? undefined}>
                            {t.impactedItemTypes ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-neutral-600 max-w-[100px] truncate" title={t.tellTaleSigns ?? undefined}>
                            {t.tellTaleSigns ?? "—"}
                          </td>
                          <td className="px-4 py-2 text-neutral-600">{t.status}</td>
                          <td className="px-4 py-2 text-neutral-500">
                            {t.updatedAt ? new Date(t.updatedAt).toLocaleDateString() : "—"}
                          </td>
                        </tr>
                      );
                    });
                  })()}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 5. Styling rules (with hierarchy) */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card">
          <h2 className="text-lg font-medium text-neutral-900">Styling rules</h2>
          <p className="mt-1 text-sm text-neutral-500">
            {rulesTotal} total. Strength 1–10. Indented rows are children of the rule above.
          </p>
          {loading ? (
            <p className="mt-4 text-neutral-500">Loading…</p>
          ) : stylingRules.length === 0 ? (
            <p className="mt-4 text-neutral-500 text-sm">No styling rules yet. Run the agent.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-border text-sm">
                <thead className="bg-neutral-100">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Title / Subject</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Type</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Body</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Strength</th>
                    <th className="px-4 py-2 text-left font-medium text-neutral-700">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {flattenRulesWithDepth(stylingRules).map(({ item: r, depth }) => (
                    <tr
                      key={r.id}
                      className={depth === 0 ? "hover:bg-neutral-100 bg-card" : "hover:bg-neutral-100 bg-neutral-100/70"}
                      id={`rule-${r.id}`}
                    >
                      <td
                        className={`px-4 py-2 font-medium text-neutral-900 ${depth > 0 ? "border-l-2 border-indigo-200" : ""}`}
                        style={{ paddingLeft: depth > 0 ? `${12 + depth * 16}px` : undefined }}
                      >
                        {depth > 0 ? "↳ ".repeat(depth) : ""}{r.title || r.subject || "—"}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">{r.ruleType ?? "—"}</td>
                      <td className="px-4 py-2 text-neutral-600 max-w-xs truncate" title={r.body}>
                        {r.body}
                      </td>
                      <td className="px-4 py-2 text-neutral-600">{r.strength ?? "—"}</td>
                      <td className="px-4 py-2 text-neutral-500">
                        {r.updatedAt ? new Date(r.updatedAt).toLocaleDateString() : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
    </>
  );
}
