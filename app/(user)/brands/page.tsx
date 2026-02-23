"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  listBrands,
  followBrand,
  unfollowBrand,
  type BrandSummary,
} from "@/lib/api/brandsUser";

function BrandCard({
  brand,
  onFollowChange,
  mutating,
}: {
  brand: BrandSummary;
  onFollowChange: (id: string, follow: boolean) => Promise<void>;
  mutating: string | null;
}) {
  const [followed, setFollowed] = useState(Boolean(brand.following));
  const loading = mutating === brand.id;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !followed;
    setFollowed(next);
    try {
      await onFollowChange(brand.id, next);
    } catch {
      setFollowed(!next);
    }
  };

  return (
    <Link
      href={`/brands/${brand.id}`}
      className="block rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft hover:border-primary/30 transition-colors p-4"
    >
      <div className="flex items-start gap-4">
        <div className="w-16 h-16 rounded-soft-lg bg-neutral-100 flex-shrink-0 overflow-hidden">
          {brand.logoUrl ? (
            <img src={brand.logoUrl} alt="" className="w-full h-full object-contain" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">Logo</div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="font-medium text-foreground truncate">{brand.name}</h2>
          {brand.description && (
            <p className="text-sm text-neutral-600 line-clamp-2 mt-0.5">{brand.description}</p>
          )}
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-neutral-500">
              {brand.followerCount ?? 0} followers
              {brand.productCount != null && ` · ${brand.productCount} products`}
            </span>
            <button
              type="button"
              onClick={handleFollow}
              disabled={loading}
              className="rounded-soft-lg border border-border bg-background px-2 py-1 text-xs font-medium hover:bg-muted disabled:opacity-50"
            >
              {loading ? "…" : followed ? "Unfollow" : "Follow"}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function BrandsPage() {
  const { data, mutate } = useSWR("brands", () => listBrands({ limit: 48 }));
  const [mutating, setMutating] = useState<string | null>(null);

  const handleFollowChange = async (id: string, follow: boolean) => {
    setMutating(id);
    try {
      if (follow) await followBrand(id);
      else await unfollowBrand(id);
      await mutate();
    } finally {
      setMutating(null);
    }
  };

  const items = data?.items ?? [];

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Brands</h1>
      <p className="text-neutral-600">Discover and follow brands.</p>
      {items.length === 0 ? (
        <p className="text-neutral-500">No brands available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onFollowChange={handleFollowChange}
              mutating={mutating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
