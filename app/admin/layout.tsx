"use client";

import { AppHeader } from "@/components/AppHeader";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useRequireAuth } from "@/lib/auth/useRequireAuth";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { logout } = useAuth();
  const { user, loading } = useRequireAuth("admin");

  if (loading || !user) return null;

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title="Hanger Admin" user={user} onLogout={logout} logoHref="/admin" />
      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        {children}
      </main>
    </div>
  );
}
