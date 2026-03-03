"use client";

import { useState, useCallback, useRef } from "react";
import useSWR from "swr";
import { toPng } from "html-to-image";
import { getStyleReportIfExists, generateStyleReport, type GenerateStyleReportResponse } from "@/lib/api/styleReport";
import type { StyleReportData, StyleReportCard } from "@/lib/types/styleReport";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";
import { CARD_TEXTURE_STRONG } from "@/lib/constants/cardStyles";

/** Vibrant, textural gradient backgrounds (stylezone-style). Texture overlay for depth. */
const CARD_TEXTURE = CARD_TEXTURE_STRONG;
const CARD_GRADIENTS = [
  "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)",   // pink
  "linear-gradient(135deg, #c4b5fd 0%, #a78bfa 50%, #8b5cf6 100%)",   // violet
  "linear-gradient(135deg, #99f6e4 0%, #5eead4 50%, #2dd4bf 100%)",   // teal
  "linear-gradient(135deg, #fef3c7 0%, #fde68a 50%, #fcd34d 100%)",   // amber
  "linear-gradient(135deg, #fecdd3 0%, #fda4af 50%, #fb7185 100%)",   // rose
  "linear-gradient(135deg, #a7f3d0 0%, #6ee7b7 50%, #34d399 100%)",   // emerald
  "linear-gradient(135deg, #fed7aa 0%, #fdba74 50%, #fb923c 100%)",   // orange
  "linear-gradient(135deg, #bfdbfe 0%, #93c5fd 50%, #60a5fa 100%)",   // blue
];

/** Pill backgrounds complementary to each CARD_GRADIENT (pink→teal, violet→amber, teal→rose, etc.). No border. */
const CARD_PILL_BG = [
  "bg-teal-100/90 text-teal-900",
  "bg-amber-100/90 text-amber-900",
  "bg-rose-100/90 text-rose-900",
  "bg-sky-100/90 text-sky-900",
  "bg-emerald-100/90 text-emerald-900",
  "bg-pink-100/90 text-pink-900",
  "bg-indigo-100/90 text-indigo-900",
  "bg-amber-100/90 text-amber-900",
];

/** Resolve colour string (hex or name) to hex for swatch background. Aligned with backend NAMED_COLOR_PALETTE. */
function colourToHex(s: string): string {
  const t = s.trim();
  if (/^#[0-9A-Fa-f]{3}$/.test(t)) return t.length === 4 ? t : t;
  if (/^#[0-9A-Fa-f]{6}$/.test(t)) return t;
  const nameMap: Record<string, string> = {
    black: "#0d0d0d",
    white: "#fafafa",
    offwhite: "#f5f0e8",
    ivory: "#fffff0",
    cream: "#fffdd0",
    grey: "#808080",
    gray: "#808080",
    charcoal: "#36454f",
    silver: "#c0c0c0",
    slate: "#708090",
    navy: "#1e3a5f",
    midnightblue: "#191970",
    blue: "#2563eb",
    powderblue: "#b0e0e6",
    skyblue: "#87ceeb",
    lightblue: "#87ceeb",
    teal: "#008080",
    forestgreen: "#228b22",
    green: "#16a34a",
    sage: "#9dc183",
    mint: "#98ff98",
    olive: "#808000",
    khaki: "#c3b091",
    mustard: "#ffdb58",
    yellow: "#eab308",
    gold: "#ffd700",
    amber: "#f59e0b",
    orange: "#ea580c",
    coral: "#ff7f50",
    terracotta: "#c75c3c",
    red: "#dc2626",
    burgundy: "#722f37",
    maroon: "#800000",
    wine: "#722f37",
    pink: "#ec4899",
    dustyrose: "#c9a9a6",
    blush: "#de98ab",
    rose: "#e11d48",
    fuchsia: "#c026d3",
    purple: "#7c3aed",
    lavender: "#e879f9",
    violet: "#8b5cf6",
    plum: "#581c87",
    brown: "#78350f",
    tan: "#d2b48c",
    beige: "#d4b896",
    camel: "#c19a6b",
    rust: "#b7410e",
  };
  const key = t.toLowerCase().replace(/\s+/g, "").replace(/-/g, "");
  return nameMap[key] ?? "#9ca3af";
}

function ShareCardButton({ cardRef, cardTitle }: { cardRef: React.RefObject<HTMLDivElement | null>; cardTitle: string }) {
  const [sharing, setSharing] = useState(false);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setSharing(true);
    try {
      const dataUrl = await toPng(cardRef.current, { cacheBust: true, pixelRatio: 2 });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `style-report-${cardTitle.replace(/\s+/g, "-")}.png`, { type: "image/png" });
      if (typeof navigator.share === "function") {
        const sharePayload = { title: cardTitle, files: [file] };
        const canShareFiles = typeof navigator.canShare === "function" && navigator.canShare(sharePayload);
        try {
          if (canShareFiles) {
            await navigator.share(sharePayload);
            return;
          }
        } catch (_) {
          /* fallback below */
        }
        try {
          await navigator.share({
            title: cardTitle,
            text: "My style report from Hanger",
            url: typeof window !== "undefined" ? window.location.href : "",
          });
          const a = document.createElement("a");
          a.href = dataUrl;
          a.download = `style-report-${cardTitle.replace(/\s+/g, "-")}.png`;
          a.click();
          return;
        } catch (_) {
          /* fallback to download only */
        }
      }
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `style-report-${cardTitle.replace(/\s+/g, "-")}.png`;
      a.click();
    } catch (err) {
      console.warn("Share card failed:", err);
    } finally {
      setSharing(false);
    }
  }, [cardRef, cardTitle]);

  return (
    <button
      type="button"
      onClick={handleShare}
      disabled={sharing}
      className="absolute top-3 right-3 rounded-full p-3 min-w-[44px] min-h-[44px] flex items-center justify-center bg-white/90 shadow-sm border border-stone-200/80 hover:bg-white text-stone-600 hover:text-stone-900 transition-opacity disabled:opacity-50"
      title="Share this card"
      aria-label="Share this card"
    >
      {sharing ? (
        <span className="text-xs">…</span>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
        </svg>
      )}
    </button>
  );
}

function ReportCardBlock({ card, index }: { card: StyleReportCard; index: number }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const gradient = CARD_GRADIENTS[index % CARD_GRADIENTS.length];
  const storageToken = useStorageAccessToken();

  if (card.type === "style_identity") {
    // Display only the two-word identity (e.g. "Minimal Mysterious"), never "Your … Style"
    let twoWord = (card.twoWordIdentity ?? "").trim() || (card.title ?? "Style Identity");
    const parts = twoWord.split(/\s+/).filter((w) => w && !/^(your|style)$/i.test(w));
    if (parts.length >= 2) twoWord = `${parts[0]} ${parts[1]}`;
    else if (parts.length === 1) twoWord = parts[0];
    // Max 4 pills so they stay in one line; drop lowest relevance (last) if we had 5
    const pills = (card.keywords ?? []).slice(0, 4);
    const quote = (card.quote ?? "").trim();
    const analysis = (card.analysis ?? "").trim();

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/40 px-8 py-6 sm:p-8 shadow-soft flex flex-col items-center text-center min-h-0"
        style={{ backgroundImage: `${gradient}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <p
          className="text-2xl sm:text-3xl md:text-4xl font-bold tracking-wide px-10 pt-8 pb-8 text-center bg-clip-text text-transparent"
          style={{
            fontFamily: "var(--font-bungee-spice), sans-serif",
            backgroundImage: "linear-gradient(135deg, #7c3aed 0%, #db2777 40%, #ea580c 100%)",
            WebkitBackgroundClip: "text",
          }}
        >
          {twoWord}
        </p>
        {quote ? (
          <div className="w-full max-w-md my-4 bg-white/25 py-3 px-3 rounded-lg">
            <p className="text-sm text-neutral-800/95 italic text-center">
              &ldquo;{quote}&rdquo;
            </p>
          </div>
        ) : (
          <div className="w-full max-w-md my-4 bg-white/25 py-3 px-3 rounded-lg">
            <p className="text-sm text-neutral-600/80 italic text-center">
              &ldquo;Style is what you make it—and we&rsquo;re here for it.&rdquo;
            </p>
          </div>
        )}
        {analysis && (
          <p className="text-sm text-neutral-700 leading-relaxed max-w-lg text-justify mt-6 self-start">
            {analysis}
          </p>
        )}
        {pills.length > 0 && (
          <div className="flex flex-wrap sm:flex-nowrap justify-start items-center gap-2 mt-auto pt-5 w-full max-w-lg self-start">
            {pills.map((k, i) => (
              <span
                key={i}
                className="rounded-full px-3 py-1.5 text-[11px] font-medium shrink-0 bg-[#fffff0] text-neutral-800"
              >
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (card.type === "style_code") {
    const STYLE_CODE_BG = "linear-gradient(135deg, #ffffff 0%, #f3e8ff 50%, #ede9fe 100%)";
    const DIMENSION_NAMES: Record<string, string> = {
      trendAppetite: "Trend Appetite",
      formAndFit: "Form and Fit",
      expression: "Expression",
      colour: "Colour",
    };
    const styleCodeDimensionsFallback = [
      { id: "trendAppetite", labelLeft: "Classic, Timeless", labelRight: "Runway, Experimental", score: 5 },
      { id: "formAndFit", labelLeft: "Comfort, relaxed", labelRight: "Structured, fitted", score: 5 },
      { id: "expression", labelLeft: "Minimal, Simple", labelRight: "Layered, Detailed", score: 5 },
      { id: "colour", labelLeft: "Soft, muted", labelRight: "Bold, Bright", score: 5 },
    ];
    const dimensions = (card.dimensions && card.dimensions.length > 0)
      ? card.dimensions
      : styleCodeDimensionsFallback;

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft flex flex-col items-center min-h-0"
        style={{ backgroundImage: `${STYLE_CODE_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-6 pb-0 mb-12">
          Style Code
        </h3>
        <div className="w-full max-w-md space-y-6">
          {dimensions.map((d) => (
            <div key={d.id} className="flex flex-col">
              <div className="text-[10px] font-medium text-neutral-600 uppercase tracking-wide mb-1.5 text-center">
                {DIMENSION_NAMES[d.id] ?? d.id}
              </div>
              <div
                className="relative h-2.5 w-full rounded-full overflow-visible"
                style={{ background: "linear-gradient(90deg, #e9d5ff 0%, #d8b4fe 50%, #c4b5fd 100%)" }}
                role="progressbar"
                aria-valuenow={d.score}
                aria-valuemin={0}
                aria-valuemax={10}
                aria-label={`${DIMENSION_NAMES[d.id] ?? d.id}: ${d.labelLeft} to ${d.labelRight}: ${d.score} of 10`}
              >
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${(d.score / 10) * 100}%`,
                    background: "linear-gradient(90deg, #f59e0b 0%, #fcd34d 50%, #fbbf24 100%)",
                  }}
                />
                <div
                  className="absolute top-1/2 w-5 h-5 -mt-2.5 rounded-full bg-white border-2 shadow-sm flex items-center justify-center"
                  style={{
                    left: `${(d.score / 10) * 100}%`,
                    transform: "translateX(-50%)",
                    borderColor: "#f59e0b",
                  }}
                >
                  <span className="text-[9px] font-medium text-neutral-700 leading-none">{d.score}</span>
                </div>
              </div>
              <div className="flex justify-between text-[9px] text-neutral-600 mt-2 sm:mt-0.5">
                <span>{d.labelLeft}</span>
                <span>{d.labelRight}</span>
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-row flex-nowrap justify-center items-center gap-2 sm:gap-3 mt-12">
          {dimensions.map((d) => (
            <div
              key={d.id}
              className="flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium"
              style={{
                background: "linear-gradient(135deg, #5b21b6 0%, #7c3aed 50%, #4c1d95 100%)",
                color: "#fcd34d",
              }}
              aria-label={`${d.id}: ${d.score}`}
            >
              {d.score}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (card.type === "colour_analysis") {
    const allColors = card.colors ?? [];
    const base = card.basePalette ?? allColors.slice(0, 4);
    const accent = card.accentPalette ?? allColors.slice(4, 8);
    const signature = allColors.slice(8, 12);
    const combination = (card.combinationIdea ?? allColors.slice(0, 3)).filter(Boolean);
    const paletteBars = [
      { label: "Base", sublabel: "Your often used palette", colors: base },
      { label: "Accent", sublabel: "Your accents palette", colors: accent },
      { label: "Signature", sublabel: "Your signature tones", colors: signature },
    ].filter((bar) => bar.colors.length > 0);
    const COLOUR_CARD_BG = "linear-gradient(135deg, #f8f8f8 0%, #e8e8e8 50%, #d8d8d8 100%)";

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${COLOUR_CARD_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle="Colour Palette" />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-6 pb-0 mb-10 text-center">
          Colour Palette
        </h3>

        <div className="w-full max-w-lg space-y-6">
          {paletteBars.map((bar) => (
            <div key={bar.label} className="flex flex-col gap-2">
              <div className="flex flex-col sm:flex-row sm:items-baseline gap-0.5">
                <span className="text-sm font-semibold text-neutral-800">{bar.label}</span>
                <span className="text-xs text-neutral-600 sm:ml-1">{bar.sublabel}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {bar.colors.map((c, i) => (
                  <div
                    key={`${bar.label}-${i}`}
                    className="h-8 min-w-[2.5rem] flex-1 max-w-[4rem] rounded-md border border-neutral-300/60 shadow-sm"
                    style={{ backgroundColor: colourToHex(c) }}
                    title={c}
                    aria-hidden
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {card.content?.trim() ? (
          <p className="text-sm text-neutral-700 leading-relaxed mt-8 max-w-lg text-left text-justify">
            {card.content.trim().slice(0, 200)}
          </p>
        ) : null}

        {combination.length > 0 ? (
          <div className="mt-8 flex flex-col items-center gap-3">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">
              A combination idea for you
            </span>
            <div className="flex flex-row items-center justify-center gap-4 sm:gap-6">
              {combination.map((c, i) => (
                <div
                  key={i}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full flex-shrink-0 border-2 border-neutral-300/70 shadow-md"
                  style={{ backgroundColor: colourToHex(c) }}
                  title={c}
                  aria-hidden
                />
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  }

  if (card.type === "look_recipe") {
    const trimTo10Words = (s: string) => {
      const words = s.trim().split(/\s+/).slice(0, 10);
      return words.join(" ").replace(/[,.]\s*$/, "").trim();
    };
    const trimTo20Words = (s: string) => {
      const words = s.trim().split(/\s+/).slice(0, 20);
      return words.join(" ").replace(/[,.]\s*$/, "").trim();
    };
    const silhouettes = card.dominantSilhouettes ?? card.goToShapes ?? card.keywords ?? [];
    const sliders = card.structureSliders ?? { structuredFluid: 5, relaxedFitted: 5 };
    const accessoriesInsight10 = card.accessoriesInsight?.trim()
      ? trimTo10Words(card.accessoriesInsight.trim())
      : "";
    const footwearInsight10 = card.footwearInsight?.trim()
      ? trimTo10Words(card.footwearInsight.trim())
      : "";
    const trendScore = Math.max(0, Math.min(10, card.trendAdaptivenessScore ?? 5));
    const trendObservation =
      (card.trendObservation ?? "").trim() ||
      (trendScore <= 2
        ? "Classic"
        : trendScore <= 4
          ? "Quiet luxury"
          : trendScore <= 6
            ? "Selective"
            : trendScore <= 8
              ? "Trend-curious"
              : "Experimental");
    const LOOK_RECIPE_BG = "linear-gradient(135deg, #1e3a5f 0%, #2563eb 40%, #3b82f6 70%, #60a5fa 100%)";

    const SUB_CARD_HEIGHT = "min-h-[165px]";
    const PILL_GRADIENT = "linear-gradient(135deg, #e0f2fe 0%, #bae6fd 50%, #7dd3fc 100%)";
    const SubCard = ({
      title,
      children,
      className = "",
    }: {
      title: string;
      children: React.ReactNode;
      className?: string;
    }) => (
      <div
        className={`rounded-xl border border-white/30 bg-white p-5 flex flex-col gap-2 ${SUB_CARD_HEIGHT} ${className}`}
      >
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600">{title}</span>
        {children}
      </div>
    );

    const SliderDisplay = ({ value, leftLabel, rightLabel }: { value: number; leftLabel: string; rightLabel: string }) => (
      <div className="flex flex-col gap-1.5">
        <div className="flex justify-between text-[10px] text-slate-600">
          <span>{leftLabel}</span>
          <span>{rightLabel}</span>
        </div>
        <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-indigo-600 transition-all"
            style={{ width: `${Math.max(0, Math.min(100, value * 10))}%` }}
          />
        </div>
      </div>
    );

    const accessoriesIconAlt = "Accessories";
    const footwearIconAlt = "Footwear";

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/20 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${LOOK_RECIPE_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-white pt-6 pb-0 mb-6 text-center">
          {card.title || "Look recipe"}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl mx-auto w-full">
          <SubCard title="Silhouette">
            {silhouettes.length > 0 ? (
              <div className="flex flex-wrap gap-1.5">
                {silhouettes.map((s, i) => (
                  <span
                    key={i}
                    className="rounded-full px-2.5 py-1 text-[10px] font-medium text-sky-900 border border-sky-200/80"
                    style={{ background: PILL_GRADIENT }}
                  >
                    {s}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No silhouette data</p>
            )}
          </SubCard>

          <SubCard title="Structure">
            <div className="mt-3 flex flex-col gap-3">
              <SliderDisplay
                value={sliders.structuredFluid}
                leftLabel="Fluid"
                rightLabel="Structured"
              />
              <SliderDisplay
                value={sliders.relaxedFitted}
                leftLabel="Relaxed"
                rightLabel="Fitted"
              />
            </div>
          </SubCard>

          <SubCard title="Trends">
            <span
              className="inline-flex rounded-full px-3 py-1.5 text-[10px] font-medium max-w-full text-sky-900 border border-sky-200/80"
              style={{ background: PILL_GRADIENT }}
            >
              {trendObservation}
            </span>
            <div className="mt-3 flex flex-col gap-1.5">
              <div className="text-[10px] font-medium text-slate-600 uppercase tracking-wide">
                Adaptiveness to trends
              </div>
              <div className="flex justify-between text-[9px] text-slate-600">
                <span>Classic</span>
                <span>Experimental</span>
              </div>
              <div className="h-2 w-full rounded-full bg-slate-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-amber-500 transition-all"
                  style={{ width: `${trendScore * 10}%` }}
                />
              </div>
            </div>
          </SubCard>

          <SubCard title="Styling">
            <div className="flex items-start gap-2 flex-1">
              <img
                src="/images/style-report/sunglasses.png"
                alt={accessoriesIconAlt}
                className="w-8 h-8 flex-shrink-0 object-contain invert opacity-80"
                aria-hidden
              />
              <p className="text-xs text-slate-700 leading-relaxed min-w-0">
                {accessoriesInsight10 || "Accessories that fit your look."}
              </p>
            </div>
            <div className="flex items-start gap-2 flex-1 mt-2">
              <img
                src="/images/style-report/shoes.png"
                alt={footwearIconAlt}
                className="w-8 h-8 flex-shrink-0 object-contain invert opacity-80"
                aria-hidden
              />
              <p className="text-xs text-slate-700 leading-relaxed min-w-0">
                {footwearInsight10 || "Footwear that works for you."}
              </p>
            </div>
          </SubCard>
        </div>

        {card.content?.trim() && !card.trendObservation ? (
          <p className="text-sm text-white/95 leading-relaxed mt-6 text-left max-w-2xl mx-auto w-full text-justify">
            {trimTo20Words(card.content.trim())}
          </p>
        ) : null}
      </div>
    );
  }

  if (card.type === "silhouette") {
    const shapes = card.goToShapes ?? card.keywords ?? [];
    const fitProfile = card.fitProfile?.trim() || "Mixed";
    const SILHOUETTE_CARD_BG = "linear-gradient(135deg, #fafaf9 0%, #f5f5f4 50%, #e7e5e4 100%)";

    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-neutral-200/80 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${SILHOUETTE_CARD_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-6 pb-0 mb-10 text-center">
          {card.title || "Shape & Fit"}
        </h3>

        {shapes.length > 0 ? (
          <div className="w-full max-w-lg flex flex-col gap-2 mb-6">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">Your go-to shapes</span>
            <div className="flex flex-wrap gap-2">
              {shapes.map((s, i) => (
                <span
                  key={i}
                  className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-800 border border-neutral-300/60 shadow-sm"
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {fitProfile ? (
          <p className="text-sm text-neutral-600 mb-4">
            <span className="font-medium">Fit:</span> {fitProfile}
          </p>
        ) : null}

        {card.content?.trim() ? (
          <p className="text-sm text-neutral-700 leading-relaxed mt-4 max-w-lg text-center sm:text-left">
            {card.content.trim().slice(0, 300)}
          </p>
        ) : null}

        {card.silhouetteIdea?.trim() ? (
          <div className="mt-6 flex flex-col gap-1">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">Idea to try</span>
            <p className="text-sm font-medium text-neutral-800">{card.silhouetteIdea.trim()}</p>
          </div>
        ) : null}
      </div>
    );
  }

  if (card.type === "style_signature" || card.type === "style_dna") {
    const THUMBPRINT_BG = "linear-gradient(135deg, #4b5563 0%, #374151 50%, #1f2937 80%, #111827 100%)";
    const observations = (card.observations && card.observations.length >= 3)
      ? card.observations.slice(0, 3)
      : [
          { number: 1, serious: "Your style has a clear point of view.", humorous: "You know what works." },
          { number: 2, serious: "You know what works for you.", humorous: "Your tell is strong." },
          { number: 3, serious: "Your choices feel intentional.", humorous: "No fashion FOMO here." },
        ];
    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/20 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${THUMBPRINT_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle="Thumbprint" />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-100 pt-4 text-center">
          Thumbprint
        </h3>
        <div className="flex justify-center py-4">
          <img
            src="/images/style-report/thumbprint.png"
            alt=""
            className="w-32 h-32 sm:w-40 sm:h-40 object-contain"
            aria-hidden
          />
        </div>
        <div className="w-full max-w-lg text-left flex flex-col items-start">
          {observations.map((obs) => {
            const heading =
              obs.number === 1 ? "Signature" : obs.number === 2 ? "Tell" : "Absent";
            return (
              <div key={obs.number} className="w-full flex flex-col">
                {obs.number > 1 ? (
                  <div
                    className="w-full h-0.5 rounded-full mb-5"
                    style={{ background: "linear-gradient(90deg, transparent, #eab308 20%, #fcd34d 50%, #eab308 80%, transparent)" }}
                    aria-hidden
                  />
                ) : null}
                <div className={`flex flex-row gap-3 sm:gap-4 items-center w-full ${obs.number < 3 ? "pb-5" : ""}`}>
                  <span
                    className="flex-shrink-0 min-w-[6rem] text-lg sm:text-xl uppercase tracking-wide inline-block"
                    style={{
                      fontFamily: "var(--font-bangers), sans-serif",
                      color: "#eab308",
                      transform: "rotate(-10deg)",
                    }}
                  >
                    {heading}
                  </span>
                  <div className="text-sm sm:text-base text-neutral-200 leading-relaxed pt-0.5 space-y-0.5">
                    <p>{obs.serious ?? obs.text}</p>
                    {obs.humorous ? (
                      <p className="italic text-neutral-300">{obs.humorous}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  if (card.type === "ideas_for_you" || card.type === "style_recipe") {
    const sections = card.sections;
    const ideas = card.ideas;
    const hasSections = sections?.inYourZone || sections?.zoneAdjacent || sections?.whereIsTheZone;

    const IdeasSectionBlock = ({
      label,
      idea,
      imagePath,
      horizontalLayout = false,
    }: {
      label: string;
      idea: string;
      imagePath: string;
      horizontalLayout?: boolean;
    }) => {
      const labelEl = (
        <span
          className="text-sm sm:text-base uppercase tracking-wide mb-2 bg-clip-text text-transparent"
          style={{
            fontFamily: "var(--font-bangers), sans-serif",
            backgroundImage: "linear-gradient(135deg, #6b7280 0%, #374151 50%, #1f2937 100%)",
            WebkitBackgroundClip: "text",
          }}
        >
          {label}
        </span>
      );
      const imageEl = (
        <div className="relative w-full h-full rounded-lg overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center flex-shrink-0">
          <img
            src={imagePath}
            alt=""
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = "none";
              const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
              if (placeholder) placeholder.classList.remove("hidden");
            }}
          />
          <div className="hidden absolute inset-0 flex items-center justify-center text-neutral-500/80 text-4xl" aria-hidden>
            &#9733;
          </div>
        </div>
      );
      const ideaEl = idea ? (
        <p className="text-sm font-medium text-neutral-800 mt-1">{idea}</p>
      ) : null;

      if (horizontalLayout) {
        return (
          <div className="rounded-xl bg-white/10 p-4 flex flex-row gap-4 h-full">
            <div className="relative w-28 sm:w-36 h-28 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
              {imageEl}
            </div>
            <div className="min-w-0 flex flex-col justify-center">
              {labelEl}
              {ideaEl}
            </div>
          </div>
        );
      }

      return (
        <div className="rounded-xl bg-white/10 p-4 flex flex-col h-full">
          {labelEl}
          <div className="relative h-28 sm:h-32 rounded-lg overflow-hidden bg-white/20 border border-white/30 flex items-center justify-center mb-3">
            <img
              src={imagePath}
              alt=""
              className="w-full h-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
                const placeholder = e.currentTarget.nextElementSibling as HTMLElement;
                if (placeholder) placeholder.classList.remove("hidden");
              }}
            />
            <div className="hidden absolute inset-0 flex items-center justify-center text-neutral-500/80 text-4xl" aria-hidden>
              &#9733;
            </div>
          </div>
          {ideaEl}
        </div>
      );
    };

    if (hasSections) {
      const inZone = sections!.inYourZone ?? { description: "", items: [] };
      const adj = sections!.zoneAdjacent ?? { description: "", items: [] };
      const where = sections!.whereIsTheZone ?? { description: "", items: [] };
      const inZoneIdea = (inZone.items && inZone.items[0]) ? inZone.items[0] : "";
      const adjIdea = (adj.items && adj.items[0]) ? adj.items[0] : "";
      const whereIdea = (where.items && where.items[0]) ? where.items[0] : "";
      return (
        <div
          ref={cardRef}
          className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft min-h-[140px]"
          style={{ backgroundImage: `${gradient}, ${CARD_TEXTURE}` }}
        >
          <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
          <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-4 text-center mb-4">
            {card.title || "Ideas for you"}
          </h3>
          {card.content ? (
            <p className="text-sm text-neutral-700 mb-4 text-center">{card.content}</p>
          ) : null}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <IdeasSectionBlock
              label="In your zone"
              idea={inZoneIdea}
              imagePath={getImageDisplayUrl(inZone.imageUrl, storageToken) || "/images/style-report/ideas-in-zone.png"}
            />
            <IdeasSectionBlock
              label="Zone adjacent"
              idea={adjIdea}
              imagePath={getImageDisplayUrl(adj.imageUrl, storageToken) || "/images/style-report/ideas-adjacent.png"}
            />
          </div>
          <div className="pt-2">
            <IdeasSectionBlock
              label="Where is the zone?"
              idea={whereIdea}
              imagePath={getImageDisplayUrl(where.imageUrl, storageToken) || "/images/style-report/ideas-where-zone.png"}
              horizontalLayout
            />
          </div>
        </div>
      );
    }

    const hasWithin = ideas?.within && ideas.within.length > 0;
    const hasAdjacent = ideas?.adjacent && ideas.adjacent.length > 0;
    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft min-h-[140px]"
        style={{ backgroundImage: `${gradient}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pr-10 mb-3">
          {card.title || "Ideas for you"}
        </h3>
        {card.content ? (
          <div className="text-sm sm:text-base text-neutral-800 leading-relaxed whitespace-pre-wrap mb-4">
            {card.content}
          </div>
        ) : null}
        {hasWithin && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">Within your zone</h4>
            <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
              {ideas!.within!.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
        {hasAdjacent && (
          <div className="mt-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 mb-2">Stretch</h4>
            <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1">
              {ideas!.adjacent!.map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  if (card.type === "trends") {
    const TRENDS_CARD_BG = "linear-gradient(135deg, #fef3c7 0%, #fde68a 40%, #fcd34d 100%)";
    const hasStructured = card.moodLabel || (card.insights && card.insights.length > 0);
    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${TRENDS_CARD_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-6 pb-0 mb-4 text-center">
          {card.title || "Trends"}
        </h3>
        {hasStructured ? (
          <>
            {card.moodLabel ? (
              <div className="flex justify-center mb-4">
                <span
                  className="rounded-full px-4 py-1.5 text-sm font-medium bg-amber-200/80 text-amber-900 border border-amber-300/60"
                  aria-label={`Trend mood: ${card.moodLabel}`}
                >
                  {card.moodLabel}
                </span>
              </div>
            ) : null}
            {card.insights && card.insights.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1 mb-4 max-w-lg mx-auto">
                {card.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
        {card.content?.trim() ? (
          <p className="text-sm text-neutral-800 leading-relaxed max-w-lg mx-auto text-center sm:text-left">
            {card.content.trim()}
          </p>
        ) : null}
        {card.suggestion?.trim() ? (
          <div className="mt-6 flex flex-col gap-1 max-w-lg mx-auto w-full">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">One to try</span>
            <p className="text-sm font-medium text-neutral-800">{card.suggestion.trim()}</p>
          </div>
        ) : null}
        {card.keywords && card.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {card.keywords.map((k, i) => (
              <span key={i} className="rounded-full bg-white/70 px-3 py-1 text-xs text-neutral-700 border border-amber-200/60">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (card.type === "styling") {
    const STYLING_CARD_BG = "linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 40%, #a5b4fc 100%)";
    const hasStructured = card.moodLabel || (card.insights && card.insights.length > 0);
    return (
      <div
        ref={cardRef}
        className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft flex flex-col min-h-0"
        style={{ backgroundImage: `${STYLING_CARD_BG}, ${CARD_TEXTURE}` }}
      >
        <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
        <h3 className="font-display text-xl sm:text-2xl tracking-[0.14em] uppercase text-neutral-900 pt-6 pb-0 mb-4 text-center">
          {card.title || "Styling"}
        </h3>
        {hasStructured ? (
          <>
            {card.moodLabel ? (
              <div className="flex justify-center mb-4">
                <span
                  className="rounded-full px-4 py-1.5 text-sm font-medium bg-indigo-200/80 text-indigo-900 border border-indigo-300/60"
                  aria-label={`Styling mood: ${card.moodLabel}`}
                >
                  {card.moodLabel}
                </span>
              </div>
            ) : null}
            {card.insights && card.insights.length > 0 ? (
              <ul className="list-disc list-inside text-sm text-neutral-700 space-y-1 mb-4 max-w-lg mx-auto">
                {card.insights.map((insight, i) => (
                  <li key={i}>{insight}</li>
                ))}
              </ul>
            ) : null}
          </>
        ) : null}
        {card.content?.trim() ? (
          <p className="text-sm text-neutral-800 leading-relaxed max-w-lg mx-auto text-center sm:text-left">
            {card.content.trim()}
          </p>
        ) : null}
        {card.suggestion?.trim() ? (
          <div className="mt-6 flex flex-col gap-1 max-w-lg mx-auto w-full">
            <span className="text-xs font-medium uppercase tracking-wider text-neutral-600">Idea to try</span>
            <p className="text-sm font-medium text-neutral-800">{card.suggestion.trim()}</p>
          </div>
        ) : null}
        {card.keywords && card.keywords.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 justify-center">
            {card.keywords.map((k, i) => (
              <span key={i} className="rounded-full bg-white/70 px-3 py-1 text-xs text-neutral-700 border border-indigo-200/60">
                {k}
              </span>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={cardRef}
      className="relative rounded-2xl border border-white/40 p-6 sm:p-8 shadow-soft min-h-[140px]"
      style={{ backgroundImage: `${gradient}, ${CARD_TEXTURE}` }}
    >
      <ShareCardButton cardRef={cardRef} cardTitle={card.title} />
      <h3 className="font-display text-lg sm:text-xl font-semibold text-neutral-900 pr-10 mb-3">{card.title}</h3>
      <div className="text-sm sm:text-base text-neutral-800 leading-relaxed whitespace-pre-wrap">{card.content}</div>
      {card.keywords && card.keywords.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {card.keywords.map((k, i) => (
            <span key={i} className="rounded-full bg-white/70 px-3 py-1 text-xs text-neutral-700 border border-white/50">
              {k}
            </span>
          ))}
        </div>
      )}
      {card.colors && card.colors.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3">
          {card.colors.map((c, i) => (
            <span key={i} className="text-xs text-neutral-700">{c}</span>
          ))}
        </div>
      )}
    </div>
  );
}

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

  function RegenerateIcon({ className }: { className?: string }) {
    return (
      <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
      </svg>
    );
  }

  const bannerRightAction = (
    <button
      type="button"
      onClick={handleGenerate}
      disabled={generating || (noReportYet && lookCount !== undefined && lookCount < 1)}
      className="p-2 rounded-full text-black/70 hover:text-black hover:bg-black/10 disabled:opacity-50 transition-colors"
      title={noReportYet ? "Generate" : "Regenerate"}
      aria-label={noReportYet ? "Generate style report" : "Regenerate style report"}
    >
      <RegenerateIcon className="w-5 h-5" />
    </button>
  );

  const titleCard = (generatedAt?: string | null) => (
    <div
      className="rounded-2xl py-3 px-4 sm:py-4 sm:px-5 shadow-sm flex items-start justify-between gap-3"
      style={{ background: "linear-gradient(135deg, #f5efe8 0%, #ebe0d5 50%, #e2d5c4 100%)" }}
    >
      <div className="min-w-0">
        <h1 className="font-display text-xl sm:text-2xl tracking-[0.18em] uppercase text-black">
          Style Report
        </h1>
        {generatedAt && (
          <p className="text-[10px] sm:text-xs italic text-neutral-700 mt-1" suppressHydrationWarning>{generatedAt}</p>
        )}
      </div>
      {bannerRightAction}
    </div>
  );

  if (noReportYet || !hasReport) {
    return (
      <div className="space-y-6">
        {titleCard()}
        <div className="rounded-soft-xl border border-border bg-card p-6 text-center space-y-4">
          <p className="text-sm text-neutral-600">
            Generate a style report from your diary looks to see insights and recommendations.
          </p>
          {generateError && <p className="text-sm text-red-600">{generateError}</p>}
        </div>
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
  const useCards =
    (Number(report.version) === 2 || report.version === 2) &&
    Array.isArray(report.cards) &&
    report.cards.length > 0;

  return (
    <div className="space-y-6">
      {titleCard(generatedAt)}

      {useCards ? (
        <div className="flex flex-col gap-6 overflow-y-auto">
          {report.cards!.map((card, i) => (
            <ReportCardBlock key={card.id} card={card} index={i} />
          ))}
        </div>
      ) : (
        <>
          {(Number(report.version) === 1 || (Number(report.version) === 2 && !report.cards?.length)) && (
            <p className="text-sm text-neutral-500 rounded-soft-lg bg-neutral-50 border border-border px-3 py-2">
              Regenerate to see your style report as cards (Style Identity, Style DNA, Colour Analysis, and more).
            </p>
          )}
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
        </>
      )}

    </div>
  );
}
