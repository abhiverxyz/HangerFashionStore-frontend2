"use client";

import Link from "next/link";
import { GetReadySection } from "@/components/looks/GetReadySection";

export default function GetReadyPage() {
  return (
    <div className="flex flex-col h-[calc(100vh-9rem-env(safe-area-inset-bottom,0px)-120px)] lg:h-[calc(100vh-12rem)] min-h-0 bg-card rounded-soft-xl border border-border shadow-soft overflow-hidden">
      {/* Heading strip: title + Live Styling chip (right) */}
      <div className="shrink-0 px-3 py-2.5 md:px-4 md:py-3 border-b border-border bg-gradient-to-r from-pink-50/80 via-fuchsia-50/80 to-purple-50/80 flex items-center justify-between gap-2 md:gap-3">
        <h1 className="font-display text-sm tracking-[0.12em] uppercase bg-gradient-to-r from-pink-600 via-fuchsia-500 to-purple-600 bg-clip-text text-transparent">
          Get ready with me
        </h1>
        <Link
          href="/get-ready/live"
          className="shrink-0 rounded-full px-2.5 py-1.5 text-xs font-medium bg-gradient-to-r from-pink-600 to-purple-600 text-white hover:opacity-90 transition-opacity"
        >
          Live Styling
        </Link>
      </div>
      {/* Mode selector */}
      <div className="shrink-0 px-3 py-2 border-b border-border bg-neutral-50/50 flex flex-wrap items-center gap-2">
        <span className="text-xs text-foreground/70 mr-1">Mode:</span>
        <span className="rounded-full px-3 py-1 text-xs font-medium bg-neutral-200 text-foreground">Quick Suggestions</span>
        <Link
          href="/get-ready/live"
          className="rounded-full px-3 py-1 text-xs font-medium bg-white border border-border hover:bg-neutral-100 text-foreground transition-colors"
        >
          Live Styling Session
        </Link>
      </div>
      {/* LHS + RHS below strip */}
      <GetReadySection />
    </div>
  );
}
