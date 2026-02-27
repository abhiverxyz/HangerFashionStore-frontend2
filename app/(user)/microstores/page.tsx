"use client";

import { useState } from "react";
import Link from "next/link";
import useSWR from "swr";
import {
  listMicrostores,
  followMicrostore,
  unfollowMicrostore,
  canCreateMicrostore,
  resolveMicrostoreCoverUrl,
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

  const [coverError, setCoverError] = useState(false);
  const coverSrc = resolveMicrostoreCoverUrl(store.coverImageUrl);
  const showPlaceholder = !coverSrc || coverError;

  return (
    <Link
      href={`/microstores/${store.id}`}
      className="block rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft hover:border-primary/30 transition-colors"
    >
      <div className="aspect-[4/3] bg-neutral-100 relative">
        {showPlaceholder ? (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No cover</div>
        ) : (
          <img src={coverSrc} alt="" className="w-full h-full object-cover" onError={() => setCoverError(true)} />
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
  const { data: canCreate } = useSWR("can-create-microstore", () => canCreateMicrostore().then((r) => r.allowed).catch(() => false));
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
  const isLoading = data === undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl lg:text-3xl text-foreground">Stores</h1>
          <p className="text-neutral-600">Discover microstores and follow your favorites.</p>
        </div>
        {canCreate && (
          <Link
            href="/microstores/create"
            className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            Create store
          </Link>
        )}
      </div>
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" aria-busy="true" aria-label="Loading stores">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="block rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft animate-pulse">
              <div className="aspect-[4/3] bg-neutral-200" />
              <div className="p-3 space-y-2">
                <div className="h-5 bg-neutral-200 rounded w-3/4" />
                <div className="h-4 bg-neutral-100 rounded w-full" />
                <div className="h-4 bg-neutral-100 rounded w-2/3" />
                <div className="h-4 bg-neutral-100 rounded w-1/2 mt-2" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
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
