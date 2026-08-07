import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder } from "./deck-placeholder";

export interface DeckSpotlightDatum {
  id: string;
  name: string;
  designer: string | null;
  tags: string[];
  images: { url: string }[];
}

export function DeckSpotlightCard({ deck }: { deck: DeckSpotlightDatum }) {
  const [main, ...rest] = deck.images;
  const secondary = rest.slice(0, 4);

  return (
    <Link
      href={`/decks/${deck.id}`}
      className="group relative flex aspect-[6/5] w-full flex-col overflow-hidden rounded-lg border border-brass/40 bg-felt-bg shadow-lg shadow-black/30 transition-transform duration-300 hover:-translate-y-1"
    >
      <div className="absolute inset-0 grid grid-cols-[1.5fr_1fr] gap-1 p-1">
        <div className="relative overflow-hidden rounded-sm bg-felt-surface">
          {main ? (
            <Image
              src={main.url}
              alt={deck.name}
              fill
              sizes="(min-width: 1024px) 20vw, 60vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <DeckPlaceholder tags={deck.tags} size="lg" />
          )}
        </div>
        {secondary.length > 0 && (
          <div className="grid grid-cols-2 grid-rows-2 gap-1">
            {secondary.map((img, i) => (
              <div key={i} className="relative overflow-hidden rounded-sm bg-felt-surface">
                <Image
                  src={img.url}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 20vw, (max-width: 1024px) 10vw, 7vw"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-felt-bg/95 via-felt-bg/60 to-felt-bg/10" />
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-felt-bg/90 via-transparent to-felt-bg/20" />
      <div className="relative z-10 flex h-full flex-col p-5">
        <p className="my-auto line-clamp-3 max-w-[88%] font-display text-4xl font-bold leading-[0.9] tracking-tight text-felt-ink drop-shadow-lg">
          {deck.name}
        </p>
        <div className="flex items-end justify-between gap-3">
          {deck.designer ? (
            <span className="truncate font-display text-sm italic text-felt-sub">
              {deck.designer}
            </span>
          ) : (
            <span />
          )}
          <span className="inline-flex shrink-0 items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brass">
            View deck <span aria-hidden="true">→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}
