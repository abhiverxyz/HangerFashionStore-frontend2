"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getLandingChoice, LANDING_CHOICES } from "@/lib/api/landing";

const LANDING_TO_ROUTE: Record<string, string> = {
  [LANDING_CHOICES.STORE_FOR_YOU]: "/wardrobe",
  [LANDING_CHOICES.FEED]: "/feed",
  [LANDING_CHOICES.PRODUCTS]: "/browse",
  [LANDING_CHOICES.DISCOVER]: "/browse",
};

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [landingChecked, setLandingChecked] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (user?.role === "admin") {
      router.replace("/admin");
      return;
    }
    if (user?.role === "brand") {
      router.replace("/brand");
      return;
    }
    if (user) {
      getLandingChoice()
        .then((res) => {
          const route = LANDING_TO_ROUTE[res.choice] ?? "/browse";
          router.replace(route);
        })
        .catch(() => router.replace("/browse"))
        .finally(() => setLandingChecked(true));
      return;
    }
    setLandingChecked(true);
  }, [user, loading, router]);

  if (loading || (user && !landingChecked)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-neutral-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8 bg-background">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground tracking-wide">
        Hanger
      </h1>
      <div className="flex gap-4">
        <Link
          href="/browse"
          className="px-5 py-2.5 bg-primary-cta text-neutral-100 rounded-soft-lg font-medium hover:opacity-90 transition-opacity"
        >
          Browse products
        </Link>
        <Link
          href="/login"
          className="px-5 py-2.5 border border-border rounded-soft-lg font-medium text-foreground hover:bg-neutral-100 transition-colors"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
