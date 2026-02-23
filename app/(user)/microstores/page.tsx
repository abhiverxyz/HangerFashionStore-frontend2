"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  listMicrostores,
  followMicrostore,
  unfollowMicrostore,
  type MicrostoreSummary,
} from "@/lib/api/microstores";

function StoreCard({
  store,
  onFollowChange,
  mutating,
}: {
  store: MicrostoreSummary;
  onFollowChange: (id: string, follow: boolean) => Promise<void>;
  mutating: string | null;
}) {
  const [followed, setFollowed] = useState(false);
  const loading = mutating === store.id;

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const next = !followed;
    setFollowed(next);
    try {
      await onFollowChange(store.id, next);
    } catch {
      setFollowed(!next);
    }
  }

  return (
    <Link
      href={`/microstores/${store.id}`}
      className="block rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft hover:border-primary/30 transition-colors"
    >
      <div className="aspect-[4/3] bg-neutral-100 relative">
        {store.coverImageUrl ? (
          <img src={store.coverImageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No cover</div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h2 className="font-medium text-foreground line-clamp-2">{store.name}</h2>
        {store.description && (
          <p className="text-sm text-neutral-600 line-clamp-2">{store.description}</p>
        )}
        <div className="flex items-center justify-between">
          <span className="text-xs text-neutral-500">
            {store.followerCount ?? 0} followers
            {store.brand?.name && ` · ${store.brand.name}`}
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
    </Link>
  );
}

export default function MicrostoresPage() {
  const { data, mutate } = useSWR("microstores", () => listMicrostores({ status: "published", limit: 24 }));
  const [mutating, setMutating] = useState<string | null>(null);

  const handleFollowChange = async (id: string, follow: boolean) => {
    setMutating(id);
    try {
      if (follow) await followMicrostore(id);
      else await unfollowMicrostore(id);
      await mutate();
    } finally {
      setMutating(null);
    }
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Stores</h1>
      <p className="text-neutral-600">Discover microstores and follow your favorites.</p>
      {items.length === 0 ? (
        <p className="text-neutral-500">No stores available yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((store) => (
            <StoreCard
              key={store.id}
              store={store}
              onFollowChange={handleFollowChange}
              mutating={mutating}
            />
          ))}
        </div>
      )}
    </div>
  );
}
