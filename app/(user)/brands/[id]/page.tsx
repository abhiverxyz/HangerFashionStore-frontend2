"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import useSWR from "swr";
import { getBrand, followBrand, unfollowBrand } from "@/lib/api/brandsUser";

export default function BrandDetailPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : "";
  const { data, error, isLoading, mutate } = useSWR(id ? ["brand", id] : null, () => getBrand(id));
  const [followed, setFollowed] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    if (data?.following != null) setFollowed(!!data.following);
  }, [data?.following]);

  const handleFollow = async () => {
    setFollowLoading(true);
    try {
      if (followed) await unfollowBrand(id);
      else await followBrand(id);
      setFollowed(!followed);
      await mutate();
    } finally {
      setFollowLoading(false);
    }
  };

  if (!id) return <p className="text-neutral-500">Invalid brand.</p>;
  if (error) return <p className="text-red-600">Brand not found.</p>;
  if (isLoading || !data) return <p className="text-neutral-500">Loading…</p>;

  const isFollowing = data.following ?? followed;

  return (
    <div className="space-y-6">
      <div className="rounded-soft-xl border border-border bg-card overflow-hidden p-6 md:p-8">
        <div className="flex flex-col sm:flex-row gap-6 items-start">
          <div className="w-24 h-24 rounded-soft-xl bg-neutral-100 flex-shrink-0 overflow-hidden">
            {data.logoUrl ? (
              <img src={data.logoUrl} alt="" className="w-full h-full object-contain" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">Logo</div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-display text-2xl lg:text-3xl text-foreground">{data.name}</h1>
            {data.description && <p className="text-neutral-600 mt-2">{data.description}</p>}
            <div className="flex flex-wrap items-center gap-3 mt-4">
              {data.websiteUrl && (
                <a
                  href={data.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  Website
                </a>
              )}
              <span className="text-sm text-neutral-500">
                {data.followerCount ?? 0} followers
                {data.productCount != null && ` · ${data.productCount} products`}
              </span>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={handleFollow}
                disabled={followLoading}
                className="rounded-soft-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {followLoading ? "…" : isFollowing ? "Unfollow" : "Follow"}
              </button>
              <Link
                href={`/browse?brandId=${encodeURIComponent(id)}`}
                className="rounded-soft-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-medium hover:opacity-90 inline-block"
              >
                View products
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
