"use client";

import { useState, useCallback } from "react";
import useSWR from "swr";
import { getStyleReportIfExists, generateStyleReport, type GenerateStyleReportResponse } from "@/lib/api/styleReport";
import type { StyleReportData } from "@/lib/types/styleReport";

export function StyleReportSection({ lookCount }: { lookCount?: number }) {
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
        setGenerateError(res.message || "Not enough looks. Add more looks in your diary first.");
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
      <div className="rounded-soft-xl border border-border bg-card p-6 text-center space-y-4">
        <p className="text-sm text-neutral-600">
          Generate a style report from your diary looks to see insights and recommendations.
        </p>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={generating || (lookCount !== undefined && lookCount < 1)}
          className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
        >
          {generating ? "Generating…" : "Generate style report"}
        </button>
        {generateError && <p className="text-sm text-red-600">{generateError}</p>}
      </div>
    );
  }

  const report = data!.reportData!;
  const generatedAt = data!.generatedAt
    ? new Date(data!.generatedAt).toLocaleString("en-US", {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-display text-lg text-foreground">{report.headline}</h2>
          {generatedAt && <p className="text-xs text-neutral-500" suppressHydrationWarning>Generated {generatedAt}</p>}
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
