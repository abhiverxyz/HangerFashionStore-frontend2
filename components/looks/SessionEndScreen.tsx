"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import { saveSession, type SaveSessionResponse } from "@/lib/api/stylingSession";

interface SessionEndScreenProps {
  sessionId: string;
  finalImageFile: File | null;
  onStartAnother: () => void;
}

export function SessionEndScreen({ sessionId, finalImageFile, onStartAnother }: SessionEndScreenProps) {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState<SaveSessionResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tags, setTags] = useState<{ vibe: string[]; occasion: string[]; time: string[] }>({
    vibe: [],
    occasion: [],
    time: [],
  });
  const [editTagsOpen, setEditTagsOpen] = useState(false);
  const [finalPreviewUrl, setFinalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!finalImageFile) return;
    const url = URL.createObjectURL(finalImageFile);
    setFinalPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [finalImageFile]);

  const handleSaveToDiary = useCallback(async () => {
    setSaving(true);
    setError(null);
    try {
      const result = await saveSession(sessionId, {
        finalImage: finalImageFile ?? undefined,
        tags: Object.keys(tags).some((k) => (tags as Record<string, string[]>)[k]?.length) ? tags : undefined,
      });
      setSaved(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }, [sessionId, finalImageFile, tags]);

  const addTag = useCallback((key: "vibe" | "occasion" | "time", value: string) => {
    const v = value.trim();
    if (!v) return;
    setTags((prev) => ({
      ...prev,
      [key]: prev[key].includes(v) ? prev[key] : [...prev[key], v],
    }));
  }, []);

  const removeTag = useCallback((key: "vibe" | "occasion" | "time", value: string) => {
    setTags((prev) => ({ ...prev, [key]: prev[key].filter((t) => t !== value) }));
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-neutral-100 to-white p-4 pb-24">
      <div className="max-w-lg mx-auto space-y-6">
        <h1 className="font-display text-xl text-foreground">Session complete</h1>

        {/* Final frame preview */}
        <div className="rounded-soft-xl overflow-hidden border border-border bg-neutral-100 aspect-[3/4] max-h-80">
          {finalPreviewUrl ? (
            <img src={finalPreviewUrl} alt="Your look" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
              No photo captured
            </div>
          )}
        </div>

        {/* Summary (after save) */}
        {saved && (
          <div className="rounded-soft-xl border border-border bg-card p-4 space-y-3">
            <h2 className="font-display text-sm font-medium text-foreground">{saved.summary.title}</h2>
            <div>
              <p className="text-xs font-medium text-foreground/70 mb-1">What works</p>
              <ul className="list-disc list-inside text-sm text-foreground">
                {saved.summary.whatWorks.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
            {saved.summary.nextTime.length > 0 && (
              <div>
                <p className="text-xs font-medium text-foreground/70 mb-1">If you want to elevate</p>
                <ul className="list-disc list-inside text-sm text-foreground">
                  {saved.summary.nextTime.map((n, i) => (
                    <li key={i}>{n}</li>
                  ))}
                </ul>
              </div>
            )}
            <p className="text-xs text-foreground/70">Saved to your diary.</p>
          </div>
        )}

        {error && <p className="text-sm text-red-600" role="alert">{error}</p>}

        {/* CTAs */}
        <div className="flex flex-col gap-3">
          {!saved ? (
            <button
              type="button"
              onClick={handleSaveToDiary}
              disabled={saving}
              className="w-full rounded-full py-3 font-medium bg-primary-cta text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {saving ? "Saving…" : "Save to Diary"}
            </button>
          ) : (
            <>
              <Link
                href="/looks/diary"
                className="w-full rounded-full py-3 font-medium bg-primary-cta text-white hover:opacity-90 text-center block"
              >
                View Diary
              </Link>
              <button
                type="button"
                onClick={onStartAnother}
                className="w-full rounded-full py-3 font-medium border border-border bg-card hover:bg-neutral-50 transition-colors"
              >
                Start another session
              </button>
            </>
          )}
          {!saved && (
            <>
              <button
                type="button"
                onClick={() => setEditTagsOpen((o) => !o)}
                className="w-full rounded-full py-2 text-sm border border-border bg-card hover:bg-neutral-50 transition-colors"
              >
                Edit tags
              </button>
              <button
                type="button"
                onClick={onStartAnother}
                className="w-full rounded-full py-2 text-sm text-foreground/70 hover:underline"
              >
                Start another session
              </button>
            </>
          )}
        </div>

        {/* Edit tags panel */}
        {editTagsOpen && (
          <div className="rounded-soft-xl border border-border bg-card p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Vibe</p>
            <div className="flex flex-wrap gap-2">
              {["Minimal", "Casual", "Smart casual", "Evening", "Office"].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => addTag("vibe", v)}
                  className="rounded-full px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200"
                >
                  {v}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">Occasion</p>
            <div className="flex flex-wrap gap-2">
              {["Work", "Date", "Party", "Travel", "Brunch"].map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => addTag("occasion", o)}
                  className="rounded-full px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200"
                >
                  {o}
                </button>
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">Time</p>
            <div className="flex flex-wrap gap-2">
              {["Morning", "Afternoon", "Evening", "Night"].map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => addTag("time", t)}
                  className="rounded-full px-3 py-1 text-xs bg-neutral-100 hover:bg-neutral-200"
                >
                  {t}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              {tags.vibe.map((v) => (
                <span key={v} className="rounded-full px-2 py-0.5 text-xs bg-primary-cta/20 flex items-center gap-1">
                  {v} <button type="button" onClick={() => removeTag("vibe", v)} aria-label={`Remove ${v}`}>×</button>
                </span>
              ))}
              {tags.occasion.map((o) => (
                <span key={o} className="rounded-full px-2 py-0.5 text-xs bg-primary-cta/20 flex items-center gap-1">
                  {o} <button type="button" onClick={() => removeTag("occasion", o)} aria-label={`Remove ${o}`}>×</button>
                </span>
              ))}
              {tags.time.map((t) => (
                <span key={t} className="rounded-full px-2 py-0.5 text-xs bg-primary-cta/20 flex items-center gap-1">
                  {t} <button type="button" onClick={() => removeTag("time", t)} aria-label={`Remove ${t}`}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
