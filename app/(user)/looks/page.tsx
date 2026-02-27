"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import useSWR from "swr";
import { listLooks, type Look } from "@/lib/api/looks";
import { getStyleReportIfExists } from "@/lib/api/styleReport";
import type { StyleReportData } from "@/lib/types/styleReport";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";

/** Column 1: pink. Column 2: yellow, orange. Column 3: purple. Same 135deg, 3-stop structure. */
const CARD_GRADIENTS = {
  getReady: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)",       // col 1: pink
  diary: "linear-gradient(135deg, #fef9c3 0%, #fef08a 50%, #fde047 100%)",         // col 2: yellow
  howDoILook: "linear-gradient(135deg, #ffedd5 0%, #fed7aa 50%, #fdba74 100%)",    // col 2: orange
  styleReport: "linear-gradient(135deg, #f3e8ff 0%, #e9d5ff 50%, #d8b4fe 100%)",    // col 3: purple
} as const;
const CARD_TEXTURE = `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`;

/** Shared typography: titles and descriptors consistent across all cards, dark grey for legibility. */
const CARD_TITLE_CLASS = "font-display text-lg font-medium text-neutral-800";
const CARD_DESC_CLASS = "text-sm text-neutral-700 mt-1";

/** Placeholder area for card image (replace with <img> or next/image when source is available). */
function CardImageSlot({ className = "" }: { className?: string }) {
  return (
    <div
      className={`flex items-center justify-center rounded-soft-lg bg-white/30 border border-white/40 ${className}`}
      aria-hidden
    />
  );
}

/** How do I look? — image left, text right. */
function FitCheckCard({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/camera"
      className={`block w-full h-full min-h-0 rounded-soft-xl overflow-hidden shadow-soft hover:shadow-soft-hover transition-shadow active:opacity-95 border border-white/30 p-4 ${className}`}
      style={{
        backgroundImage: `${CARD_GRADIENTS.howDoILook}, ${CARD_TEXTURE}`,
      }}
    >
      <div className="relative z-10 flex h-full gap-3 items-stretch">
        <div className="flex min-w-0 flex-1 flex-col justify-center text-left">
          <h2 className={CARD_TITLE_CLASS}>How do I look?</h2>
          <p className={CARD_DESC_CLASS}>Do a quick fit check.</p>
        </div>
        <img
          src="/images/howdoilook.png"
          alt=""
          className="aspect-square w-20 shrink-0 rounded-soft-lg object-cover lg:w-24"
        />
      </div>
    </Link>
  );
}

/** Use to avoid hydration mismatch: only use async/data-dependent content after mount. */
function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/** Get Ready with me — image in center, text at bottom. */
function GetReadyCard({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/get-ready"
      className={`block rounded-soft-xl shadow-soft border border-white/30 overflow-hidden w-full h-full min-h-0 text-left hover:shadow-soft-hover transition-shadow active:opacity-95 ${className}`}
      style={{ backgroundImage: `${CARD_GRADIENTS.getReady}, ${CARD_TEXTURE}` }}
    >
      <div className="relative flex h-full min-h-[140px] flex-col lg:min-h-[360px]">
        <div className="flex flex-1 items-center justify-center p-4">
          <img
            src="/images/GRWM.png"
            alt=""
            className="aspect-square w-24 shrink-0 rounded-soft-lg object-cover lg:w-32"
          />
        </div>
        <div className="flex flex-col p-4">
          <h2 className={CARD_TITLE_CLASS}>Get Ready with Me</h2>
          <p className={CARD_DESC_CLASS}>Style your daily look by vibe or occasion</p>
        </div>
      </div>
    </Link>
  );
}

function DiaryCard({
  lookCount,
  latestLook,
  latestLookDisplayUrl,
  className = "",
}: {
  lookCount: number;
  latestLook: Look | null;
  latestLookDisplayUrl: string;
  className?: string;
}) {
  return (
    <Link
      href="/looks/diary"
      className={`block w-full h-full min-h-0 rounded-soft-xl overflow-hidden shadow-soft hover:shadow-soft-hover transition-shadow active:opacity-95 border border-white/30 ${className}`}
      style={{ backgroundImage: `${CARD_GRADIENTS.diary}, ${CARD_TEXTURE}` }}
    >
      <div className="relative z-10 flex h-full gap-3 p-4">
        <img
          src="/images/Look_diary.png"
          alt=""
          className="aspect-square w-20 shrink-0 rounded-soft-lg object-cover lg:w-24"
        />
        <div className="flex min-w-0 flex-1 flex-col justify-center text-right">
          <h3 className={`${CARD_TITLE_CLASS} text-right`}>Looks diary</h3>
          <p className={`${CARD_DESC_CLASS} text-right`}>All your looks at your fingertips</p>
        </div>
      </div>
    </Link>
  );
}

function StyleReportCard({
  hasReport,
  reportHeadline,
  className = "",
}: {
  hasReport: boolean;
  reportHeadline: string | null;
  className?: string;
}) {
  return (
    <Link
      href="/looks/style-report"
      className={`block w-full h-full min-h-0 rounded-soft-xl overflow-hidden shadow-soft hover:shadow-soft-hover transition-shadow active:opacity-95 border border-white/30 ${className}`}
      style={{ backgroundImage: `${CARD_GRADIENTS.styleReport}, ${CARD_TEXTURE}` }}
    >
      <div className="relative z-10 flex h-full flex-col p-4">
        <div className="flex flex-1 items-center justify-center">
          <img
            src="/images/stylereport.png"
            alt=""
            className="aspect-square w-24 shrink-0 rounded-soft-lg object-cover lg:w-32"
          />
        </div>
        <div className="flex flex-col">
          <h3 className={CARD_TITLE_CLASS}>Style report</h3>
          <p className={`${CARD_DESC_CLASS} line-clamp-2`}>
            {hasReport && reportHeadline ? reportHeadline : hasReport ? "Report ready" : "Generate from your looks"}
          </p>
        </div>
      </div>
    </Link>
  );
}

export default function LooksPage() {
  const mounted = useMounted();
  const storageToken = useStorageAccessToken();
  const { data: looksData } = useSWR(
    "looks-list",
    () => listLooks({ limit: 50, offset: 0 }),
    { revalidateOnFocus: false }
  );
  const { data: styleReportData } = useSWR<{ reportData: StyleReportData; generatedAt: string | null } | null>(
    "style-report",
    () => getStyleReportIfExists(),
    { revalidateOnFocus: false }
  );

  const lookCount = looksData?.total ?? 0;
  const looksItems = looksData?.items ?? [];
  const latestLook = looksItems[0] ?? null;
  const hasStyleReport = Boolean(styleReportData?.reportData);
  const styleReportHeadline = styleReportData?.reportData?.headline ?? null;

  return (
    <div className="space-y-6">
      {/* Desktop: Col1 = Get ready, Col2 = Looks diary + How do I look (gap-4 = same as column gap), Col3 = Style report. Mobile: Row1 How do I look 4:1, Row2 Get ready 2:1, Row3 Diary | Style report. */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 lg:grid-rows-2 lg:min-h-[360px] lg:gap-4 lg:items-stretch">
        {/* Mobile: row 1 full width (4:1). Desktop: col 2 row 2. */}
        <div className="col-span-2 aspect-[4/1] min-h-0 lg:col-start-2 lg:col-end-3 lg:row-start-2 lg:row-end-3 lg:aspect-auto lg:min-h-0">
          <FitCheckCard className="h-full" />
        </div>
        {/* Mobile: row 2 full width (2:1). Desktop: col 1 row 1-2. */}
        <div className="col-span-2 aspect-[2/1] min-h-0 lg:col-start-1 lg:col-end-2 lg:row-span-2 lg:aspect-auto lg:min-h-[360px]">
          <GetReadyCard className="h-full" />
        </div>
        {/* Mobile: row 3 col 1. Desktop: col 2 row 1. */}
        <div className="min-h-0 lg:col-start-2 lg:col-end-3 lg:row-start-1 lg:row-end-2">
          <DiaryCard
            lookCount={mounted ? lookCount : 0}
            latestLook={mounted ? latestLook : null}
            latestLookDisplayUrl={getImageDisplayUrl(latestLook?.imageUrl ?? null, storageToken)}
            className="h-full"
          />
        </div>
        {/* Mobile: row 3 col 2. Desktop: col 3 row 1-2. */}
        <div className="min-h-0 lg:col-start-3 lg:col-end-4 lg:row-span-2 lg:min-h-[360px]">
          <StyleReportCard
            hasReport={mounted && hasStyleReport}
            reportHeadline={mounted ? styleReportHeadline : null}
            className="h-full"
          />
        </div>
      </div>
    </div>
  );
}
