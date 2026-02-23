"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  listLooks,
  analyzeLookWithFile,
  deleteLook,
  type Look,
  type LookDataParsed,
} from "@/lib/api/looks";
import { getStyleReportIfExists, generateStyleReport, type GenerateStyleReportResponse } from "@/lib/api/styleReport";
import type { StyleReportData } from "@/lib/types/styleReport";
import { planLooks, type PlannedLook } from "@/lib/api/lookPlanning";
import { useAuth } from "@/lib/auth/AuthProvider";

const TAB_DIARY = "diary";
const TAB_STYLE_REPORT = "style-report";
const TAB_GET_READY = "get-ready";
const TAB_PLAN_LOOKS = "plan-looks";
type TabId = typeof TAB_DIARY | typeof TAB_STYLE_REPORT | typeof TAB_GET_READY | typeof TAB_PLAN_LOOKS;

function parseLookData(look: Look): LookDataParsed {
  try {
    const data = typeof look.lookData === "string" ? JSON.parse(look.lookData) : look.lookData;
    return data || {};
  } catch {
    return {};
  }
}

function LookCard({
  look,
  onDelete,
  onReanalyze,
}: {
  look: Look;
  onDelete: (id: string) => void;
  onReanalyze: (id: string) => void;
}) {
  const parsed = parseLookData(look);
  const comment = parsed.comment ?? look.vibe ?? look.occasion ?? "Look";
  const vibe = parsed.vibe ?? look.vibe;
  const occasion = parsed.occasion ?? look.occasion;
  const timeOfDay = parsed.timeOfDay;
  const date = look.updatedAt ? new Date(look.updatedAt).toLocaleDateString(undefined, { dateStyle: "medium" }) : null;

  return (
    <div className="rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft">
      <div className="aspect-[3/4] bg-neutral-100 relative">
        {look.imageUrl ? (
          <img
            src={look.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="text-sm text-foreground line-clamp-2">{comment}</p>
        <div className="flex flex-wrap gap-1.5 text-xs text-neutral-500">
          {vibe && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{vibe}</span>}
          {occasion && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{occasion}</span>}
          {timeOfDay && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{timeOfDay}</span>}
        </div>
        {date && <p className="text-xs text-neutral-400">{date}</p>}
        <div className="flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => onReanalyze(look.id)}
            className="text-xs font-medium text-primary hover:underline"
          >
            Re-analyze
          </button>
          <button
            type="button"
            onClick={() => onDelete(look.id)}
            className="text-xs font-medium text-red-600 hover:underline"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

function DiarySection({ onAnalyzeComplete }: { onAnalyzeComplete: () => void }) {
  const { data, error, isLoading, mutate } = useSWR("looks-list", () => listLooks({ limit: 50, offset: 0 }));
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [reanalyzing, setReanalyzing] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const handleFileSelect = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      setUploadError(null);
      setUploading(true);
      const accepted = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
      );
      if (accepted.length === 0) {
        setUploadError("Please select image files (JPEG, PNG, WebP, GIF).");
        setUploading(false);
        return;
      }
      try {
        for (const file of accepted) {
          await analyzeLookWithFile(file);
        }
        await mutate();
        onAnalyzeComplete();
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [mutate, onAnalyzeComplete]
  );

  const handleReanalyze = useCallback(
    async (lookId: string) => {
      setReanalyzing(lookId);
      setUploadError(null);
      try {
        const { analyzeLook } = await import("@/lib/api/looks");
        await analyzeLook({ lookId });
        await mutate();
      } catch (e) {
        setUploadError(e instanceof Error ? e.message : "Re-analyze failed");
      } finally {
        setReanalyzing(null);
      }
    },
    [mutate]
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (!confirm("Remove this look from your diary?")) return;
      setDeleting(id);
      try {
        await deleteLook(id);
        await mutate();
      } finally {
        setDeleting(null);
      }
    },
    [mutate]
  );

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <div className="rounded-soft-xl border-2 border-dashed border-border bg-muted/30 p-6 text-center">
        <label className="block text-sm font-medium text-foreground mb-2">Add looks to your fashion diary</label>
        <p className="text-xs text-neutral-500 mb-4">Upload one or more outfit photos. We&apos;ll analyze vibe, occasion, and suggest improvements.</p>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          multiple
          disabled={uploading}
          onChange={(e) => {
            handleFileSelect(e.target.files);
            e.target.value = "";
          }}
          className="block w-full text-sm text-neutral-600 file:mr-4 file:py-2 file:px-4 file:rounded-soft-lg file:border-0 file:bg-primary file:text-primary-foreground file:font-medium file:cursor-pointer hover:file:opacity-90"
        />
        {uploading && <p className="mt-2 text-sm text-neutral-500">Analyzing…</p>}
        {uploadError && (
          <p className="mt-2 text-sm text-red-600" role="alert">
            {uploadError}
          </p>
        )}
      </div>

      {isLoading && <p className="text-neutral-500">Loading your looks…</p>}
      {error && (
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to load looks."} Sign in to see your diary.
        </p>
      )}
      {!isLoading && !error && total > 0 && (
        <>
          <h2 className="font-display text-lg text-foreground">Your looks ({total})</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((look) => (
              <LookCard
                key={look.id}
                look={look}
                onDelete={handleDelete}
                onReanalyze={handleReanalyze}
              />
            ))}
          </div>
        </>
      )}
      {!isLoading && !error && total === 0 && (
        <p className="text-neutral-500">No looks yet. Upload photos above to start your diary.</p>
      )}
    </div>
  );
}

function StyleReportSection({ lookCount }: { lookCount: number }) {
  const [generating, setGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const { data, isLoading, mutate } = useSWR<{ reportData: StyleReportData; generatedAt: string | null } | null>(
    "style-report",
    () => getStyleReportIfExists(),
    { revalidateOnFocus: false }
  );
  const noReportYet = !isLoading && !data;
  const hasReport = Boolean(data?.reportData);

  const handleGenerate = useCallback(async () => {
    setGenerateError(null);
    setGenerating(true);
    try {
      const res: GenerateStyleReportResponse = await generateStyleReport({ forceRegenerate: true });
      if (res.reportData) {
        await mutate({ reportData: res.reportData, generatedAt: new Date().toISOString() });
      } else {
        setGenerateError(res.message || "Not enough looks. Add more looks in the Diary tab first.");
      }
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }, [mutate]);

  if (isLoading && !data) {
    return <p className="text-neutral-500">Loading style report…</p>;
  }

  if (noReportYet || !hasReport) {
    return (
      <div className="space-y-6">
        <div className="rounded-soft-xl border border-border bg-card p-6 text-center">
          <h2 className="font-display text-lg text-foreground mb-2">Your style report</h2>
          <p className="text-sm text-neutral-600 mb-4">
            Generate a report from your diary looks. We&apos;ll summarize your style, colors, and silhouettes.
          </p>
          {lookCount < 3 && (
            <p className="text-sm text-amber-700 mb-4">
              Add at least 3–5 looks in the Diary tab for a better report.
            </p>
          )}
          <button
            type="button"
            onClick={handleGenerate}
            disabled={generating || lookCount < 1}
            className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {generating ? "Generating…" : "Generate style report"}
          </button>
          {generateError && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {generateError}
            </p>
          )}
        </div>
      </div>
    );
  }

  const report = data!.reportData!;
  const generatedAt = data!.generatedAt
    ? new Date(data!.generatedAt).toLocaleDateString(undefined, { dateStyle: "medium", timeStyle: "short" })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-foreground">{report.headline}</h2>
          {generatedAt && <p className="text-xs text-neutral-500">Generated {generatedAt}</p>}
        </div>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating}
          className="rounded-soft-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50"
        >
          {generating ? "Regenerating…" : "Regenerate"}
        </button>
      </div>

      {report.sections?.length > 0 && (
        <div className="space-y-4">
          {report.sections.map((section, i) => (
            <section key={i} className="rounded-soft-xl border border-border bg-card p-4">
              <h3 className="font-medium text-foreground mb-2">{section.title}</h3>
              <div className="text-sm text-neutral-700 whitespace-pre-wrap">{section.content}</div>
            </section>
          ))}
        </div>
      )}

      {report.byLooks?.length > 0 && (
        <>
          <h3 className="font-medium text-foreground">By look</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {report.byLooks.map((entry, i) => (
              <div key={entry.lookId ?? i} className="rounded-soft-xl border border-border bg-card overflow-hidden">
                {entry.imageUrl && (
                  <div className="aspect-[3/4] bg-neutral-100">
                    <img src={entry.imageUrl} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-3">
                  <div className="flex flex-wrap gap-1 text-xs text-neutral-500">
                    {entry.vibe && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{entry.vibe}</span>}
                    {entry.occasion && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{entry.occasion}</span>}
                  </div>
                  {entry.pairingSummary && (
                    <p className="text-sm text-foreground mt-2 line-clamp-2">{entry.pairingSummary}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {report.byItems?.aggregates && (
        <section className="rounded-soft-xl border border-border bg-card p-4">
          <h3 className="font-medium text-foreground mb-3">Your wardrobe at a glance</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div>
              <p className="text-neutral-500">Items</p>
              <p className="font-medium text-foreground">{report.byItems.aggregates.itemCount ?? 0}</p>
            </div>
            {report.byItems.aggregates.topTypes?.slice(0, 3).map((t) => (
              <div key={t.name}>
                <p className="text-neutral-500 capitalize">{t.name}</p>
                <p className="font-medium text-foreground">{t.count}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

function GetReadySection() {
  return (
    <div className="rounded-soft-xl border border-border bg-card p-6 text-center max-w-lg mx-auto">
      <h2 className="font-display text-lg text-foreground mb-2">Get ready with me</h2>
      <p className="text-sm text-neutral-600 mb-6">
        Get outfit ideas and styling tips based on your looks and style. Chat with the Concierge to plan what to wear.
      </p>
      <Link
        href="/concierge"
        className="inline-flex rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        Open Concierge
      </Link>
    </div>
  );
}

function PlanLooksSection() {
  const [occasion, setOccasion] = useState("");
  const [vibe, setVibe] = useState("");
  const [numberOfLooks, setNumberOfLooks] = useState(5);
  const [generateImages, setGenerateImages] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ looks: PlannedLook[]; planSummary?: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const occasionStr = occasion.trim();
    if (!occasionStr) {
      setError("Please enter an occasion (e.g. vacation, weekend trip).");
      return;
    }
    setError(null);
    setLoading(true);
    setResult(null);
    try {
      const res = await planLooks({
        occasion: occasionStr,
        numberOfLooks: Math.min(10, Math.max(1, numberOfLooks)),
        vibe: vibe.trim() || undefined,
        generateImages,
        imageStyle: "flat_lay",
      });
      setResult({ looks: res.looks, planSummary: res.planSummary });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Look planning failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-soft-xl border border-border bg-card p-6 max-w-lg">
        <h2 className="font-display text-lg text-foreground mb-2">Plan looks</h2>
        <p className="text-sm text-neutral-600 mb-4">
          Enter an occasion (e.g. vacation, business trip) and get a set of diverse outfit ideas.
        </p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label htmlFor="plan-occasion" className="block text-sm font-medium text-foreground mb-1">
              Occasion *
            </label>
            <input
              id="plan-occasion"
              type="text"
              value={occasion}
              onChange={(e) => setOccasion(e.target.value)}
              placeholder="e.g. vacation, weekend trip"
              className="w-full rounded-soft-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="plan-vibe" className="block text-sm font-medium text-foreground mb-1">
              Vibe (optional)
            </label>
            <input
              id="plan-vibe"
              type="text"
              value={vibe}
              onChange={(e) => setVibe(e.target.value)}
              placeholder="e.g. casual, minimal"
              className="w-full rounded-soft-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor="plan-count" className="block text-sm font-medium text-foreground mb-1">
              Number of looks (1–10)
            </label>
            <input
              id="plan-count"
              type="number"
              min={1}
              max={10}
              value={numberOfLooks}
              onChange={(e) => setNumberOfLooks(Number(e.target.value) || 5)}
              className="w-full rounded-soft-lg border border-border bg-background px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={generateImages}
              onChange={(e) => setGenerateImages(e.target.checked)}
              className="rounded border-border"
            />
            <span className="text-sm text-foreground">Generate images (slower)</span>
          </label>
          <button
            type="submit"
            disabled={loading}
            className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Planning…" : "Plan looks"}
          </button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </form>
      </div>

      {result && (
        <div className="space-y-4">
          {result.planSummary && (
            <p className="text-sm text-neutral-600">{result.planSummary}</p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {result.looks.map((look, i) => (
              <div key={i} className="rounded-soft-xl border border-border bg-card overflow-hidden">
                <div className="aspect-[3/4] bg-neutral-100">
                  {look.imageUrl ? (
                    <img src={look.imageUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">
                      {look.error ?? "No image"}
                    </div>
                  )}
                </div>
                <div className="p-3 space-y-1">
                  <p className="font-medium text-foreground text-sm line-clamp-2">{look.label}</p>
                  <div className="flex flex-wrap gap-1 text-xs text-neutral-500">
                    {look.vibe && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{look.vibe}</span>}
                    {look.occasion && <span className="rounded-full bg-neutral-100 px-2 py-0.5">{look.occasion}</span>}
                  </div>
                  {look.productIds?.length > 0 && (
                    <p className="text-xs text-neutral-500">{look.productIds.length} product(s)</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function LooksPage() {
  const [tab, setTab] = useState<TabId>(TAB_DIARY);
  const { data: looksData } = useSWR("looks-list", () => listLooks({ limit: 1, offset: 0 }), {
    revalidateOnFocus: false,
  });
  const lookCount = looksData?.total ?? 0;

  const tabs: { id: TabId; label: string }[] = [
    { id: TAB_DIARY, label: "Diary" },
    { id: TAB_STYLE_REPORT, label: "Style report" },
    { id: TAB_GET_READY, label: "Get ready" },
    { id: TAB_PLAN_LOOKS, label: "Plan looks" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Looks</h1>

      <nav className="flex gap-2 border-b border-border" aria-label="Looks sections">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.id
                ? "border-primary text-primary"
                : "border-transparent text-neutral-600 hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {tab === TAB_DIARY && <DiarySection onAnalyzeComplete={() => setTab(TAB_STYLE_REPORT)} />}
      {tab === TAB_STYLE_REPORT && <StyleReportSection lookCount={lookCount} />}
      {tab === TAB_GET_READY && <GetReadySection />}
      {tab === TAB_PLAN_LOOKS && <PlanLooksSection />}
    </div>
  );
}
