import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder, AccentBar } from "./deck-placeholder";

export interface DeckCardData {
  id: string;
  name: string;
  series: string | null;
  designer: string | null;
  producer: string | null;
  qty: number;
  tags: string[];
  images: { url: string }[];
}

export function DeckCard({ deck }: { deck: DeckCardData }) {
  const image = deck.images[0];

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group flex flex-col overflow-hidden rounded-lg border border-felt-line bg-felt-surface transition-colors hover:border-brass"
    >
      <div className="relative aspect-[3/4] w-full bg-felt-surface-2">
        {image ? (
          <>
            <Image
              src={image.url}
              alt={deck.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 16vw"
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
      </div>
      <div className="flex flex-col gap-0.5 p-2.5">
        <p className="line-clamp-2 text-sm font-medium text-felt-ink">{deck.name}</p>
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
