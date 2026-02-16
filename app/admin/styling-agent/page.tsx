"use client";

import { useCallback, useEffect, useState } from "react";
import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";
import {
  fetchStylingAvatars,
  setDefaultStylingAvatar,
  updateStylingAvatar,
  fetchStylingPlaybook,
  fetchStylingGoals,
  updateStylingGoals,
  createStylingPlaybookEntry,
  updateStylingPlaybookEntry,
  deleteStylingPlaybookEntry,
} from "@/lib/api/admin";
import type { StylingAvatar, StylingPlaybookEntry } from "@/lib/api/admin";

export default function AdminStylingAgentPage() {
  const { logout } = useAuth();
  const { user, loading: authLoading } = useRequireAuth("admin");
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
    if (!user) return;
    load();
  }, [user, load]);

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

  const handleSaveAvatarPrompt = async (idOrSlug: string, systemPromptAddition: string) => {
    setSavingAvatar(idOrSlug);
    setError(null);
    try {
      await updateStylingAvatar(idOrSlug, { systemPromptAddition });
      setEditingAvatarId(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save avatar");
    } finally {
      setSavingAvatar(null);
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
        <h1 className="text-2xl font-semibold">Styling Agent</h1>
        <p className="mt-2 text-gray-600">
          Agent goals, tone avatars, and suggested flows. These are injected into the Styling Agent context so it keeps improving.
        </p>

        {error && (
          <div className="mt-4 p-3 rounded bg-red-50 text-red-800 text-sm" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <p className="mt-6 text-gray-500">Loading…</p>
        ) : (
          <div className="mt-8 space-y-10">
            {/* Goals */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800">Agent goals (three pillars)</h2>
              <p className="mt-1 text-sm text-gray-500">Shown at the start of the agent context.</p>
              <textarea
                value={goals}
                onChange={(e) => setGoals(e.target.value)}
                rows={5}
                className="mt-2 block w-full rounded border border-gray-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={handleSaveGoals}
                disabled={savingGoals}
                className="mt-2 px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
              >
                {savingGoals ? "Saving…" : "Save goals"}
              </button>
            </section>

            {/* Avatars */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800">Tone avatars</h2>
              <p className="mt-1 text-sm text-gray-500">One is used as default. Edit the prompt to change tone.</p>
              <div className="mt-4 space-y-4">
                {avatars.map((a) => (
                  <div key={a.id} className="rounded border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">{a.name}</span>
                        {a.isDefault && (
                          <span className="ml-2 text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded">Default</span>
                        )}
                      </div>
                      {!a.isDefault && (
                        <button
                          type="button"
                          onClick={() => handleSetDefaultAvatar(a.id)}
                          className="text-sm text-gray-600 hover:text-gray-900"
                        >
                          Set as default
                        </button>
                      )}
                    </div>
                    {a.description && <p className="mt-1 text-sm text-gray-500">{a.description}</p>}
                    {editingAvatarId === a.id ? (
                      <div className="mt-3">
                        <textarea
                          defaultValue={a.systemPromptAddition}
                          id={`avatar-prompt-${a.id}`}
                          rows={3}
                          className="block w-full rounded border border-gray-300 px-3 py-2 text-sm"
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            type="button"
                            onClick={() => {
                              const el = document.getElementById(`avatar-prompt-${a.id}`) as HTMLTextAreaElement;
                              if (el) handleSaveAvatarPrompt(a.slug, el.value);
                            }}
                            disabled={savingAvatar === a.slug}
                            className="px-3 py-1 rounded bg-gray-800 text-white text-sm"
                          >
                            {savingAvatar === a.slug ? "Saving…" : "Save"}
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingAvatarId(null)}
                            className="px-3 py-1 rounded border border-gray-300 text-sm"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-600 whitespace-pre-wrap">{a.systemPromptAddition}</p>
                    )}
                    {editingAvatarId !== a.id && (
                      <button
                        type="button"
                        onClick={() => setEditingAvatarId(a.id)}
                        className="mt-2 text-sm text-gray-600 hover:text-gray-900"
                      >
                        Edit tone prompt
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Suggested flows */}
            <section>
              <h2 className="text-lg font-semibold text-gray-800">Suggested flows and examples</h2>
              <p className="mt-1 text-sm text-gray-500">Instructions or example flows injected into the agent context.</p>
              <div className="mt-4 flex gap-2 flex-wrap">
                <select
                  value={newFlowType}
                  onChange={(e) => setNewFlowType(e.target.value as "instruction" | "example_flow")}
                  className="rounded border border-gray-300 px-3 py-2 text-sm"
                >
                  <option value="instruction">Instruction</option>
                  <option value="example_flow">Example flow</option>
                </select>
                <textarea
                  value={newFlowContent}
                  onChange={(e) => setNewFlowContent(e.target.value)}
                  placeholder="e.g. When user asks what to wear for X, use suggest_look, occasion: X, lookDisplayPreference: auto"
                  rows={2}
                  className="flex-1 min-w-[200px] rounded border border-gray-300 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  onClick={handleAddFlow}
                  disabled={addingFlow || !newFlowContent.trim()}
                  className="px-4 py-2 rounded bg-gray-900 text-white text-sm font-medium hover:bg-gray-800 disabled:opacity-50"
                >
                  {addingFlow ? "Adding…" : "Add"}
                </button>
              </div>
              <ul className="mt-4 space-y-3">
                {playbook.map((e) => (
                  <li key={e.id} className="rounded border border-gray-200 bg-white p-3">
                    <span className="text-xs text-gray-500">{e.type}</span>
                    <p className="mt-1 text-sm text-gray-800 whitespace-pre-wrap">{e.content}</p>
                    <div className="mt-2 flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleTogglePlaybookActive(e)}
                        className="text-sm text-gray-600 hover:text-gray-900"
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
      </main>
    </div>
  );
}
