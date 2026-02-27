"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const BURST_COUNT = 6;
const BURST_INTERVAL_MS = 350;
const BEST_N = 3;
const MIN_BRIGHTNESS = 25;
const MAX_BRIGHTNESS = 240;
const SAMPLE_SIZE = 32;

/**
 * Approximate "sharpness" via variance of pixel differences (lower = blurrier).
 * Uses a downscaled canvas for speed.
 */
function sharpnessScore(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor((w * h) / (SAMPLE_SIZE * SAMPLE_SIZE)));
  for (let i = 0; i < data.length - 4; i += step * 4) {
    const g = data[i + 1];
    const next = data[Math.min(i + step * 4, data.length - 1) + 1];
    sum += Math.abs(g - next);
    count += 1;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Average luminance (0–255). Too low = dark, too high = washed out.
 */
function brightnessScore(ctx: CanvasRenderingContext2D, w: number, h: number): number {
  const imageData = ctx.getImageData(0, 0, w, h);
  const data = imageData.data;
  let sum = 0;
  let count = 0;
  const step = Math.max(1, Math.floor((data.length / 4) / (SAMPLE_SIZE * SAMPLE_SIZE)));
  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    sum += 0.299 * r + 0.587 * g + 0.114 * b;
    count += 1;
  }
  return count > 0 ? sum / count : 0;
}

/**
 * Combined quality: prefer sharp and mid-range brightness. Penalize too dark / too bright.
 */
function qualityScore(sharp: number, brightness: number): number {
  let bScore = 1;
  if (brightness < MIN_BRIGHTNESS) bScore = brightness / MIN_BRIGHTNESS;
  else if (brightness > MAX_BRIGHTNESS) bScore = Math.max(0, (255 - brightness) / (255 - MAX_BRIGHTNESS));
  return sharp * (1 + bScore);
}

export interface UseLiveStylingCameraResult {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  stream: MediaStream | null;
  startCamera: () => Promise<void>;
  stopCamera: () => void;
  captureFrames: () => Promise<{ files: File[]; error?: string }>;
  /** Capture a single frame from the video. Returns one File or an error. */
  captureSingle: () => Promise<{ file: File | null; error?: string }>;
  error: string | null;
  isReady: boolean;
}

export function useLiveStylingCamera(): UseLiveStylingCameraResult {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : "Camera access failed";
      setError(message);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  useEffect(() => {
    return () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
    };
  }, [stream]);

  const captureFrames = useCallback((): Promise<{ files: File[]; error?: string }> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !stream || video.readyState < 2) {
        resolve({ files: [], error: "Camera not ready" });
        return;
      }

      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }
      const w = Math.min(640, video.videoWidth);
      const h = Math.min(480, video.videoHeight);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ files: [], error: "Canvas not available" });
        return;
      }

      const frames: { score: number; blob: Blob }[] = [];
      let captured = 0;

      const captureOne = () => {
        if (captured >= BURST_COUNT) {
          frames.sort((a, b) => b.score - a.score);
          const best = frames.slice(0, BEST_N);
          const files = best.map((f, i) => new File([f.blob], `frame-${i}.jpg`, { type: "image/jpeg" }));
          resolve({ files });
          return;
        }
        ctx.drawImage(video, 0, 0, w, h);
        const sharp = sharpnessScore(ctx, w, h);
        const brightness = brightnessScore(ctx, w, h);
        const score = qualityScore(sharp, brightness);
        canvas.toBlob(
          (blob) => {
            if (blob) frames.push({ score, blob });
            captured += 1;
            if (captured < BURST_COUNT) {
              setTimeout(captureOne, BURST_INTERVAL_MS);
            } else {
              frames.sort((a, b) => b.score - a.score);
              const best = frames.slice(0, BEST_N);
              if (best.length === 0) {
                resolve({ files: [], error: "Could not capture frames. Hold steady and ensure good lighting." });
                return;
              }
              const files = best.map((f, i) => new File([f.blob], `frame-${i}.jpg`, { type: "image/jpeg" }));
              resolve({ files });
            }
          },
          "image/jpeg",
          0.85
        );
      };

      captureOne();
    });
  }, [stream]);

  const captureSingle = useCallback((): Promise<{ file: File | null; error?: string }> => {
    return new Promise((resolve) => {
      const video = videoRef.current;
      if (!video || !stream || video.readyState < 2) {
        resolve({ file: null, error: "Camera not ready" });
        return;
      }
      let canvas = canvasRef.current;
      if (!canvas) {
        canvas = document.createElement("canvas");
        canvasRef.current = canvas;
      }
      const w = Math.min(640, video.videoWidth);
      const h = Math.min(480, video.videoHeight);
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve({ file: null, error: "Canvas not available" });
        return;
      }
      ctx.drawImage(video, 0, 0, w, h);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve({ file: new File([blob], "photo.jpg", { type: "image/jpeg" }) });
          } else {
            resolve({ file: null, error: "Could not capture image" });
          }
        },
        "image/jpeg",
        0.85
      );
    });
  }, [stream]);

  return {
    videoRef,
    stream,
    startCamera,
    stopCamera,
    captureFrames,
    captureSingle,
    error,
    isReady: !!stream && !!videoRef.current,
  };
}
