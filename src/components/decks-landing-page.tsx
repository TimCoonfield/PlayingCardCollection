import type { ReactNode } from "react";
import Image from "next/image";
import { getSession } from "@/lib/auth";
import { DeckCard, type DeckCardData } from "./deck-card";
import { DeckSpotlightCard } from "./deck-spotlight-card";
import type { CoinCardData } from "./coin-card";
import {
  ScopedCollectionBrowser,
  type FilterableScopedCoin,
  type FilterableScopedDeck,
} from "./scoped-collection-browser";

const HERO_FADE_GRADIENT =
  "linear-gradient(to right, color-mix(in srgb, var(--felt-bg) 90%, transparent) 0%, color-mix(in srgb, var(--felt-bg) 90%, transparent) 44%, transparent 58%)";

/**
 * Shared layout for the dedicated "specialty collection" / creator landing pages
 * (White Whales, Souvenir, Mini, Tarot, and each featured creator). Every one of these pages is a hero
 * (photo or inline SVG art + blurb) followed by an optional "Featured Decks" spotlight row
 * and "The Collection" grid — only the hero content and the deck query differ per page.
 */
export async function DecksLandingPage({
  title,
  tagline,
  blurb,
  heroImageUrl,
  heroObjectRight = false,
  heroSvg,
  heroTextMaxWidth = "lg",
  showFeaturedDecks = true,
  coins = [],
  showFilters = false,
  filterTagSet = "curated",
  decks,
  emptyMessage = "No decks yet.",
}: {
  title: string;
  tagline?: string;
  blurb: ReactNode;
  heroImageUrl?: string;
  heroObjectRight?: boolean;
  heroSvg?: ReactNode;
  heroTextMaxWidth?: "lg" | "xl";
  showFeaturedDecks?: boolean;
  decks: DeckCardData[] | FilterableScopedDeck[];
  coins?: CoinCardData[] | FilterableScopedCoin[];
  showFilters?: boolean;
  filterTagSet?: "curated" | "all";
  emptyMessage?: string;
}) {
  const isAuthenticated = showFilters && Boolean((await getSession()).authenticated);
  const favoriteDecks = decks.filter((d) => d.favorite).slice(0, 3);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        {heroImageUrl && (
          <Image
            src={heroImageUrl}
            alt=""
            fill
            unoptimized={heroImageUrl.startsWith("/")}
            sizes="(min-width: 1024px) 60vw, 100vw"
            className={`pointer-events-none object-cover opacity-[0.18] lg:opacity-100 ${
              heroObjectRight ? "lg:object-right" : ""
            }`}
          />
        )}
        {heroSvg && (
          <svg
            viewBox="0 0 800 500"
            preserveAspectRatio="xMaxYMid slice"
            className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] lg:opacity-40"
            aria-hidden="true"
          >
            {heroSvg}
          </svg>
        )}
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{ background: HERO_FADE_GRADIENT }}
        />
        <div
          className={`relative flex flex-col gap-3 p-6 ${
            heroTextMaxWidth === "xl" ? "lg:max-w-xl" : "lg:max-w-lg"
          }`}
        >
          <h1
            className={`font-display font-semibold text-felt-ink ${
              tagline ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl"
            }`}
          >
            {title}
          </h1>
          {tagline && (
            <p className="font-display text-base font-medium italic tracking-wide text-brass">
              {tagline}
            </p>
          )}
          <p className="text-sm text-felt-sub">{blurb}</p>
        </div>
      </div>

      {showFilters ? (
        <ScopedCollectionBrowser
          decks={decks as FilterableScopedDeck[]}
          coins={coins as FilterableScopedCoin[]}
          showFeaturedDecks={showFeaturedDecks}
          tagSet={filterTagSet}
          isAuthenticated={isAuthenticated}
        />
      ) : decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">{emptyMessage}</p>
      ) : (
        <>
          {showFeaturedDecks && favoriteDecks.length > 0 && (
            <div className="flex flex-col gap-4">
              <SectionLabel>Featured Decks</SectionLabel>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {favoriteDecks.map((deck) => (
                  <DeckSpotlightCard key={deck.id} deck={deck} />
                ))}
              </div>
            </div>
          )}
          {decks.length > 0 && (
            <div className="flex flex-col gap-4">
              <SectionLabel>The Collection</SectionLabel>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {decks.map((deck) => (
                  <DeckCard key={deck.id} deck={deck} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function SectionLabel({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <h2 className="whitespace-nowrap font-display text-sm font-bold uppercase tracking-[0.2em] text-brass">
        {children}
      </h2>
      <div className="h-px flex-1 bg-brass/30" />
    </div>
  );
}
