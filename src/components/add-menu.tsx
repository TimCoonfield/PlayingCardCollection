"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { PlusIcon, ChevronDownIcon } from "./icons";

export function AddMenu() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  function openNow() {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    setOpen(true);
  }

  function closeSoon() {
    closeTimer.current = setTimeout(() => setOpen(false), 150);
  }

  return (
    <div ref={containerRef} className="relative" onMouseEnter={openNow} onMouseLeave={closeSoon}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="menu"
        className="flex items-center gap-1.5 whitespace-nowrap rounded-md border-b-2 border-transparent px-2 py-1.5 uppercase tracking-wide text-felt-sub transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3"
      >
        <PlusIcon className="hidden h-4 w-4 sm:inline" />
        Add
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-40 overflow-hidden rounded-md border border-felt-line bg-felt-surface shadow-lg"
        >
          <Link
            href="/decks/new"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm normal-case tracking-normal text-felt-sub transition-colors hover:bg-felt-surface-2 hover:text-felt-ink"
          >
            Add Deck
          </Link>
          <Link
            href="/coins/new"
            role="menuitem"
            onClick={() => setOpen(false)}
            className="block px-3 py-2 text-sm normal-case tracking-normal text-felt-sub transition-colors hover:bg-felt-surface-2 hover:text-felt-ink"
          >
            Add Coin
          </Link>
        </div>
      )}
    </div>
  );
}
