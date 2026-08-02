"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

interface UploadedImage {
  url: string;
  uploading?: boolean;
  progress?: number;
  retries?: number;
  error?: string;
}

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const UPLOAD_TIMEOUT_MS = 120_000;
const COMPRESS_MAX_DIMENSION = 2000;
const COMPRESS_QUALITY = 0.85;
const COMPRESS_SKIP_UNDER_BYTES = 1.5 * 1024 * 1024;

// Phone camera photos (5-15MB HEIC/JPEG) take long enough to upload that something along
// the way reliably kills the transfer before it finishes. Shrinking the file client-side
// cuts transfer time dramatically and sidesteps whatever that is. Falls back to the
// original file untouched if decoding/encoding isn't supported for the given format.
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < COMPRESS_SKIP_UNDER_BYTES) return file;

  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  }
}

export function ImageUploader({
  initialImages = [],
  onImagesChange,
}: {
  initialImages?: { url: string }[];
  onImagesChange?: (urls: string[]) => void;
}) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map((i) => ({ url: i.url }))
  );

  useEffect(() => {
    onImagesChange?.(images.filter((i) => i.url).map((i) => i.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const newEntries: UploadedImage[] = Array.from(files).map(() => ({
      url: "",
      uploading: true,
    }));
    setImages((prev) => [...prev, ...newEntries]);
    const startIndex = images.length;

    await Promise.all(
      Array.from(files).map(async (file, i) => {
        if (file.size > MAX_FILE_BYTES) {
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = { url: "", error: "Photo too large (50MB max)" };
            return next;
          });
          return;
        }

        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
        let lastPercentage = 0;

        try {
          const uploadFile = await compressImage(file);
          const blob = await upload(`decks/${Date.now()}-${uploadFile.name}`, uploadFile, {
            access: "public",
            handleUploadUrl: "/api/upload",
            multipart: true,
            abortSignal: controller.signal,
            onUploadProgress: ({ percentage }) => {
              // The SDK retries the whole PUT on transient network errors (common on flaky
              // mobile connections) — progress dropping back down means a retry just kicked in.
              const isRetry = percentage < lastPercentage;
              lastPercentage = percentage;
              setImages((prev) => {
                const next = [...prev];
                next[startIndex + i] = {
                  ...next[startIndex + i],
                  uploading: true,
                  progress: percentage,
                  retries: isRetry ? (next[startIndex + i]?.retries ?? 0) + 1 : next[startIndex + i]?.retries,
                };
                return next;
              });
            },
          });
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = { url: blob.url };
            return next;
          });
        } catch (err) {
          const timedOut = controller.signal.aborted;
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = {
              url: "",
              error: timedOut
                ? "Upload timed out — check your connection and try again"
                : err instanceof Error
                  ? err.message
                  : "Upload failed",
            };
            return next;
          });
        } finally {
          clearTimeout(timeout);
        }
      })
    );
  }

  function removeImage(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="flex flex-col gap-3">
      <label className="text-sm font-medium text-felt-sub">Photos</label>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={i}
            className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border border-felt-line bg-felt-surface"
          >
            {img.uploading && (
              <span className="px-1 text-center text-xs text-felt-sub">
                Uploading{typeof img.progress === "number" ? ` ${Math.round(img.progress)}%` : "..."}
                {img.retries ? (
                  <>
                    <br />
                    Retrying upload (attempt {img.retries + 1})
                  </>
                ) : null}
              </span>
            )}
            {img.error && (
              <span className="px-1 text-center text-xs text-red-300">{img.error}</span>
            )}
            {img.url && (
              <>
                <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
                <input type="hidden" name="imageUrls" value={img.url} />
              </>
            )}
            {!img.uploading && (
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-felt-ink hover:bg-black"
                aria-label="Remove photo"
              >
                ×
              </button>
            )}
          </div>
        ))}
        <label className="flex h-28 w-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-felt-line text-felt-sub hover:border-brass hover:text-brass">
          <span className="text-2xl leading-none">+</span>
          <span className="text-xs">Add photo</span>
          <input
            type="file"
            accept="image/*"
            multiple
            capture="environment"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />
        </label>
      </div>
    </div>
  );
}
