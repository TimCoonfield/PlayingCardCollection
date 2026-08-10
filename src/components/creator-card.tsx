import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder } from "./deck-placeholder";
import type { CreatorAccent } from "@/lib/featured-creators";

const MONOGRAM_CLASSES: Record<CreatorAccent, string> = {
  plum: "bg-gradient-to-br from-plum to-felt-bg text-felt-ink",
  brass: "bg-gradient-to-br from-brass to-felt-bg text-felt-ink",
  sage: "bg-gradient-to-br from-sage to-felt-bg text-felt-ink",
  brick: "bg-gradient-to-br from-brick to-felt-bg text-felt-ink",
  "felt-ink": "bg-gradient-to-br from-felt-surface-2 to-felt-bg text-felt-ink",
};

export interface CreatorRandomDeck {
  id: string;
  name: string;
  tags: string[];
  imageUrl: string | null;
}

export function CreatorCard({
  designer,
  producer,
  bio,
  accent,
  initials,
  logoUrl,
  logoAlt,
  deckCount,
  randomDecks,
  viewAllHref,
}: {
  designer: string;
  producer: string;
  bio: string;
  accent: CreatorAccent;
  initials: string;
  logoUrl?: string;
  logoAlt?: string;
  deckCount: number;
  randomDecks: CreatorRandomDeck[];
  viewAllHref: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-lg border border-felt-line bg-felt-surface p-4">
      <div className="flex items-start gap-3">
        {logoUrl ? (
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-felt-ink p-2">
            <Image
              src={logoUrl}
              alt={logoAlt ?? `${producer} logo`}
              width={56}
              height={56}
              unoptimized={logoUrl.startsWith("/")}
              className="h-full w-full object-contain"
            />
          </div>
        ) : (
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-md font-display text-xl font-semibold ${MONOGRAM_CLASSES[accent]}`}
          >
            {initials}
          </div>
        )}
        <div className="flex flex-col">
          <span className="font-display text-base font-semibold text-felt-ink">{designer}</span>
          <span className="text-xs text-felt-sub">{producer}</span>
        </div>
      </div>

      <p className="text-xs leading-relaxed text-felt-sub">{bio}</p>

      {randomDecks.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          {randomDecks.map((deck) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-md border border-felt-line bg-felt-surface-2"
            >
              {deck.imageUrl ? (
                <Image
                  src={deck.imageUrl}
                  alt={deck.name}
                  fill
                  sizes="120px"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <DeckPlaceholder tags={deck.tags} size="sm" />
              )}
            </Link>
          ))}
        </div>
      )}

      <Link
        href={viewAllHref}
        className="mt-auto text-xs font-medium text-brass hover:text-brass-deep"
      >
        View all {deckCount} decks by {designer} →
      </Link>
    </div>
  );
}
