"use client";

import { useState } from "react";
import useSWR from "swr";
import { listFeedPosts, getFeedPost, type FeedPost } from "@/lib/api/feedPosts";

const PAGE_SIZE = 12;

function FeedPostCard({
  post,
  onClick,
}: {
  post: FeedPost;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-left rounded-soft-xl border border-border bg-card overflow-hidden shadow-soft hover:border-primary/30 transition-colors w-full"
    >
      <div className="aspect-[4/5] sm:aspect-square bg-neutral-100 relative">
        {post.videoUrl ? (
          <video
            src={post.videoUrl}
            className="w-full h-full object-cover"
            muted
            playsInline
            preload="metadata"
          />
        ) : post.imageUrl ? (
          <img src={post.imageUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-neutral-400 text-sm">No media</div>
        )}
      </div>
      <div className="p-3 space-y-1">
        <p className="font-medium text-foreground line-clamp-2">{post.title}</p>
        {post.subtitle && <p className="text-sm text-neutral-600 line-clamp-1">{post.subtitle}</p>}
        {post.brand?.name && <p className="text-xs text-neutral-500">{post.brand.name}</p>}
      </div>
    </button>
  );
}

function FeedPostModal({
  postId,
  onClose,
}: {
  postId: string | null;
  onClose: () => void;
}) {
  const { data, error, isLoading } = useSWR(
    postId ? ["feed-post", postId] : null,
    () => getFeedPost(postId!).then((r) => r.post)
  );

  if (!postId) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Feed post"
    >
      <div
        className="rounded-soft-xl bg-card border border-border shadow-soft max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {isLoading && <div className="p-6 text-neutral-500">Loading…</div>}
        {error && <div className="p-6 text-red-600">Failed to load post.</div>}
        {data && (
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-neutral-100 relative">
              {data.videoUrl ? (
                <video
                  src={data.videoUrl}
                  className="w-full h-full object-contain"
                  controls
                  playsInline
                />
              ) : data.imageUrl ? (
                <img src={data.imageUrl} alt="" className="w-full h-full object-contain" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-neutral-400">No media</div>
              )}
            </div>
            <div className="p-4 space-y-2">
              <h2 className="font-display text-xl text-foreground">{data.title}</h2>
              {data.subtitle && <p className="text-neutral-600">{data.subtitle}</p>}
              {data.brand && (
                <p className="text-sm text-neutral-500">
                  {data.brand.logoUrl && (
                    <img src={data.brand.logoUrl} alt="" className="inline w-5 h-5 rounded-full mr-1.5 align-middle" />
                  )}
                  {data.brand.name}
                </p>
              )}
              {data.href && (
                <a
                  href={data.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline"
                >
                  View link
                </a>
              )}
            </div>
          </div>
        )}
        <div className="p-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="rounded-soft-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default function FeedPage() {
  const [offset, setOffset] = useState(0);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);

  const { data, isLoading } = useSWR(
    ["feed-posts", "active", PAGE_SIZE, offset],
    () => listFeedPosts({ active: true, limit: PAGE_SIZE, offset })
  );

  const posts = data?.posts ?? [];
  const total = data?.total ?? 0;
  const hasMore = offset + posts.length < total;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl lg:text-3xl text-foreground">Edit</h1>
      <p className="text-neutral-600">Content feed — inspiration and edits.</p>

      {isLoading && offset === 0 ? (
        <p className="text-neutral-500">Loading feed…</p>
      ) : posts.length === 0 ? (
        <p className="text-neutral-500">No posts in the feed yet.</p>
      ) : (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {posts.map((post) => (
              <FeedPostCard
                key={post.id}
                post={post}
                onClick={() => setSelectedPostId(post.id)}
              />
            ))}
          </div>
          {hasMore && (
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => setOffset((o) => o + PAGE_SIZE)}
                className="rounded-soft-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Load more
              </button>
            </div>
          )}
        </>
      )}

      <FeedPostModal postId={selectedPostId} onClose={() => setSelectedPostId(null)} />
    </div>
  );
}
