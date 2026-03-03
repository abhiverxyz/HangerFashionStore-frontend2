"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  getAdminStyleReportSettings,
  putAdminStyleReportSettings,
  STYLE_REPORT_CARD_TYPES,
  DEFAULT_STYLE_SIGNALS,
  DEFAULT_EXPRESSION_MODES,
  type StyleReportSettingsResponse,
} from "@/lib/api/admin";

export default function AdminStyleReportPage() {
  const { data: settings, isLoading, mutate } = useSWR<StyleReportSettingsResponse>(
    "admin-style-report-settings",
    () => getAdminStyleReportSettings(),
    { revalidateOnFocus: false }
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [agentObjective, setAgentObjective] = useState("");
  const [agentTone, setAgentTone] = useState("");
  const [minLooks, setMinLooks] = useState(7);
  const [maxLooks, setMaxLooks] = useState(15);
  const [cardOrder, setCardOrder] = useState<string[]>([]);
  const [enabledCardTypes, setEnabledCardTypes] = useState<Set<string>>(new Set());
  const [styleSignals, setStyleSignals] = useState<string[]>(DEFAULT_STYLE_SIGNALS);
  const [expressionModes, setExpressionModes] = useState<string[]>(DEFAULT_EXPRESSION_MODES);
  const [newStyleSignal, setNewStyleSignal] = useState("");
  const [newExpressionMode, setNewExpressionMode] = useState("");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!settings || initialized) return;
    setCardOrder(settings.cardConfig.cardOrder);
    setEnabledCardTypes(new Set(settings.cardConfig.enabledCardTypes));
    setAgentObjective(settings.agentObjective ?? "");
    setAgentTone(settings.agentTone ?? "");
    setMinLooks(settings.minLooks);
    setMaxLooks(settings.maxLooks);
    const opts = settings.styleIdentityOptions;
    setStyleSignals(Array.isArray(opts?.styleSignals) && opts.styleSignals.length > 0 ? opts.styleSignals : DEFAULT_STYLE_SIGNALS);
    setExpressionModes(Array.isArray(opts?.expressionModes) && opts.expressionModes.length > 0 ? opts.expressionModes : DEFAULT_EXPRESSION_MODES);
    setInitialized(true);
  }, [settings, initialized]);

  const handleSave = useCallback(async () => {
    setSaving(true);
    setMessage(null);
    try {
      await putAdminStyleReportSettings({
        minLooks,
        maxLooks,
        agentObjective: agentObjective.trim() || null,
        agentTone: agentTone.trim() || null,
        cardConfig: {
          cardOrder: cardOrder.length ? cardOrder : STYLE_REPORT_CARD_TYPES.map((c) => c.id),
          enabledCardTypes: cardOrder.filter((id) => enabledCardTypes.has(id)),
        },
        styleIdentityOptions: { styleSignals, expressionModes },
      });
      await mutate();
      setMessage({ type: "success", text: "Saved." });
    } catch (err) {
      setMessage({ type: "error", text: err instanceof Error ? err.message : "Save failed" });
    } finally {
      setSaving(false);
    }
  }, [minLooks, maxLooks, agentObjective, agentTone, cardOrder, enabledCardTypes, styleSignals, expressionModes, mutate]);

  const moveCard = (index: number, dir: "up" | "down") => {
    const order = cardOrder.length ? [...cardOrder] : STYLE_REPORT_CARD_TYPES.map((c) => c.id);
    const i = dir === "up" ? index - 1 : index + 1;
    if (i < 0 || i >= order.length) return;
    [order[index], order[i]] = [order[i], order[index]];
    setCardOrder(order);
  };

  const toggleEnabled = (id: string) => {
    setEnabledCardTypes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const orderedIds = cardOrder.length ? cardOrder : STYLE_REPORT_CARD_TYPES.map((c) => c.id);
  const labelById = Object.fromEntries(STYLE_REPORT_CARD_TYPES.map((c) => [c.id, c.label]));

  if (isLoading && !settings) {
    return (
      <div className="p-6">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          ← Back to Admin
        </Link>
        <span className="text-sm text-neutral-500">Style report settings</span>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Agent objective</h2>
        <p className="text-sm text-neutral-600">
          Optional overall objective for the style report agent (e.g. &quot;Focus on wardrobe versatility&quot;). It is passed into style profile and report generation.
        </p>
        {settings?.agentObjective != null && settings.agentObjective.trim() !== "" && (
          <div className="rounded-soft-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Current objective</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{settings.agentObjective}</p>
          </div>
        )}
        {(!settings?.agentObjective || settings.agentObjective.trim() === "") && (
          <p className="text-sm text-neutral-500 italic">No objective set. Add one below to guide the agent.</p>
        )}
        <div>
          <label htmlFor="agent-objective-edit" className="block text-xs font-medium text-neutral-600 mb-1">
            Edit objective
          </label>
          <textarea
            id="agent-objective-edit"
            value={agentObjective}
            onChange={(e) => setAgentObjective(e.target.value)}
            placeholder="e.g. Emphasise colour confidence, or Focus on wardrobe versatility"
            className="w-full rounded-soft-lg border border-border bg-card px-3 py-2 text-sm text-foreground min-h-[80px]"
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Tone</h2>
        <p className="text-sm text-neutral-600">
          Tone for the style report output (insightful, relatable, warm, etc.). Used in profile and card generation and in quality checks.
        </p>
        {settings?.agentTone != null && settings.agentTone.trim() !== "" && (
          <div className="rounded-soft-lg border border-border bg-muted/40 px-3 py-2">
            <p className="text-xs font-medium uppercase tracking-wide text-neutral-500 mb-1">Current tone</p>
            <p className="text-sm text-foreground whitespace-pre-wrap">{settings.agentTone}</p>
          </div>
        )}
        {(!settings?.agentTone || settings.agentTone.trim() === "") && (
          <p className="text-sm text-neutral-500 italic">Default tone is used. You can set a custom tone below.</p>
        )}
        <div>
          <label htmlFor="agent-tone-edit" className="block text-xs font-medium text-neutral-600 mb-1">
            Edit tone
          </label>
          <textarea
            id="agent-tone-edit"
            value={agentTone}
            onChange={(e) => setAgentTone(e.target.value)}
            placeholder="e.g. Be insightful, concise, relatable, warm, and lightly humorous."
            className="w-full rounded-soft-lg border border-border bg-card px-3 py-2 text-sm text-foreground min-h-[72px]"
            rows={3}
          />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Look counts</h2>
        <div className="flex gap-4 items-center">
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">Min looks</span>
            <input
              type="number"
              min={1}
              max={50}
              value={minLooks}
              onChange={(e) => setMinLooks(Number(e.target.value) || 7)}
              className="w-20 rounded border border-border bg-card px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <span className="text-neutral-600">Max looks</span>
            <input
              type="number"
              min={1}
              max={50}
              value={maxLooks}
              onChange={(e) => setMaxLooks(Number(e.target.value) || 15)}
              className="w-20 rounded border border-border bg-card px-2 py-1 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-display text-lg font-semibold text-foreground">Style Identity card</h2>
        <p className="text-sm text-neutral-600">
          Word lists for the 2-word Style Identity (Word 1 = STYLE SIGNAL, Word 2 = EXPRESSION MODE). The agent picks one from each list. Edit, add, or remove words.
        </p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Style signals (word 1)</h3>
            <ul className="flex flex-wrap gap-2">
              {styleSignals.map((word, idx) => (
                <li key={`${word}-${idx}`} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-sm">
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => setStyleSignals((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                    aria-label={`Remove ${word}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newStyleSignal}
                onChange={(e) => setNewStyleSignal(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newStyleSignal.trim();
                    if (v) setStyleSignals((prev) => [...prev, v]), setNewStyleSignal("");
                  }
                }}
                placeholder="Add word"
                className="flex-1 rounded border border-border bg-card px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const v = newStyleSignal.trim();
                  if (v) setStyleSignals((prev) => [...prev, v]), setNewStyleSignal("");
                }}
                className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Add
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <h3 className="text-sm font-medium text-foreground">Expression modes (word 2)</h3>
            <ul className="flex flex-wrap gap-2">
              {expressionModes.map((word, idx) => (
                <li key={`${word}-${idx}`} className="flex items-center gap-1 rounded-full bg-muted/60 px-2.5 py-1 text-sm">
                  <span>{word}</span>
                  <button
                    type="button"
                    onClick={() => setExpressionModes((prev) => prev.filter((_, i) => i !== idx))}
                    className="rounded p-0.5 text-neutral-500 hover:bg-neutral-200 hover:text-neutral-800"
                    aria-label={`Remove ${word}`}
                  >
                    ×
                  </button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2">
              <input
                type="text"
                value={newExpressionMode}
                onChange={(e) => setNewExpressionMode(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const v = newExpressionMode.trim();
                    if (v) setExpressionModes((prev) => [...prev, v]), setNewExpressionMode("");
                  }
                }}
                placeholder="Add word"
                className="flex-1 rounded border border-border bg-card px-2 py-1.5 text-sm"
              />
              <button
                type="button"
                onClick={() => {
                  const v = newExpressionMode.trim();
                  if (v) setExpressionModes((prev) => [...prev, v]), setNewExpressionMode("");
                }}
                className="rounded border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-lg font-semibold text-foreground">Report cards</h2>
        <p className="text-sm text-neutral-600">
          Choose which cards appear in the style report and their order. Use up/down to reorder.
        </p>
        <ul className="space-y-2">
          {orderedIds.map((id, index) => (
            <li
              key={id}
              className="flex items-center gap-3 rounded-soft-lg border border-border bg-card px-3 py-2"
            >
              <input
                type="checkbox"
                id={`card-${id}`}
                checked={enabledCardTypes.has(id)}
                onChange={() => toggleEnabled(id)}
                className="rounded border-border"
              />
              <label htmlFor={`card-${id}`} className="flex-1 text-sm font-medium text-foreground cursor-pointer">
                {labelById[id] ?? id}
              </label>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => moveCard(index, "up")}
                  disabled={index === 0}
                  className="rounded p-1 border border-border bg-card text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Move up"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => moveCard(index, "down")}
                  disabled={index === orderedIds.length - 1}
                  className="rounded p-1 border border-border bg-card text-neutral-600 hover:bg-neutral-50 disabled:opacity-40"
                  aria-label="Move down"
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-soft-lg bg-neutral-800 text-white px-4 py-2 text-sm font-medium hover:bg-neutral-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save"}
        </button>
        {message && (
          <span className={message.type === "error" ? "text-red-600 text-sm" : "text-neutral-600 text-sm"}>
            {message.text}
          </span>
        )}
      </div>
    </div>
  );
}
