"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import useSWR from "swr";
import {
  listLooks,
  deleteLook,
  type Look,
  type LookDataParsed,
} from "@/lib/api/looks";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";
import { LookDetailModal } from "@/components/looks/LookDetailModal";

const MS_WEEK = 7 * 24 * 60 * 60 * 1000;
const MS_MONTH = 30 * 24 * 60 * 60 * 1000;

function parseLookData(look: Look): LookDataParsed {
  try {
    const data = typeof look.lookData === "string" ? JSON.parse(look.lookData) : look.lookData;
    return data || {};
  } catch {
    return {};
  }
}

function getLookVibe(look: Look): string | null {
  const parsed = parseLookData(look);
  return (parsed.vibe ?? look.vibe)?.trim() || null;
}

function getLookOccasion(look: Look): string | null {
  const parsed = parseLookData(look);
  return (parsed.occasion ?? look.occasion)?.trim() || null;
}

function getLookClassificationTags(look: Look): string[] {
  const parsed = parseLookData(look);
  const tags = parsed.classificationTags;
  return Array.isArray(tags) ? tags.filter((t): t is string => typeof t === "string" && t.trim() !== "") : [];
}

function getTimeBucket(updatedAt: string | null): "week" | "month" | "older" {
  if (!updatedAt) return "older";
  const age = Date.now() - new Date(updatedAt).getTime();
  if (age <= MS_WEEK) return "week";
  if (age <= MS_MONTH) return "month";
  return "older";
}

const TIME_BUCKET_LABELS: Record<"week" | "month" | "older", string> = {
  week: "This week",
  month: "This month",
  older: "Older",
};

/* Same closet icon as top nav (AppHeader ClosetIcon) */
const ClosetIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
    <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
  </svg>
);

const DeleteIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
    <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const PRIORITY_IMAGE_COUNT = 8;

function LookCard({
  look,
  displayImageUrl,
  onDelete,
  onAddToWardrobe,
  onLookClick,
  addingWardrobeLookId,
  compact,
  priorityImage,
}: {
  look: Look;
  displayImageUrl: string;
  onDelete: (id: string) => void;
  onAddToWardrobe?: (lookId: string) => void;
  onLookClick?: (look: Look) => void;
  addingWardrobeLookId?: string | null;
  compact?: boolean;
  priorityImage?: boolean;
}) {
  const parsed = parseLookData(look);
  const shortTitle = parsed.shortTitle?.trim();
  const vibe = parsed.vibe ?? look.vibe;
  const occasion = parsed.occasion ?? look.occasion;
  const comment = parsed.comment ?? null;
  const tag =
    shortTitle ??
    (parsed.classificationTags?.[0]) ??
    vibe ??
    occasion ??
    (comment ? comment.split(/\s+/).slice(0, 3).join(" ") : null) ??
    "Look";
  const date = look.updatedAt
    ? new Date(look.updatedAt).toLocaleDateString("en-US", { dateStyle: "medium" })
    : null;

  const imageArea = (
    <div className="aspect-[3/4] bg-neutral-100 relative flex-shrink-0 group">
      {displayImageUrl ? (
        <img
          src={displayImageUrl}
          alt=""
          className="w-full h-full object-cover"
          loading={priorityImage ? "eager" : "lazy"}
          fetchPriority={priorityImage ? "high" : undefined}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No image</div>
      )}
      <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        {onAddToWardrobe && !look.id.startsWith("temp-") && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onAddToWardrobe(look.id); }}
            disabled={addingWardrobeLookId === look.id}
            className="p-2 rounded-full bg-white/90 shadow-md text-foreground hover:bg-white disabled:opacity-60"
            title="Add to wardrobe"
            aria-label="Add to wardrobe"
          >
            <ClosetIcon className="w-5 h-5" />
          </button>
        )}
        {!look.id.startsWith("temp-") && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(look.id); }}
            className="p-2 rounded-full bg-white/90 shadow-md text-red-600 hover:bg-white hover:text-red-700"
            title="Remove look"
            aria-label="Remove look"
          >
            <DeleteIcon />
          </button>
        )}
      </div>
    </div>
  );

  const cardContent = (
    <>
      {imageArea}
      <div className={compact ? "p-2 flex-1 min-w-0" : "p-3 min-w-0"}>
        <p className={`text-sm font-medium text-foreground ${compact ? "line-clamp-1" : "line-clamp-2"}`}>{tag}</p>
        {date && <p className={`text-xs text-neutral-500 ${compact ? "mt-0.5 line-clamp-1" : "mt-1 line-clamp-2"}`} suppressHydrationWarning>{date}</p>}
      </div>
    </>
  );

  const cardWrapperClass = compact
    ? "rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft flex flex-col w-[180px] sm:w-[200px] flex-shrink-0 snap-start"
    : "rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft flex flex-col";

  if (onLookClick) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={() => onLookClick(look)}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onLookClick(look); } }}
        className={`${cardWrapperClass} text-left cursor-pointer hover:ring-2 hover:ring-violet-200 transition-shadow`}
      >
        {cardContent}
      </div>
    );
  }

  return <div className={cardWrapperClass}>{cardContent}</div>;
}

function CarouselRow({
  title,
  looks,
  storageToken,
  onDelete,
  onAddToWardrobe,
  onLookClick,
  addingWardrobeLookId,
  priorityImageCount,
}: {
  title: string;
  looks: Look[];
  storageToken: string | null;
  onDelete: (id: string) => void;
  onAddToWardrobe?: (lookId: string) => void;
  onLookClick?: (look: Look) => void;
  addingWardrobeLookId?: string | null;
  priorityImageCount?: number;
}) {
  if (looks.length === 0) return null;
  return (
    <section className="space-y-2">
      <h3 className="font-display text-base text-foreground">{title}</h3>
      <div className="flex overflow-x-auto gap-4 pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
        {looks.map((look, i) => (
          <LookCard
            key={look.id}
            look={look}
            displayImageUrl={getImageDisplayUrl(look.imageUrl, storageToken)}
            onDelete={onDelete}
            onAddToWardrobe={onAddToWardrobe}
            onLookClick={onLookClick}
            addingWardrobeLookId={addingWardrobeLookId}
            compact
            priorityImage={priorityImageCount != null && i < priorityImageCount}
          />
        ))}
      </div>
    </section>
  );
}

export function DiarySection({
  onAddToWardrobe,
  addingWardrobeLookId,
}: {
  onAddToWardrobe?: (lookId: string) => void;
  addingWardrobeLookId?: string | null;
} = {}) {
  const storageToken = useStorageAccessToken();
  const { data, error, isLoading, mutate } = useSWR("looks-list", () => listLooks({ limit: 100, offset: 0 }));
  const [deleting, setDeleting] = useState<string | null>(null);
  const [selectedLookId, setSelectedLookId] = useState<string | null>(null);

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
  const selectedLook = selectedLookId ? items.find((l) => l.id === selectedLookId) ?? null : null;

  useEffect(() => {
    if (selectedLookId && !selectedLook) setSelectedLookId(null);
  }, [selectedLookId, selectedLook]);

  const handleLookClick = useCallback((look: Look) => {
    setSelectedLookId(look.id);
  }, []);

  const byTime = useMemo(() => {
    const week: Look[] = [];
    const month: Look[] = [];
    const older: Look[] = [];
    items.forEach((look) => {
      const bucket = getTimeBucket(look.updatedAt);
      if (bucket === "week") week.push(look);
      else if (bucket === "month") month.push(look);
      else older.push(look);
    });
    return { week, month, older };
  }, [items]);

  const byClassificationTag = useMemo(() => {
    const map = new Map<string, Look[]>();
    items.forEach((look) => {
      const tags = getLookClassificationTags(look);
      if (tags.length === 0) {
        const key = "Uncategorized";
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(look);
      } else {
        tags.forEach((tag) => {
          if (!map.has(tag)) map.set(tag, []);
          map.get(tag)!.push(look);
        });
      }
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  return (
    <div className="space-y-8">
      {isLoading && <p className="text-neutral-500">Loading your looks…</p>}
      {error && (
        <p className="text-red-600">
          {error instanceof Error ? error.message : "Failed to load looks."} Sign in to see your diary.
        </p>
      )}
      {!isLoading && !error && total > 0 && (
        <>
          {(byTime.week.length > 0 || byTime.month.length > 0 || byTime.older.length > 0) && (
            <div className="space-y-6">
              {byTime.week.length > 0 && (
                <CarouselRow
                  title={TIME_BUCKET_LABELS.week}
                  looks={byTime.week}
                  storageToken={storageToken}
                  onDelete={handleDelete}
                  onAddToWardrobe={onAddToWardrobe}
                  onLookClick={handleLookClick}
                  addingWardrobeLookId={addingWardrobeLookId}
                  priorityImageCount={PRIORITY_IMAGE_COUNT}
                />
              )}
              {byTime.month.length > 0 && (
                <CarouselRow
                  title={TIME_BUCKET_LABELS.month}
                  looks={byTime.month}
                  storageToken={storageToken}
                  onDelete={handleDelete}
                  onAddToWardrobe={onAddToWardrobe}
                  onLookClick={handleLookClick}
                  addingWardrobeLookId={addingWardrobeLookId}
                />
              )}
              {byTime.older.length > 0 && (
                <CarouselRow
                  title={TIME_BUCKET_LABELS.older}
                  looks={byTime.older}
                  storageToken={storageToken}
                  onDelete={handleDelete}
                  onAddToWardrobe={onAddToWardrobe}
                  onLookClick={handleLookClick}
                  addingWardrobeLookId={addingWardrobeLookId}
                />
              )}
            </div>
          )}
          {byClassificationTag.length > 0 && (
            <div className="space-y-6">
              {byClassificationTag.map(([tag, tagLooks]) => (
                <CarouselRow
                  key={tag}
                  title={tag}
                  looks={tagLooks}
                  storageToken={storageToken}
                  onDelete={handleDelete}
                  onAddToWardrobe={onAddToWardrobe}
                  onLookClick={handleLookClick}
                  addingWardrobeLookId={addingWardrobeLookId}
                />
              ))}
            </div>
          )}
        </>
      )}
      <LookDetailModal
        open={!!selectedLookId}
        onClose={() => setSelectedLookId(null)}
        look={selectedLook}
        storageToken={storageToken}
      />
    </div>
  );
}
