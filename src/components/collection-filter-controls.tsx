"use client";

import { useState } from "react";
import { getTagStyle } from "@/lib/placeholders";
import type { CollectionSort } from "@/lib/collection-sort";
import { CameraIcon } from "./icons";
import {
  COLLECTION_REASON_DETAILS,
  COLLECTION_REASON_VALUES,
  type CollectionReasonValue,
} from "@/lib/collection-reasons";

export type CollectionItemType = "all" | "deck" | "coin";
export type CollectionReasonField = "any" | "primary" | "secondary";

export function CollectionReasonFilter({
  reason,
  field,
  onChange,
}: {
  reason: CollectionReasonValue | "";
  field: CollectionReasonField;
  onChange: (reason: CollectionReasonValue | "", field: CollectionReasonField) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-felt-sub">
          Collection reason
        </span>
        <select
          value={reason}
          onChange={(event) =>
            onChange(event.target.value as CollectionReasonValue | "", field)
          }
          className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
        >
          <option value="">Any collection reason</option>
          {COLLECTION_REASON_VALUES.map((value) => (
            <option key={value} value={value}>
              {COLLECTION_REASON_DETAILS[value].label}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1.5">
        <span className="text-xs font-semibold uppercase tracking-[0.12em] text-felt-sub">
          Reason position
        </span>
        <select
          value={field}
          disabled={!reason}
          onChange={(event) => onChange(reason, event.target.value as CollectionReasonField)}
          className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass disabled:opacity-50"
        >
          <option value="any">Primary or secondary</option>
          <option value="primary">Primary only</option>
          <option value="secondary">Secondary only</option>
        </select>
      </label>
      <p className="text-xs text-felt-sub/70 sm:col-span-2">
        Collection Reasons apply to Decks only and remain separate from tags.
      </p>
    </div>
  );
}

export function MissingPhotoFilter({
  selected,
  onChange,
}: {
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!selected)}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-felt-surface ${
        selected
          ? "border-brass bg-brass/20 text-felt-ink shadow-sm"
          : "border-felt-line bg-felt-bg/40 text-felt-sub hover:border-brass/70 hover:text-brass"
      }`}
    >
      <CameraIcon className="h-3.5 w-3.5" />
      Missing photo
      {selected && <span aria-hidden="true">✓</span>}
    </button>
  );
}

export function MissingYearFilter({
  selected,
  onChange,
}: {
  selected: boolean;
  onChange: (selected: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!selected)}
      aria-pressed={selected}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-felt-surface ${
        selected
          ? "border-brass bg-brass/20 text-felt-ink shadow-sm"
          : "border-felt-line bg-felt-bg/40 text-felt-sub hover:border-brass/70 hover:text-brass"
      }`}
    >
      <span aria-hidden="true" className="font-display text-sm leading-none">?</span>
      Missing year
      {selected && <span aria-hidden="true">✓</span>}
    </button>
  );
}

export function CollectionMaintenanceFilters({
  missingPhoto,
  missingYear,
  onMissingPhotoChange,
  onMissingYearChange,
}: {
  missingPhoto: boolean;
  missingYear: boolean;
  onMissingPhotoChange: (selected: boolean) => void;
  onMissingYearChange: (selected: boolean) => void;
}) {
  return (
    <>
      <MissingPhotoFilter selected={missingPhoto} onChange={onMissingPhotoChange} />
      <MissingYearFilter selected={missingYear} onChange={onMissingYearChange} />
    </>
  );
}

export const ALL_COLLECTION_TAGS = [
  "Modern",
  "Vintage",
  "Antique",
  "Gilded",
  "Signed",
  "Mini",
  "Tarot",
  "Prototype",
  "Edge Painted",
] as const;

export const CURATED_COLLECTION_TAGS = [
  "Gilded",
  "Signed",
  "Mini",
  "Prototype",
  "Edge Painted",
] as const;

const TAG_PILL_CLASSES: Record<string, { idle: string; selected: string }> = {
  plum: {
    idle: "hover:border-plum/70 hover:text-plum",
    selected: "border-plum bg-plum/20 text-felt-ink shadow-sm",
  },
  brass: {
    idle: "hover:border-brass/70 hover:text-brass",
    selected: "border-brass bg-brass/20 text-felt-ink shadow-sm",
  },
  sage: {
    idle: "hover:border-sage/70 hover:text-sage",
    selected: "border-sage bg-sage/20 text-felt-ink shadow-sm",
  },
  brick: {
    idle: "hover:border-brick/70 hover:text-brick",
    selected: "border-brick bg-brick/20 text-felt-ink shadow-sm",
  },
  "felt-ink": {
    idle: "hover:border-felt-ink/60 hover:text-felt-ink",
    selected: "border-felt-ink/70 bg-felt-ink/15 text-felt-ink shadow-sm",
  },
};

export function CollectionTypeSelector({
  value,
  onChange,
}: {
  value: CollectionItemType;
  onChange: (value: CollectionItemType) => void;
}) {
  return (
    <div className="flex rounded-md border border-felt-line p-0.5">
      {(["all", "deck", "coin"] as const).map((option) => (
        <button
          key={option}
          type="button"
          onClick={() => onChange(option)}
          className={`flex-1 rounded px-3 py-1.5 text-sm transition-colors ${
            value === option ? "bg-brass text-felt-bg" : "text-felt-sub hover:text-felt-ink"
          }`}
        >
          {option === "all" ? "All" : option === "deck" ? "Decks" : "Coins"}
        </button>
      ))}
    </div>
  );
}

export function CollectionSortSelector({
  value,
  onChange,
  includeFeatured = false,
}: {
  value: CollectionSort;
  onChange: (value: CollectionSort) => void;
  includeFeatured?: boolean;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-felt-sub">
      <span className="sr-only">Sort by</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as CollectionSort)}
        aria-label="Sort collection"
        className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
      >
        {includeFeatured && <option value="featured">Featured first</option>}
        <option value="alpha-asc">Alphabetical: A–Z</option>
        <option value="alpha-desc">Alphabetical: Z–A</option>
        <option value="year-asc">Release year: oldest first</option>
        <option value="year-desc">Release year: newest first</option>
        <option value="recent">Recently added</option>
        <option value="random">Random</option>
      </select>
    </label>
  );
}

export function CollectionFacetPicker({
  label,
  options,
  selected,
  onAdd,
}: {
  label: string;
  options: string[];
  selected: string[];
  onAdd: (value: string) => void;
}) {
  const [query, setQuery] = useState("");
  const matches = query.trim()
    ? options
        .filter(
          (option) =>
            !selected.includes(option) &&
            option.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())
        )
        .slice(0, 8)
    : [];

  function choose(value: string) {
    onAdd(value);
    setQuery("");
  }

  return (
    <div className="relative">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-felt-sub">
        {label}
      </label>
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && matches[0]) {
            event.preventDefault();
            choose(matches[0]);
          }
        }}
        placeholder={`Search ${label.toLocaleLowerCase()}…`}
        className="w-full rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink placeholder:text-felt-sub/60 outline-none focus:border-brass"
      />
      {query.trim() && (
        <div className="absolute z-20 mt-1 max-h-60 w-full overflow-y-auto rounded-md border border-felt-line bg-felt-surface shadow-xl">
          {matches.length > 0 ? (
            matches.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => choose(option)}
                className="block w-full px-3 py-2 text-left text-sm text-felt-ink hover:bg-felt-surface-2 hover:text-brass"
              >
                {option}
              </button>
            ))
          ) : (
            <p className="px-3 py-2 text-sm text-felt-sub">No matches</p>
          )}
        </div>
      )}
    </div>
  );
}

export function CollectionActiveFilter({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onRemove}
      title={`Remove ${label} filter`}
      className="inline-flex items-center gap-1.5 rounded-full border border-brass/40 bg-brass/10 px-2.5 py-1 text-xs text-felt-ink hover:border-brass"
    >
      <span className="max-w-56 truncate">{label}</span>
      <span aria-hidden="true" className="text-brass">×</span>
    </button>
  );
}

export function CollectionTagPills({
  availableTags,
  selectedTags,
  onToggle,
  useCheckboxes = false,
}: {
  availableTags: readonly string[];
  selectedTags: string[];
  onToggle: (tag: string, selected: boolean) => void;
  useCheckboxes?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {availableTags.map((tag) => {
        const selected = selectedTags.includes(tag);
        const style = getTagStyle(tag);
        const colorClasses = TAG_PILL_CLASSES[style.accent] ?? TAG_PILL_CLASSES.brass;
        const classes = `inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-all focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2 focus-within:ring-offset-felt-surface ${
          selected
            ? colorClasses.selected
            : `border-felt-line bg-felt-bg/40 text-felt-sub ${colorClasses.idle}`
        }`;
        const content = (
          <>
            <span
              aria-hidden="true"
              className={style.icon ? "text-sm leading-none" : "font-display text-sm leading-none"}
            >
              {style.icon ?? "♠"}
            </span>
            {tag}
            {selected && <span aria-hidden="true">✓</span>}
          </>
        );

        return useCheckboxes ? (
          <label key={tag} className={classes}>
            <input
              type="checkbox"
              checked={selected}
              onChange={(event) => onToggle(tag, event.target.checked)}
              className="sr-only"
            />
            {content}
          </label>
        ) : (
          <button
            key={tag}
            type="button"
            onClick={() => onToggle(tag, !selected)}
            aria-pressed={selected}
            className={classes}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function CollectionYearRange({
  availableMinYear,
  availableMaxYear,
  selectedMinYear,
  selectedMaxYear,
  onCommit,
}: {
  availableMinYear: number;
  availableMaxYear: number;
  selectedMinYear: number;
  selectedMaxYear: number;
  onCommit: (minYear: number, maxYear: number) => void;
}) {
  const [yearRange, setYearRange] = useState<[number, number]>([
    selectedMinYear,
    selectedMaxYear,
  ]);
  const isFullRange =
    yearRange[0] === availableMinYear && yearRange[1] === availableMaxYear;
  const yearSpan = Math.max(1, availableMaxYear - availableMinYear);

  function moveHandle(handle: "lower" | "upper", value: number) {
    setYearRange((current) => {
      const otherValue = handle === "lower" ? current[1] : current[0];
      return value <= otherValue ? [value, otherValue] : [otherValue, value];
    });
  }

  return (
    <div>
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <span className="text-sm text-felt-sub">Release year</span>
        <span className="text-sm font-medium tabular-nums text-felt-ink">
          {isFullRange ? "All years (including unknown)" : `${yearRange[0]}–${yearRange[1]}`}
        </span>
      </div>
      <div className="relative h-6" aria-label="Release year range">
        <div className="absolute left-0 right-0 top-2.5 h-1 rounded-full bg-felt-line" />
        <div
          className="absolute top-2.5 h-1 rounded-full bg-brass"
          style={{
            left: `${((yearRange[0] - availableMinYear) / yearSpan) * 100}%`,
            right: `${100 - ((yearRange[1] - availableMinYear) / yearSpan) * 100}%`,
          }}
        />
        <input
          type="range"
          min={availableMinYear}
          max={availableMaxYear}
          value={yearRange[0]}
          aria-label="Earliest release year"
          onChange={(event) => moveHandle("lower", Number(event.target.value))}
          onPointerUp={() => onCommit(yearRange[0], yearRange[1])}
          onKeyUp={() => onCommit(yearRange[0], yearRange[1])}
          className="collection-year-range absolute inset-x-0 top-0 z-10 w-full"
        />
        <input
          type="range"
          min={availableMinYear}
          max={availableMaxYear}
          value={yearRange[1]}
          aria-label="Latest release year"
          onChange={(event) => moveHandle("upper", Number(event.target.value))}
          onPointerUp={() => onCommit(yearRange[0], yearRange[1])}
          onKeyUp={() => onCommit(yearRange[0], yearRange[1])}
          className="collection-year-range absolute inset-x-0 top-0 z-10 w-full"
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-felt-sub">
        <span>{availableMinYear}</span>
        <span>{availableMaxYear}</span>
      </div>
    </div>
  );
}
