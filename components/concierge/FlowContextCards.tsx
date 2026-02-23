"use client";

import type { FlowContext, LookCard, ProductCard, TipCard, MakeupHairCard } from "@/lib/api/conversations";
import { ConciergeProductCard } from "./ConciergeProductCard";
import { getImageDisplayUrl } from "@/lib/utils/imageUrl";
import { useStorageAccessToken } from "@/lib/contexts/StorageAccessContext";

export interface FlowContextCardsProps {
  flowContext: FlowContext;
  flowType?: string | null;
  onOpenProductQuickView?: (productId: string) => void;
}

export function FlowContextCards({
  flowContext,
  flowType,
  onOpenProductQuickView,
}: FlowContextCardsProps) {
  const accessToken = useStorageAccessToken();
  const hasLooks =
    flowType === "look_planning"
      ? Array.isArray((flowContext as { looks?: LookCard[] }).looks) && (flowContext as { looks?: LookCard[] }).looks!.length > 0
      : (flowContext.looks?.length ?? 0) > 0;
  const looks = (flowType === "look_planning"
    ? (flowContext as { looks?: LookCard[] }).looks
    : flowContext.looks) ?? [];
  const products = flowContext.products ?? [];
  const tips = flowContext.tips ?? [];
  const makeupHair = flowContext.makeupHair ?? [];

  if (!hasLooks && products.length === 0 && tips.length === 0 && makeupHair.length === 0) {
    return null;
  }

  return (
    <div className="mt-3 space-y-4">
      {hasLooks && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Looks
          </h4>
          <div className="space-y-3">
            {looks.map((look: LookCard, i: number) => (
              <div
                key={i}
                className="rounded-soft-lg border border-border bg-card p-4 shadow-soft"
              >
                <p className="text-xs text-neutral-500 mb-1">
                  {look.lookImageStyle === "on_model"
                    ? "On model"
                    : look.lookImageStyle === "flat_lay"
                      ? "Flat lay"
                      : look.lookImageStyle ?? "Look"}
                </p>
                {(look.vibe || look.occasion) && (
                  <p className="text-sm text-neutral-600 mb-2">
                    {[look.vibe, look.occasion].filter(Boolean).join(" · ")}
                  </p>
                )}
                {look.imageUrl && (
                  <img
                    src={getImageDisplayUrl(look.imageUrl, accessToken)}
                    alt="Look"
                    className="rounded-soft-md max-h-64 w-full object-contain bg-neutral-100"
                  />
                )}
                {look.products && look.products.length > 0 && (
                  <p className="text-xs text-neutral-500 mt-2">
                    {look.products.map((p) => p.title || p.id).join(", ")}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {flowType === "look_planning" && (flowContext as { planSummary?: string }).planSummary && (
        <div className="rounded-soft-lg border border-border bg-card p-3 shadow-soft">
          <p className="text-sm text-foreground">
            {(flowContext as { planSummary: string }).planSummary}
          </p>
        </div>
      )}

      {products.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Products
          </h4>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {products.map((p: ProductCard, i: number) => (
              <ConciergeProductCard
                key={`product-${i}-${p.id ?? ""}`}
                product={p}
                onOpenQuickView={onOpenProductQuickView}
              />
            ))}
          </div>
        </div>
      )}

      {tips.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Tips & trends
          </h4>
          <ul className="space-y-2">
            {(tips as TipCard[]).map((t, i) => (
              <li
                key={i}
                className="rounded-soft-lg border border-border bg-card p-3 text-sm shadow-soft"
              >
                {t.title && <span className="font-medium text-foreground">{t.title}</span>}
                {(t.description ?? t.body) && (
                  <span className="text-neutral-600"> — {(t.description ?? t.body)?.slice(0, 200)}{(t.description ?? t.body)?.length && (t.description ?? t.body)!.length > 200 ? "…" : ""}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {makeupHair.length > 0 && (
        <div>
          <h4 className="text-xs font-medium text-neutral-500 uppercase tracking-wide mb-2">
            Hair & makeup
          </h4>
          <ul className="space-y-2">
            {(makeupHair as MakeupHairCard[]).map((m, i) => (
              <li
                key={i}
                className="rounded-soft-lg border border-border bg-card p-3 text-sm shadow-soft"
              >
                <span className="text-neutral-500 capitalize">{m.type}:</span>{" "}
                {m.title ?? m.text ?? "—"}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
