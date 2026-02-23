"use client";

import Link from "next/link";

export default function DesignSystemShowcasePage() {
  return (
    <>
      <div className="mb-8">
          <Link href="/admin" className="text-sm text-neutral-500 hover:text-foreground">
            ← Back to Dashboard
          </Link>
          <h1 className="mt-2 font-display text-2xl text-foreground">
            Design system showcase
          </h1>
          <p className="mt-1 text-sm text-neutral-500">
            Frontend (original) colour scheme. Edit <code className="bg-neutral-200 px-1 rounded-soft-lg">tailwind.config.ts</code> and{" "}
            <code className="bg-neutral-200 px-1 rounded-soft-lg">app/globals.css</code> to see changes here.
          </p>
        </div>

        <div className="space-y-10">
          {/* Colors */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Colors</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div>
                <div className="h-16 rounded-soft-lg bg-background border border-border" />
                <p className="mt-2 text-xs font-medium text-foreground">background</p>
                <p className="text-xs text-neutral-500">#f5f3f0</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-foreground" />
                <p className="mt-2 text-xs font-medium text-foreground">foreground</p>
                <p className="text-xs text-neutral-500">#111827</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-card border border-border" />
                <p className="mt-2 text-xs font-medium text-foreground">card</p>
                <p className="text-xs text-neutral-500">#ffffff</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-primary" />
                <p className="mt-2 text-xs font-medium text-foreground">primary / primary-cta</p>
                <p className="text-xs text-neutral-500">#111827</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-accent-sand" />
                <p className="mt-2 text-xs font-medium text-foreground">accent-sand</p>
                <p className="text-xs text-neutral-500">#d0bfa6</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-accent-blush" />
                <p className="mt-2 text-xs font-medium text-foreground">accent-blush</p>
                <p className="text-xs text-neutral-500">#f5e3da</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-neutral-200" />
                <p className="mt-2 text-xs font-medium text-foreground">neutral-200</p>
                <p className="text-xs text-neutral-500">#f1f5f9</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-neutral-500" />
                <p className="mt-2 text-xs font-medium text-neutral-100">neutral-500</p>
                <p className="text-xs text-neutral-500">#64748b</p>
              </div>
              <div>
                <div className="h-16 rounded-soft-lg bg-neutral-800" />
                <p className="mt-2 text-xs font-medium text-neutral-100">neutral-800</p>
                <p className="text-xs text-neutral-500">#1e293b</p>
              </div>
            </div>
          </section>

          {/* Typography */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Typography</h2>
            <div className="space-y-4">
              <div>
                <p className="font-display text-3xl text-foreground">Hanger</p>
                <p className="text-xs text-neutral-500 mt-1">font-display (Fraunces) — logo & headlines</p>
              </div>
              <div>
                <p className="text-xl font-semibold text-foreground">Body and UI text</p>
                <p className="text-sm text-neutral-600 mt-1">
                  This is the default sans (Outfit). Use for body copy, labels, and UI.
                </p>
                <p className="text-xs text-neutral-500 mt-1">font-sans (Outfit)</p>
              </div>
              <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-xs text-neutral-500">text-xs</span>
                <span className="text-sm">text-sm</span>
                <span className="text-base">text-base</span>
                <span className="text-lg">text-lg</span>
                <span className="text-xl">text-xl</span>
                <span className="text-2xl font-display">text-2xl</span>
              </div>
            </div>
          </section>

          {/* Border radius */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Border radius</h2>
            <div className="flex flex-wrap gap-6 items-end">
              <div className="w-20 h-20 bg-neutral-200 rounded-soft-md" />
              <span className="text-xs text-neutral-500">soft-md (6px)</span>
              <div className="w-20 h-20 bg-neutral-200 rounded-soft-lg" />
              <span className="text-xs text-neutral-500">soft-lg (8px)</span>
              <div className="w-20 h-20 bg-neutral-200 rounded-soft-xl" />
              <span className="text-xs text-neutral-500">soft-xl (12px)</span>
              <div className="w-20 h-20 bg-neutral-200 rounded-soft-2xl" />
              <span className="text-xs text-neutral-500">soft-2xl (16px)</span>
            </div>
          </section>

          {/* Shadows */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Shadows</h2>
            <div className="flex flex-wrap gap-8">
              <div className="w-32 h-24 bg-card rounded-soft-xl shadow-soft flex items-center justify-center">
                <span className="text-xs text-neutral-500">shadow-soft</span>
              </div>
              <div className="w-32 h-24 bg-card rounded-soft-xl shadow-soft-hover flex items-center justify-center">
                <span className="text-xs text-neutral-500">shadow-soft-hover</span>
              </div>
            </div>
          </section>

          {/* Sample components */}
          <section className="bg-card rounded-soft-xl border border-border p-6 shadow-soft">
            <h2 className="text-lg font-semibold text-foreground mb-4">Sample components</h2>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-3">
                <button
                  type="button"
                  className="px-4 py-2 bg-primary-cta text-neutral-100 rounded-soft-lg font-medium text-sm"
                >
                  Primary CTA
                </button>
                <button
                  type="button"
                  className="px-4 py-2 border border-border rounded-soft-lg font-medium text-sm text-foreground hover:bg-neutral-100"
                >
                  Secondary
                </button>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-sand text-foreground">
                  Tag (accent-sand)
                </span>
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent-blush text-foreground">
                  Tag (accent-blush)
                </span>
                <button
                  type="button"
                  className="px-4 py-2 bg-primary text-neutral-100 rounded-soft-lg font-medium text-sm hover:opacity-90"
                >
                  Primary button
                </button>
              </div>
              <div className="max-w-xs">
                <label className="block text-sm font-medium text-foreground mb-1">Input</label>
                <input
                  type="text"
                  placeholder="Placeholder"
                  className="w-full border border-border rounded-soft-lg px-3 py-2 bg-background text-foreground text-sm"
                  readOnly
                />
              </div>
              <div className="max-w-sm p-4 rounded-soft-xl border border-border bg-card shadow-soft">
                <p className="font-medium text-foreground">Card sample</p>
                <p className="text-sm text-neutral-500 mt-1">Uses card bg, border, shadow-soft.</p>
              </div>
            </div>
          </section>
        </div>
    </>
  );
}
