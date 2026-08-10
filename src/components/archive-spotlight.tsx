"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import { useRouter } from "next/navigation";
import { SearchIcon } from "./icons";
import {
  ARCHIVE_SEARCH_SCOPES,
  ARCHIVE_SEARCH_SCOPE_LABELS,
  type ArchiveSearchScope,
} from "@/lib/archive-search";

type SearchResult = {
  label: string;
  href: string;
  count?: number;
  meta?: string;
};

type SearchResponse = {
  decks: SearchResult[];
  creators: SearchResult[];
  series: SearchResult[];
  producers: SearchResult[];
  archives: SearchResult[];
};

const EMPTY_RESULTS: SearchResponse = {
  decks: [],
  creators: [],
  series: [],
  producers: [],
  archives: [],
};

const OPEN_SPOTLIGHT_EVENT = "open-archive-spotlight";

export function openArchiveSpotlight() {
  window.dispatchEvent(new Event(OPEN_SPOTLIGHT_EVENT));
}

export function ArchiveSpotlightTrigger() {
  return (
    <button
      type="button"
      onClick={openArchiveSpotlight}
      aria-label="Search archive"
      className="flex h-8 items-center gap-2 rounded-md px-2 text-felt-sub transition-colors hover:bg-felt-surface hover:text-felt-ink lg:border lg:border-felt-line lg:bg-felt-surface lg:px-2.5"
    >
      <SearchIcon className="h-4 w-4" />
      <span className="hidden text-sm lg:inline">Search archive</span>
      <kbd className="hidden rounded border border-felt-line bg-felt-bg px-1.5 py-0.5 font-sans text-[10px] text-felt-sub xl:inline">
        /
      </kbd>
    </button>
  );
}

export function ArchiveSpotlight() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope, setScope] = useState<ArchiveSearchScope>("all");
  const [results, setResults] = useState<SearchResponse>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [highlighted, setHighlighted] = useState(-1);

  const groups = useMemo(
    () => [
      { label: "Creators", items: results.creators },
      { label: "Decks", items: results.decks },
      { label: "Series", items: results.series },
      { label: "Producers", items: results.producers },
      { label: "Archives", items: results.archives },
    ].filter((group) => group.items.length > 0),
    [results]
  );
  const viewAllHref = buildViewAllHref(query, scope);
  const actions = useMemo(() => groups.flatMap((group) => group.items), [groups]);

  useEffect(() => {
    function openAndFocus() {
      // Mobile browsers only raise the software keyboard when focus happens synchronously
      // inside the originating tap/press event. Waiting for the normal focus effect is too late.
      flushSync(() => setOpen(true));
      inputRef.current?.focus({ preventScroll: true });
    }
    function handleGlobalKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const isTyping =
        target?.tagName === "INPUT" ||
        target?.tagName === "TEXTAREA" ||
        target?.tagName === "SELECT" ||
        target?.isContentEditable;
      if (event.key === "/" && !isTyping) {
        event.preventDefault();
        openAndFocus();
      }
    }
    function handleOpenRequest() {
      openAndFocus();
    }
    document.addEventListener("keydown", handleGlobalKey);
    window.addEventListener(OPEN_SPOTLIGHT_EVENT, handleOpenRequest);
    return () => {
      document.removeEventListener("keydown", handleGlobalKey);
      window.removeEventListener(OPEN_SPOTLIGHT_EVENT, handleOpenRequest);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    requestAnimationFrame(() => inputRef.current?.focus());
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(
          `/api/archive-search?q=${encodeURIComponent(trimmed)}&scope=${scope}`,
          { signal: controller.signal }
        );
        if (response.ok) setResults(await response.json());
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query, scope]);

  function close() {
    setOpen(false);
    setQuery("");
    setResults(EMPTY_RESULTS);
    setHighlighted(-1);
  }

  function navigate(href: string) {
    close();
    router.push(href);
  }

  function handleKeyDown(event: React.KeyboardEvent) {
    const liveQuery = inputRef.current?.value.trim() ?? query.trim();
    if (event.key === "Escape") {
      event.preventDefault();
      close();
    } else if (event.key === "ArrowDown" && actions.length > 0) {
      event.preventDefault();
      setHighlighted((current) => (current >= actions.length - 1 ? -1 : current + 1));
    } else if (event.key === "ArrowUp" && actions.length > 0) {
      event.preventDefault();
      setHighlighted((current) => (current === -1 ? actions.length - 1 : current - 1));
    } else if (event.key === "Enter" && liveQuery) {
      event.preventDefault();
      navigate(
        highlighted === -1
          ? buildViewAllHref(liveQuery, scope)
          : actions[highlighted].href
      );
    }
  }

  let actionIndex = 0;

  return (
    <>
      {open && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/70 px-3 pt-[10vh] backdrop-blur-sm sm:px-6 sm:pt-[14vh]"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) close();
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Search the archive"
            className="flex max-h-[78vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-brass/40 bg-felt-surface shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            <div className="flex items-center gap-3 border-b border-felt-line px-4 py-4 sm:px-5">
              <SearchIcon className="h-5 w-5 shrink-0 text-brass" />
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(event) => {
                  const value = event.target.value;
                  setQuery(value);
                  setHighlighted(-1);
                  if (value.trim().length < 2) {
                    setResults(EMPTY_RESULTS);
                    setLoading(false);
                  }
                }}
                placeholder="Search decks, creators, series, producers…"
                aria-label="Search the archive"
                className="min-w-0 flex-1 bg-transparent text-lg text-felt-ink outline-none placeholder:text-felt-sub/50 sm:text-xl"
              />
              <button
                type="button"
                onClick={close}
                className="rounded border border-felt-line px-2 py-1 text-xs text-felt-sub hover:text-felt-ink"
              >
                Esc
              </button>
            </div>

            <div className="flex gap-1 overflow-x-auto border-b border-felt-line px-3 py-2 sm:px-5">
              {ARCHIVE_SEARCH_SCOPES.map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setScope(option);
                    setHighlighted(-1);
                    setResults(EMPTY_RESULTS);
                  }}
                  aria-pressed={scope === option}
                  className={`shrink-0 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                    scope === option
                      ? "border-brass bg-brass/15 text-brass"
                      : "border-transparent text-felt-sub hover:border-felt-line hover:text-felt-ink"
                  }`}
                >
                  {ARCHIVE_SEARCH_SCOPE_LABELS[option]}
                </button>
              ))}
            </div>

            <div className="min-h-32 overflow-y-auto p-2 sm:p-3">
              {query.trim().length < 2 ? (
                <p className="px-3 py-10 text-center text-sm text-felt-sub">
                  Type at least two characters to search the archive.
                </p>
              ) : loading ? (
                <p className="px-3 py-10 text-center text-sm text-felt-sub">Searching…</p>
              ) : groups.length === 0 ? (
                <p className="px-3 py-10 text-center text-sm text-felt-sub">No direct matches.</p>
              ) : (
                groups.map((group) => (
                  <div key={group.label} className="mb-3 last:mb-0">
                    <p className="px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-brass/80">
                      {group.label}
                    </p>
                    {group.items.map((item) => {
                      const index = actionIndex++;
                      return (
                        <button
                          key={`${group.label}-${item.href}`}
                          type="button"
                          onClick={() => navigate(item.href)}
                          onMouseEnter={() => setHighlighted(index)}
                          className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left ${
                            highlighted === index ? "bg-felt-surface-2" : "hover:bg-felt-surface-2"
                          }`}
                        >
                          <span className="min-w-0">
                            <span className="block truncate font-display text-base font-semibold text-felt-ink">
                              {item.label}
                            </span>
                            {item.meta && (
                              <span className="block truncate text-xs text-felt-sub">
                                {item.meta}
                              </span>
                            )}
                          </span>
                          {item.count !== undefined && (
                            <span className="shrink-0 text-xs tabular-nums text-felt-sub">
                              {item.count} {item.count === 1 ? "deck" : "decks"}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                ))
              )}
            </div>

            {query.trim() && (
              <button
                type="button"
                onClick={() => navigate(viewAllHref)}
                onMouseEnter={() => setHighlighted(-1)}
                className={`flex items-center justify-between border-t border-felt-line px-5 py-3 text-sm font-semibold text-brass ${
                  highlighted === -1 ? "bg-felt-surface-2" : "hover:bg-felt-surface-2"
                }`}
              >
                <span>View all results</span>
                <span aria-hidden="true">→</span>
              </button>
            )}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

function buildViewAllHref(query: string, scope: ArchiveSearchScope) {
  const params = new URLSearchParams();
  params.set("q", query.trim());
  if (scope !== "all") params.set("scope", scope);
  return `/collection?${params.toString()}`;
}
