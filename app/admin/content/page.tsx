"use client";

import Link from "next/link";

export default function AdminContentPage() {
  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="font-display text-2xl text-foreground">Content</h1>
      <p className="mt-2 text-neutral-600">Coming soon. Manage feed posts and content here.</p>
    </>
  );
}
