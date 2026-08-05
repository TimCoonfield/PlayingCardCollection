"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDownIcon } from "./icons";

interface CreatorNavItem {
  name: string;
  href: string;
}

const COLLECTION_LINKS = [
  { label: "Mini Decks", href: "/mini" },
  { label: "Tarot", href: "/tarot" },
  { label: "Souvenir Decks", href: "/souvenir" },
  { label: "Coins", href: "/collection?type=coin" },
];

export function SpecialtyCollectionsMenu({
  creators,
  isActive,
}: {
  creators: CreatorNavItem[];
  isActive: boolean;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
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
        onClick={() => setOpen((current) => !current)}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`flex items-center gap-1 whitespace-nowrap rounded-md border-b-2 px-2 py-1.5 uppercase tracking-wide transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3 ${
          isActive
            ? "border-brass font-semibold text-felt-ink"
            : "border-transparent text-felt-sub"
        }`}
      >
        <span className="sm:hidden">Specialty</span>
        <span className="hidden sm:inline">Specialty Collections</span>
        <ChevronDownIcon className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-20 mt-1 w-64 overflow-hidden rounded-md border border-felt-line bg-felt-surface py-1 shadow-lg"
        >
          <div className="px-3 pb-1 pt-2 font-display text-sm font-semibold uppercase tracking-wider text-brass">
            Featured Creators
          </div>
          {creators.map((creator) => (
            <Link
              key={creator.href}
              href={creator.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block py-1.5 pl-6 pr-3 text-sm normal-case tracking-normal text-felt-sub transition-colors hover:bg-felt-surface-2 hover:text-felt-ink"
            >
              {creator.name}
            </Link>
          ))}
          <div className="my-1 border-t border-felt-line" />
          {COLLECTION_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-3 py-2 text-sm normal-case tracking-normal text-felt-sub transition-colors hover:bg-felt-surface-2 hover:text-felt-ink"
            >
              {link.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
