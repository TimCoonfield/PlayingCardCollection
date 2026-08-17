"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface SeriesDeckLink {
  id: string;
  name: string;
}

interface SeriesDeckNavigationProps {
  series: {
    name: string;
    slug: string;
  };
  previousDeck: SeriesDeckLink | null;
  nextDeck: SeriesDeckLink | null;
}

export function SeriesDeckNavigation({
  series,
  previousDeck,
  nextDeck,
}: SeriesDeckNavigationProps) {
  const router = useRouter();

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.defaultPrevented || event.isComposing || event.repeat) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        (target.matches("input, textarea, select") || target.isContentEditable)
      ) {
        return;
      }

      if (event.metaKey || event.ctrlKey || event.altKey) return;

      const goPrevious =
        previousDeck &&
        ((event.shiftKey && event.key === "ArrowLeft") ||
          (!event.shiftKey && event.key === "["));
      const goNext =
        nextDeck &&
        ((event.shiftKey && event.key === "ArrowRight") ||
          (!event.shiftKey && event.key === "]"));

      if (goPrevious) {
        event.preventDefault();
        router.push(`/decks/${previousDeck.id}`);
      } else if (goNext) {
        event.preventDefault();
        router.push(`/decks/${nextDeck.id}`);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [nextDeck, previousDeck, router]);

  return (
    <nav
      aria-label={`${series.name} Series navigation`}
      className="sticky top-[61px] z-[9] -mt-6 w-dvw self-center border-b border-brass/70 bg-brass-deep text-felt-header shadow-md sm:top-[65px]"
    >
      <div className="mx-auto grid min-h-12 max-w-6xl grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-stretch px-2 sm:px-6">
        {previousDeck ? (
          <Link
            href={`/decks/${previousDeck.id}`}
            aria-keyshortcuts="Shift+ArrowLeft"
            aria-label={`Previous deck in ${series.name}: ${previousDeck.name}`}
            title="Previous deck (Shift + Left Arrow or [)"
            className="group flex min-w-0 items-center gap-2 px-2 py-1.5 transition-colors hover:bg-brass/25 sm:px-3"
          >
            <span aria-hidden="true" className="shrink-0 text-lg leading-none">←</span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-65">
                Previous
              </span>
              <span className="truncate font-display text-xs font-semibold sm:text-sm">
                {previousDeck.name}
              </span>
            </span>
            <kbd className="ml-auto hidden shrink-0 rounded border border-felt-header/30 px-1.5 py-0.5 font-sans text-[10px] opacity-70 lg:inline">
              ⇧←
            </kbd>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}

        <Link
          href={`/series/${series.slug}`}
          className="flex max-w-[38vw] flex-col justify-center border-x border-felt-header/20 px-3 py-1 text-center transition-colors hover:bg-brass/25 sm:max-w-xs sm:px-5"
        >
          <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-65">
            Series
          </span>
          <span className="truncate font-display text-xs font-semibold sm:text-sm">
            {series.name}
          </span>
        </Link>

        {nextDeck ? (
          <Link
            href={`/decks/${nextDeck.id}`}
            aria-keyshortcuts="Shift+ArrowRight"
            aria-label={`Next deck in ${series.name}: ${nextDeck.name}`}
            title="Next deck (Shift + Right Arrow or ])"
            className="group flex min-w-0 items-center justify-end gap-2 px-2 py-1.5 text-right transition-colors hover:bg-brass/25 sm:px-3"
          >
            <kbd className="mr-auto hidden shrink-0 rounded border border-felt-header/30 px-1.5 py-0.5 font-sans text-[10px] opacity-70 lg:inline">
              ⇧→
            </kbd>
            <span className="flex min-w-0 flex-col">
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] opacity-65">
                Next
              </span>
              <span className="truncate font-display text-xs font-semibold sm:text-sm">
                {nextDeck.name}
              </span>
            </span>
            <span aria-hidden="true" className="shrink-0 text-lg leading-none">→</span>
          </Link>
        ) : (
          <span aria-hidden="true" />
        )}
      </div>
    </nav>
  );
}
