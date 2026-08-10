"use client";

import { useState } from "react";
import { getTagStyle } from "@/lib/placeholders";

export type CollectionItemType = "all" | "deck" | "coin";

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
