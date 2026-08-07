import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder, AccentBar } from "./deck-placeholder";
import { HeartIcon } from "./icons";

export interface DeckCardData {
  id: string;
  name: string;
  series: string | null;
  designer: string | null;
  producer: string | null;
  qty: number;
  tags: string[];
  favorite: boolean;
  images: { url: string }[];
}

const DEFAULT_CARD_SIZES =
  "(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, (max-width: 1280px) 20vw, 16vw";

export function DeckCard({
  deck,
  sizes = DEFAULT_CARD_SIZES,
}: {
  deck: DeckCardData;
  sizes?: string;
}) {
  const hasImages = deck.images.length > 0;

  return (
    <Link
      href={`/decks/${deck.id}`}
      prefetch={false}
      className="group flex flex-col overflow-hidden rounded-lg border border-felt-line bg-felt-surface transition-colors hover:border-brass"
    >
      <div className="relative aspect-[3/4] w-full bg-felt-surface-2">
        {hasImages ? (
          <>
            <Image
              src={deck.images[0].url}
              alt={deck.name}
              fill
              sizes={sizes}
              className="object-cover transition-transform group-hover:scale-105"
            />
            <AccentBar tags={deck.tags} />
          </>
        ) : (
          <DeckPlaceholder tags={deck.tags} size="md" />
        )}
        {deck.qty > 1 && (
          <span className="absolute right-1.5 top-1.5 rounded-full bg-felt-bg/80 px-2 py-0.5 text-xs font-medium text-felt-ink">
            ×{deck.qty}
          </span>
        )}
        {deck.favorite && (
          <span className="absolute left-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-felt-bg/80 text-brick">
            <HeartIcon filled className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="line-clamp-2 font-display text-base font-semibold leading-snug text-felt-ink">
          {deck.name}
        </p>
        {deck.designer && (
          <p className="truncate text-xs text-felt-sub">{deck.designer}</p>
        )}
        {deck.producer && (
          <p className="truncate text-xs text-felt-sub/70">{deck.producer}</p>
        )}
      </div>
    </Link>
  );
}
