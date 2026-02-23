"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { ConciergeFABIcon } from "@/components/concierge/ConciergeFABIcon";
import { useAuth } from "@/lib/auth/AuthProvider";

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const showConciergeFAB = pathname !== "/concierge" && !pathname?.startsWith("/concierge/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader user={user} onLogout={logout} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 lg:py-8 lg:px-6 pb-24">
        {children}
      </main>
      <AppFooter />
      {showConciergeFAB && (
        <Link
          href="/concierge"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-700 to-purple-700 text-white shadow-soft-hover hover:opacity-90 transition-opacity"
          aria-label="Fashion Concierge"
        >
          <ConciergeFABIcon className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
