"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";

export default function BrandPage() {
  const { logout } = useAuth();
  const { user, loading } = useRequireAuth("brand");

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader
        title="Hanger Brand"
        user={user}
        onLogout={logout}
      />
      <main className="max-w-4xl mx-auto p-8">
        <h1 className="text-2xl font-semibold">Brand dashboard</h1>
        <p className="mt-2 text-gray-600">Placeholder – brand products and analytics go here.</p>
        {user.brandId && (
          <p className="mt-2 text-sm text-gray-500">Brand ID: {user.brandId}</p>
        )}
      </main>
    </div>
  );
}
