"use client";

import { useState, useCallback } from "react";
import { LiveStylingSessionScreen } from "@/components/looks/LiveStylingSessionScreen";
import { SessionEndScreen } from "@/components/looks/SessionEndScreen";

export default function LiveStylingPage() {
  const [showEndScreen, setShowEndScreen] = useState(false);
  const [endSessionId, setEndSessionId] = useState<string | null>(null);
  const [endFinalImage, setEndFinalImage] = useState<File | null>(null);

  const handleSessionDone = useCallback((sessionId: string, finalImageFile: File | null) => {
    setEndSessionId(sessionId);
    setEndFinalImage(finalImageFile);
    setShowEndScreen(true);
  }, []);

  const handleStartAnother = useCallback(() => {
    setShowEndScreen(false);
    setEndSessionId(null);
    setEndFinalImage(null);
  }, []);

  if (showEndScreen && endSessionId) {
    return (
      <SessionEndScreen
        sessionId={endSessionId}
        finalImageFile={endFinalImage}
        onStartAnother={handleStartAnother}
      />
    );
  }

  return <LiveStylingSessionScreen onSessionDone={handleSessionDone} />;
}
