"use client";

import { fetchProduct } from "@/lib/api/products";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import type { ProductDetail } from "@/lib/api/products";

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError("");
    fetchProduct(id)
      .then(setProduct)
      .catch(() => setError("Product not found"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><p className="text-gray-500">Loading…</p></div>;
  if (error || !product) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <p className="text-red-600">{error || "Not found"}</p>
        <Link href="/browse" className="text-gray-700 hover:underline">Back to browse</Link>
      </div>
    );
  }

  const img = product.images?.[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b bg-white px-4 py-3">
        <Link href="/browse" className="text-gray-600 hover:text-gray-900">← Back to browse</Link>
      </header>
      <main className="max-w-4xl mx-auto p-4 md:p-8">
        <div className="grid md:grid-cols-2 gap-8 bg-white rounded-xl border p-6">
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {img ? (
              <img src={img.src} alt={img.alt || product.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No image</div>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-semibold">{product.title}</h1>
            {product.brand && (
              <p className="text-gray-600 mt-1">{product.brand.name}</p>
            )}
            {product.variants?.length ? (
              <p className="mt-4 text-lg font-medium">
                From ₹{product.variants[0].price}
              </p>
            ) : null}
            {product.descriptionHtml && (
              <div
                className="mt-4 text-gray-700 prose prose-sm max-w-none"
                dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
