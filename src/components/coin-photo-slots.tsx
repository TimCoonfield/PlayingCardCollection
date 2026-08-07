"use client";

import { useState } from "react";
import Image from "next/image";
import { upload } from "@vercel/blob/client";
import {
  compressImage,
  requestBlobCleanup,
  MAX_FILE_BYTES,
  UPLOAD_TIMEOUT_MS,
} from "./image-uploader";

interface SlotState {
  url: string;
  uploading?: boolean;
  stage?: "permission" | "transfer";
  error?: string;
}

function PhotoSlot({
  label,
  name,
  slot,
  onUpload,
  onRemove,
}: {
  label: string;
  name: string;
  slot: SlotState;
  onUpload: (file: File) => void;
  onRemove: () => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-felt-sub">{label}</span>
      <div className="relative flex h-28 w-28 items-center justify-center overflow-hidden rounded-md border border-felt-line bg-felt-surface">
        {slot.uploading && (
          <span className="px-1 text-center text-xs text-felt-sub">
            {slot.stage === "permission" ? "Requesting permission..." : "Uploading..."}
          </span>
        )}
        {slot.error && (
          <span className="px-1 text-center text-xs text-red-300">{slot.error}</span>
        )}
        {slot.url && !slot.uploading && (
          <>
            <Image src={slot.url} alt={label} fill sizes="112px" className="object-cover" />
            <input type="hidden" name={name} value={slot.url} />
          </>
        )}
        {!slot.url && !slot.uploading && !slot.error && (
          <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 text-felt-sub hover:text-brass">
            <span className="text-2xl leading-none">+</span>
            <span className="text-xs">Add photo</span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        )}
        {!slot.uploading && (slot.url || slot.error) && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/70 text-xs text-felt-ink hover:bg-black"
            aria-label={`Remove ${label} photo`}
          >
            ×
          </button>
        )}
      </div>
    </div>
  );
}

export function CoinPhotoSlots({
  initialObverseUrl,
  initialReverseUrl,
}: {
  initialObverseUrl?: string;
  initialReverseUrl?: string;
}) {
  const [obverse, setObverse] = useState<SlotState>({ url: initialObverseUrl ?? "" });
  const [reverse, setReverse] = useState<SlotState>({ url: initialReverseUrl ?? "" });

  async function handleUpload(
    file: File,
    setSlot: React.Dispatch<React.SetStateAction<SlotState>>
  ) {
    if (file.size > MAX_FILE_BYTES) {
      setSlot({ url: "", error: "Photo too large (50MB max)" });
      return;
    }

    setSlot({ url: "", uploading: true, stage: "permission" });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT_MS);
    let uploadFileSize = file.size;

    try {
      const uploadFile = await compressImage(file);
      uploadFileSize = uploadFile.size;
      setSlot({ url: "", uploading: true, stage: "transfer" });

      const blob = await upload(`coins/${Date.now()}-${uploadFile.name}`, uploadFile, {
        access: "public",
        handleUploadUrl: "/api/upload",
        abortSignal: controller.signal,
      });
      setSlot({ url: blob.url });
    } catch (err) {
      const timedOut = controller.signal.aborted;
      const diag = `${Math.round(uploadFileSize / 1024)}KB`;
      setSlot({
        url: "",
        error: timedOut
          ? `Upload timed out (${diag})`
          : `${err instanceof Error ? err.message : "Upload failed"} (${diag})`,
      });
    } finally {
      clearTimeout(timeout);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-felt-sub">Photos</span>
      <div className="flex flex-wrap gap-3">
        <PhotoSlot
          label="Obverse"
          name="obverseImageUrl"
          slot={obverse}
          onUpload={(file) => handleUpload(file, setObverse)}
          onRemove={() => {
            if (obverse.url) requestBlobCleanup(obverse.url);
            setObverse({ url: "" });
          }}
        />
        <PhotoSlot
          label="Reverse"
          name="reverseImageUrl"
          slot={reverse}
          onUpload={(file) => handleUpload(file, setReverse)}
          onRemove={() => {
            if (reverse.url) requestBlobCleanup(reverse.url);
            setReverse({ url: "" });
          }}
        />
      </div>
    </div>
  );
}
