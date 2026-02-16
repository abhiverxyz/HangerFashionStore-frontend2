"use client";

import type { User } from "@/lib/types/auth";
import Link from "next/link";

interface AppHeaderProps {
  title: string;
  user: User | null;
  onLogout: () => void;
}

export function AppHeader({ title, user, onLogout }: AppHeaderProps) {
  return (
    <header className="border-b bg-white px-4 py-3 flex items-center justify-between">
      <Link href="/" className="font-semibold text-gray-900">
        {title}
      </Link>
      <div className="flex items-center gap-4">
        {user ? (
          <>
            <span className="text-sm text-gray-600">{user.email}</span>
            <button
              type="button"
              onClick={onLogout}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              Log out
            </button>
          </>
        ) : (
          <Link href="/login" className="text-sm text-gray-600 hover:text-gray-900">
            Log in
          </Link>
        )}
      </div>
    </header>
  );
}
