"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import {
  getStorageStatus,
  storageTestUpload,
  storageTestVerify,
  type StorageStatus,
  type StorageTestUploadResult,
  type StorageTestVerifyResult,
} from "@/lib/api/admin";
import { getStoredToken } from "@/lib/auth/storage";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3002";

export default function StorageTestPage() {
  const [status, setStatus] = useState<StorageStatus | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<StorageTestUploadResult | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<StorageTestVerifyResult | null>(null);
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [previewBlobUrl, setPreviewBlobUrl] = useState<string | null>(null);
  const previewBlobRef = useRef<string | null>(null);

  useEffect(() => {
    getStorageStatus()
      .then(setStatus)
      .catch((err) => setStatusError(err instanceof Error ? err.message : "Failed to load status"));
  }, []);

  // Load preview via proxy for R2 (bucket URL is not public-read); revoke previous blob URL
  useEffect(() => {
    if (!uploadResult?.key || uploadResult.storageMode !== "r2") {
      if (previewBlobRef.current) {
        URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = null;
      }
      setPreviewBlobUrl(null);
      return;
    }
    const token = getStoredToken();
    const proxyUrl = `${API_BASE}/api/admin/storage-test/proxy?key=${encodeURIComponent(uploadResult.key)}`;
    fetch(proxyUrl, { headers: token ? { Authorization: `Bearer ${token}` } : {} })
      .then((res) => (res.ok ? res.blob() : null))
      .then((blob) => {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        if (blob) {
          const url = URL.createObjectURL(blob);
          previewBlobRef.current = url;
          setPreviewBlobUrl(url);
        } else {
          previewBlobRef.current = null;
          setPreviewBlobUrl(null);
        }
      })
      .catch(() => {
        if (previewBlobRef.current) URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = null;
        setPreviewBlobUrl(null);
      });
    return () => {
      if (previewBlobRef.current) {
        URL.revokeObjectURL(previewBlobRef.current);
        previewBlobRef.current = null;
      }
    };
  }, [uploadResult?.key, uploadResult?.storageMode]);

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    setUploadResult(null);
    setVerifyResult(null);
    setVerifyError(null);
    try {
      const result = await storageTestUpload(file);
      setUploadResult(result);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleVerify = async () => {
    const url = uploadResult?.url;
    if (!url) return;
    setVerifying(true);
    setVerifyError(null);
    setVerifyResult(null);
    try {
      // For R2, backend uses HeadObject (same URL). For local, backend fetches API_BASE + url.
      const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
      const result = await storageTestVerify(fullUrl);
      setVerifyResult(result);
    } catch (err) {
      setVerifyError(err instanceof Error ? err.message : "Verify request failed");
    } finally {
      setVerifying(false);
    }
  };

  const previewSrc =
    uploadResult?.storageMode === "r2" && previewBlobUrl
      ? previewBlobUrl
      : uploadResult?.url
        ? uploadResult.url.startsWith("http")
          ? uploadResult.url
          : `${API_BASE}${uploadResult.url}`
        : null;

  return (
    <>
      <div className="mb-6">
        <Link href="/admin" className="text-sm text-neutral-600 hover:text-foreground">
          ← Back to Dashboard
        </Link>
      </div>
      <h1 className="text-2xl font-semibold">R2 / Image storage test</h1>
        <p className="mt-2 text-neutral-600">
          Upload an image to check if storage (R2 or local) is working, then verify the stored URL is reachable.
        </p>

        {/* Storage status */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-2">Storage status</h2>
          {statusError && (
            <p className="text-red-600 text-sm">{statusError}</p>
          )}
          {status && (
            <ul className="text-sm space-y-1">
              <li>
                <span className="font-medium">R2 enabled (env):</span>{" "}
                {status.r2Enabled ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-amber-600">No (using local)</span>
                )}
              </li>
              <li>
                <span className="font-medium">R2 client available:</span>{" "}
                {status.r2Available ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-amber-600">No</span>
                )}
              </li>
            </ul>
          )}
        </section>

        {/* Upload */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">1. Upload image</h2>
          <p className="text-sm text-neutral-600 mb-3">Choose an image (JPEG, PNG, WebP, GIF). It will be stored under admin-test/.</p>
          <div className="flex flex-wrap items-end gap-3">
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={(e) => {
                const f = e.target.files?.[0];
                setFile(f || null);
                setUploadResult(null);
                setUploadError(null);
                setVerifyResult(null);
              }}
              className="block text-sm text-neutral-600 file:mr-2 file:rounded file:border-0 file:bg-neutral-100 file:px-3 file:py-2 file:text-sm file:font-medium"
            />
            <button
              type="button"
              onClick={handleUpload}
              disabled={!file || uploading}
              className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? "Uploading…" : "Upload"}
            </button>
          </div>
          {uploadError && (
            <p className="mt-3 text-red-600 text-sm" role="alert">{uploadError}</p>
          )}
          {uploadResult && (
            <div className="mt-3 p-3 rounded-soft-lg bg-neutral-100 text-sm space-y-1">
              <p><span className="font-medium">Storage:</span> {uploadResult.storageMode}</p>
              <p><span className="font-medium">Key:</span> {uploadResult.key}</p>
              <p><span className="font-medium">Size:</span> {uploadResult.size} bytes</p>
              <p className="break-all"><span className="font-medium">URL:</span> {uploadResult.url}</p>
            </div>
          )}
        </section>

        {/* Test store (verify) */}
        <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card shadow-soft">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">2. Test store</h2>
          <p className="text-sm text-neutral-600 mb-3">
            After uploading, click below to verify the stored file is reachable (backend fetches the URL).
          </p>
          <button
            type="button"
            onClick={handleVerify}
            disabled={!uploadResult?.url || verifying}
            className="px-4 py-2 rounded bg-primary-cta text-neutral-100 text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {verifying ? "Verifying…" : "Verify URL"}
          </button>
          {verifyError && (
            <p className="mt-3 text-red-600 text-sm" role="alert">{verifyError}</p>
          )}
          {verifyResult && (
            <div className="mt-3 p-3 rounded-soft-lg bg-neutral-100 text-sm space-y-1">
              <p>
                <span className="font-medium">Reachable:</span>{" "}
                {verifyResult.ok ? (
                  <span className="text-green-600">Yes</span>
                ) : (
                  <span className="text-red-600">No</span>
                )}
              </p>
              {verifyResult.statusCode != null && (
                <p><span className="font-medium">Status:</span> {verifyResult.statusCode}</p>
              )}
              {verifyResult.contentType && (
                <p><span className="font-medium">Content-Type:</span> {verifyResult.contentType}</p>
              )}
              {verifyResult.error && (
                <p className="text-red-600">{verifyResult.error}</p>
              )}
            </div>
          )}
        </section>

        {uploadResult?.url && (
          <section className="mt-8 p-4 rounded-soft-xl border border-border bg-card shadow-soft">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-500 mb-3">Preview</h2>
            <p className="text-sm text-neutral-600 mb-2">
              {uploadResult.storageMode === "r2"
                ? "R2: image loaded via proxy (bucket is not public-read)."
                : "Local: image served from backend /uploads."}
            </p>
            {previewSrc ? (
              <img
                src={previewSrc}
                alt="Uploaded"
                className="max-w-full max-h-64 object-contain border border-border rounded"
              />
            ) : uploadResult.storageMode === "r2" ? (
              <p className="text-sm text-amber-600">Loading preview…</p>
            ) : null}
          </section>
        )}
    </>
  );
}
