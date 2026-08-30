"use client";

import { useActionState, useRef, useState } from "react";
import { CoinPhotoSlots } from "./coin-photo-slots";
import { CreatorSelector, type CreatorOption } from "./creator-selector";
import { COIN_TAGS } from "@/lib/coin-schemas";
import type { CoinFormState } from "@/app/(app)/coins/actions";

export interface CoinFormDefaultValues {
  name?: string;
  series?: string;
  designerCreator?: CreatorOption;
  producerCreator?: CreatorOption;
  material?: string;
  diameter?: string;
  qty?: number;
  releaseYear?: number | null;
  notes?: string;
  catalogNumber?: string;
  tags?: string[];
}

export function CoinForm({
  action,
  defaultValues = {},
  initialObverseUrl,
  initialReverseUrl,
  creators,
  submitLabel,
}: {
  action: (prevState: CoinFormState, formData: FormData) => Promise<CoinFormState>;
  defaultValues?: CoinFormDefaultValues;
  initialObverseUrl?: string;
  initialReverseUrl?: string;
  creators: CreatorOption[];
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState<CoinFormState, FormData>(action, {});
  const [tags, setTags] = useState<string[]>(defaultValues.tags ?? []);

  const nameRef = useRef<HTMLInputElement>(null);
  const seriesRef = useRef<HTMLInputElement>(null);
  const materialRef = useRef<HTMLInputElement>(null);
  const notesRef = useRef<HTMLTextAreaElement>(null);

  return (
    <form action={formAction} className="flex flex-col gap-6 max-w-2xl">
      <CoinPhotoSlots initialObverseUrl={initialObverseUrl} initialReverseUrl={initialReverseUrl} />

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
        <Field label="Associated Deck" error={state?.fieldErrors?.series}>
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
          <CreatorSelector
            options={creators}
            names={{
              query: "designerQuery",
              creatorId: "designerCreatorId",
              newCreatorName: "newDesignerName",
            }}
            defaultCreator={defaultValues.designerCreator}
          />
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
          />
        </Field>
        <Field label="Material (e.g. brass, silver-plated)">
          <input ref={materialRef} name="material" defaultValue={defaultValues.material} className={inputClass} />
        </Field>
        <Field label="Diameter (e.g. 38mm)">
          <input name="diameter" defaultValue={defaultValues.diameter} className={inputClass} />
        </Field>
        <Field label="Catalog number">
          <input name="catalogNumber" defaultValue={defaultValues.catalogNumber} className={inputClass} />
        </Field>
        <Field label="Release year" error={state?.fieldErrors?.releaseYear}>
          <input
            name="releaseYear"
            type="number"
            min={1}
            defaultValue={defaultValues.releaseYear ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <fieldset className="flex flex-col gap-2">
        <legend className="mb-1 text-sm font-medium text-felt-sub">Tags</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {COIN_TAGS.map((tag) => (
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
        <span className="text-xs text-felt-sub/80">Markdown is supported.</span>
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
