import Image from "next/image";
import Link from "next/link";

export function CreatorSpotlightCard({
  name,
  tagline,
  imageUrl,
  imageAlt,
  deckCount,
  href,
}: {
  name: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  deckCount: number;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="group relative flex aspect-[4/3] w-full overflow-hidden rounded-lg border border-felt-line bg-felt-surface"
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover opacity-30 saturate-[0.85] transition-opacity group-hover:opacity-35"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-felt-bg/15 via-felt-bg/55 to-felt-bg/95" />
      <div className="relative mt-auto flex flex-col p-5">
        <span className="font-display text-5xl font-semibold leading-tight text-felt-ink">
          {name}
        </span>
        <span className="mt-2 text-base tracking-wide text-brass">{tagline}</span>
        <span className="mt-1 text-xs text-felt-sub">{deckCount} decks in the collection →</span>
      </div>
    </Link>
  );
}
