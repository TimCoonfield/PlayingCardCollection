"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";

interface UploadedImage {
  url: string;
  uploading?: boolean;
  progress?: number;
  error?: string;
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
        try {
          const blob = await upload(`decks/${Date.now()}-${file.name}`, file, {
            access: "public",
            handleUploadUrl: "/api/upload",
            multipart: true,
            onUploadProgress: ({ percentage }) => {
              setImages((prev) => {
                const next = [...prev];
                next[startIndex + i] = { ...next[startIndex + i], uploading: true, progress: percentage };
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
          setImages((prev) => {
            const next = [...prev];
            next[startIndex + i] = {
              url: "",
              error: err instanceof Error ? err.message : "Upload failed",
            };
            return next;
          });
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
              <span className="text-xs text-felt-sub">
                Uploading{typeof img.progress === "number" ? ` ${Math.round(img.progress)}%` : "..."}
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
