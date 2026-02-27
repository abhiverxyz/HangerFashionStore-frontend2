"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useLiveStylingCamera } from "@/hooks/useLiveStylingCamera";
import {
  startSession,
  analyzeFrames,
  respond,
  type SessionStartResponse,
  type RespondResponse,
} from "@/lib/api/stylingSession";

interface LiveStylingSessionScreenProps {
  onSessionDone: (sessionId: string, finalImageFile: File | null) => void;
}

export function LiveStylingSessionScreen({ onSessionDone }: LiveStylingSessionScreenProps) {
  const { videoRef, stream, startCamera, stopCamera, captureFrames, error: cameraError } = useLiveStylingCamera();

  const [sessionId, setSessionId] = useState<string | null>(null);
  const [state, setState] = useState<string>("INTRO");
  const [assistant, setAssistant] = useState<SessionStartResponse["assistant"] | null>(null);
  const [ui, setUi] = useState<SessionStartResponse["ui"] | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzeLoading, setAnalyzeLoading] = useState(false);
  const [askModalOpen, setAskModalOpen] = useState(false);
  const [askInput, setAskInput] = useState("");
  const [audioOn, setAudioOn] = useState(true);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);

  const speak = useCallback(
    (text: string) => {
      if (!audioOn || typeof window === "undefined" || !window.speechSynthesis) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.95;
      synthRef.current = u;
      window.speechSynthesis.speak(u);
    },
    [audioOn]
  );

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await startSession({ mode: "live_styling", entryPoint: "style_tab" });
        if (cancelled) return;
        setSessionId(data.sessionId);
        setState(data.state);
        setAssistant(data.assistant);
        setUi(data.ui);
        if (data.assistant?.speak) speak(data.assistant.text);
      } catch (e) {
        if (!cancelled) setAssistant({ text: "Could not start session. Try again.", speak: false });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [speak]);

  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera, stopCamera]);

  useEffect(() => {
    if (assistant?.speak) speak(assistant.text);
  }, [assistant?.text, speak]);

  const handleAnalyzeNow = useCallback(async () => {
    if (!sessionId) return;
    setAnalyzeLoading(true);
    try {
      const { files, error: captureError } = await captureFrames();
      if (captureError || files.length === 0) {
        setUi((prev) => ({ ...prev!, instruction: captureError || "Hold steady and ensure good lighting, then try again." }));
        setAnalyzeLoading(false);
        return;
      }
      const analysis = await analyzeFrames(sessionId, files);
      const response: RespondResponse = await respond(sessionId, { analysisId: analysis.analysisId });
      setState(response.state);
      setAssistant(response.assistant);
      setUi(response.ui);
      if (response.assistant.speak) speak(response.assistant.text);
      if (response.state === "DONE") {
        onSessionDone(sessionId, files[0] ?? null);
        return;
      }
    } catch (e) {
      setUi((prev) => ({ ...prev!, instruction: e instanceof Error ? e.message : "Analysis failed. Try again." }));
    } finally {
      setAnalyzeLoading(false);
    }
  }, [sessionId, captureFrames, speak, onSessionDone]);

  const handleTryAnother = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await respond(sessionId, { userMessage: "try another" });
      setState(response.state);
      setAssistant(response.assistant);
      setUi(response.ui);
      if (response.assistant.speak) speak(response.assistant.text);
      if (response.state === "DONE") onSessionDone(sessionId, null);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId, speak, onSessionDone]);

  const handleNext = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await respond(sessionId, { userMessage: "next" });
      setState(response.state);
      setAssistant(response.assistant);
      setUi(response.ui);
      if (response.assistant.speak) speak(response.assistant.text);
      if (response.state === "DONE") onSessionDone(sessionId, null);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId, speak, onSessionDone]);

  const handleAskSubmit = useCallback(async () => {
    const msg = askInput.trim();
    if (!sessionId || !msg) return;
    setAskModalOpen(false);
    setAskInput("");
    setLoading(true);
    try {
      const response = await respond(sessionId, { userMessage: msg });
      setState(response.state);
      setAssistant(response.assistant);
      setUi(response.ui);
      if (response.assistant.speak) speak(response.assistant.text);
      if (response.state === "DONE") onSessionDone(sessionId, null);
    } catch {
      setLoading(false);
    } finally {
      setLoading(false);
    }
  }, [sessionId, askInput, speak, onSessionDone]);

  const handleChip = useCallback(
    async (chip: string) => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const response = await respond(sessionId, { userMessage: chip });
        setState(response.state);
        setAssistant(response.assistant);
        setUi(response.ui);
        if (response.assistant.speak) speak(response.assistant.text);
        if (response.state === "DONE") onSessionDone(sessionId, null);
      } catch {
        setLoading(false);
      } finally {
        setLoading(false);
      }
    },
    [sessionId, speak, onSessionDone]
  );

  if (!sessionId && !assistant) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 text-white">
        <p>Starting session…</p>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black">
      {/* Camera preview - mirrored */}
      <div className="absolute inset-0 overflow-hidden">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="h-full w-full object-cover"
          style={{ transform: "scaleX(-1)" }}
        />
        {cameraError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/70 text-white p-4 text-center">
            <p>{cameraError}</p>
          </div>
        )}
      </div>

      {/* Top bar */}
      <div className="relative z-10 flex items-center justify-between px-4 py-3 bg-black/50 text-white">
        <Link
          href="/get-ready"
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </Link>
        <h1 className="font-display text-sm tracking-wide uppercase">Live Styling</h1>
        <button
          type="button"
          onClick={() => setAudioOn((a) => !a)}
          className="p-2 rounded-full hover:bg-white/20 transition-colors"
          aria-label={audioOn ? "Mute" : "Unmute"}
        >
          {audioOn ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <line x1="23" y1="9" x2="17" y2="15" />
              <line x1="17" y1="9" x2="23" y2="15" />
            </svg>
          )}
        </button>
      </div>

      {/* Step card overlay - bottom */}
      <div className="relative z-10 mt-auto p-4 pb-8 bg-gradient-to-t from-black/90 to-transparent">
        <div className="rounded-soft-xl bg-white/95 text-foreground p-4 shadow-lg max-w-lg mx-auto">
          <p className="font-display text-sm font-medium text-foreground mb-1">{ui?.stepTitle ?? "Step"}</p>
          <p className="text-sm text-foreground/90 mb-3">{ui?.instruction ?? ""}</p>
          {assistant?.text && (
            <div className="rounded-lg bg-neutral-100 p-2.5 mb-3 text-sm text-foreground">
              {assistant.text}
            </div>
          )}
          <div className="flex flex-wrap gap-2 mb-3">
            {(ui?.chips ?? []).map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => handleChip(chip)}
                disabled={loading}
                className="rounded-full px-3 py-1.5 text-xs bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleAnalyzeNow}
              disabled={analyzeLoading || !stream}
              className="rounded-full px-4 py-2 text-sm font-medium bg-primary-cta text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {analyzeLoading ? "Analyzing…" : "Analyze now"}
            </button>
            <button
              type="button"
              onClick={handleTryAnother}
              disabled={loading}
              className="rounded-full px-4 py-2 text-sm bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 transition-colors"
            >
              Try another
            </button>
            <button
              type="button"
              onClick={handleNext}
              disabled={loading}
              className="rounded-full px-4 py-2 text-sm bg-neutral-200 hover:bg-neutral-300 disabled:opacity-50 transition-colors"
            >
              Next
            </button>
          </div>
        </div>
        <div className="flex justify-end mt-2">
          <button
            type="button"
            onClick={() => setAskModalOpen(true)}
            className="rounded-full px-4 py-2 text-sm bg-white/20 text-white hover:bg-white/30 transition-colors"
          >
            Ask
          </button>
        </div>
      </div>

      {/* Ask modal */}
      {askModalOpen && (
        <div className="absolute inset-0 z-20 flex items-end justify-center bg-black/60 p-4 pb-24">
          <div className="w-full max-w-md rounded-soft-xl bg-white p-4">
            <p className="text-sm font-medium text-foreground mb-2">Ask your stylist</p>
            <input
              type="text"
              value={askInput}
              onChange={(e) => setAskInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAskSubmit()}
              placeholder="e.g. skip to makeup, just validate…"
              className="w-full rounded-lg border border-border px-3 py-2 text-sm mb-3"
            />
            <div className="flex gap-2">
              <button type="button" onClick={() => setAskModalOpen(false)} className="rounded-lg px-3 py-2 text-sm bg-neutral-200 hover:bg-neutral-300">
                Cancel
              </button>
              <button type="button" onClick={handleAskSubmit} className="rounded-lg px-3 py-2 text-sm bg-primary-cta text-white hover:opacity-90">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
