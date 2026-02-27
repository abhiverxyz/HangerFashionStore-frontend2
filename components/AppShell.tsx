"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppHeader } from "@/components/AppHeader";
import { AppFooter } from "@/components/AppFooter";
import { useAuth } from "@/lib/auth/AuthProvider";
import { useStorageAccessToken } from "@/hooks/useStorageAccessToken";

function CameraFABIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

interface AppShellProps {
  children: React.ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  useStorageAccessToken();
  const showCameraFAB =
    pathname !== "/concierge" &&
    !pathname?.startsWith("/concierge/") &&
    pathname !== "/get-ready" &&
    pathname !== "/get-ready/live" &&
    pathname !== "/camera" &&
    !pathname?.startsWith("/camera/");

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <AppHeader user={user} onLogout={logout} />
      <main className="flex-1 w-full max-w-6xl mx-auto px-4 py-6 lg:py-8 lg:px-6 pb-24">
        {children}
      </main>
      <AppFooter />
      {showCameraFAB && (
        <Link
          href="/camera"
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-r from-pink-700 to-purple-700 text-white shadow-soft-hover hover:opacity-90 transition-opacity"
          aria-label="Camera"
        >
          <CameraFABIcon className="w-6 h-6" />
        </Link>
      )}
    </div>
  );
}
