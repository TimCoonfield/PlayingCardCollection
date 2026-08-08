"use client";

import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

interface UploadedImage {
  url: string;
  uploading?: boolean;
  stage?: "permission" | "transfer";
  error?: string;
}

export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const UPLOAD_TIMEOUT_MS = 30_000;
const COMPRESS_MAX_DIMENSION = 2000;
const COMPRESS_QUALITY = 0.85;
const COMPRESS_SKIP_UNDER_BYTES = 1.5 * 1024 * 1024;
const COMPRESS_TIMEOUT_MS = 8_000;

export function requestBlobCleanup(url: string): void {
  void fetch("/api/upload", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ url }),
    keepalive: true,
  }).catch(() => {
    // Cleanup is best-effort; the save action gets another chance for persisted images.
  });
}

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("compression timed out")), ms);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

// Phone camera photos (5-15MB HEIC/JPEG) take long enough to upload that something along
// the way reliably kills the transfer before it finishes. Shrinking the file client-side
// cuts transfer time dramatically and sidesteps whatever that is. Falls back to the
// original file untouched if decoding/encoding isn't supported, or doesn't finish quickly
// (e.g. createImageBitmap can hang indefinitely on HEIC in some Safari versions instead of
// erroring, so we decode via <img> — the same path Safari uses for HEIC previews — and cap
// every step with a timeout so a stuck decode can never block the upload).
export async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.size < COMPRESS_SKIP_UNDER_BYTES) return file;

  let objectUrl: string | null = null;
  try {
    objectUrl = URL.createObjectURL(file);
    const url = objectUrl;
    const img = await withTimeout(
      new Promise<HTMLImageElement>((resolve, reject) => {
        const el = new window.Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error("decode failed"));
        el.src = url;
      }),
      COMPRESS_TIMEOUT_MS
    );

    const scale = Math.min(1, COMPRESS_MAX_DIMENSION / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, width, height);

    const blob = await withTimeout(
      new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", COMPRESS_QUALITY)),
      COMPRESS_TIMEOUT_MS
    );
    if (!blob || blob.size >= file.size) return file;

    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], name, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
  }
}

export function ImageUploader({
  initialImages = [],
  onImagesChange,
  pathPrefix = "decks",
}: {
  initialImages?: { url: string }[];
  onImagesChange?: (urls: string[]) => void;
  pathPrefix?: string;
}) {
  const [images, setImages] = useState<UploadedImage[]>(
    initialImages.map((i) => ({ url: i.url }))
  );
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [reorderMessage, setReorderMessage] = useState("");
  const dragIndexRef = useRef<number | null>(null);
  const completedImageCount = images.filter((image) => image.url).length;
  const canReorder = completedImageCount > 1 && !images.some((image) => image.uploading);

  useEffect(() => {
    onImagesChange?.(images.filter((i) => i.url).map((i) => i.url));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;

    const newEntries: UploadedImage[] = Array.from(files).map(() => ({
      url: "",
      uploading: true,
      stage: "permission",
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
        let uploadFileSize = file.size;

        try {
          const uploadFile = await compressImage(file);
          uploadFileSize = uploadFile.size;
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = { ...next[startIndex + i], uploading: true, stage: "transfer" };
            return next;
          });
          // Deliberately no onUploadProgress here: passing one forces the SDK onto a
          // streamed-fetch path (ReadableStream body, re-chunked to 64KB, duplex: "half")
          // instead of sending the file as a plain body — and that streaming path is where
          // uploads have been consistently stalling. Without it, the SDK just sends the file
          // directly, which is much more broadly supported.
          const blob = await upload(`${pathPrefix}/${Date.now()}-${uploadFile.name}`, uploadFile, {
            access: "public",
            handleUploadUrl: "/api/upload",
            abortSignal: controller.signal,
          });
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = { url: blob.url };
            return next;
          });
        } catch (err) {
          const timedOut = controller.signal.aborted;
          const diag = `${Math.round(uploadFileSize / 1024)}KB`;
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = {
              url: "",
              error: timedOut
                ? `Upload timed out (${diag})`
                : `${err instanceof Error ? err.message : "Upload failed"} (${diag})`,
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
    const url = images[index]?.url;
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (url) requestBlobCleanup(url);
  }

  function moveImage(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex) return;
    setImages((prev) => {
      if (!prev[fromIndex] || !prev[toIndex]) return prev;
      const next = [...prev];
      const [moved] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, moved);
      return next;
    });
  }

  function startDrag(event: ReactPointerEvent<HTMLButtonElement>, index: number) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    dragIndexRef.current = index;
    setDragIndex(index);
    setReorderMessage("");
  }

  function continueDrag(event: ReactPointerEvent<HTMLButtonElement>) {
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null) return;
    event.preventDefault();

    const target = document
      .elementFromPoint(event.clientX, event.clientY)
      ?.closest<HTMLElement>("[data-photo-index]");
    const toIndex = Number(target?.dataset.photoIndex);
    if (!Number.isInteger(toIndex) || toIndex === fromIndex) return;

    moveImage(fromIndex, toIndex);
    dragIndexRef.current = toIndex;
    setDragIndex(toIndex);
  }

  function finishDrag() {
    const finalIndex = dragIndexRef.current;
    if (finalIndex !== null) {
      setReorderMessage(
        finalIndex === 0
          ? "Photo moved to the main position."
          : `Photo moved to position ${finalIndex + 1}.`
      );
    }
    dragIndexRef.current = null;
    setDragIndex(null);
  }

  function handleReorderKey(event: KeyboardEvent<HTMLButtonElement>, index: number) {
    let nextIndex = index;
    if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = index - 1;
    if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = index + 1;
    if (event.key === "Home") nextIndex = 0;
    if (event.key === "End") nextIndex = images.length - 1;
    nextIndex = Math.max(0, Math.min(nextIndex, images.length - 1));
    if (nextIndex === index) return;

    event.preventDefault();
    moveImage(index, nextIndex);
    setReorderMessage(
      nextIndex === 0
        ? "Photo moved to the main position."
        : `Photo moved to position ${nextIndex + 1}.`
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-baseline justify-between gap-3">
        <label className="text-sm font-medium text-felt-sub">Photos</label>
        {canReorder && (
          <span className="text-xs text-felt-sub">Drag the handle to reorder</span>
        )}
      </div>
      <div className="flex flex-wrap gap-3">
        {images.map((img, i) => (
          <div
            key={img.url || `pending-${i}`}
            data-photo-index={img.url ? i : undefined}
            className={`relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border bg-felt-surface transition-[border-color,transform,box-shadow] ${
              dragIndex === i
                ? "z-10 scale-[1.04] border-brass shadow-lg shadow-black/35"
                : "border-felt-line"
            }`}
          >
            {img.uploading && (
              <span className="px-1 text-center text-xs text-felt-sub">
                {img.stage === "permission" ? "Requesting permission..." : "Uploading..."}
              </span>
            )}
            {img.error && (
              <span className="px-1 text-center text-xs text-red-300">{img.error}</span>
            )}
            {img.url && (
              <>
                <Image src={img.url} alt="" fill sizes="112px" className="object-cover" />
                <input type="hidden" name="imageUrls" value={img.url} />
                {i === 0 && (
                  <span className="absolute left-1 top-1 rounded bg-brass px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-felt-bg">
                    Main
                  </span>
                )}
                {canReorder && (
                  <button
                    type="button"
                    onPointerDown={(event) => startDrag(event, i)}
                    onPointerMove={continueDrag}
                    onPointerUp={finishDrag}
                    onPointerCancel={finishDrag}
                    onKeyDown={(event) => handleReorderKey(event, i)}
                    className="absolute bottom-1 left-1 flex h-7 min-w-7 touch-none cursor-grab items-center justify-center rounded bg-black/75 px-1.5 text-base leading-none text-felt-ink shadow-sm active:cursor-grabbing"
                    aria-label={`Reorder photo ${i + 1}. Use arrow keys to move it.`}
                    title="Drag to reorder"
                  >
                    ⠿
                  </button>
                )}
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
      <p className="sr-only" aria-live="polite">
        {reorderMessage}
      </p>
    </div>
  );
}
