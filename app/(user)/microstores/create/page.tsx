"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import useSWR from "swr";
import {
  suggestMicrostoreNameUser,
  createMicrostoreUser,
  getMicrostore,
  updateMicrostoreUser,
  generateMicrostoreCoverUser,
  uploadMicrostoreCover,
  suggestProductsForMicrostoreUser,
  suggestOneStyleNoteUser,
  submitMicrostoreForApprovalUser,
  resolveMicrostoreCoverUrl,
} from "@/lib/api/microstores";
import { uploadUserImage } from "@/lib/api/userImages";
import { searchProducts } from "@/lib/api/search";
import { StyleNoteCard } from "@/components/StyleNoteCard";

const API_BASE = typeof process !== "undefined" ? process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002" : "";

const STEPS = ["Name & details", "Cover image", "Products", "Style notes", "Submit"];

const STYLE_CARD_PRESETS = [
  { id: "coral", name: "Coral", backgroundColor: "#e07a5f", fontStyle: "#1d3557" },
  { id: "navy", name: "Navy & Gold", backgroundColor: "#1d3557", fontStyle: "#f2cc8f" },
  { id: "mint", name: "Mint", backgroundColor: "#81b29a", fontStyle: "#1d3557" },
  { id: "blush", name: "Blush", backgroundColor: "#f4a261", fontStyle: "#ffffff" },
  { id: "slate", name: "Slate", backgroundColor: "#3d405b", fontStyle: "#e9c46a" },
  { id: "sage", name: "Sage", backgroundColor: "#2a9d8f", fontStyle: "#ffffff" },
  { id: "berry", name: "Berry", backgroundColor: "#9b5de5", fontStyle: "#ffffff" },
  { id: "cream", name: "Cream", backgroundColor: "#fefae0", fontStyle: "#283618" },
  { id: "terracotta", name: "Terracotta", backgroundColor: "#c67b5c", fontStyle: "#1a1a1a" },
  { id: "forest", name: "Forest", backgroundColor: "#2d5a27", fontStyle: "#e8e0d5" },
  { id: "lavender", name: "Lavender", backgroundColor: "#b8a9c9", fontStyle: "#2c1810" },
  { id: "sunset", name: "Sunset", backgroundColor: "#e76f51", fontStyle: "#ffffff" },
  { id: "ocean", name: "Ocean", backgroundColor: "#0077b6", fontStyle: "#ffffff" },
  { id: "mustard", name: "Mustard", backgroundColor: "#e9c46a", fontStyle: "#1d3557" },
  { id: "rose", name: "Rose", backgroundColor: "#e0a0a0", fontStyle: "#3d2c29" },
  { id: "charcoal", name: "Charcoal", backgroundColor: "#264653", fontStyle: "#e9c46a" },
] as const;

type StyleCardLink = { title: string; url?: string; description?: string; imageUrl?: string; backgroundColor?: string; fontStyle?: string };

export default function CreateMicrostorePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [storeId, setStoreId] = useState<string | null>(null);

  const [descriptionInput, setDescriptionInput] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [vibe, setVibe] = useState("");
  const [trends, setTrends] = useState("");
  const [categories, setCategories] = useState("");
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [coverLoading, setCoverLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncedProductsFromStore = useRef(false);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [productPool, setProductPool] = useState<{ id: string; title?: string; brand?: { name?: string }; variants?: { price?: string }[]; images?: { src?: string; url?: string }[] }[]>([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [productSearchQuery, setProductSearchQuery] = useState("");
  const [productSearchLoading, setProductSearchLoading] = useState(false);
  const [productsSaveLoading, setProductsSaveLoading] = useState(false);
  const [styleNotes, setStyleNotes] = useState<{ text: string; links: StyleCardLink[] }>({ text: "", links: [] });
  const [styleNotesLoading, setStyleNotesLoading] = useState(false);
  const [styleNotesSaveLoading, setStyleNotesSaveLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [editingCardIndex, setEditingCardIndex] = useState<number | null>(null);
  const [uploadingCardIndex, setUploadingCardIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!descriptionInput.trim()) return;
    setSuggestLoading(true);
    setError(null);
    try {
      const result = await suggestMicrostoreNameUser({
        description: descriptionInput.trim(),
        vibe: vibe || undefined,
        trend: trends || undefined,
        category: categories || undefined,
      });
      setName(result.name);
      setDescription(result.description);
      setVibe(result.vibe ?? "");
      setTrends(result.trends ?? "");
      setCategories(result.categories ?? "");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate");
    } finally {
      setSuggestLoading(false);
    }
  };

  const handleNextFromStep1 = async () => {
    if (!name.trim()) {
      setError("Enter a store name or generate from description.");
      return;
    }
    setCreateLoading(true);
    setError(null);
    try {
      const store = await createMicrostoreUser({
        name: name.trim(),
        description: description.trim() || undefined,
        vibe: vibe.trim() || undefined,
        trends: trends.trim() || undefined,
        categories: categories.trim() || undefined,
      });
      setStoreId(store.id);
      setStep(2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create store");
    } finally {
      setCreateLoading(false);
    }
  };

  const { data: storeData, mutate: mutateStore } = useSWR(
    storeId ? ["microstore-wizard", storeId] : null,
    () => getMicrostore(storeId!)
  );
  const currentCoverUrl = resolveMicrostoreCoverUrl(storeData?.coverImageUrl ?? null);

  const { data: suggestProductsData } = useSWR(
    step === 3 && storeId ? ["suggest-products", storeId, name] : null,
    () => suggestProductsForMicrostoreUser({ storeId: storeId!, name, description: description || undefined, vibe: vibe || undefined, limit: 40 })
  );

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !storeId) return;
    setCoverLoading(true);
    setError(null);
    try {
      await uploadMicrostoreCover(storeId, file);
      await mutateStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setCoverLoading(false);
      e.target.value = "";
    }
  };

  const handleGenerateCover = async () => {
    if (!storeId) return;
    setCoverLoading(true);
    setError(null);
    try {
      const result = await generateMicrostoreCoverUser({
        name,
        description: description || undefined,
        vibe: vibe || undefined,
        trends: trends || undefined,
        categories: categories || undefined,
      });
      if (result.imageUrl) {
        await updateMicrostoreUser(storeId, { coverImageUrl: result.imageUrl });
        await mutateStore();
      } else setError("Image generation failed");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setCoverLoading(false);
    }
  };

  useEffect(() => {
    if (step === 3 && suggestProductsData?.products?.length && productPool.length === 0) {
      setProductPool(suggestProductsData.products);
    }
  }, [step, suggestProductsData?.products, productPool.length]);

  useEffect(() => {
    if (step !== 3 || !storeData?.sections?.length || syncedProductsFromStore.current) return;
    const ids = new Set<string>();
    for (const s of storeData.sections) {
      for (const id of s.productIds || []) ids.add(id);
    }
    if (ids.size > 0) {
      setSelectedProductIds(ids);
      syncedProductsFromStore.current = true;
    }
  }, [step, storeData?.sections]);
  useEffect(() => {
    if (step !== 3) syncedProductsFromStore.current = false;
  }, [step]);

  useEffect(() => {
    if (step === 4 && storeData?.styleNotes && typeof storeData.styleNotes === "object") {
      const sn = storeData.styleNotes as { text?: string; links?: { title?: string; url?: string; description?: string; imageUrl?: string; backgroundColor?: string; fontStyle?: string }[] };
      setStyleNotes({
        text: sn.text ?? "",
        links: Array.isArray(sn.links) ? sn.links.map((l) => ({ title: l?.title ?? "", url: l?.url, description: l?.description, imageUrl: l?.imageUrl, backgroundColor: l?.backgroundColor, fontStyle: l?.fontStyle })) : [],
      });
    }
  }, [step, storeData?.styleNotes]);

  const handleGenerateOneStyleNote = async () => {
    setStyleNotesLoading(true);
    setError(null);
    try {
      const existingTitles = styleNotes.links.map((l) => l.title).filter(Boolean);
      const result = await suggestOneStyleNoteUser({
        description: [name, description].filter(Boolean).join(". "),
        vibe: vibe || undefined,
        trend: trends || undefined,
        category: categories || undefined,
        existingTitles,
      });
      const card = result.card;
      const preset = STYLE_CARD_PRESETS[styleNotes.links.length % STYLE_CARD_PRESETS.length];
      const newIndex = styleNotes.links.length;
      setStyleNotes((prev) => ({
        ...prev,
        links: [
          ...prev.links,
          {
            title: card.title,
            description: card.description,
            backgroundColor: card.backgroundColor ?? preset.backgroundColor,
            fontStyle: card.fontStyle ?? preset.fontStyle,
          },
        ],
      }));
      setEditingCardIndex(newIndex);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generate failed");
    } finally {
      setStyleNotesLoading(false);
    }
  };

  const handleAddEmptyCard = () => {
    const preset = STYLE_CARD_PRESETS[styleNotes.links.length % STYLE_CARD_PRESETS.length];
    setStyleNotes((prev) => ({
      ...prev,
      links: [...prev.links, { title: "New tip", description: "", backgroundColor: preset.backgroundColor, fontStyle: preset.fontStyle }],
    }));
    setEditingCardIndex(styleNotes.links.length);
  };

  const handleUpdateCard = (index: number, updates: Partial<StyleCardLink>) => {
    setStyleNotes((prev) => ({
      ...prev,
      links: prev.links.map((link, i) => (i === index ? { ...link, ...updates } : link)),
    }));
  };

  const handleRemoveCard = (index: number) => {
    setStyleNotes((prev) => ({ ...prev, links: prev.links.filter((_, i) => i !== index) }));
    if (editingCardIndex === index) setEditingCardIndex(null);
    else if (editingCardIndex != null && editingCardIndex > index) setEditingCardIndex(editingCardIndex - 1);
  };

  const handleStyleNoteImageUpload = async (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingCardIndex(index);
    setError(null);
    try {
      const record = await uploadUserImage(file);
      let url = record.rawImageUrl;
      if (url && url.startsWith("/")) url = `${API_BASE}${url}`;
      handleUpdateCard(index, { imageUrl: url });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploadingCardIndex(null);
      e.target.value = "";
    }
  };

  const handleSaveStyleNotes = async () => {
    if (!storeId) return;
    setStyleNotesSaveLoading(true);
    setError(null);
    try {
      await updateMicrostoreUser(storeId, { styleNotes });
      await mutateStore();
      setStep(5);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setStyleNotesSaveLoading(false);
    }
  };

  const handleSubmitForApproval = async () => {
    if (!storeId) return;
    setSubmitLoading(true);
    setError(null);
    try {
      await submitMicrostoreForApprovalUser(storeId);
      router.push("/microstores");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Submit failed");
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleProduct = (id: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleProductSearch = async () => {
    if (!productSearchQuery.trim()) return;
    setProductSearchLoading(true);
    setError(null);
    try {
      const res = await searchProducts({ query: productSearchQuery.trim(), limit: 24 });
      const items = res.items || [];
      setProductPool(items.map((p) => ({
        id: p.id,
        title: p.title,
        brand: p.brand,
        variants: p.variants,
        images: p.images,
      })));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setProductSearchLoading(false);
    }
  };

  const handleSaveSelection = async () => {
    if (!storeId) return;
    setProductsSaveLoading(true);
    setError(null);
    try {
      await updateMicrostoreUser(storeId, {
        sections: [{ label: "All", productIds: Array.from(selectedProductIds) }],
      });
      await mutateStore();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setProductsSaveLoading(false);
    }
  };

  const handleSaveProductsAndNext = async () => {
    if (!storeId || selectedProductIds.size < 20) return;
    setProductsSaveLoading(true);
    setError(null);
    try {
      await updateMicrostoreUser(storeId, {
        sections: [{ label: "All", productIds: Array.from(selectedProductIds) }],
      });
      await mutateStore();
      setStep(4);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setProductsSaveLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link href="/microstores" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to stores
        </Link>
        <h1 className="mt-2 font-display text-2xl text-foreground">Create store</h1>
        <p className="mt-1 text-neutral-600">Fill in the steps below to create your microstore.</p>
      </div>

      <div className="flex gap-2 border-b border-border pb-2">
        {STEPS.map((label, i) => {
          const n = i + 1;
          const active = step === n;
          const done = n < step;
          const canGo = n <= step;
          return (
            <button
              key={n}
              type="button"
              onClick={() => canGo && setStep(n)}
              className={`rounded-soft-lg px-3 py-1.5 text-sm font-medium ${active ? "bg-primary-cta text-neutral-100" : done ? "bg-neutral-200 text-neutral-800" : "bg-neutral-100 text-neutral-500"} ${!canGo ? "cursor-not-allowed opacity-70" : ""}`}
            >
              {n}. {label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="rounded-soft-lg bg-red-50 p-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {step === 1 && (
        <section className="rounded-soft-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Step 1: Name & details</h2>
          <div>
            <label className="block text-sm font-medium text-neutral-700">Store idea / description</label>
            <textarea
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              placeholder="e.g. Casual denim for work, dark wash, office-appropriate"
              rows={3}
              className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
            />
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={suggestLoading || !descriptionInput.trim()}
            className="rounded-soft-lg bg-neutral-200 text-neutral-800 px-4 py-2 text-sm font-medium hover:bg-neutral-300 disabled:opacity-50"
          >
            {suggestLoading ? "Generating…" : "Generate name & details"}
          </button>
          <div className="grid gap-3 pt-2">
            <div>
              <label className="block text-sm font-medium text-neutral-700">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Store name (max 8 words)"
                className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
                className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
              />
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label className="block text-sm font-medium text-neutral-700">Vibe</label>
                <input
                  type="text"
                  value={vibe}
                  onChange={(e) => setVibe(e.target.value)}
                  className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Trends</label>
                <input
                  type="text"
                  value={trends}
                  onChange={(e) => setTrends(e.target.value)}
                  className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700">Categories</label>
                <input
                  type="text"
                  value={categories}
                  onChange={(e) => setCategories(e.target.value)}
                  className="mt-1 w-full rounded-soft-lg border border-border px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleNextFromStep1}
              disabled={createLoading || !name.trim()}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {createLoading ? "Creating…" : "Next →"}
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="rounded-soft-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Step 2: Cover image</h2>
          {currentCoverUrl && (
            <div className="aspect-[3/4] max-h-48 w-full rounded-soft-lg border border-border bg-neutral-100 overflow-hidden">
              <img src={currentCoverUrl} alt="Cover" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={coverLoading}
              className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              Upload image
            </button>
            <button
              type="button"
              onClick={handleGenerateCover}
              disabled={coverLoading}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {coverLoading ? "…" : "Generate with AI"}
            </button>
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(1)} className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium">
              ← Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium">
              Next →
            </button>
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="rounded-soft-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Step 3: Products</h2>
          <p className="text-sm text-neutral-600">Add products one or a few at a time. Save your selection anytime. You need at least 20 products to continue; publish is only allowed when all are added.</p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="text"
              value={productSearchQuery}
              onChange={(e) => setProductSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleProductSearch()}
              placeholder="Search products…"
              className="rounded-soft-lg border border-border px-3 py-1.5 text-sm w-48"
            />
            <button
              type="button"
              onClick={handleProductSearch}
              disabled={productSearchLoading || !productSearchQuery.trim()}
              className="rounded-soft-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
            >
              {productSearchLoading ? "Searching…" : "Search"}
            </button>
            <span className="text-sm text-neutral-600">
              Selected: <strong>{selectedProductIds.size}</strong> {selectedProductIds.size >= 20 ? "✓ (min 20)" : "(min 20 to continue)"}
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-h-[28rem] overflow-y-auto">
            {productPool.map((p) => {
              const img = p.images?.[0];
              const src = img?.src ?? (img as { url?: string })?.url;
              const checked = selectedProductIds.has(p.id);
              const price = p.variants?.[0]?.price ?? (p as { price?: string }).price ?? null;
              const brandName = p.brand?.name ?? null;
              return (
                <label
                  key={p.id}
                  className={`flex flex-col rounded-soft-lg border p-2 cursor-pointer ${checked ? "border-primary-cta bg-primary/5" : "border-border"}`}
                >
                  <div className="aspect-square bg-neutral-100 rounded-soft-lg overflow-hidden">
                    {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-neutral-400 text-xs">No image</div>}
                  </div>
                  <span className="mt-1 text-xs line-clamp-2 font-medium">{p.title || p.id}</span>
                  {brandName && <span className="text-xs text-neutral-500 line-clamp-1">{brandName}</span>}
                  {price != null && <span className="text-xs text-neutral-700">{typeof price === "string" && price.startsWith("₹") ? price : `₹${price}`}</span>}
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleProduct(p.id)}
                    className="mt-1"
                  />
                </label>
              );
            })}
          </div>
          {productPool.length === 0 && !suggestProductsData && <p className="text-sm text-neutral-500">Loading suggestions…</p>}
          <div className="flex flex-wrap gap-2 justify-between pt-2">
            <button type="button" onClick={() => setStep(2)} className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium">
              ← Back
            </button>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveSelection}
                disabled={productsSaveLoading}
                className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted disabled:opacity-50"
              >
                {productsSaveLoading ? "Saving…" : "Save selection"}
              </button>
              <button
                type="button"
                onClick={handleSaveProductsAndNext}
                disabled={productsSaveLoading || selectedProductIds.size < 20}
                className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
              >
                {productsSaveLoading ? "Saving…" : "Save & Next →"}
              </button>
            </div>
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="rounded-soft-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Step 4: Style notes</h2>
          <p className="text-sm text-neutral-600">Create style cards: colourful text on a background (use presets) or add an image. Generate one at a time with AI and edit it.</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleGenerateOneStyleNote}
              disabled={styleNotesLoading}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {styleNotesLoading ? "Generating…" : "Generate one card (AI)"}
            </button>
            <button
              type="button"
              onClick={handleAddEmptyCard}
              className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Add card (manual)
            </button>
          </div>
          <p className="text-xs text-neutral-500">Preview below shows cards exactly as they will appear on your store page.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {styleNotes.links.map((link, i) => (
              <div key={i} className="rounded-soft-xl border border-border overflow-hidden shadow-soft">
                {editingCardIndex === i ? (
                  <div className="p-3 space-y-2 bg-muted/30">
                    <input
                      type="text"
                      value={link.title}
                      onChange={(e) => handleUpdateCard(i, { title: e.target.value })}
                      placeholder="Title"
                      className="w-full rounded-soft-lg border border-border px-3 py-1.5 text-sm"
                    />
                    <textarea
                      value={link.description ?? ""}
                      onChange={(e) => handleUpdateCard(i, { description: e.target.value })}
                      placeholder="Description"
                      rows={2}
                      className="w-full rounded-soft-lg border border-border px-3 py-1.5 text-sm"
                    />
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-neutral-500">Preset:</span>
                      {STYLE_CARD_PRESETS.map((pre) => (
                        <button
                          key={pre.id}
                          type="button"
                          onClick={() => handleUpdateCard(i, { backgroundColor: pre.backgroundColor, fontStyle: pre.fontStyle })}
                          className="w-6 h-6 rounded-full border-2 border-neutral-300 hover:border-primary-cta"
                          style={{ backgroundColor: pre.backgroundColor }}
                          title={pre.name}
                        />
                      ))}
                    </div>
                    <div className="flex gap-2 items-center flex-wrap">
                      <input
                        type="text"
                        value={link.imageUrl ?? ""}
                        onChange={(e) => handleUpdateCard(i, { imageUrl: e.target.value || undefined })}
                        placeholder="Image URL (optional)"
                        className="flex-1 min-w-0 rounded-soft-lg border border-border px-3 py-1.5 text-sm"
                      />
                      <input
                        id={`style-note-upload-${i}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleStyleNoteImageUpload(i, e)}
                      />
                      <button
                        type="button"
                        onClick={() => document.getElementById(`style-note-upload-${i}`)?.click()}
                        disabled={uploadingCardIndex === i}
                        className="rounded-soft-lg border border-border px-3 py-1.5 text-sm font-medium hover:bg-muted disabled:opacity-50"
                      >
                        {uploadingCardIndex === i ? "Uploading…" : "Upload image"}
                      </button>
                    </div>
                    <div className="flex justify-between">
                      <button type="button" onClick={() => handleRemoveCard(i)} className="text-sm text-red-600 hover:underline">
                        Remove
                      </button>
                      <button type="button" onClick={() => setEditingCardIndex(null)} className="rounded-soft-lg bg-primary-cta text-neutral-100 px-3 py-1 text-sm">
                        Done
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setEditingCardIndex(i)}
                    className="w-full text-left block"
                  >
                    <StyleNoteCard
                      item={link}
                      compact
                      resolveImageUrl={(url) => (url.startsWith("/") ? `${API_BASE}${url}` : url)}
                    />
                  </button>
                )}
              </div>
            ))}
          </div>
          {styleNotes.links.length === 0 && <p className="text-sm text-neutral-500">No style cards yet. Click &quot;Generate one card (AI)&quot; or &quot;Add card (manual)&quot;.</p>}
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(3)} className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium">
              ← Back
            </button>
            <button
              type="button"
              onClick={handleSaveStyleNotes}
              disabled={styleNotesSaveLoading}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {styleNotesSaveLoading ? "Saving…" : "Save & Next →"}
            </button>
          </div>
        </section>
      )}

      {step === 5 && (
        <section className="rounded-soft-xl border border-border bg-card p-6 space-y-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500">Step 5: Submit</h2>
          <p className="text-sm text-neutral-600">Submit for admin approval or keep as draft and view your store.</p>
          {storeId && (
            <p className="text-sm text-neutral-700">
              Store: <strong>{name}</strong> — ID: <code className="rounded bg-neutral-200 px-1">{storeId}</code>
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSubmitForApproval}
              disabled={submitLoading}
              className="rounded-soft-lg bg-primary-cta text-neutral-100 px-4 py-2 text-sm font-medium hover:opacity-90 disabled:opacity-50"
            >
              {submitLoading ? "Submitting…" : "Submit for approval"}
            </button>
            <button
              type="button"
              onClick={() => storeId && router.push(`/microstores/${storeId}`)}
              className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium"
            >
              View store (keep draft)
            </button>
          </div>
          <div className="flex justify-between pt-2">
            <button type="button" onClick={() => setStep(4)} className="rounded-soft-lg border border-border px-4 py-2 text-sm font-medium">
              ← Back
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
