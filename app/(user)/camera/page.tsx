"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLiveStylingCamera } from "@/hooks/useLiveStylingCamera";
import { analyzeLookWithFile } from "@/lib/api/looks";
import { submitHowDoILook } from "@/lib/api/getReady";
import { addFromLook } from "@/lib/api/wardrobe";

type Step = "camera" | "preview";

export default function CameraPage() {
  const router = useRouter();
  const { videoRef, stream, startCamera, stopCamera, captureSingle, error: cameraError } = useLiveStylingCamera();

  const [step, setStep] = useState<Step>("camera");
  const [capturedPhoto, setCapturedPhoto] = useState<File | null>(null);
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null);

  const [addLookLoading, setAddLookLoading] = useState(false);
  const [addLookSuccess, setAddLookSuccess] = useState(false);
  const [howDoILookLoading, setHowDoILookLoading] = useState(false);
  const [howDoILookResponse, setHowDoILookResponse] = useState<string | null>(null);
  const [howDoILookModalOpen, setHowDoILookModalOpen] = useState(false);
  const [wardrobeAdding, setWardrobeAdding] = useState(false);
  const [wardrobeAdded, setWardrobeAdded] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    return () => {
      if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    };
  }, [capturedPreviewUrl]);

  const handleTakePhoto = useCallback(async () => {
    const { file, error } = await captureSingle();
    if (error || !file) {
      setActionError(error ?? "Could not capture photo");
      return;
    }
    setActionError(null);
    setCapturedPhoto(file);
    const url = URL.createObjectURL(file);
    setCapturedPreviewUrl(url);
    setStep("preview");
  }, [captureSingle]);

  const handleStartLiveSession = useCallback(() => {
    stopCamera();
    router.push("/get-ready/live");
  }, [stopCamera, router]);

  const handleRetake = useCallback(() => {
    if (capturedPreviewUrl) URL.revokeObjectURL(capturedPreviewUrl);
    setCapturedPhoto(null);
    setCapturedPreviewUrl(null);
    setStep("camera");
    setAddLookSuccess(false);
    setHowDoILookResponse(null);
    setHowDoILookModalOpen(false);
    setWardrobeAdded(false);
    setActionError(null);
  }, [capturedPreviewUrl]);

  const handleAddLook = useCallback(async () => {
    if (!capturedPhoto) return;
    setActionError(null);
    setAddLookLoading(true);
    try {
      await analyzeLookWithFile(capturedPhoto);
      setAddLookSuccess(true);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to add look");
    } finally {
      setAddLookLoading(false);
    }
  }, [capturedPhoto]);

  const handleHowDoILook = useCallback(async () => {
    if (!capturedPhoto) return;
    setActionError(null);
    setHowDoILookLoading(true);
    setHowDoILookResponse(null);
    try {
      const res = await analyzeLookWithFile(capturedPhoto);
      const imageUrl = res.look?.imageUrl ?? undefined;
      const result = await submitHowDoILook({ imageUrl });
      setHowDoILookResponse(result.response);
      setHowDoILookModalOpen(true);
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setHowDoILookLoading(false);
    }
  }, [capturedPhoto]);

  const handleAddToWardrobe = useCallback(async () => {
    if (!capturedPhoto) return;
    setActionError(null);
    setWardrobeAdding(true);
    setWardrobeAdded(false);
    try {
      const res = await analyzeLookWithFile(capturedPhoto);
      if (res.lookId) {
        await addFromLook({ lookId: res.lookId, imageUrl: res.look?.imageUrl ?? undefined });
        setWardrobeAdded(true);
      } else {
        setActionError("Could not create look for wardrobe");
      }
    } catch (e) {
      setActionError(e instanceof Error ? e.message : "Failed to add to wardrobe");
    } finally {
      setWardrobeAdding(false);
    }
  }, [capturedPhoto]);

  if (step === "preview" && capturedPreviewUrl) {
    return (
      <div className="flex flex-col max-w-lg mx-auto">
        <div className="rounded-soft-xl border border-border overflow-hidden bg-card shadow-soft">
          <div className="aspect-[3/4] relative bg-neutral-900">
            <img
              src={capturedPreviewUrl}
              alt="Captured"
              className="w-full h-full object-cover object-top"
            />
          </div>
          <div className="p-4 space-y-3 border-t border-border">
            <p className="font-display text-sm text-foreground">What would you like to do?</p>
            {actionError && (
              <p className="text-sm text-red-600" role="alert">{actionError}</p>
            )}
            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={handleAddLook}
                disabled={addLookLoading || addLookSuccess}
                className="rounded-full border border-border bg-card py-2.5 px-4 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-60"
              >
                {addLookLoading ? "Adding…" : addLookSuccess ? "Added to diary" : "Add a look"}
              </button>
              <button
                type="button"
                onClick={handleHowDoILook}
                disabled={howDoILookLoading}
                className="rounded-full border border-border bg-card py-2.5 px-4 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-60"
              >
                {howDoILookLoading ? "Asking…" : "How do I look?"}
              </button>
              <button
                type="button"
                onClick={handleAddToWardrobe}
                disabled={wardrobeAdding || wardrobeAdded}
                className="rounded-full border border-border bg-card py-2.5 px-4 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-60"
              >
                {wardrobeAdding ? "Adding…" : wardrobeAdded ? "Added to wardrobe" : "Add to wardrobe"}
              </button>
              {wardrobeAdded && (
                <Link
                  href="/wardrobe"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  View in Wardrobe →
                </Link>
              )}
              <button
                type="button"
                onClick={handleRetake}
                className="rounded-full py-2.5 px-4 text-sm font-medium text-neutral-600 hover:text-foreground"
              >
                Retake photo
              </button>
            </div>
            {addLookSuccess && (
              <Link
                href="/looks/diary"
                className="inline-block text-sm font-medium text-primary hover:underline"
              >
                View in Fashion Diary →
              </Link>
            )}
          </div>
        </div>

        {howDoILookModalOpen && howDoILookResponse && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            role="dialog"
            aria-modal="true"
          >
            <div className="bg-card border border-border rounded-soft-xl shadow-soft max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-display text-lg text-foreground">How do I look?</h2>
                <button
                  type="button"
                  onClick={() => setHowDoILookModalOpen(false)}
                  className="p-2 rounded-full hover:bg-neutral-100 text-neutral-600"
                  aria-label="Close"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-y-auto">
                <p className="text-sm text-foreground whitespace-pre-wrap">{howDoILookResponse}</p>
              </div>
              <div className="p-4 border-t border-border">
                <Link
                  href="/looks/diary"
                  className="inline-block text-sm font-medium text-primary hover:underline"
                >
                  View in Fashion Diary →
                </Link>
              </div>
            </div>
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="flex flex-col max-w-lg mx-auto">
      <div className="rounded-soft-xl border border-border overflow-hidden bg-card shadow-soft">
        <div className="aspect-[4/3] relative bg-neutral-900">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
            style={{ transform: "scaleX(-1)" }}
          />
          {cameraError && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 bg-neutral-900/90 text-white text-center">
              <p className="text-sm font-medium">Camera access needed</p>
              <p className="text-xs mt-1 text-neutral-300">{cameraError}</p>
              <p className="text-xs mt-2">Allow camera in your browser to take a photo or start a live styling session.</p>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-border flex flex-col gap-3">
          <p className="font-display text-sm text-foreground">Take a photo or start a live styling session.</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              type="button"
              onClick={handleTakePhoto}
              disabled={!!cameraError || !stream}
              className="flex-1 rounded-full bg-gradient-to-r from-pink-600 to-purple-600 text-white py-2.5 px-4 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              Take a photo
            </button>
            <button
              type="button"
              onClick={handleStartLiveSession}
              disabled={!!cameraError}
              className="flex-1 rounded-full border border-border bg-card py-2.5 px-4 text-sm font-medium text-foreground hover:bg-neutral-50 disabled:opacity-50"
            >
              Start live styling session
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
