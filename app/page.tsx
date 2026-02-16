"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

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
      router.replace("/browse");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-6 p-8">
      <h1 className="text-2xl font-semibold">Hanger Fashion</h1>
      <div className="flex gap-4">
        <Link
          href="/browse"
          className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          Browse products
        </Link>
        <Link
          href="/login"
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
        >
          Log in
        </Link>
      </div>
    </div>
  );
}
