"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  getVibeOptions,
  getMoodOptions,
  getOutfitSuggestions,
  getStyleTips,
  submitHowDoILook,
  type LookSummary,
  type WardrobeItem,
  type StyleTipsResponse,
} from "@/lib/api/getReady";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";

const GET_READY_STEPS = ["vibe", "mood", "outfit", "style", "howDoILook"] as const;
type GetReadyStepId = (typeof GET_READY_STEPS)[number];

const GET_READY_STORAGE_KEY = "get-ready-step";

/** Pre-filled occasion pills (merged with API options) */
const DEFAULT_OCCASION_PILLS = [
  "Office presentation",
  "Brunch day",
  "Date night",
  "Weekend casual",
  "Travel",
  "Interview",
  "Gym",
  "Party",
  "Meeting",
  "Dinner out",
  "Coffee catch-up",
  "Wedding guest",
];

/** Default mood emojis (merged with API options) */
const DEFAULT_MOOD_EMOJIS = ["😊", "😌", "😎", "🌟", "💪", "🎉", "🤔", "😴", "✨", "🌸", "🔥", "💫"];

function StepIcon({ stepId }: { stepId: GetReadyStepId }) {
  const className = "w-6 h-6 md:w-7 md:h-7";
  switch (stepId) {
    case "vibe":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="5" />
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </svg>
      );
    case "mood":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <circle cx="12" cy="12" r="10" />
          <path d="M8 14s1.5 2 4 2 4-2 4-2" />
          <line x1="9" y1="9" x2="9.01" y2="9" />
          <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
      );
    case "outfit":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
        </svg>
      );
    case "style":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <path d="M12 3L3 8v1h18V8L12 3z" />
          <line x1="3" y1="9" x2="21" y2="9" />
        </svg>
      );
    case "howDoILook":
      return (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
          <ellipse cx="12" cy="10" rx="7" ry="6" />
          <path d="M12 16v4M9 20h6" />
        </svg>
      );
    default:
      return null;
  }
}

function stepLabel(s: GetReadyStepId): string {
  return s === "howDoILook" ? "How do I look?" : s.charAt(0).toUpperCase() + s.slice(1);
}

export function GetReadySection() {
  const [step, setStep] = useState<GetReadyStepId>("vibe");
  useEffect(() => {
    const s = sessionStorage.getItem(GET_READY_STORAGE_KEY);
    if (GET_READY_STEPS.includes(s as GetReadyStepId)) setStep(s as GetReadyStepId);
  }, []);
  useEffect(() => {
    sessionStorage.setItem(GET_READY_STORAGE_KEY, step);
  }, [step]);
  const [vibe, setVibe] = useState<string>("");
  const [mood, setMood] = useState<string>("");
  const [outfitId, setOutfitId] = useState<string>("");
  const [inputText, setInputText] = useState("");
  const [inputImage, setInputImage] = useState<File | null>(null);
  const [inputImagePreview, setInputImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [vibeOptions, setVibeOptions] = useState<string[]>([]);
  const [vibeOptionsLoading, setVibeOptionsLoading] = useState(true);
  const [moodEmojis, setMoodEmojis] = useState<string[]>([]);
  const [outfitSuggestions, setOutfitSuggestions] = useState<{ suggestedLooks: LookSummary[]; fromWardrobe: WardrobeItem[] } | null>(null);
  const [outfitLoading, setOutfitLoading] = useState(false);
  const [styleTipsData, setStyleTipsData] = useState<StyleTipsResponse | null>(null);
  const [styleTipsLoading, setStyleTipsLoading] = useState(false);
  const [howDoILookResponse, setHowDoILookResponse] = useState<string | null>(null);

  const storageToken = useStorageAccessToken();

  const timeOfDay = (() => {
    const h = new Date().getHours();
    if (h < 12) return "morning";
    if (h < 17) return "afternoon";
    return "evening";
  })();

  useEffect(() => {
    let cancelled = false;
    getVibeOptions({ timeOfDay })
      .then((r) => {
        if (cancelled) return;
        const fromApi = r.options ?? [];
        const combined = [...DEFAULT_OCCASION_PILLS];
        const seen = new Set(DEFAULT_OCCASION_PILLS.map((x) => x.toLowerCase()));
        fromApi.forEach((opt) => {
          const key = String(opt).trim().toLowerCase();
          if (key && !seen.has(key)) {
            seen.add(key);
            combined.push(String(opt).trim());
          }
        });
        setVibeOptions(combined);
      })
      .catch(() => { if (!cancelled) setVibeOptions(DEFAULT_OCCASION_PILLS); })
      .finally(() => { if (!cancelled) setVibeOptionsLoading(false); });
    return () => { cancelled = true; };
  }, [timeOfDay]);

  useEffect(() => {
    getMoodOptions()
      .then((r) => {
        const fromApi = r.emojis ?? [];
        const combined = [...DEFAULT_MOOD_EMOJIS];
        const seen = new Set(DEFAULT_MOOD_EMOJIS);
        fromApi.forEach((e) => {
          const s = String(e).trim();
          if (s && !seen.has(s)) {
            seen.add(s);
            combined.push(s);
          }
        });
        setMoodEmojis(combined);
      })
      .catch(() => setMoodEmojis(DEFAULT_MOOD_EMOJIS));
  }, []);

  useEffect(() => {
    if (step !== "outfit") return;
    let cancelled = false;
    setOutfitLoading(true);
    getOutfitSuggestions({
      vibe: vibe?.trim() || undefined,
      mood: mood?.trim() || undefined,
      limit: 12,
    })
      .then((data) => {
        if (!cancelled) setOutfitSuggestions(data);
      })
      .catch(() => {
        if (!cancelled) setOutfitSuggestions(null);
      })
      .finally(() => {
        if (!cancelled) setOutfitLoading(false);
      });
    return () => { cancelled = true; };
  }, [step, vibe, mood]);

  useEffect(() => {
    if (step !== "style") return;
    setStyleTipsLoading(true);
    getStyleTips({ vibe: vibe || undefined, mood: mood || undefined, outfitId: outfitId || undefined })
      .then(setStyleTipsData)
      .catch(() => setStyleTipsData(null))
      .finally(() => setStyleTipsLoading(false));
  }, [step, vibe, mood, outfitId]);

  const handleSubmitInput = useCallback(async () => {
    const text = inputText.trim();
    setError(null);
    if (step === "howDoILook") {
      if (!text && !inputImage) return;
      setLoading(true);
      setHowDoILookResponse(null);
      try {
        let imageUrl: string | undefined;
        if (inputImage) {
          const { analyzeLookWithFile } = await import("@/lib/api/looks");
          const res = await analyzeLookWithFile(inputImage);
          imageUrl = res.look?.imageUrl ?? undefined;
        }
        const result = await submitHowDoILook({ text: text || undefined, imageUrl, vibe: vibe || undefined });
        setHowDoILookResponse(result.response);
        setInputText("");
        setInputImage(null);
        setInputImagePreview(null);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Something went wrong");
      } finally {
        setLoading(false);
      }
      return;
    }
    // Vibe: Send (text or image) -> set vibe and go to mood
    if (step === "vibe" && (text || inputImage)) {
      if (text) setVibe(text);
      setStep("mood");
      setInputText("");
      setInputImage(null);
      setInputImagePreview(null);
      return;
    }
    // Mood: Send (text or image) -> set mood and go to outfit
    if (step === "mood" && (text || inputImage)) {
      if (text) setMood(text);
      setStep("outfit");
      setInputText("");
      setInputImage(null);
      setInputImagePreview(null);
      return;
    }
    // Outfit: Send (text or image) -> fetch more suggestions
    if (step === "outfit" && (text || inputImage)) {
      setOutfitLoading(true);
      getOutfitSuggestions({
        vibe: vibe?.trim() || undefined,
        mood: mood?.trim() || undefined,
        limit: 12,
        query: text || undefined,
      })
        .then((data) => setOutfitSuggestions(data))
        .catch(() => setOutfitSuggestions(null))
        .finally(() => setOutfitLoading(false));
      setInputText("");
      setInputImage(null);
      setInputImagePreview(null);
      return;
    }
  }, [step, inputText, inputImage, vibe, mood]);

  const handleImageAttach = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/")) {
      setInputImage(file);
      const reader = new FileReader();
      reader.onload = () => setInputImagePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }, []);

  return (
    <div className="flex-1 flex flex-row min-h-0">
      {/* LHS: narrow step tiles (icon + text), square with rounded edges */}
      <nav
        className="shrink-0 w-20 md:w-24 flex flex-col border-r border-border bg-neutral-50/50 overflow-hidden"
        aria-label="Get ready steps"
      >
        {GET_READY_STEPS.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStep(s)}
            className={`flex-1 min-h-0 flex flex-col items-center justify-center gap-1 p-2 rounded-none w-full transition-colors ${
              step === s
                ? "bg-gradient-to-b from-pink-100 to-fuchsia-100 text-foreground"
                : "bg-transparent text-foreground hover:bg-neutral-100/80"
            }`}
          >
            <StepIcon stepId={s} />
            <span className="text-[10px] md:text-xs font-medium leading-tight text-center line-clamp-2">
              {stepLabel(s)}
            </span>
          </button>
        ))}
      </nav>

      {/* RHS: main content + integrated input bar */}
      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {step === "vibe" && (
            <>
              <h3 className="font-display text-lg text-foreground mb-3">What are you dressing for?</h3>
              {vibeOptionsLoading ? (
                <p className="text-neutral-500 text-sm">Loading options…</p>
              ) : (
                <div className="flex flex-wrap gap-x-2 gap-y-3">
                  {vibeOptions.map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => { setVibe(opt); setStep("mood"); }}
                      className={`rounded-full px-2.5 py-1 text-xs transition-colors ${
                        vibe === opt
                          ? "bg-stone-200/80 text-foreground"
                          : "bg-stone-100/70 text-foreground hover:bg-stone-200/60"
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
          {step === "mood" && (
            <>
              <h3 className="font-display text-lg text-foreground mb-3">How are you feeling?</h3>
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                {moodEmojis.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => { setMood(emoji); setStep("outfit"); }}
                    className={`w-12 h-12 rounded-full flex items-center justify-center text-2xl transition-colors ${
                      mood === emoji ? "bg-stone-200/80" : "bg-stone-100/70 hover:bg-stone-200/60"
                    }`}
                    aria-label={`Mood ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </>
          )}
          {step === "outfit" && (
            <>
              <h3 className="font-display text-lg text-foreground mb-3">Pick an outfit</h3>
              {outfitLoading ? (
                <p className="text-neutral-500 text-sm">Loading suggestions…</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Suggested outfits</p>
                    <p className="text-xs text-neutral-500 mb-2">Apparel from the catalog based on your vibe and profile.</p>
                    <div className="flex overflow-x-auto gap-3 pb-2 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
                      {(outfitSuggestions?.suggestedLooks ?? []).length > 0 ? (outfitSuggestions?.suggestedLooks ?? []).map((look) => (
                        <button
                          key={look.id}
                          type="button"
                          onClick={() => { setOutfitId(look.id); setStep("style"); }}
                          className="shrink-0 w-36 min-w-[140px] snap-center rounded-soft-lg border border-border overflow-hidden text-left hover:border-primary transition-colors"
                        >
                          {getImageDisplayUrl(look.imageUrl, storageToken) ? (
                            <div className="aspect-[3/4] bg-neutral-100">
                              <img src={getImageDisplayUrl(look.imageUrl, storageToken)} alt="" className="w-full h-full object-cover" />
                            </div>
                          ) : (
                            <div className="aspect-[3/4] bg-muted flex items-center justify-center text-neutral-400 text-sm">Look</div>
                          )}
                          <p className="p-2 text-xs font-medium text-foreground line-clamp-1">{look.title}</p>
                        </button>
                      )) : (
                        <p className="text-sm text-neutral-500 py-2">No suggested outfits right now. Try selecting a vibe and mood above.</p>
                      )}
                    </div>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">From wardrobe</p>
                    <p className="text-xs text-neutral-500 mb-2">Items from your wardrobe, style report, and looks.</p>
                  {(outfitSuggestions?.fromWardrobe?.length ?? 0) > 0 ? (
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {(outfitSuggestions?.fromWardrobe ?? []).slice(0, 8).map((item) => (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => { setOutfitId(item.id); setStep("style"); }}
                            className="rounded-soft-lg border border-border overflow-hidden text-left hover:border-primary transition-colors"
                          >
                            {getImageDisplayUrl(item.imageUrl, storageToken) ? (
                              <div className="aspect-square bg-neutral-100">
                                <img src={getImageDisplayUrl(item.imageUrl, storageToken)} alt="" className="w-full h-full object-cover" />
                              </div>
                            ) : (
                              <div className="aspect-square bg-muted flex items-center justify-center text-neutral-400 text-sm">Item</div>
                            )}
                            <p className="p-1.5 text-xs text-foreground line-clamp-1">{item.title}</p>
                          </button>
                        ))}
                      </div>
                  ) : (
                    <p className="text-sm text-neutral-500 py-2">No wardrobe items yet. Add looks to build your style report.</p>
                  )}
                  </div>
                  <div className="pt-3">
                    <button
                      type="button"
                      onClick={() => setStep("style")}
                      className="text-sm text-neutral-500 hover:text-foreground underline"
                    >
                      Skip to style tips →
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
          {step === "style" && (
            <>
              <h3 className="font-display text-lg text-foreground mb-3">Styling ideas</h3>
              {styleTipsLoading ? (
                <p className="text-neutral-500 text-sm">Loading tips…</p>
              ) : (
                <div className="space-y-4">
                  {styleTipsData?.suggestedProductsOrLooks?.length ? (
                    <div>
                      <p className="text-sm font-medium text-foreground mb-2">What to pair with:</p>
                      <div className="flex flex-wrap gap-2">
                        {styleTipsData.suggestedProductsOrLooks.slice(0, 8).map((item) => (
                          <div key={item.id} className="rounded-soft-lg border border-border p-2 text-xs text-foreground max-w-[140px]">
                            {getImageDisplayUrl(item.imageUrl, storageToken) && <img src={getImageDisplayUrl(item.imageUrl, storageToken)!} alt="" className="w-full aspect-square object-cover rounded-soft mb-1" />}
                            <p className="line-clamp-2">{item.title ?? "Item"}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                  <div>
                    <p className="text-sm font-medium text-foreground mb-2">Style Tips:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm text-foreground">
                      {(styleTipsData?.tips ?? []).map((tip, i) => (
                        <li key={i}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
          {step === "howDoILook" && (
            <>
              <h3 className="font-display text-lg text-foreground mb-2">How do I look?</h3>
              <p className="text-sm text-neutral-600 mb-3">Upload a picture of your look. We’ll give you encouraging, honest feedback.</p>
              {howDoILookResponse && (
                <>
                  <div className="rounded-soft-lg bg-muted/50 border border-border p-4 text-sm text-foreground whitespace-pre-wrap">
                    {howDoILookResponse}
                  </div>
                  <Link
                    href="/looks/diary"
                    className="inline-block mt-2 text-sm font-medium text-primary hover:underline"
                  >
                    View in Fashion Diary →
                  </Link>
                </>
              )}
            </>
          )}
        </div>

        {error && <div className="shrink-0 px-4 pb-2"><p className="text-sm text-red-600" role="alert">{error}</p></div>}

        {/* Single integrated bar: text + image attach + send; Next on its own row on mobile so it's always visible */}
        <div className="shrink-0 p-3 md:p-4 border-t border-border bg-card space-y-2">
          <div className="flex items-end gap-0 rounded-soft-xl border border-border bg-neutral-50 focus-within:ring-2 focus-within:ring-primary focus-within:border-primary min-w-0">
            {inputImagePreview && (
              <div className="shrink-0 flex items-center p-1">
                <div className="relative w-12 h-12 rounded-soft-lg overflow-hidden border border-border">
                  <img src={inputImagePreview} alt="" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => { setInputImage(null); setInputImagePreview(null); }}
                    className="absolute inset-0 bg-black/50 text-white text-xs flex items-center justify-center hover:bg-black/70"
                    aria-label="Remove image"
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSubmitInput()}
              placeholder={
                step === "vibe" ? "Or type your occasion…" :
                step === "mood" ? "Or type how you feel…" :
                step === "outfit" ? "Describe what you want to see more of…" :
                step === "style" ? "Ask a follow-up…" :
                "Upload a picture for feedback"
              }
              className="flex-1 min-w-0 min-h-[2.5rem] py-2.5 px-3 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-neutral-400 disabled:opacity-50"
              disabled={loading}
            />
            <label className="shrink-0 flex items-center justify-center w-10 h-10 text-neutral-500 hover:text-foreground hover:bg-neutral-100 cursor-pointer disabled:opacity-50 transition-colors">
              <input type="file" accept="image/*" className="sr-only" onChange={handleImageAttach} />
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </label>
            <button
              type="button"
              onClick={handleSubmitInput}
              disabled={loading || (step === "howDoILook" && !inputText.trim() && !inputImage)}
              className="shrink-0 flex items-center justify-center w-10 h-10 text-primary-cta hover:bg-primary-cta/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              aria-label={loading ? "Sending…" : "Send"}
            >
              {loading ? (
                <span className="text-xs text-neutral-500">…</span>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                  <path d="M8 5v14l11-7L8 5z" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
