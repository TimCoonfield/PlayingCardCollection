"use client";

import { useState, type ReactNode } from "react";
import { ChevronDownIcon } from "./icons";

export function CollectionFilterPanel({
  searchControl,
  sortControl,
  surpriseControl,
  advancedControls,
  advancedFilterCount,
  activeFilters,
  onClear,
  resultCount,
}: {
  searchControl: ReactNode;
  sortControl: ReactNode;
  surpriseControl: ReactNode;
  advancedControls: ReactNode;
  advancedFilterCount: number;
  activeFilters?: ReactNode;
  onClear?: () => void;
  resultCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="min-w-0 flex-1">{searchControl}</div>
        <div className="flex flex-wrap items-center gap-2">
          {sortControl}
          {surpriseControl}
        </div>
      </div>

      <div className="border-t border-felt-line pt-3">
        <button
          type="button"
          onClick={() => setExpanded((current) => !current)}
          aria-expanded={expanded}
          className="flex w-full items-center justify-between gap-3 text-left"
        >
          <span className="flex items-center gap-2 font-display text-sm font-semibold uppercase tracking-[0.14em] text-brass">
            Advanced filters
            {advancedFilterCount > 0 && (
              <span className="rounded-full bg-brass px-1.5 py-0.5 font-sans text-[10px] tracking-normal text-felt-bg">
                {advancedFilterCount}
              </span>
            )}
          </span>
          <span className="flex items-center gap-3 text-xs text-felt-sub">
            {resultCount !== undefined && (
              <span className="hidden sm:inline">
                {resultCount} {resultCount === 1 ? "item" : "items"}
              </span>
            )}
            <ChevronDownIcon
              className={`h-4 w-4 transition-transform ${expanded ? "rotate-180" : ""}`}
            />
          </span>
        </button>

        {expanded && (
          <div className="mt-4 flex flex-col gap-4 border-t border-felt-line/70 pt-4">
            {advancedControls}
          </div>
        )}
      </div>

      {activeFilters && (
        <div className="flex flex-wrap items-center gap-2 border-t border-felt-line pt-3">
          {activeFilters}
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              className="text-sm text-felt-sub hover:text-felt-ink"
            >
              Clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
}
