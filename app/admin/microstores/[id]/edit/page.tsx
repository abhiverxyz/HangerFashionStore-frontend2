"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";

/**
 * Admin edit redirects to the full 5-step wizard (same as user edit).
 */
export default function AdminMicrostoreEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";

  useEffect(() => {
    if (id) router.replace(`/microstores/${encodeURIComponent(id)}/edit`);
  }, [id, router]);

  if (!id) return <p className="text-neutral-500">Invalid store.</p>;
  return (
    <div className="max-w-2xl space-y-6 p-6">
      <p className="text-neutral-600">Redirecting to full edit wizard…</p>
      <a href={`/microstores/${encodeURIComponent(id)}/edit`} className="text-primary hover:underline">
        Open edit wizard →
      </a>
    </div>
  );
}
