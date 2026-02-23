"use client";

import type { User } from "@/lib/types/auth";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

interface AppHeaderProps {
  user: User | null;
  onLogout: () => void;
  /** Optional title (e.g. "Hanger Admin"); defaults to "Hanger" with logo as HANGER */
  title?: string;
  /** Optional href for logo; defaults to /browse */
  logoHref?: string;
}

/* Icons reimplemented for nav (no dependency on frontend) */
function FindIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  );
}

function BrandIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  );
}

function StoresIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function LooksIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
      <circle cx="12" cy="13" r="4" />
    </svg>
  );
}

function ClosetIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20.38 3.46L16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z" />
    </svg>
  );
}

function EditIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  );
}

function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

const mainNavItems = [
  { href: "/browse", label: "Find", icon: FindIcon },
  { href: "/brands", label: "Brands", icon: BrandIcon },
  { href: "/microstores", label: "Stores", icon: StoresIcon },
  { href: "/looks", label: "Looks", icon: LooksIcon },
  { href: "/wardrobe", label: "Closet", icon: ClosetIcon },
  { href: "/feed", label: "Edit", icon: EditIcon },
];

export function AppHeader({ user, onLogout, title = "Hanger", logoHref = "/browse" }: AppHeaderProps) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const showFrontendStyle = title === "Hanger";

  return (
    <>
      <header className="sticky top-0 z-30 w-full border-b border-border bg-background">
        {/* Row 1: Centered logo + profile right; full width bar, inner content centered */}
        <div className="relative w-full mx-auto max-w-4xl lg:max-w-6xl px-4 py-4 flex items-end justify-center">
          <Link href={logoHref} className="font-display text-3xl lg:text-4xl tracking-[0.18em] uppercase text-foreground">
            {showFrontendStyle ? "HANGER" : title}
          </Link>
          <div className="absolute right-6 top-1/2 -translate-y-1/2 flex items-center gap-3">
            {user ? (
              <>
                <Link
                  href="/profile"
                  className="flex items-center justify-center h-8 w-8 rounded-full border border-border bg-neutral-200 text-neutral-700 text-sm font-medium hover:bg-neutral-300"
                  aria-label="Profile"
                >
                  {(user.username ?? user.email ?? user.id)?.[0]?.toUpperCase() ?? "U"}
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="text-sm text-neutral-600 hover:text-foreground"
                >
                  Log out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center justify-center h-8 w-8 rounded-full border border-border bg-neutral-200 text-neutral-600 hover:text-foreground"
                aria-label="Sign in"
              >
                <ProfileIcon className="w-4 h-4" />
              </Link>
            )}
            {!showFrontendStyle && (
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -mr-2 text-neutral-600 hover:text-foreground"
                aria-label="Open menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Row 2: Horizontal nav with icon + label (frontend-style only for main app); full width bar */}
        {showFrontendStyle ? (
          <div className="w-full mx-auto max-w-4xl lg:max-w-6xl px-4 py-3">
            <div className="flex items-center justify-between w-full overflow-x-auto lg:overflow-visible scrollbar-hide">
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex flex-col items-center gap-1 lg:gap-3 transition-colors whitespace-nowrap min-w-[48px] ${
                      isActive ? "text-foreground" : "text-neutral-600 hover:text-foreground"
                    }`}
                  >
                    <Icon className={isActive ? "w-5 h-5 text-foreground" : "w-5 h-5 text-neutral-600"} />
                    <span className={`text-[8px] lg:text-[12px] uppercase tracking-[0.16em] ${isActive ? "font-medium" : ""}`}>
                      {item.label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ) : (
          /* Admin: single-row header with text nav + mobile menu */
          <div className="max-w-6xl mx-auto px-4 pb-4 flex items-center justify-between">
            <nav className="hidden lg:flex items-center gap-8">
              {mainNavItems.map(({ href, label }) => {
                const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    className={`text-sm font-medium transition-colors ${
                      isActive ? "text-foreground" : "text-neutral-600 hover:text-foreground"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 -mr-2 text-neutral-600 hover:text-foreground"
              aria-label="Open menu"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        )}
      </header>

      {/* Mobile drawer (when nav is hidden: admin always; main app on small screens we use horizontal scroll, but drawer for admin) */}
      {mobileMenuOpen && !showFrontendStyle && (
        <div className="fixed inset-0 z-40 lg:hidden" aria-modal role="dialog">
          <div className="absolute inset-0 bg-foreground/20" onClick={() => setMobileMenuOpen(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-64 bg-card border-l border-border shadow-soft-hover flex flex-col">
            <div className="p-4 flex items-center justify-between border-b border-border">
              <span className="font-display text-lg text-foreground">Menu</span>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 text-neutral-600 hover:text-foreground"
                aria-label="Close menu"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <nav className="p-4 flex flex-col gap-2">
              {mainNavItems.map(({ href, label }) => {
                const isActive = pathname === href || (href !== "/" && pathname?.startsWith(href));
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`py-3 px-3 rounded-soft-lg text-sm font-medium ${
                      isActive ? "bg-neutral-200 text-foreground" : "text-neutral-600 hover:bg-neutral-100"
                    }`}
                  >
                    {label}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
