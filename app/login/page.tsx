"use client";

import { useAuth } from "@/lib/auth/AuthProvider";
import { login } from "@/lib/api/auth";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const { setToken } = useAuth();
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await login(username, password);
      setToken(res.token);
      if (res.user.role === "admin") router.replace("/admin");
      else if (res.user.role === "brand") router.replace("/brand");
      else router.replace("/browse");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <div className="w-full max-w-sm border border-border rounded-soft-2xl shadow-soft bg-card p-6">
        <h1 className="font-display text-xl text-foreground mb-4">Log in</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              autoComplete="username"
              className="w-full border border-border rounded-soft-lg px-3 py-2 bg-background text-foreground"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-border rounded-soft-lg px-3 py-2 bg-background text-foreground"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 bg-primary-cta text-neutral-100 rounded-soft-lg font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
          >
            {submitting ? "Signing in…" : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-neutral-500">
          <Link href="/browse" className="text-primary-cta hover:underline">
            Continue without logging in
          </Link>
        </p>
      </div>
    </div>
  );
}
