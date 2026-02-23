"use client";

import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

/**
 * Avatar circle for Concierge: shows imageUrl when set (from admin), otherwise cartoon placeholder or initial.
 */
export interface ConciergeAvatarCircleProps {
  size?: number;
  className?: string;
  /** Avatar image URL (from admin upload); when set, shown as circle image */
  imageUrl?: string | null;
  /** Optional: first letter of name or id to show instead of face (e.g. in picker) */
  initial?: string | null;
  /** Optional: seed for background tint (e.g. avatar id or name) */
  tintSeed?: string;
}

function hashToHue(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h << 5) - h + s.charCodeAt(i);
  return Math.abs(h) % 360;
}

export function ConciergeAvatarCircle({
  size = 40,
  className = "",
  imageUrl = null,
  initial = null,
  tintSeed,
}: ConciergeAvatarCircleProps) {
  const accessToken = useStorageAccessToken();
  const resolvedImageUrl = imageUrl ? getImageDisplayUrl(imageUrl, accessToken) : "";

  if (resolvedImageUrl) {
    return (
      <div
        className={`rounded-full overflow-hidden bg-neutral-100 shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        <img
          src={resolvedImageUrl}
          alt=""
          className="w-full h-full object-cover"
        />
      </div>
    );
  }

  const hue = tintSeed != null ? hashToHue(tintSeed) : 260;
  const bg = tintSeed != null ? `hsl(${hue}, 45%, 92%)` : "hsl(260, 45%, 92%)";
  const stroke = tintSeed != null ? `hsl(${hue}, 40%, 50%)` : "hsl(260, 40%, 50%)";

  if (initial && initial.trim()) {
    const letter = initial.trim()[0].toUpperCase();
    return (
      <div
        className={`rounded-full flex items-center justify-center text-sm font-medium ${className}`}
        style={{
          width: size,
          height: size,
          backgroundColor: bg,
          color: stroke,
        }}
      >
        {letter}
      </div>
    );
  }

  const r = size / 2;
  const eyeOff = size * 0.2;
  const eyeR = size * 0.08;
  const smileCy = r + size * 0.15;
  const smileRy = size * 0.12;
  const smileRx = size * 0.25;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={className}
    >
      <circle cx={r} cy={r} r={r - 1} fill={bg} stroke={stroke} strokeWidth="1.5" />
      <circle cx={r - eyeOff} cy={r - eyeOff} r={eyeR} fill={stroke} />
      <circle cx={r + eyeOff} cy={r - eyeOff} r={eyeR} fill={stroke} />
      <path
        d={`M ${r - smileRx} ${smileCy} Q ${r} ${smileCy + smileRy} ${r + smileRx} ${smileCy}`}
        fill="none"
        stroke={stroke}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
