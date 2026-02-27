"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { fetchAgentPrompts, updateAgentPrompt, type AgentPromptItem } from "@/lib/api/admin";

const AGENT_ID = "microstoreCuration";

const PROMPT_LABELS: Record<string, string> = {
  suggestName_system: "Suggest name (system) – Step 1 generate name & details",
  suggestName_user: "Suggest name (user template)",
  suggestOneStyleNote_system: "Suggest one style card (system) – Step 4 generate one card",
  suggestOneStyleNote_user: "Suggest one style card (user template)",
  runCuration_system: "Run full curation (system) – Auto-generate store",
  runCuration_user: "Run full curation (user template)",
  validateCoherence_user: "Validate product coherence",
  selectStoreImage_user: "Select store cover image",
  generateCover_imageTemplate: "Generate cover image – prompt template (scene-based, no text; placeholders: {{name}}, {{description}}, {{vibe}}, {{trends}}, {{categories}})",
  referenceImageAnalysis: "Reference image analysis (for style reference)",
};

export default function AdminMicrostoreCurationPromptsPage() {
  const [prompts, setPrompts] = useState<AgentPromptItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [editing, setEditing] = useState<Record<string, { content: string; references: string[] }>>({});

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchAgentPrompts(AGENT_ID)
      .then((res) => {
        if (!cancelled) {
          setPrompts(res.prompts);
          setEditing(
            Object.fromEntries(res.prompts.map((p) => [p.promptKey, { content: p.content, references: p.references }]))
          );
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load prompts");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSave = async (promptKey: string) => {
    const state = editing[promptKey];
    if (!state) return;
    setSavingKey(promptKey);
    setError(null);
    try {
      await updateAgentPrompt(AGENT_ID, promptKey, { content: state.content, references: state.references });
      setPrompts((prev) =>
        prev.map((p) => (p.promptKey === promptKey ? { ...p, content: state.content, references: state.references } : p))
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save");
    } finally {
      setSavingKey(null);
    }
  };

  const updateLocal = (promptKey: string, field: "content" | "references", value: string | string[]) => {
    setEditing((prev) => ({
      ...prev,
      [promptKey]: {
        ...prev[promptKey],
        [field]: value,
      },
    }));
  };

  const addReference = (promptKey: string) => {
    const refs = editing[promptKey]?.references ?? [];
    updateLocal(promptKey, "references", [...refs, ""]);
  };

  const setReferenceAt = (promptKey: string, index: number, value: string) => {
    const refs = [...(editing[promptKey]?.references ?? [])];
    refs[index] = value;
    updateLocal(promptKey, "references", refs);
  };

  const removeReference = (promptKey: string, index: number) => {
    const refs = (editing[promptKey]?.references ?? []).filter((_, i) => i !== index);
    updateLocal(promptKey, "references", refs);
  };

  if (loading) return <p className="text-neutral-500">Loading prompts…</p>;
  if (error) return <p className="text-red-600">{error}</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link href="/admin" className="text-sm font-medium text-primary hover:underline">
          ← Dashboard
        </Link>
        <span className="text-neutral-400">·</span>
        <h1 className="font-display text-2xl text-foreground">Microstore Curation Agent – Prompts</h1>
      </div>
      <p className="text-sm text-neutral-600">
        Edit prompts and references used by the microstore creation wizard and auto-generate. Use <code className="rounded bg-muted px-1">{"{{references}}"}</code> in the prompt to inject the reference list. Cover image template uses <code className="rounded bg-muted px-1">{"{{name}}"}</code>, <code className="rounded bg-muted px-1">{"{{description}}"}</code>, <code className="rounded bg-muted px-1">{"{{vibe}}"}</code>, <code className="rounded bg-muted px-1">{"{{trends}}"}</code>, <code className="rounded bg-muted px-1">{"{{categories}}"}</code>. Once saved, these prompts are used when the agent runs.
      </p>
      <div className="space-y-8">
        {prompts.map((p) => (
          <section key={p.promptKey} className="rounded-soft-xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-semibold text-foreground">
              {PROMPT_LABELS[p.promptKey] ?? p.promptKey}
            </h2>
            <div>
              <label className="block text-xs font-medium text-neutral-500 mb-1">Prompt content</label>
              <textarea
                value={editing[p.promptKey]?.content ?? p.content}
                onChange={(e) => updateLocal(p.promptKey, "content", e.target.value)}
                rows={6}
                className="w-full rounded-soft-lg border border-border px-3 py-2 text-sm font-mono"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-medium text-neutral-500">References (injected into {"{{references}}"})</label>
                <button
                  type="button"
                  onClick={() => addReference(p.promptKey)}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  + Add reference
                </button>
              </div>
              <ul className="space-y-2">
                {(editing[p.promptKey]?.references ?? p.references).map((ref, i) => (
                  <li key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={ref}
                      onChange={(e) => setReferenceAt(p.promptKey, i, e.target.value)}
                      placeholder="Reference line"
                      className="flex-1 rounded-soft-lg border border-border px-3 py-1.5 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => removeReference(p.promptKey, i)}
                      className="text-red-600 hover:underline text-sm"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <button
              type="button"
              onClick={() => handleSave(p.promptKey)}
              disabled={savingKey === p.promptKey}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {savingKey === p.promptKey ? "Saving…" : "Save this prompt"}
            </button>
          </section>
        ))}
      </div>
    </div>
  );
}
