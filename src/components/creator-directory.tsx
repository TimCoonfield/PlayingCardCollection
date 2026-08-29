"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SearchIcon } from "./icons";

export interface CreatorDirectoryItem {
  id: string;
  name: string;
  displayName: string | null;
  slug: string;
  tagline: string | null;
  heroImageUrl: string | null;
  favorite: boolean;
  deckCount: number;
  coinCount: number;
  role: "Designer & Producer" | "Designer" | "Producer" | "Uncredited";
}

type CreatorSort = "deck-count" | "alpha-asc" | "alpha-desc" | "favorites";
const BATCH_SIZE = 96;

export function CreatorDirectory({ creators }: { creators: CreatorDirectoryItem[] }) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<CreatorSort>("favorites");
  const [visibility, setVisibility] = useState({ key: "", count: BATCH_SIZE });
  const sentinelRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = query.trim().toLocaleLowerCase();
  const visibilityKey = `${normalizedQuery}\u0000${sort}`;
  const visibleCount = visibility.key === visibilityKey ? visibility.count : BATCH_SIZE;

  const filteredCreators = useMemo(() => {
    const matches = creators.filter((creator) =>
      !normalizedQuery ||
      [creator.name, creator.displayName, creator.tagline]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalizedQuery))
    );
    return matches.sort((left, right) => compareCreators(left, right, sort));
  }, [creators, normalizedQuery, sort]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || visibleCount >= filteredCreators.length) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisibility((current) => ({
            key: visibilityKey,
            count: Math.min(
              current.key === visibilityKey ? current.count + BATCH_SIZE : BATCH_SIZE * 2,
              filteredCreators.length
            ),
          }));
        }
      },
      { rootMargin: "500px" }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [filteredCreators.length, visibilityKey, visibleCount]);

  const visibleCreators = filteredCreators.slice(0, visibleCount);

  return (
    <div className="flex flex-col gap-5">
      <div className="grid gap-3 rounded-lg border border-felt-line bg-felt-surface p-3 sm:grid-cols-[1fr_auto]">
        <label className="relative">
          <span className="sr-only">Search Creators</span>
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-felt-sub" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Creators…"
            className="w-full rounded-md border border-felt-line bg-felt-bg py-2 pl-9 pr-3 text-sm text-felt-ink outline-none placeholder:text-felt-sub/60 focus:border-brass"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-felt-sub">
          <span>Sort</span>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value as CreatorSort)}
            className="rounded-md border border-felt-line bg-felt-bg px-3 py-2 text-sm text-felt-ink outline-none focus:border-brass"
          >
            <option value="deck-count">Most decks</option>
            <option value="alpha-asc">Name A–Z</option>
            <option value="alpha-desc">Name Z–A</option>
            <option value="favorites">Favorites first</option>
          </select>
        </label>
      </div>

      <div className="flex items-center gap-3">
        <p className="whitespace-nowrap text-xs uppercase tracking-[0.16em] text-felt-sub">
          {filteredCreators.length} {filteredCreators.length === 1 ? "Creator" : "Creators"}
        </p>
        <div className="h-px flex-1 bg-felt-line" />
      </div>

      {visibleCreators.length === 0 ? (
        <p className="py-14 text-center text-felt-sub">No Creators match that search.</p>
      ) : (
        <div className="grid auto-rows-[5.5rem] grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {visibleCreators.map((creator) =>
            creator.favorite ? (
              <FavoriteCreatorTile key={creator.id} creator={creator} />
            ) : (
              <CompactCreatorTile key={creator.id} creator={creator} />
            )
          )}
        </div>
      )}

      {visibleCount < filteredCreators.length && (
        <div ref={sentinelRef} className="flex justify-center py-3">
          <button
            type="button"
            onClick={() =>
              setVisibility((current) => ({
                key: visibilityKey,
                count: Math.min(
                  current.key === visibilityKey ? current.count + BATCH_SIZE : BATCH_SIZE * 2,
                  filteredCreators.length
                ),
              }))
            }
            className="rounded-md border border-felt-line px-4 py-2 text-xs text-felt-sub hover:border-brass hover:text-brass"
          >
            Show more Creators
          </button>
        </div>
      )}
    </div>
  );
}

function CompactCreatorTile({ creator }: { creator: CreatorDirectoryItem }) {
  const title = creator.displayName ?? creator.name;
  return (
    <Link
      href={`/creators/${creator.slug}`}
      className="group flex min-w-0 items-center justify-between gap-3 rounded-md border border-felt-line bg-felt-surface px-4 py-3 transition-colors hover:border-brass/55 hover:bg-felt-surface-2"
    >
      <span className="min-w-0">
        <span className="block truncate font-display text-base font-semibold text-felt-ink group-hover:text-brass">
          {title}
        </span>
        <span className="mt-1 block truncate text-[10px] uppercase tracking-[0.14em] text-felt-sub/75">
          {creator.role}
        </span>
      </span>
      <CreatorCounts creator={creator} />
    </Link>
  );
}

function FavoriteCreatorTile({ creator }: { creator: CreatorDirectoryItem }) {
  const title = creator.displayName ?? creator.name;
  return (
    <Link
      href={`/creators/${creator.slug}`}
      className="group relative row-span-2 flex min-w-0 overflow-hidden rounded-md border border-brass/40 bg-felt-header shadow-lg shadow-black/20 transition hover:border-brass"
    >
      {creator.heroImageUrl ? (
        <Image
          src={creator.heroImageUrl}
          alt=""
          fill
          unoptimized={creator.heroImageUrl.startsWith("/")}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-35 transition duration-300 group-hover:scale-[1.02] group-hover:opacity-45"
        />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-display text-7xl font-semibold text-brass/15" aria-hidden="true">
          {initials(title)}
        </span>
      )}
      <span className="absolute inset-0 bg-gradient-to-b from-felt-bg/10 via-felt-bg/45 to-felt-bg/95" />
      <span className="relative mt-auto flex w-full items-end justify-between gap-3 p-4">
        <span className="min-w-0">
          <span className="block font-display text-xl font-semibold leading-tight text-felt-ink">
            {title}
          </span>
          {creator.tagline && (
            <span className="mt-1 block truncate font-display text-sm italic text-brass">
              {creator.tagline}
            </span>
          )}
          <span className="mt-2 block text-[10px] uppercase tracking-[0.14em] text-felt-sub">
            {creator.role}
          </span>
        </span>
        <CreatorCounts creator={creator} />
      </span>
    </Link>
  );
}

function CreatorCounts({ creator }: { creator: CreatorDirectoryItem }) {
  return (
    <span className="shrink-0 text-right text-[10px] uppercase tracking-wide text-felt-sub">
      <span className="block text-sm font-semibold tabular-nums text-felt-ink">{creator.deckCount}</span>
      <span>{creator.deckCount === 1 ? "deck" : "decks"}</span>
      {creator.coinCount > 0 && (
        <span className="mt-1 block normal-case tracking-normal">
          + {creator.coinCount} {creator.coinCount === 1 ? "coin" : "coins"}
        </span>
      )}
    </span>
  );
}

function compareCreators(
  left: CreatorDirectoryItem,
  right: CreatorDirectoryItem,
  sort: CreatorSort
) {
  const leftName = left.displayName ?? left.name;
  const rightName = right.displayName ?? right.name;
  if (sort === "alpha-asc") return leftName.localeCompare(rightName);
  if (sort === "alpha-desc") return rightName.localeCompare(leftName);
  if (sort === "favorites" && left.favorite !== right.favorite) return left.favorite ? -1 : 1;
  return (
    right.deckCount - left.deckCount ||
    right.coinCount - left.coinCount ||
    leftName.localeCompare(rightName)
  );
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 3)
    .map((part) => part[0])
    .join("");
}
