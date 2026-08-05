import Image from "next/image";
import Link from "next/link";
import { DeckPlaceholder } from "./deck-placeholder";

export interface SeriesSpotlightDatum {
  series: string;
  count: number;
  deck: { id: string; name: string; imageUrl: string | null; tags: string[] } | null;
}

const RANK_BADGE_STYLES = [
  "bg-felt-bg text-brass ring-brass/50",
  "bg-felt-bg text-felt-ink ring-felt-ink/40",
  "bg-felt-bg text-brick ring-brick/50",
  "bg-felt-bg text-sage ring-sage/50",
  "bg-felt-bg text-plum ring-plum/50",
];

export function SeriesShowcase({ items }: { items: SeriesSpotlightDatum[] }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((item, i) => {
        const badgeStyle = RANK_BADGE_STYLES[i] ?? RANK_BADGE_STYLES[RANK_BADGE_STYLES.length - 1];
        const content = (
          <div className="group flex flex-col overflow-hidden rounded-lg border border-felt-line bg-felt-surface transition-colors hover:border-brass">
            <div className="relative aspect-[3/4] w-full bg-felt-surface-2">
              {item.deck?.imageUrl ? (
                <Image
                  src={item.deck.imageUrl}
                  alt={item.deck.name}
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  className="object-cover transition-transform group-hover:scale-105"
                />
              ) : (
                <DeckPlaceholder tags={item.deck?.tags ?? []} size="md" />
              )}
              <span
                className={`absolute left-2 top-2 flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-1 ${badgeStyle}`}
              >
                #{i + 1}
              </span>
            </div>
            <div className="flex flex-col gap-0.5 p-3">
              <p className="truncate font-display text-base font-semibold text-felt-ink">{item.series}</p>
              <p className="text-xs text-felt-sub">
                {item.count} {item.count === 1 ? "deck" : "decks"} in this series
              </p>
              {item.deck && (
                <p className="mt-1 truncate text-xs text-felt-sub/70">Shown: {item.deck.name}</p>
              )}
            </div>
          </div>
        );

        return (
          <Link key={item.series} href={`/collection?series=${encodeURIComponent(item.series)}`}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
