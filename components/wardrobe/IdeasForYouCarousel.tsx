"use client";

import type { IdeaForYou } from "@/lib/api/microstores";

/** Lighter gradient presets for idea cards (aligned with backend IDEA_GRADIENT_IDS). */
const GRADIENT_STYLES: Record<string, string> = {
  coral: "linear-gradient(135deg, #f5c4b8 0%, #edb5a4 50%, #e8a898 100%)",
  navy: "linear-gradient(135deg, #7b9bb8 0%, #8aa9c4 50%, #7a9ab5 100%)",
  mint: "linear-gradient(135deg, #b8ddcc 0%, #a5d4be 50%, #9accb4 100%)",
  blush: "linear-gradient(135deg, #f9d4b8 0%, #f5c9a8 50%, #f0bd98 100%)",
  sage: "linear-gradient(135deg, #8cc9c2 0%, #7abeb5 50%, #6eb5ac 100%)",
  berry: "linear-gradient(135deg, #d4b8f0 0%, #c4a5e8 50%, #b894e0 100%)",
};

function getGradient(gradientId: string): string {
  return GRADIENT_STYLES[gradientId] ?? GRADIENT_STYLES.coral;
}

const CARD_MIN_HEIGHT = 220;

export function IdeasForYouCarousel({ ideas }: { ideas: IdeaForYou[] }) {
  if (!ideas?.length) return null;

  return (
    <div className="w-full">
      {/* Mobile: horizontal carousel; Desktop: 3-column grid */}
      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-2 -mx-4 px-4 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:gap-5 lg:overflow-visible lg:snap-none">
        {ideas.map((idea, i) => (
          <div
            key={`${idea.title}-${i}`}
            className="flex-shrink-0 w-[51vw] min-w-[168px] max-w-[240px] snap-center rounded-soft-xl overflow-hidden shadow-md lg:w-auto lg:min-w-0 lg:max-w-none"
            style={{
              background: getGradient(idea.gradientId),
              minHeight: CARD_MIN_HEIGHT,
            }}
          >
            <div
              className="p-5 sm:p-6 h-full flex flex-col justify-center text-gray-800"
              style={{ minHeight: CARD_MIN_HEIGHT }}
            >
              <h4 className="font-semibold text-base sm:text-lg leading-tight mb-2 drop-shadow-sm">
                {idea.title}
              </h4>
              <p className="text-xs sm:text-sm text-gray-700 leading-snug line-clamp-3">
                {idea.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
