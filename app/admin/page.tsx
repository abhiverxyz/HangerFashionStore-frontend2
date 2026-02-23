"use client";

import Link from "next/link";

const SECTIONS = [
  {
    title: "Shopping",
    tiles: [
      { href: "/admin/products", title: "Products", description: "Import brands and products from Shopify, run enrichment." },
      { href: "/admin/brands", title: "Brands", description: "Manage brands and settings." },
      { href: "/admin/microstores", title: "Microstores", description: "Manage microstores and product curation." },
    ],
  },
  {
    title: "Fashion",
    tiles: [
      { href: "/admin/fashion-content", title: "Trends and Styling", description: "View trends and styling rules (used by Styling Agent and MicroStore)." },
      { href: "/admin/styling-agent", title: "Styling Agent", description: "Agent goals, tone avatars, and suggested flows (improvement loop)." },
      { href: "/admin/look-classification-tags", title: "Look classification tags", description: "Add, edit, or delete tags for classifying user looks (Look Analysis)." },
      { href: "/admin/content", title: "Content", description: "Manage feed posts and content." },
    ],
  },
  {
    title: "Settings",
    tiles: [
      { href: "/admin/settings", title: "AI Model settings", description: "Choose which provider and model to use for each utility or agent." },
      { href: "/admin/storage-test", title: "R2 / Image storage test", description: "Upload an image and verify storage (R2 or local) is working." },
    ],
  },
  {
    title: "Testing",
    tiles: [
      { href: "/admin/styling-test", title: "Styling Agent testing", description: "Test Conversation API and Styling Agent (reply, looks, images, products, tips)." },
      { href: "/admin/search-test", title: "Search testing", description: "Test Search API: NL and image-based product search (query, imageUrl, results)." },
    ],
  },
  {
    title: "Frontend",
    tiles: [
      { href: "/admin/design-system", title: "Design system showcase", description: "View Option C tokens: colors, typography, spacing, radius, shadows. Edit tailwind.config and globals.css, then see changes here." },
    ],
  },
];

export default function AdminPage() {
  return (
    <>
      <h1 className="font-display text-2xl text-foreground">Dashboard</h1>
      <p className="mt-1 text-neutral-600">Choose an area to manage.</p>
      <div className="mt-8 space-y-8">
        {SECTIONS.map((section) => (
          <section key={section.title}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">{section.title}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {section.tiles.map((tile) => (
                <Link
                  key={tile.href}
                  href={tile.href}
                  className="block p-6 rounded-soft-xl border border-border bg-card hover:shadow-soft transition-shadow"
                >
                  <h3 className="font-semibold text-foreground">{tile.title}</h3>
                  <p className="mt-1 text-sm text-neutral-600">{tile.description}</p>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  );
}
