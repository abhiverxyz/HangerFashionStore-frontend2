"use client";

/**
 * Renders a style note card exactly as on the microstore page.
 * - Text only: background covers full card, text center and middle aligned.
 * - Image + text: image fills card, text at bottom.
 */
export type StyleNoteCardItem = {
  title: string;
  description?: string;
  url?: string;
  imageUrl?: string;
  backgroundColor?: string;
  fontStyle?: string;
};

const CARD_WIDTH = 256; // w-64
const ASPECT_RATIO = 3 / 4;

function TitleOrLink({ item, wide }: { item: StyleNoteCardItem; wide?: boolean }) {
  const text = item.title || "—";
  const titleClass = "font-medium text-base text-white";
  if (item.url) {
    return (
      <a href={item.url} target="_blank" rel="noopener noreferrer" className={`${titleClass} hover:underline line-clamp-2`}>
        {text}
      </a>
    );
  }
  return <span className={`${titleClass} line-clamp-2`}>{text}</span>;
}

export function StyleNoteCard({
  item,
  className = "",
  resolveImageUrl,
  compact,
  wide,
}: {
  item: StyleNoteCardItem;
  className?: string;
  /** If imageUrl is relative (e.g. /api/storage/...), prefix with API base for img src */
  resolveImageUrl?: (url: string) => string;
  /** If true, use smaller width for wizard preview grid */
  compact?: boolean;
  /** If true, on desktop (md+) use 3x width and larger font */
  wide?: boolean;
}) {
  const imageUrl = item.imageUrl ? (resolveImageUrl ? resolveImageUrl(item.imageUrl) : item.imageUrl) : null;
  const bg = item.backgroundColor ?? "#f5f5f5";
  const color = item.fontStyle ?? "#1a1a1a";
  const widthClass = compact ? "" : wide ? "w-64 md:w-[768px]" : "";
  const w = compact ? undefined : wide ? undefined : CARD_WIDTH;

  return (
    <div
      data-style-note-card
      className={`shrink-0 rounded-soft-lg border border-border overflow-hidden flex flex-col ${widthClass} ${className}`}
      style={{ width: w, backgroundColor: imageUrl ? undefined : bg }}
    >
      {imageUrl ? (
        <div className="relative w-full" style={{ aspectRatio: ASPECT_RATIO }}>
          <img src={imageUrl} alt={item.title} className="w-full h-full object-cover" />
          <div className="absolute inset-x-0 bottom-0 p-3 md:p-4 bg-gradient-to-t from-black/75 to-transparent flex flex-col justify-end gap-2">
            <TitleOrLink item={item} wide={wide} />
            {item.description && item.description !== item.title && (
              <p className="text-sm text-white/90 line-clamp-2">{item.description}</p>
            )}
          </div>
        </div>
      ) : (
        <div
          className="w-full flex items-center justify-center text-center p-4 md:p-6"
          style={{ aspectRatio: ASPECT_RATIO, backgroundColor: bg, color }}
        >
          <div className="flex flex-col items-center justify-center gap-2">
            {item.url ? (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="font-medium text-base hover:underline" style={{ color }}>
                {item.title || "—"}
              </a>
            ) : (
              <span className="font-medium text-base">{item.title || "—"}</span>
            )}
            {item.description && <p className="text-sm opacity-90 line-clamp-3">{item.description}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
