"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth/AuthProvider";
import Link from "next/link";
import useSWR from "swr";
import { getProfile, submitQuiz, type UserProfile } from "@/lib/api/profile";

export default function ProfilePage() {
  const { user } = useAuth();
  const { data: profile, error, isLoading, mutate } = useSWR(
    user ? "profile" : null,
    () => getProfile(),
    { revalidateOnFocus: true }
  );
  const [quizJson, setQuizJson] = useState("");
  const [quizSubmitting, setQuizSubmitting] = useState(false);
  const [quizMessage, setQuizMessage] = useState<string | null>(null);

  const handleQuizSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let responses: unknown;
    try {
      responses = JSON.parse(quizJson || "{}");
    } catch {
      setQuizMessage("Invalid JSON for responses.");
      return;
    }
    setQuizSubmitting(true);
    setQuizMessage(null);
    try {
      await submitQuiz({ responses });
      await mutate();
      setQuizMessage("Quiz saved.");
    } catch (err) {
      setQuizMessage(err instanceof Error ? err.message : "Failed to save quiz.");
    } finally {
      setQuizSubmitting(false);
    }
  };

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Profile</h1>

      {!user ? (
        <p className="text-neutral-500">
          <Link href="/login" className="text-primary-cta hover:underline">Log in</Link> to see your profile.
        </p>
      ) : (
        <>
          {/* Account */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Account</h2>
            <dl className="space-y-2 text-sm">
              <div>
                <dt className="text-neutral-500">Username</dt>
                <dd className="text-foreground">{user.username ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-neutral-500">Email</dt>
                <dd className="text-foreground">{user.email ?? "—"}</dd>
              </div>
            </dl>
            <p className="text-sm text-neutral-500 mt-3">Avatar and account settings (placeholder).</p>
          </section>

          {/* Profile data: style, need, motivation, summary */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Your profile</h2>
            {isLoading && <p className="text-neutral-500">Loading profile…</p>}
            {error && <p className="text-red-600">Could not load profile.</p>}
            {profile && (
              <div className="space-y-4 text-sm">
                {profile.summary?.overall && (
                  <div>
                    <dt className="text-neutral-500 font-medium">Summary</dt>
                    <dd className="text-foreground mt-1">{profile.summary.overall}</dd>
                  </div>
                )}
                {profile.styleProfile?.data != null && (
                  <div>
                    <dt className="text-neutral-500 font-medium">Style profile</dt>
                    <dd className="text-foreground mt-1">
                      From style report.{" "}
                      <Link href="/looks?tab=style-report" className="text-primary hover:underline">View style report</Link>
                    </dd>
                  </div>
                )}
                {profile.fashionNeed?.text && (
                  <div>
                    <dt className="text-neutral-500 font-medium">Fashion need</dt>
                    <dd className="text-foreground mt-1">{profile.fashionNeed.text}</dd>
                  </div>
                )}
                {profile.fashionMotivation?.text && (
                  <div>
                    <dt className="text-neutral-500 font-medium">Motivation</dt>
                    <dd className="text-foreground mt-1">{profile.fashionMotivation.text}</dd>
                  </div>
                )}
                {profile.history?.summary && (
                  <div>
                    <dt className="text-neutral-500 font-medium">History summary</dt>
                    <dd className="text-foreground mt-1">{profile.history.summary}</dd>
                  </div>
                )}
                {!profile.summary?.overall && !profile.styleProfile?.data && !profile.fashionNeed?.text && !profile.fashionMotivation?.text && !profile.history?.summary && (
                  <p className="text-neutral-500">Complete the style report and quiz to build your profile.</p>
                )}
              </div>
            )}
          </section>

          {/* Style report link */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-2">Style report</h2>
            <p className="text-sm text-neutral-500 mb-2">Your style analysis from looks and preferences.</p>
            <Link href="/looks?tab=style-report" className="text-primary hover:underline text-sm">Open style report</Link>
          </section>

          {/* Quiz */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-2">Quiz</h2>
            <p className="text-sm text-neutral-500 mb-3">Submit style and preference responses (JSON).</p>
            {profile?.quiz?.submittedAt && (
              <p className="text-xs text-neutral-500 mb-2">Last submitted: {new Date(profile.quiz.submittedAt).toLocaleString()}</p>
            )}
            <form onSubmit={handleQuizSubmit} className="space-y-2">
              <textarea
                value={quizJson}
                onChange={(e) => setQuizJson(e.target.value)}
                placeholder='{"occasion": "casual", "vibe": "minimal"}'
                className="w-full rounded-soft-lg border border-border bg-background px-3 py-2 text-sm font-mono min-h-[100px]"
                rows={4}
              />
              <button
                type="submit"
                disabled={quizSubmitting}
                className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {quizSubmitting ? "Saving…" : "Save quiz"}
              </button>
              {quizMessage && <p className="text-sm text-neutral-600">{quizMessage}</p>}
            </form>
          </section>

          {/* Settings */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-2">Settings</h2>
            <p className="text-sm text-neutral-500">Notifications, privacy, and app settings (placeholder).</p>
          </section>
        </>
      )}
    </div>
  );
}
