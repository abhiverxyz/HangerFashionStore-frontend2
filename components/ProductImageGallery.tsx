"use client";

import Image from "next/image";
import { IMAGE_BLUR_DATA_URL } from "@/lib/constants";

export interface ProductImageItem {
  id: string;
  src: string;
  alt: string | null;
}

export interface ProductImageGalleryProps {
  images: ProductImageItem[];
  imageIndex: number;
  onImageIndexChange: (index: number) => void;
  productTitle: string;
  /** Main image sizes attribute for Next/Image */
  sizes?: string;
  /** Set priority for above-the-fold hero (detail page, modal) */
  priority?: boolean;
  /** Optional className for the main image container */
  className?: string;
  /** If true, stop propagation on thumbnail/prev/next clicks (e.g. when inside modal) */
  stopPropagation?: boolean;
}

export function ProductImageGallery({
  images,
  imageIndex,
  onImageIndexChange,
  productTitle,
  sizes = "(max-width: 1024px) 100vw, 50vw",
  priority = false,
  className = "",
  stopPropagation = false,
}: ProductImageGalleryProps) {
  const mainImage = images[imageIndex];
  const handleClick = (e: React.MouseEvent, index?: number) => {
    if (stopPropagation) e.stopPropagation();
    if (index != null) onImageIndexChange(index);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="aspect-square w-full max-w-full bg-neutral-100 rounded-soft-xl overflow-hidden relative mx-auto">
        {mainImage ? (
          <>
            <Image
              key={mainImage.id}
              src={mainImage.src}
              alt={mainImage.alt || `${productTitle} ${imageIndex + 1}`}
              fill
              className="object-cover"
              sizes={sizes}
              priority={priority}
              placeholder="blur"
              blurDataURL={IMAGE_BLUR_DATA_URL}
            />
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="Previous image"
                  onClick={(e) => {
                    handleClick(e);
                    onImageIndexChange(imageIndex === 0 ? images.length - 1 : imageIndex - 1);
                  }}
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-neutral-100 text-foreground"
                >
                  <span className="text-lg leading-none">‹</span>
                </button>
                <button
                  type="button"
                  aria-label="Next image"
                  onClick={(e) => {
                    handleClick(e);
                    onImageIndexChange(imageIndex === images.length - 1 ? 0 : imageIndex + 1);
                  }}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/90 backdrop-blur-sm hover:bg-neutral-100 text-foreground"
                >
                  <span className="text-lg leading-none">›</span>
                </button>
                <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Image ${i + 1}`}
                      onClick={(e) => handleClick(e, i)}
                      className={`w-2 h-2 rounded-full transition-colors ${
                        i === imageIndex ? "bg-foreground" : "bg-neutral-300 hover:bg-neutral-400"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </>
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-neutral-400 text-sm">
            No image
          </span>
        )}
      </div>
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1 min-w-0">
          {images.map((im, i) => (
            <button
              key={im.id}
              type="button"
              onClick={(e) => handleClick(e, i)}
              className={`relative shrink-0 w-16 h-16 min-w-[4rem] rounded-soft-lg overflow-hidden border-2 transition-colors flex-shrink-0 ${
                i === imageIndex ? "border-foreground" : "border-border hover:border-neutral-400"
              }`}
            >
              <span className="absolute inset-0">
                <Image
                  src={im.src}
                  alt={im.alt || ""}
                  fill
                  className="object-cover"
                  sizes="64px"
                  placeholder="blur"
                  blurDataURL={IMAGE_BLUR_DATA_URL}
                />
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
