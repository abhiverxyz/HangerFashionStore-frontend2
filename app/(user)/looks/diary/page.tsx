"use client";

import { useRef, useCallback, useState } from "react";
import useSWR from "swr";
import { listLooks, analyzeLookWithFile } from "@/lib/api/looks";
import { addFromLook } from "@/lib/api/wardrobe";
import { DiarySection } from "@/components/looks/DiarySection";

function createOptimisticLook(file: File, tempId: string): {
  id: string;
  userId: string | null;
  lookData: string;
  imageUrl: string | null;
  vibe: string | null;
  occasion: string | null;
  createdAt: string;
  updatedAt: string;
} {
  const now = new Date().toISOString();
  return {
    id: tempId,
    userId: null,
    lookData: JSON.stringify({ status: "analyzing", comment: "Adding…" }),
    imageUrl: URL.createObjectURL(file),
    vibe: null,
    occasion: null,
    createdAt: now,
    updatedAt: now,
  };
}

export default function LooksDiaryPage() {
  const addLookInputRef = useRef<HTMLInputElement>(null);
  const { mutate: mutateLooks } = useSWR("looks-list", () => listLooks({ limit: 100, offset: 0 }));
  const { mutate: mutateWardrobe } = useSWR("wardrobe", () => Promise.resolve(null));
  const [addingWardrobeLookId, setAddingWardrobeLookId] = useState<string | null>(null);
  const [addToWardrobeMessage, setAddToWardrobeMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [addingLook, setAddingLook] = useState(false);
  const [addLookError, setAddLookError] = useState<string | null>(null);

  const handleAddLookFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return;
      const accepted = Array.from(files).filter((f) =>
        f.type.startsWith("image/") && ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(f.type)
      );
      if (accepted.length === 0) {
        setAddLookError("Please choose an image (JPEG, PNG, WebP or GIF).");
        return;
      }
      setAddLookError(null);
      setAddingLook(true);

      const tempIds = accepted.map((_, i) => `temp-${Date.now()}-${i}`);
      const optimisticLooks = accepted.map((file, i) => createOptimisticLook(file, tempIds[i]));
      mutateLooks(
        (prev) => {
          const items = prev?.items ?? [];
          const total = prev?.total ?? 0;
          return { items: [...optimisticLooks, ...items], total: total + optimisticLooks.length };
        },
        { revalidate: false }
      );

      const results = await Promise.allSettled(accepted.map((file) => analyzeLookWithFile(file)));
      const failed = results.filter((r) => r.status === "rejected");
      if (failed.length > 0) {
        const msg = (failed[0] as PromiseRejectedResult).reason?.message ?? "Failed to add look";
        setAddLookError(msg === "Request failed" ? "Sign in to add looks, or try again." : msg);
      }
      await mutateLooks();
      optimisticLooks.forEach((look) => {
        if (look.imageUrl && look.imageUrl.startsWith("blob:")) {
          URL.revokeObjectURL(look.imageUrl);
        }
      });
      setTimeout(() => mutateLooks(), 6000);
      setAddingLook(false);
    },
    [mutateLooks]
  );

  const handleAddToWardrobe = useCallback(
    async (lookId: string) => {
      setAddingWardrobeLookId(lookId);
      setAddToWardrobeMessage(null);
      try {
        await addFromLook({ lookId });
        mutateWardrobe();
        setAddToWardrobeMessage({ type: "success", text: "Added to wardrobe. We're extracting items." });
        setTimeout(() => setAddToWardrobeMessage(null), 4000);
      } catch (e) {
        setAddToWardrobeMessage({
          type: "error",
          text: e instanceof Error ? e.message : "Failed to add to wardrobe",
        });
      } finally {
        setAddingWardrobeLookId(null);
      }
    },
    [mutateWardrobe]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-end gap-2">
        <input
          ref={addLookInputRef}
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          aria-hidden
          onChange={(e) => {
            handleAddLookFiles(e.target.files ?? null);
            e.target.value = "";
          }}
        />
        <button
          type="button"
          onClick={() => addLookInputRef.current?.click()}
          disabled={addingLook}
          className="inline-flex items-center gap-2 rounded-full border-2 border-violet-200 bg-violet-100 px-4 py-2.5 text-sm font-medium text-violet-800 hover:bg-violet-200 transition-colors disabled:opacity-70"
          aria-label="Add a look"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M12 5v14M5 12h14" />
          </svg>
          {addingLook ? "Adding…" : "Add a look"}
        </button>
        {addLookError && (
          <p className="text-sm text-red-600" role="alert">
            {addLookError}
          </p>
        )}
        {addToWardrobeMessage && (
          <p
            className={`text-sm ${addToWardrobeMessage.type === "success" ? "text-green-700" : "text-red-600"}`}
            role="alert"
          >
            {addToWardrobeMessage.text}
          </p>
        )}
      </div>
      <DiarySection
        onAddToWardrobe={handleAddToWardrobe}
        addingWardrobeLookId={addingWardrobeLookId}
      />
    </div>
  );
}
