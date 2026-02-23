"use client";

import Link from "next/link";

export function AppFooter() {
  return (
    <footer className="border-t border-border bg-card/80 backdrop-blur-sm mt-auto mb-20">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <span className="font-display text-sm text-neutral-500 tracking-wide">
            Hanger
          </span>
          <nav className="flex items-center gap-6 text-sm text-neutral-600 hover:[&_a]:text-foreground">
            <Link href="/support">Help</Link>
            <Link href="/privacy">Privacy</Link>
            <Link href="/terms">Terms</Link>
          </nav>
        </div>
      </div>
    </footer>
  );
}
