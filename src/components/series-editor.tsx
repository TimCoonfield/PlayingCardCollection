"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import type { SeriesFormState } from "@/app/(app)/series/actions";
import { requestBlobCleanup } from "./image-uploader";
import { PencilIcon } from "./icons";
import { SeriesHeroUploader } from "./series-hero-uploader";

export interface SeriesEditorValues {
  name: string;
  subtitle: string | null;
  attributionLabel: string | null;
  attributionText: string | null;
  description: string | null;
  heroImageUrl: string | null;
}

export function SeriesEditor({
  action,
  values,
}: {
  action: (state: SeriesFormState, formData: FormData) => Promise<SeriesFormState>;
  values: SeriesEditorValues;
}) {
  const [open, setOpen] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(values.heroImageUrl ?? "");
  const [heroUploading, setHeroUploading] = useState(false);
  const [persistedHeroUrl, setPersistedHeroUrl] = useState(values.heroImageUrl ?? "");
  const persistedHeroUrlRef = useRef(values.heroImageUrl ?? "");
  const currentHeroUrl = useRef(values.heroImageUrl ?? "");
  const submittedHeroUrl = useRef<string | undefined>(undefined);
  const [state, formAction, pending] = useActionState(action, {});

  useEffect(() => {
    currentHeroUrl.current = heroImageUrl;
  }, [heroImageUrl]);

  useEffect(() => {
    function cleanupUnsavedHero() {
      if (currentHeroUrl.current && currentHeroUrl.current !== persistedHeroUrlRef.current) {
        requestBlobCleanup(currentHeroUrl.current);
      }
    }

    window.addEventListener("pagehide", cleanupUnsavedHero);
    return () => {
      window.removeEventListener("pagehide", cleanupUnsavedHero);
      cleanupUnsavedHero();
    };
  }, []);

  useEffect(() => {
    if (!state.saved || submittedHeroUrl.current === undefined) return;
    persistedHeroUrlRef.current = submittedHeroUrl.current;
    setPersistedHeroUrl(submittedHeroUrl.current);
    submittedHeroUrl.current = undefined;
    setOpen(false);
  }, [state]);

  function openEditor() {
    const current = persistedHeroUrl;
    setHeroImageUrl(current);
    setOpen(true);
  }

  function closeEditor() {
    if (heroImageUrl && heroImageUrl !== persistedHeroUrl) {
      requestBlobCleanup(heroImageUrl);
    }
    setHeroImageUrl(persistedHeroUrl);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={openEditor}
        aria-label="Edit Series"
        title="Edit Series"
        className="flex h-9 w-9 items-center justify-center rounded-full border border-felt-line bg-felt-bg/75 text-felt-sub backdrop-blur-sm transition-colors hover:border-brass/60 hover:text-brass"
      >
        <PencilIcon className="h-4 w-4" />
      </button>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Edit Series"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-[6vh] backdrop-blur-sm"
    >
    <form
      action={formAction}
      onSubmit={() => {
        submittedHeroUrl.current = heroImageUrl;
      }}
      className="flex w-full max-w-2xl max-h-full flex-col gap-4 overflow-y-auto overscroll-contain rounded-lg border border-brass/35 bg-felt-surface p-4 shadow-2xl"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-lg font-semibold text-felt-ink">Edit Series</h2>
        <button
          type="button"
          onClick={closeEditor}
          disabled={heroUploading}
          className="text-xs text-felt-sub hover:text-brass disabled:cursor-wait disabled:opacity-50"
        >
          Close
        </button>
      </div>

      {state.error && (
        <p className="rounded-md border border-red-900/60 bg-red-950/30 px-3 py-2 text-sm text-red-300">
          {state.error}
        </p>
      )}
      {state.saved && <p className="text-sm text-sage">Series saved.</p>}

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" error={state.fieldErrors?.name}>
          <input name="name" required maxLength={200} defaultValue={values.name} className={inputClass} />
        </Field>
        <Field label="Subtitle" error={state.fieldErrors?.subtitle}>
          <input name="subtitle" maxLength={300} defaultValue={values.subtitle ?? ""} className={inputClass} />
        </Field>
        <Field label="Attribution label" error={state.fieldErrors?.attributionLabel}>
          <input
            name="attributionLabel"
            maxLength={80}
            placeholder="Artist, Designer, Published by…"
            defaultValue={values.attributionLabel ?? ""}
            className={inputClass}
          />
        </Field>
        <Field label="Attribution text" error={state.fieldErrors?.attributionText}>
          <input
            name="attributionText"
            maxLength={300}
            defaultValue={values.attributionText ?? ""}
            className={inputClass}
          />
        </Field>
      </div>

      <SeriesHeroUploader
        value={heroImageUrl}
        persistedValue={persistedHeroUrl}
        error={state.fieldErrors?.heroImageUrl}
        onChange={setHeroImageUrl}
        onUploadingChange={setHeroUploading}
      />

      <Field label="About this Series (Markdown)" error={state.fieldErrors?.description}>
        <textarea name="description" rows={10} defaultValue={values.description ?? ""} className={inputClass} />
      </Field>

      <p className="text-xs text-felt-sub/70">
        The URL slug stays unchanged when the Series name changes.
      </p>
      <button
        type="submit"
        disabled={pending || heroUploading}
        className="self-start rounded-md bg-brass px-4 py-2 text-sm font-semibold text-felt-bg hover:bg-brass-deep disabled:opacity-60"
      >
        {heroUploading ? "Uploading image…" : pending ? "Saving…" : "Save Series"}
      </button>
    </form>
    </div>
  );
}

const inputClass =
  "w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass";

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-felt-sub">{label}</span>
      {children}
      {error && <span className="text-xs text-red-300">{error}</span>}
    </label>
  );
}
