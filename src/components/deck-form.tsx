"use client";

import { useActionState, useRef, useState } from "react";
import { ImageUploader } from "./image-uploader";
import { SeriesSelector, type SeriesOption } from "./series-selector";
import {
  CreatorMultiSelector,
  CreatorSelector,
  type CreatorOption,
} from "./creator-selector";
import { ALL_TAGS } from "@/lib/schemas";
import {
  COLLECTION_REASON_DETAILS,
  COLLECTION_REASON_VALUES,
  type CollectionReasonValue,
} from "@/lib/collection-reasons";
import type { DeckIdentification } from "@/lib/anthropic";
import type { DeckFormState } from "@/app/(app)/decks/actions";
import { splitLegacyDesignerCredit } from "@/lib/designers";

export interface DeckFormDefaultValues {
  name?: string;
  seriesId?: string;
  seriesName?: string;
  seriesRaw?: string;
  seriesOrder?: number | null;
  variantNote?: string;
  designers?: CreatorOption[];
  producerCreator?: CreatorOption;
  qty?: number;
  editionNumbers?: number[];
  productionRun?: number | null;
  releaseYear?: number | null;
  collectionReasonPrimary?: CollectionReasonValue;
  collectionReasonSecondary?: CollectionReasonValue;
  hook?: string;
  notes?: string;
  essay?: string;
  notesReviewedAt?: string;
  catalogNumber?: string;
  tags?: string[];
}

export function DeckForm({
  action,
  defaultValues = {},
  initialImages = [],
  creators,
  seriesOptions,
  submitLabel,
  enableAiIdentify = false,
  showEditorialFields = false,
}: {
  action: (prevState: DeckFormState, formData: FormData) => Promise<DeckFormState>;
  defaultValues?: DeckFormDefaultValues;
  initialImages?: { url: string }[];
  creators: CreatorOption[];
  seriesOptions: SeriesOption[];
  submitLabel: string;
  enableAiIdentify?: boolean;
  showEditorialFields?: boolean;
}) {
  const [state, formAction, pending] = useActionState<DeckFormState, FormData>(action, {});
  const [tags, setTags] = useState<string[]>(defaultValues.tags ?? []);
  const [imageUrls, setImageUrls] = useState<string[]>(initialImages.map((i) => i.url));
  const [editionNumbers, setEditionNumbers] = useState<string[]>(
    (defaultValues.editionNumbers ?? []).map(String)
  );
  const [qty, setQty] = useState<number>(defaultValues.qty ?? 1);
  const [designerSuggestions, setDesignerSuggestions] = useState<string[] | undefined>();
  const [producerSuggestion, setProducerSuggestion] = useState<string | undefined>();
  const [identifying, setIdentifying] = useState(false);
  const [identifyError, setIdentifyError] = useState<string | null>(null);
  const [identified, setIdentified] = useState(false);
  const [seriesSuggestion, setSeriesSuggestion] = useState<string | undefined>();
  const [primaryReason, setPrimaryReason] = useState<CollectionReasonValue | "">(
    defaultValues.collectionReasonPrimary ?? ""
  );
  const [secondaryReason, setSecondaryReason] = useState<CollectionReasonValue | "">(
    defaultValues.collectionReasonSecondary ?? ""
  );
  const [hook, setHook] = useState(defaultValues.hook ?? "");

  const nameRef = useRef<HTMLInputElement>(null);
  const productionRunRef = useRef<HTMLInputElement>(null);
  const releaseYearRef = useRef<HTMLInputElement>(null);
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
      if (result.series) setSeriesSuggestion(result.series);
      if (result.designer) setDesignerSuggestions(splitLegacyDesignerCredit(result.designer));
      if (result.producer) setProducerSuggestion(result.producer);
      if (result.deckNumber) {
        const detected = String(result.deckNumber);
        setEditionNumbers((prev) => (prev.includes(detected) ? prev : [...prev, detected]));
      }
      if (productionRunRef.current && result.productionRun)
        productionRunRef.current.value = String(result.productionRun);
      if (releaseYearRef.current && result.releaseYear)
        releaseYearRef.current.value = String(result.releaseYear);
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
        <Field label="Series" error={state?.fieldErrors?.seriesId}>
          <SeriesSelector
            options={seriesOptions}
            defaultSeriesId={defaultValues.seriesId}
            defaultSeriesName={defaultValues.seriesName}
            suggestedName={seriesSuggestion}
          />
          {defaultValues.seriesRaw && (
            <span className="text-xs text-felt-sub/70">
              Legacy value: {defaultValues.seriesRaw}
            </span>
          )}
        </Field>
        <Field label="Quantity">
          <input
            name="qty"
            type="number"
            min={1}
            defaultValue={defaultValues.qty ?? 1}
            onChange={(e) => setQty(Math.max(1, Number(e.target.value) || 1))}
            className={inputClass}
          />
        </Field>
        <Field label="Designers" error={state?.fieldErrors?.designerNames}>
          <CreatorMultiSelector
            options={creators}
            defaultCreators={defaultValues.designers}
            suggestedNames={designerSuggestions}
          />
          <span className="text-xs text-felt-sub/70">Add one credit per person, artist, or studio.</span>
        </Field>
        <Field label="Producer" error={state?.fieldErrors?.producer}>
          <CreatorSelector
            options={creators}
            names={{
              query: "producerQuery",
              creatorId: "producerCreatorId",
              newCreatorName: "newProducerName",
            }}
            defaultCreator={defaultValues.producerCreator}
            suggestedName={producerSuggestion}
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
        <Field label="Release year" error={state?.fieldErrors?.releaseYear}>
          <input
            ref={releaseYearRef}
            name="releaseYear"
            type="number"
            min={1}
            defaultValue={defaultValues.releaseYear ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Series order" error={state?.fieldErrors?.seriesOrder}>
          <input
            name="seriesOrder"
            type="number"
            min={1}
            defaultValue={defaultValues.seriesOrder ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <Field label="Variant note" error={state?.fieldErrors?.variantNote}>
        <input
          name="variantNote"
          maxLength={300}
          defaultValue={defaultValues.variantNote}
          placeholder="What distinguishes this Deck from related or similar editions?"
          className={inputClass}
        />
      </Field>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-felt-sub">Edition numbers</legend>
        {editionNumbers.length > 0 && (
          <div className="flex flex-col gap-2">
            {editionNumbers.map((num, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="number"
                  min={1}
                  required
                  name="editionNumbers"
                  placeholder="e.g. 391"
                  value={num}
                  onChange={(e) => {
                    const value = e.target.value;
                    setEditionNumbers((prev) => prev.map((n, idx) => (idx === i ? value : n)));
                  }}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => setEditionNumbers((prev) => prev.filter((_, idx) => idx !== i))}
                  className="text-xs text-felt-sub hover:text-brick"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
        <button
          type="button"
          onClick={() => setEditionNumbers((prev) => [...prev, ""])}
          disabled={editionNumbers.length >= qty}
          className="self-start rounded-md border border-felt-line px-3 py-1.5 text-xs text-felt-sub hover:border-brass hover:text-brass disabled:opacity-50"
        >
          + Add edition
        </button>
        {editionNumbers.length >= qty && (
          <span className="text-xs text-felt-sub/70">
            Can&rsquo;t have more editions than quantity ({qty})
          </span>
        )}
        {state?.fieldErrors?.editionNumbers && (
          <span className="text-xs text-red-300">{state.fieldErrors.editionNumbers}</span>
        )}
      </fieldset>

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

      {showEditorialFields && (
        <fieldset className="flex flex-col gap-5 border-t border-felt-line pt-6">
          <legend className="pr-3 font-display text-base font-semibold text-brass">
            Editorial
          </legend>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Primary collection reason"
              error={state?.fieldErrors?.collectionReasonPrimary}
            >
              <select
                name="collectionReasonPrimary"
                value={primaryReason}
                onChange={(event) =>
                  setPrimaryReason(event.target.value as CollectionReasonValue | "")
                }
                className={inputClass}
              >
                <option value="">No primary reason</option>
                {COLLECTION_REASON_VALUES.map((reason) => (
                  <option key={reason} value={reason} disabled={reason === secondaryReason}>
                    {COLLECTION_REASON_DETAILS[reason].label}
                  </option>
                ))}
              </select>
              {primaryReason && (
                <span className="text-xs leading-5 text-felt-sub/80">
                  {COLLECTION_REASON_DETAILS[primaryReason].description}
                </span>
              )}
            </Field>

            <Field
              label="Secondary collection reason"
              error={state?.fieldErrors?.collectionReasonSecondary}
            >
              <select
                name="collectionReasonSecondary"
                value={secondaryReason}
                onChange={(event) =>
                  setSecondaryReason(event.target.value as CollectionReasonValue | "")
                }
                className={inputClass}
              >
                <option value="">No secondary reason</option>
                {COLLECTION_REASON_VALUES.map((reason) => (
                  <option key={reason} value={reason} disabled={reason === primaryReason}>
                    {COLLECTION_REASON_DETAILS[reason].label}
                  </option>
                ))}
              </select>
              {secondaryReason && (
                <span className="text-xs leading-5 text-felt-sub/80">
                  {COLLECTION_REASON_DETAILS[secondaryReason].description}
                </span>
              )}
            </Field>
          </div>

          <Field label="Hook" error={state?.fieldErrors?.hook}>
            <input
              name="hook"
              value={hook}
              maxLength={240}
              onChange={(event) => setHook(event.target.value)}
              className={inputClass}
            />
            <span className="flex justify-between gap-3 text-xs text-felt-sub/80">
              <span>One sentence: why should someone care about this Deck?</span>
              <span className="shrink-0 tabular-nums">{hook.length} / 240</span>
            </span>
          </Field>
        </fieldset>
      )}

      <Field label={showEditorialFields ? "Note" : "Notes"} error={state?.fieldErrors?.notes}>
        <textarea
          ref={notesRef}
          name="notes"
          rows={3}
          defaultValue={defaultValues.notes}
          className={inputClass}
        />
        <span className="text-xs text-felt-sub/80">
          {showEditorialFields
            ? "Deck- or copy-specific collector commentary and concise factual context. Markdown is supported."
            : "Markdown is supported."}
        </span>
      </Field>

      {showEditorialFields && (
        <>
          <Field label="Essay" error={state?.fieldErrors?.essay}>
            <textarea
              name="essay"
              rows={10}
              defaultValue={defaultValues.essay}
              className={inputClass}
            />
            <span className="text-xs text-felt-sub/80">
              Long-form historical, artistic, acquisition, or research context. Markdown is
              supported.
            </span>
          </Field>

          <label className="flex items-start gap-2 rounded-md border border-felt-line bg-felt-surface/60 p-3">
            <input
              type="checkbox"
              name="notesReviewed"
              defaultChecked={Boolean(defaultValues.notesReviewedAt)}
              className="mt-0.5 accent-brass"
            />
            <span className="flex flex-col gap-1">
              <span className="text-sm font-medium text-felt-ink">
                Reviewed — current level of detail is sufficient.
              </span>
              <span className="text-xs leading-5 text-felt-sub/80">
                This records an explicit editorial review, including the decision that this Deck
                needs nothing beyond what it currently has. Clearing it removes the review date.
                {defaultValues.notesReviewedAt && (
                  <> Last reviewed {defaultValues.notesReviewedAt.slice(0, 10)}.</>
                )}
              </span>
            </span>
          </label>
        </>
      )}

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
