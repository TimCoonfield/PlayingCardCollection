"use client";

import { useActionState, useRef, useState } from "react";
import { ImageUploader } from "./image-uploader";
import { ALL_TAGS } from "@/lib/schemas";
import type { DeckIdentification } from "@/lib/anthropic";
import type { DeckFormState } from "@/app/(app)/decks/actions";

export interface DeckFormDefaultValues {
  name?: string;
  series?: string;
  designer?: string;
  producer?: string;
  qty?: number;
  deckNumber?: number | null;
  productionRun?: number | null;
  notes?: string;
  catalogNumber?: string;
  tags?: string[];
}

export function DeckForm({
  action,
  defaultValues = {},
  initialImages = [],
  designers,
  producers,
  submitLabel,
  enableAiIdentify = false,
}: {
  action: (prevState: DeckFormState, formData: FormData) => Promise<DeckFormState>;
  defaultValues?: DeckFormDefaultValues;
  initialImages?: { url: string }[];
  designers: string[];
  producers: string[];
  submitLabel: string;
  enableAiIdentify?: boolean;
}) {
  const [state, formAction, pending] = useActionState<DeckFormState, FormData>(action, {});
  const [tags, setTags] = useState<string[]>(defaultValues.tags ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages.map((i) => i.url));
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identified, setIdentified] = useState(false);

  const nameRef = useRef<HTMLInputElement>(null);
  const seriesRef = useRef<HTMLInputElement>(null);
  const designerRef = useRef<HTMLInputElement>(null);
  const producerRef = useRef<HTMLInputElement>(null);
  const deckNumberRef = useRef<HTMLInputElement>(null);
  const productionRunRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  async function handleIdentify() {
    if (imageUrls.length === 0) return;
    setIdentifying(true);
    setIdentifyError(null);
    try {
      const res = await fetch("/api/ai/identify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageUrls }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error ?? "Identification failed");
      }
      const result = data as DeckIdentification;
      if (nameRef.current && result.name) nameRef.current.value = result.name;
      if (seriesRef.current && result.series) seriesRef.current.value = result.series;
      if (designerRef.current && result.designer) designerRef.current.value = result.designer;
      if (producerRef.current && result.producer) producerRef.current.value = result.producer;
      if (deckNumberRef.current && result.deckNumber)
        deckNumberRef.current.value = String(result.deckNumber);
      if (productionRunRef.current && result.productionRun)
        productionRunRef.current.value = String(result.productionRun);
      if (notesRef.current && result.notes) notesRef.current.value = result.notes;
      if (result.tags?.length) setTags((prev) => Array.from(new Set([...prev, ...result.tags])));
      setIdentified(true);
    } catch (err) {
      setIdentifyError(err instanceof Error ? err.message : "Identification failed");
    } finally {
      setIdentifying(false);
    }
  }

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-2xl">
      <ImageUploader initialImages={initialImages} onImagesChange={setImageUrls} />

      {enableAiIdentify && (
        <div className="flex flex-col gap-2 rounded-md border border-felt-line bg-felt-surface/60 p-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleIdentify}
              disabled={imageUrls.length === 0 || identifying}
              className="rounded-md border border-brass text-brass px-3 py-1.5 text-sm hover:bg-felt-surface-2 disabled:opacity-50"
            >
              {identifying ? "Identifying..." : "✨ Identify with AI"}
            </button>
            <span className="text-xs text-felt-sub">
              {imageUrls.length === 0
                ? "Add a photo first"
                : "Uses the photo(s) above to pre-fill fields below"}
            </span>
          </div>
          {identifyError && <p className="text-xs text-red-300">{identifyError}</p>}
          {identified && !identifyError && (
            <p className="text-xs text-sage">
              Filled in fields below from the photo — please review before saving.
            </p>
          )}
        </div>
      )}

      {state?.error && (
        <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}

      <Field label="Name" error={state?.fieldErrors?.name} required>
        <input
          ref={nameRef}
          name="name"
          defaultValue={defaultValues.name}
          required
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Series" error={state?.fieldErrors?.series}>
          <input ref={seriesRef} name="series" defaultValue={defaultValues.series} className={inputClass} />
        </Field>
        <Field label="Quantity">
          <input
            name="qty"
            type="number"
            min={1}
            defaultValue={defaultValues.qty ?? 1}
            className={inputClass}
          />
        </Field>
        <Field label="Designer" error={state?.fieldErrors?.designer}>
          <input
            ref={designerRef}
            name="designer"
            list="designer-options"
            defaultValue={defaultValues.designer}
            className={inputClass}
          />
          <datalist id="designer-options">
            {designers.map((d) => (
              <option key={d} value={d} />
            ))}
          </datalist>
        </Field>
        <Field label="Producer" error={state?.fieldErrors?.producer}>
          <input
            ref={producerRef}
            name="producer"
            list="producer-options"
            defaultValue={defaultValues.producer}
            className={inputClass}
          />
          <datalist id="producer-options">
            {producers.map((p) => (
              <option key={p} value={p} />
            ))}
          </datalist>
        </Field>
        <Field label="Edition # (e.g. 391)">
          <input
            ref={deckNumberRef}
            name="deckNumber"
            type="number"
            min={1}
            defaultValue={defaultValues.deckNumber ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Production run (e.g. 700)">
          <input
            ref={productionRunRef}
            name="productionRun"
            type="number"
            min={1}
            defaultValue={defaultValues.productionRun ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Catalog number">
          <input name="catalogNumber" defaultValue={defaultValues.catalogNumber} className={inputClass} />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-felt-sub">Tags</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {ALL_TAGS.map((tag) => (
            <label key={tag} className="flex items-center gap-1.5 text-sm text-felt-sub">
              <input
                type="checkbox"
                name="tags"
                value={tag}
                checked={tags.includes(tag)}
                onChange={(e) =>
                  setTags((prev) =>
                    e.target.checked ? [...prev, tag] : prev.filter((t) => t !== tag)
                  )
                }
                className="accent-brass"
              />
              {tag}
            </label>
          ))}
        </div>
      </fieldset>

      <Field label="Notes">
        <textarea
          ref={notesRef}
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes}
          className={inputClass}
        />
      </Field>

      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-brass px-4 py-2 text-sm font-semibold text-felt-bg hover:bg-brass-deep disabled:opacity-60"
      >
        {pending ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass";

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-felt-sub">
        {label}
        {required && <span className="text-felt-sub/70"> *</span>}
      </span>
      {children}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
