"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  compressImage,
  MAX_FILE_BYTES,
  requestBlobCleanup,
  UPLOAD_TIMEOUT_MS,
} from "./image-uploader";

export function SeriesHeroUploader({
  value,
  persistedValue,
  error,
  onChange,
  onUploadingChange,
}: {
  value: string;
  persistedValue: string;
  error?: string;
  onChange: (url: string) => void;
  onUploadingChange: (uploading: boolean) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string>();

  async function handleFile(file: File | undefined) {
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setUploadError("Image too large (50MB max)");
      return;
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    let uploadFileSize = file.size;
    setUploading(true);
    onUploadingChange(true);
    setUploadError(undefined);

    try {
      const uploadFile = await compressImage(file);
      uploadFileSize = uploadFile.size;
      const blob = await upload(`series/${Date.now()}-${uploadFile.name}`, uploadFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        abortSignal: controller.signal,
      });

      if (value && value !== persistedValue) requestBlobCleanup(value);
      onChange(blob.url);
    } catch (uploadFailure) {
      const size = `${Math.round(uploadFileSize / 1024)}KB`;
      setUploadError(
        controller.signal.aborted
          ? `Upload timed out (${size})`
          : `${uploadFailure instanceof Error ? uploadFailure.message : "Upload failed"} (${size})`
      );
    } finally {
      clearTimeout(timeout);
      setUploading(false);
      onUploadingChange(false);
    }
  }

  function removeImage() {
    if (value && value !== persistedValue) requestBlobCleanup(value);
    onChange("");
    setUploadError(undefined);
  }

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-medium text-felt-sub">Hero image</span>
      <input type="hidden" name="heroImageUrl" value={value} />

      {value ? (
        <div className="relative aspect-[16/7] w-full overflow-hidden rounded-md border border-felt-line bg-felt-bg">
          <Image src={value} alt="Current Series hero" fill sizes="640px" className="object-cover" />
        </div>
      ) : (
        <div className="flex aspect-[16/7] w-full items-center justify-center rounded-md border border-dashed border-felt-line bg-felt-bg px-4 text-center text-xs text-felt-sub">
          No custom image. The Series will use its engraved suit artwork.
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="rounded-md border border-brass/60 px-3 py-1.5 text-xs font-semibold text-brass hover:bg-brass/10 disabled:cursor-wait disabled:opacity-60"
        >
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
        </button>
        {value && (
          <button
            type="button"
            disabled={uploading}
            onClick={removeImage}
            className="px-2 py-1.5 text-xs text-felt-sub hover:text-felt-ink disabled:opacity-60"
          >
            Remove
          </button>
        )}
        <span className="text-xs text-felt-sub/70">JPEG, PNG, WebP, HEIC, or HEIF · 50MB max</span>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          void handleFile(file);
        }}
      />

      {(error || uploadError) && <span className="text-xs text-red-300">{uploadError ?? error}</span>}
    </div>
  );
}
