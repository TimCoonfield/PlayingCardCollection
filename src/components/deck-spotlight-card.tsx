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
      className="group flex flex-col gap-4 rounded-lg border border-brass/40 bg-felt-surface p-4 transition-colors hover:border-brass"
    >
      <div className="flex aspect-[16/10] gap-2">
        <div className="relative h-full flex-[1.4] overflow-hidden rounded-md bg-felt-bg">
          {main ? (
            <Image
              src={main.url}
              alt={deck.name}
              fill
              sizes="(min-width: 1024px) 20vw, 60vw"
              className="object-contain transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <DeckPlaceholder tags={deck.tags} size="lg" />
          )}
        </div>
        {secondary.length > 0 && (
          <div className="grid flex-1 grid-cols-2 grid-rows-2 gap-2">
            {secondary.map((img, i) => (
              <div key={i} className="relative overflow-hidden rounded-md bg-felt-bg">
                <Image src={img.url} alt="" fill sizes="10vw" className="object-contain" />
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="flex flex-col gap-1">
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
