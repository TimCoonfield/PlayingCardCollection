import Image from "next/image";
import Link from "next/link";
import type { CreatorAccent } from "@/lib/featured-creators";

const ACCENT_BORDER_CLASSES: Record<CreatorAccent, string> = {
  brass: "hover:border-brass",
  plum: "hover:border-plum",
  sage: "hover:border-sage",
  brick: "hover:border-brick",
  "felt-ink": "hover:border-felt-ink/70",
};

export function CreatorSpotlightCard({
  name,
  tagline,
  imageUrl,
  imageAlt,
  deckCount,
  href,
  accent,
}: {
  name: string;
  tagline: string;
  imageUrl: string;
  imageAlt: string;
  deckCount: number;
  href: string;
  accent: CreatorAccent;
}) {
  return (
    <Link
      href={href}
      className={`group relative flex aspect-[4/3] w-full overflow-hidden rounded-lg border border-felt-line bg-felt-surface shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35 ${ACCENT_BORDER_CLASSES[accent]}`}
    >
      <Image
        src={imageUrl}
        alt={imageAlt}
        fill
        sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover opacity-30 saturate-[0.85] transition duration-300 group-hover:scale-[1.03] group-hover:opacity-40 group-hover:saturate-100"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-felt-bg/15 via-felt-bg/55 to-felt-bg/95" />
      <div className="relative mt-auto flex flex-col p-5">
        <span className="font-display text-5xl font-semibold leading-tight text-felt-ink">
          {name}
        </span>
        <span className="mt-2 font-display text-lg italic tracking-wide text-brass">{tagline}</span>
        <span className="mt-1 text-xs text-felt-sub">{deckCount} decks in the collection →</span>
      </div>
    </Link>
  );
}
