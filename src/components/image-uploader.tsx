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
const UPLOAD_TIMEOUT_MS = 60_000;

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
          const blob = await upload(`decks/${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
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
                    Retrying (connection dropped, attempt {img.retries + 1})
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
