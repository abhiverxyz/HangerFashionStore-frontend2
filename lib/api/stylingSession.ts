import { getStoredToken } from "@/lib/auth/storage";

const BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export interface SessionStartResponse {
  sessionId: string;
  state: string;
  assistant: { text: string; speak: boolean };
  ui: { stepTitle: string; instruction: string; chips?: string[] };
}

export interface AnalyzeFramesResponse {
  analysisId: string;
  signals: {
    personDetected: boolean;
    outfitDetected: boolean;
    garments: Array<{ type: string; label: string; color: string }>;
    palette: string[];
    vibe: string[];
    occasionGuess: string[];
    notes: string[];
  };
}

export interface RespondResponse {
  state: string;
  assistant: { text: string; speak: boolean };
  ui: { stepTitle: string; instruction: string; chips: string[] };
}

export interface SaveSessionResponse {
  lookId: string;
  diarySaved: boolean;
  summary: {
    title: string;
    whatWorks: string[];
    nextTime: string[];
  };
}

/** POST /api/styling/session/start */
export function startSession(params?: {
  mode?: string;
  entryPoint?: "style_tab" | "concierge";
  device?: { platform?: string; appVersion?: string };
}): Promise<SessionStartResponse> {
  const token = getStoredToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BASE}/api/styling/session/start`, {
    method: "POST",
    headers,
    body: JSON.stringify(params || {}),
  }).then((res) => {
    if (!res.ok) return res.json().then((err: { error?: string }) => { throw new Error(err?.error || "Failed to start session"); });
    return res.json();
  });
}

/** POST /api/styling/session/:sessionId/analyze - multipart with 1-3 images (field: frames) */
export function analyzeFrames(sessionId: string, files: File[]): Promise<AnalyzeFramesResponse> {
  const token = getStoredToken();
  const form = new FormData();
  files.forEach((f, i) => form.append("frames", f));
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BASE}/api/styling/session/${encodeURIComponent(sessionId)}/analyze`, {
    method: "POST",
    headers,
    body: form,
  }).then((res) => {
    if (!res.ok) return res.json().then((err: { error?: string }) => { throw new Error(err?.error || "Analysis failed"); });
    return res.json();
  });
}

/** POST /api/styling/session/:sessionId/respond */
export function respond(
  sessionId: string,
  body: {
    userMessage?: string | null;
    state?: string;
    analysisId?: string | null;
    clientContext?: { timezone?: string; locale?: string };
  }
): Promise<RespondResponse> {
  const token = getStoredToken();
  const headers: HeadersInit = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;
  return fetch(`${BASE}/api/styling/session/${encodeURIComponent(sessionId)}/respond`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  }).then((res) => {
    if (!res.ok) return res.json().then((err: { error?: string }) => { throw new Error(err?.error || "Respond failed"); });
    return res.json();
  });
}

/** POST /api/styling/session/:sessionId/save - multipart finalImage (optional) + body tags, userNotes */
export function saveSession(
  sessionId: string,
  body: {
    finalImage?: File | null;
    finalImageUrl?: string | null;
    tags?: { vibe?: string[]; occasion?: string[]; time?: string[] };
    userNotes?: string | null;
  }
): Promise<SaveSessionResponse> {
  const token = getStoredToken();
  const headers: HeadersInit = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const form = new FormData();
  if (body.finalImage) form.append("finalImage", body.finalImage);
  if (body.tags) {
    form.append("tags", JSON.stringify(body.tags));
  }
  if (body.userNotes != null) form.append("userNotes", body.userNotes);
  if (body.finalImageUrl != null) form.append("finalImageUrl", body.finalImageUrl);

  return fetch(`${BASE}/api/styling/session/${encodeURIComponent(sessionId)}/save`, {
    method: "POST",
    headers,
    body: form,
  }).then((res) => {
    if (!res.ok) return res.json().then((err: { error?: string }) => { throw new Error(err?.error || "Save failed"); });
    return res.json();
  });
}
