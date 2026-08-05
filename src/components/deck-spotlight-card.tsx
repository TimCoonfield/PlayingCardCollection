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

export function DeckSpotlightCard({ deck }: { deck: DeckSpotlightDatum }) {
  const image = deck.images[0];

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-lg border border-brass/50 shadow-lg shadow-black/30 transition-transform duration-300 hover:-translate-y-1"
    >
      {image ? (
        <Image
          src={image.url}
          alt={deck.name}
          fill
          sizes="(min-width: 1024px) 33vw, 100vw"
          className="object-cover transition-transform duration-300 group-hover:scale-105"
        />
      ) : (
        <DeckPlaceholder tags={deck.tags} size="lg" />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-felt-bg/95 via-felt-bg/25 to-transparent" />
      <span className="absolute left-3 top-3 flex items-center gap-1 rounded-full bg-felt-bg/85 px-2.5 py-1 text-xs font-semibold text-brass ring-1 ring-brass/50">
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
