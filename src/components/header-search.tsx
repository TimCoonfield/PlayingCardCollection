"use client";

import { useEffect, useRef, useState } from "react";
import { SearchIcon } from "./icons";

export function HeaderSearch() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    inputRef.current?.focus();

    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    // Deferred so the same click that opens the popover doesn't immediately register as an
    // "outside" click and close it again.
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 0);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label="Search collection"
        aria-expanded={open}
        className="flex h-8 w-8 items-center justify-center rounded-md text-felt-sub transition-colors hover:bg-felt-surface hover:text-felt-ink"
      >
        <SearchIcon className="h-4 w-4" />
      </button>

      {open && (
        <form
          action="/collection"
          method="GET"
          className="absolute right-0 top-full z-20 mt-2 flex w-64 items-center gap-2 rounded-md border border-felt-line bg-felt-surface p-2 shadow-lg sm:w-72"
        >
          <SearchIcon className="h-4 w-4 shrink-0 text-felt-sub" />
          <input
            ref={inputRef}
            type="search"
            name="q"
            placeholder="Search decks..."
            className="w-full bg-transparent text-sm text-felt-ink outline-none placeholder:text-felt-sub/60"
          />
        </form>
      )}
    </div>
  );
}
