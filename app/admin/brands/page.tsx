"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";
import Link from "next/link";

export default function AdminBrandsPage() {
  const { logout } = useAuth();
  const { user, loading } = useRequireAuth("admin");

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} />
      <main className="max-w-4xl mx-auto p-8">
        <div className="mb-6">
          <Link href="/admin" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-2xl font-semibold">Brands</h1>
        <p className="mt-2 text-gray-600">Coming soon. Manage brands and settings here.</p>
      </main>
    </div>
  );
}
