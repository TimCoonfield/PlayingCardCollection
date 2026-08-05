"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder } from "./deck-placeholder";
import { HeartIcon } from "./icons";

export interface DeckSpotlightDatum {
  id: string;
  name: string;
  designer: string | null;
  tags: string[];
  images: { url: string }[];
}

const CYCLE_INTERVAL_MS = 5000;

export function DeckSpotlightCard({ deck }: { deck: DeckSpotlightDatum }) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (deck.images.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % deck.images.length);
    }, CYCLE_INTERVAL_MS);
    return () => clearInterval(id);
  }, [deck.images.length]);

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group relative flex aspect-[3/4] w-full overflow-hidden rounded-lg border border-brass/50 bg-felt-bg shadow-lg shadow-black/30 transition-transform duration-300 hover:-translate-y-1"
    >
      {deck.images.length > 0 ? (
        deck.images.map((img, i) => (
          <Image
            key={img.url}
            src={img.url}
            alt={deck.name}
            fill
            sizes="(min-width: 1024px) 33vw, 100vw"
            className={`object-contain transition-opacity duration-1000 ${
              i === index ? "opacity-100" : "opacity-0"
            }`}
          />
        ))
      ) : (
        <DeckPlaceholder tags={deck.tags} size="lg" />
      )}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-felt-bg/95 via-felt-bg/5 to-transparent" />
      <span className="pointer-events-none absolute left-3 top-3 flex items-center gap-1 rounded-full bg-felt-bg/85 px-2.5 py-1 text-xs font-semibold text-brass ring-1 ring-brass/50">
        <HeartIcon filled className="h-3 w-3" />
        Featured
      </span>
      <div className="relative mt-auto flex flex-col gap-0.5 p-4">
        <p className="font-display text-xl font-semibold leading-tight text-felt-ink line-clamp-2">
          {deck.name}
        </p>
        {deck.designer && <p className="text-sm text-felt-sub">{deck.designer}</p>}
      </div>
    </Link>
  );
}
