"use client";

import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

const PLACEHOLDERS: Record<SearchBarVariant, string> = {
  find: "Find by mood, category, trend or anything",
  store: "Find microstores by trend, vibe or anything",
  brands: "Discover brands you love by mood, style or anything",
};

export type SearchBarVariant = "find" | "store" | "brands";

export interface SearchBarProps {
  variant: SearchBarVariant;
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  imageUrl?: string | null;
  onImageAttach?: (file: File) => void | Promise<void>;
  onImageClear?: () => void;
  disabled?: boolean;
  "aria-label"?: string;
  /** Override placeholder; defaults to variant placeholder */
  placeholder?: string;
}

function ImageIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
      <circle cx="9" cy="9" r="2" />
      <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
    </svg>
  );
}

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden
    >
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

export function SearchBar({
  variant,
  value,
  onChange,
  onSubmit,
  imageUrl,
  onImageAttach,
  onImageClear,
  disabled = false,
  "aria-label": ariaLabel,
  placeholder: placeholderProp,
}: SearchBarProps) {
  const accessToken = useStorageAccessToken();
  const placeholder = placeholderProp ?? PLACEHOLDERS[variant];
  const hasImage = Boolean(imageUrl?.trim());
  const displayImageUrl = imageUrl ? getImageDisplayUrl(imageUrl, accessToken) : "";
  const inputId = "search-bar-input";

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onSubmit();
    }
  };

  const handleImageClick = () => {
    if (hasImage && onImageClear) {
      onImageClear();
      return;
    }
    document.getElementById("search-bar-file-input")?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith("image/") && onImageAttach) {
      void Promise.resolve(onImageAttach(file));
    }
    e.target.value = "";
  };

  return (
    <div className="flex flex-col gap-2">
      <div
        className="flex items-center gap-2 rounded-soft-xl border border-border bg-card shadow-soft focus-within:ring-2 focus-within:ring-primary focus-within:border-primary transition-shadow"
        role="search"
      >
        {onImageAttach != null && (
          <>
            <input
              id="search-bar-file-input"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleFileChange}
              aria-hidden
            />
            <button
              type="button"
              onClick={handleImageClick}
              disabled={disabled}
              className={`flex-shrink-0 p-2.5 rounded-l-soft-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary ${
                hasImage
                  ? "text-primary bg-primary/10 hover:bg-primary/20"
                  : "text-neutral-500 hover:text-foreground hover:bg-neutral-100"
              }`}
              aria-label={hasImage ? "Remove image" : "Attach image"}
              title={hasImage ? "Remove image" : "Attach image"}
            >
              <ImageIcon className="w-5 h-5" />
            </button>
          </>
        )}
        <label htmlFor={inputId} className="sr-only">
          {ariaLabel ?? "Search"}
        </label>
        <input
          id={inputId}
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className={`flex-1 min-w-0 py-3 pr-2 text-foreground placeholder:text-neutral-500 bg-transparent border-0 focus:outline-none focus:ring-0 text-sm lg:text-base ${onImageAttach != null ? "pl-2" : "pl-4"}`}
          aria-label={ariaLabel ?? "Search"}
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={disabled}
          className="flex-shrink-0 p-2.5 text-primary hover:text-primary/90 focus:outline-none focus:ring-2 focus:ring-primary rounded-r-soft-xl border-0 bg-transparent"
          aria-label="Search"
        >
          <SearchIcon className="w-5 h-5" />
        </button>
      </div>
      {hasImage && imageUrl && (
        <div className="flex items-center gap-2">
          {displayImageUrl ? (
            <img
              src={displayImageUrl}
              alt="Search by image"
              className="h-12 w-12 object-cover rounded-soft-lg border border-border"
            />
          ) : (
            <div className="h-12 w-12 rounded-soft-lg border border-border bg-neutral-100 flex items-center justify-center" aria-hidden>
              <ImageIcon className="w-6 h-6 text-neutral-400" />
            </div>
          )}
          <span className="text-xs text-neutral-500">Search will use this image</span>
          {onImageClear && (
            <button
              type="button"
              onClick={onImageClear}
              className="text-xs text-neutral-600 hover:text-foreground underline"
            >
              Remove
            </button>
          )}
        </div>
      )}
    </div>
  );
}
