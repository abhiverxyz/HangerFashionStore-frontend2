"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  fetchStylingAvatars,
  setDefaultStylingAvatar,
  updateStylingAvatar,
  uploadStylingAvatarImage,
  fetchStylingPlaybook,
  fetchStylingGoals,
  updateStylingGoals,
  createStylingPlaybookEntry,
  updateStylingPlaybookEntry,
  deleteStylingPlaybookEntry,
} from "@/lib/api/admin";
import type { StylingAvatar, StylingPlaybookEntry } from "@/lib/api/admin";

import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

export default function AdminStylingAgentPage() {
  const accessToken = useStorageAccessToken();
  const [avatars, setAvatars] = useState<StylingAvatar[]>([]);
  const [goals, setGoals] = useState("");
  const [playbook, setPlaybook] = useState<StylingPlaybookEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingGoals, setSavingGoals] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState<string | null>(null);
  const [defaultAvatarId, setDefaultAvatarId] = useState<string | null>(null);
  const [newFlowType, setNewFlowType] = useState<"instruction" | "example_flow">("example_flow");
  const [newFlowContent, setNewFlowContent] = useState("");
  const [addingFlow, setAddingFlow] = useState(false);
  const [editingPlaybookId, setEditingPlaybookId] = useState<string | null>(null);
  const [editingAvatarId, setEditingAvatarId] = useState<string | null>(null);
  const [uploadingAvatarId, setUploadingAvatarId] = useState<string | null>(null);
  const [editingNameAvatarId, setEditingNameAvatarId] = useState<string | null>(null);
  const [editingNameValue, setEditingNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [newAvatarName, setNewAvatarName] = useState("");
  const [newAvatarSlug, setNewAvatarSlug] = useState("");
  const [addingAvatar, setAddingAvatar] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    try {
      const [avatarList, goalsRes, playbookList] = await Promise.all([
        fetchStylingAvatars(),
        fetchStylingGoals(),
        fetchStylingPlaybook({ isActive: undefined }),
      ]);
      setAvatars(avatarList);
      setGoals(goalsRes.content);
      setPlaybook(playbookList.filter((e) => e.type !== "goals"));
      const defaultA = avatarList.find((a) => a.isDefault);
      setDefaultAvatarId(defaultA?.id ?? null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleSaveGoals = async () => {
    setSavingGoals(true);
    setError(null);
    try {
      await updateStylingGoals(goals);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save goals");
    } finally {
      setSavingGoals(false);
    }
  };

  const handleSetDefaultAvatar = async (avatarId: string) => {
    setError(null);
    try {
      await setDefaultStylingAvatar(avatarId);
      setDefaultAvatarId(avatarId);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to set default avatar");
    }
  };

  const handleSaveAvatarPrompt = async (
    idOrSlug: string,
    payload: { systemPromptAddition: string; defaultGreeting: string | null; goalsAddition?: string | null; preferencesOverride?: string | null }
  ) => {
    setSavingAvatar(idOrSlug);
    setError(null);
    try {
      await updateStylingAvatar(idOrSlug, {
        systemPromptAddition: payload.systemPromptAddition,
        defaultGreeting: payload.defaultGreeting ?? undefined,
        goalsAddition: payload.goalsAddition ?? undefined,
        preferencesOverride: payload.preferencesOverride ?? undefined,
      });
      setEditingAvatarId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save avatar");
    } finally {
      setSavingAvatar(null);
    }
  };

  const handleUploadAvatarImage = async (idOrSlug: string, file: File) => {
    setUploadingAvatarId(idOrSlug);
    setError(null);
    try {
      await uploadStylingAvatarImage(idOrSlug, file);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to upload image");
    } finally {
      setUploadingAvatarId(null);
    }
  };

  const handleStartEditName = (a: StylingAvatar) => {
    setEditingNameAvatarId(a.id);
    setEditingNameValue(a.name);
  };

  const handleSaveAvatarName = async (idOrSlug: string) => {
    const name = editingNameValue.trim();
    if (!name) return;
    setSavingName(true);
    setError(null);
    try {
      await updateStylingAvatar(idOrSlug, { name });
      setEditingNameAvatarId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save name");
    } finally {
      setSavingName(false);
    }
  };

  const handleCancelEditName = () => {
    setEditingNameAvatarId(null);
    setEditingNameValue("");
  };

  const handleAddAvatar = async () => {
    const name = newAvatarName.trim();
    const slug = (newAvatarSlug.trim() || name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")).toLowerCase();
    if (!name || !slug) {
      setError("Name is required; slug will be generated from name if left blank.");
      return;
    }
    setAddingAvatar(true);
    setError(null);
    try {
      await updateStylingAvatar(slug, {
        name,
        slug,
        systemPromptAddition: "You are a friendly style advisor. Match the user's tone and help them with outfit and style choices.",
      });
      setNewAvatarName("");
      setNewAvatarSlug("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add avatar");
    } finally {
      setAddingAvatar(false);
    }
  };

  const handleAddFlow = async () => {
    if (!newFlowContent.trim()) return;
    setAddingFlow(true);
    setError(null);
    try {
      await createStylingPlaybookEntry({
        type: newFlowType,
        content: newFlowContent.trim(),
        isActive: true,
      });
      setNewFlowContent("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAddingFlow(false);
    }
  };

  const handleTogglePlaybookActive = async (entry: StylingPlaybookEntry) => {
    setError(null);
    try {
      await updateStylingPlaybookEntry(entry.id, { isActive: !entry.isActive });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update");
    }
  };

  const handleDeletePlaybook = async (id: string) => {
    setError(null);
    try {
      await deleteStylingPlaybookEntry(id);
      setEditingPlaybookId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete");
    }
  };

  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">Styling Agent</h1>
        <p className="mt-2 text-neutral-600">
          Agent goals, tone avatars, and suggested flows. These are injected into the Styling Agent context so it keeps improving.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-neutral-500">Loading…</p>
        ) : (
          <div className="mt-8 space-y-10">
            {/* Goals */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-800">Agent goals (three pillars)</h2>
              <p className="mt-1 text-sm text-neutral-500">Shown at the start of the agent context.</p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={5}
                className="mt-2 block w-full rounded border border-border px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSaveGoals}
                disabled={savingGoals}
                className="mt-2 px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {savingGoals ? "Saving…" : "Save goals"}
              </button>
            </section>

            {/* Avatars */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-800">Tone avatars</h2>
              <p className="mt-1 text-sm text-neutral-500">Display names are shown in Concierge. One avatar is used as default. Edit the prompt to change tone.</p>
              {/* Add avatar */}
              <div className="mt-4 p-4 rounded border border-dashed border-border bg-neutral-50/50">
                <p className="text-sm font-medium text-neutral-700 mb-2">Add avatar</p>
                <div className="flex flex-wrap items-end gap-2">
                  <label className="block">
                    <span className="text-xs text-neutral-500 block">Display name</span>
                    <input
                      type="text"
                      value={newAvatarName}
                      onChange={(e) => {
                        setNewAvatarName(e.target.value);
                        if (!newAvatarSlug) setNewAvatarSlug(e.target.value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, ""));
                      }}
                      placeholder="e.g. Alex"
                      className="mt-0.5 rounded border border-border px-3 py-1.5 text-sm w-40"
                    />
                  </label>
                  <label className="block">
                    <span className="text-xs text-neutral-500 block">Slug (URL-friendly)</span>
                    <input
                      type="text"
                      value={newAvatarSlug}
                      onChange={(e) => setNewAvatarSlug(e.target.value)}
                      placeholder="e.g. alex"
                      className="mt-0.5 rounded border border-border px-3 py-1.5 text-sm w-32"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={handleAddAvatar}
                    disabled={addingAvatar || !newAvatarName.trim()}
                    className="px-3 py-1.5 rounded bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50"
                  >
                    {addingAvatar ? "Adding…" : "Add avatar"}
                  </button>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                {avatars.map((a) => (
                  <div key={a.id} className="rounded border border-border bg-card p-4">
                    <div className="flex items-start gap-4">
                      <div className="shrink-0">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-neutral-100 border border-border flex items-center justify-center">
                          {a.imageUrl ? (
                            <img
                              src={getImageDisplayUrl(a.imageUrl, accessToken)}
                              alt={a.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-neutral-400 text-lg font-medium">{(a.name || "?")[0]}</span>
                          )}
                        </div>
                        <label className="mt-2 block">
                          <span className="text-xs text-neutral-500 block mb-1">Avatar image (for Concierge)</span>
                          <input
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/gif"
                            className="sr-only"
                            onChange={(e) => {
                              const f = e.target.files?.[0];
                              if (f) handleUploadAvatarImage(a.slug, f);
                              e.target.value = "";
                            }}
                            disabled={uploadingAvatarId === a.id}
                          />
                          <span className="inline-block px-2 py-1 rounded border border-border text-sm cursor-pointer hover:bg-neutral-50">
                            {uploadingAvatarId === a.id ? "Uploading…" : "Upload image"}
                          </span>
                        </label>
                      </div>
                      <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        {editingNameAvatarId === a.id ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <input
                              type="text"
                              value={editingNameValue}
                              onChange={(e) => setEditingNameValue(e.target.value)}
                              className="rounded border border-border px-2 py-1 text-sm w-48"
                              placeholder="Display name"
                              autoFocus
                            />
                            <button
                              type="button"
                              onClick={() => handleSaveAvatarName(a.slug)}
                              disabled={savingName || !editingNameValue.trim()}
                              className="px-2 py-1 rounded bg-foreground text-background text-sm"
                            >
                              {savingName ? "Saving…" : "Save"}
                            </button>
                            <button type="button" onClick={handleCancelEditName} className="px-2 py-1 rounded border border-border text-sm">
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <>
                            <span className="font-medium">{a.name}</span>
                            <button
                              type="button"
                              onClick={() => handleStartEditName(a)}
                              className="ml-2 text-xs text-neutral-500 hover:text-foreground"
                            >
                              Edit name
                            </button>
                          </>
                        )}
                        {a.isDefault && (
                          <span className="ml-2 text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      {!a.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAvatar(a.id)}
                          className="text-sm text-neutral-600 hover:text-foreground"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                    {a.description && <p className="mt-1 text-sm text-neutral-500">{a.description}</p>}
                    {editingAvatarId === a.id ? (
                      <div className="mt-3">
                        <label htmlFor={`avatar-prompt-${a.id}`} className="block text-xs font-medium text-neutral-500 mb-1">Tone and style (system prompt addition)</label>
                        <textarea
                          defaultValue={a.systemPromptAddition}
                          id={`avatar-prompt-${a.id}`}
                          rows={3}
                          className="block w-full rounded border border-border px-3 py-2 text-sm"
                        />
                        <label htmlFor={`avatar-greeting-${a.id}`} className="block text-xs font-medium text-neutral-500 mt-3 mb-1">Default greeting (welcome message when no conversation selected)</label>
                        <textarea
                          defaultValue={a.defaultGreeting ?? ""}
                          id={`avatar-greeting-${a.id}`}
                          rows={2}
                          placeholder="e.g. What shall we do? Find something, build a look…"
                          className="block w-full rounded border border-border px-3 py-2 text-sm"
                        />
                        <label htmlFor={`avatar-goals-${a.id}`} className="block text-xs font-medium text-neutral-500 mt-3 mb-1">Goal prioritization (optional — amends global goals for this avatar)</label>
                        <textarea
                          defaultValue={a.goalsAddition ?? ""}
                          id={`avatar-goals-${a.id}`}
                          rows={2}
                          placeholder="e.g. For this avatar, prioritize discovery and fun over strict occasion matching."
                          className="block w-full rounded border border-border px-3 py-2 text-sm"
                        />
                        <label htmlFor={`avatar-prefs-${a.id}`} className="block text-xs font-medium text-neutral-500 mt-3 mb-1">Avatar preferences (optional — e.g. prefer minimal suggestions, focus on sustainable brands)</label>
                        <textarea
                          defaultValue={a.preferencesOverride ?? ""}
                          id={`avatar-prefs-${a.id}`}
                          rows={2}
                          placeholder="e.g. Prefer minimal suggestions; focus on sustainable brands."
                          className="block w-full rounded border border-border px-3 py-2 text-sm"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const promptEl = document.getElementById(`avatar-prompt-${a.id}`) as HTMLTextAreaElement;
                              const greetingEl = document.getElementById(`avatar-greeting-${a.id}`) as HTMLTextAreaElement;
                              const goalsEl = document.getElementById(`avatar-goals-${a.id}`) as HTMLTextAreaElement;
                              const prefsEl = document.getElementById(`avatar-prefs-${a.id}`) as HTMLTextAreaElement;
                              const greeting = greetingEl?.value?.trim() || null;
                              const goalsAddition = goalsEl?.value?.trim() || null;
                              const preferencesOverride = prefsEl?.value?.trim() || null;
                              if (promptEl) handleSaveAvatarPrompt(a.slug, { systemPromptAddition: promptEl.value, defaultGreeting: greeting, goalsAddition, preferencesOverride });
                            }}
                            disabled={savingAvatar === a.slug}
                            className="px-3 py-1 rounded bg-foreground text-background text-sm"
                          >
                            {savingAvatar === a.slug ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAvatarId(null)}
                            className="px-3 py-1 rounded border border-border text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="mt-2 text-sm text-neutral-600 whitespace-pre-wrap">{a.systemPromptAddition}</p>
                        {a.defaultGreeting && (
                          <p className="mt-2 text-sm text-neutral-500 italic">Greeting: {a.defaultGreeting}</p>
                        )}
                        {a.goalsAddition && (
                          <p className="mt-2 text-sm text-neutral-500">Goal prioritization: {a.goalsAddition}</p>
                        )}
                        {a.preferencesOverride && (
                          <p className="mt-2 text-sm text-neutral-500">Preferences: {a.preferencesOverride}</p>
                        )}
                      </>
                    )}
                    {editingAvatarId !== a.id && (
                      <button
                        type="button"
                        onClick={() => setEditingAvatarId(a.id)}
                        className="mt-2 text-sm text-neutral-600 hover:text-foreground"
                      >
                        Edit tone prompt
                      </button>
                    )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Suggested flows */}
            <section>
              <h2 className="text-lg font-semibold text-neutral-800">Suggested flows and examples</h2>
              <p className="mt-1 text-sm text-neutral-500">Instructions or example flows injected into the agent context.</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <select
                  value={newFlowType}
                  onChange={(e) => setNewFlowType(e.target.value as "instruction" | "example_flow")}
                  className="rounded border border-border px-3 py-2 text-sm"
                >
                  <option value="instruction">Instruction</option>
                  <option value="example_flow">Example flow</option>
                </select>
                <textarea
                  value={newFlowContent}
                  onChange={(e) => setNewFlowContent(e.target.value)}
                  placeholder="e.g. When user asks what to wear for X, use suggest_look, occasion: X, lookDisplayPreference: auto"
                  rows={2}
                  className="flex-1 min-w-[200px] rounded border border-border px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddFlow}
                  disabled={addingFlow || !newFlowContent.trim()}
                  className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium hover:opacity-90 disabled:opacity-50"
                >
                  {addingFlow ? "Adding…" : "Add"}
                </button>
              </div>
              <ul className="mt-4 space-y-3">
                {playbook.map((e) => (
                  <li key={e.id} className="rounded border border-border bg-card p-3">
                    <span className="text-xs text-neutral-500">{e.type}</span>
                    <p className="mt-1 text-sm text-neutral-800 whitespace-pre-wrap">{e.content}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlaybookActive(e)}
                        className="text-sm text-neutral-600 hover:text-foreground"
                      >
                        {e.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeletePlaybook(e.id)}
                        className="text-sm text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          </div>
        )}
    </>
  );
}
