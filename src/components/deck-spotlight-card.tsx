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
      className="group relative flex aspect-square w-full flex-col overflow-hidden rounded-lg border border-brass/40 bg-felt-bg shadow-lg shadow-black/30 transition-transform duration-300 hover:-translate-y-1"
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
                <Image src={img.url} alt="" fill sizes="10vw" className="object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-felt-bg via-felt-bg/70 to-transparent" />
      <div className="relative z-10 mt-auto flex flex-col gap-1 p-4">
        <p className="font-display text-xl font-semibold leading-tight text-felt-ink line-clamp-2">
          {deck.name}
        </p>
        <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-brass">
          View deck <span aria-hidden="true">→</span>
        </span>
      </div>
    </Link>
  );
}
