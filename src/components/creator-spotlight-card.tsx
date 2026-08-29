import Image from "next/image";
import Link from "next/link";

export type CreatorAccent = "plum" | "brass" | "sage" | "brick" | "felt-ink";

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
  coinCount = 0,
  href,
  accent = "brass",
}: {
  name: string;
  tagline?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  deckCount: number;
  coinCount?: number;
  href: string;
  accent?: CreatorAccent;
}) {
  const nameSizeClass =
    name.length >= 34
      ? "text-[1.75rem] sm:text-3xl lg:text-4xl xl:text-[2rem]"
      : name.length >= 25
        ? "text-3xl sm:text-4xl"
        : "text-5xl";

  return (
    <Link
      href={href}
      className={`group relative flex aspect-[4/3] w-full overflow-hidden rounded-lg border border-felt-line bg-felt-surface shadow-lg shadow-black/20 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35 ${ACCENT_BORDER_CLASSES[accent]}`}
    >
      {imageUrl ? (
        <Image
          src={imageUrl}
          alt={imageAlt ?? `Artwork by ${name}`}
          fill
          unoptimized={imageUrl.startsWith("/")}
          sizes="(min-width: 1280px) 33vw, (min-width: 640px) 50vw, 100vw"
          className="object-cover opacity-30 saturate-[0.85] transition duration-300 group-hover:scale-[1.03] group-hover:opacity-40 group-hover:saturate-100"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center font-display text-8xl font-semibold text-brass/15"
        >
          {name
            .split(" ")
            .map((part) => part[0])
            .join("")}
        </span>
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-felt-bg/15 via-felt-bg/55 to-felt-bg/95" />
      <div className="relative mt-auto flex w-full flex-col p-5">
        <span
          className={`text-balance font-display font-semibold leading-[1.05] text-felt-ink ${nameSizeClass}`}
        >
          {name}
        </span>
        {tagline && (
          <span className="mt-2 font-display text-lg italic tracking-wide text-brass">{tagline}</span>
        )}
        <span className="mt-4 flex items-baseline justify-between gap-3 border-t border-felt-line/60 pt-3">
          <span className="flex items-baseline gap-2">
            <span className="font-display text-3xl font-semibold leading-none text-felt-ink">
              {deckCount}
            </span>
            <span className="text-[11px] uppercase tracking-wider text-felt-sub">
              {deckCount === 1 ? "deck" : "decks"}
              {coinCount > 0 && ` · ${coinCount} ${coinCount === 1 ? "coin" : "coins"}`}
            </span>
          </span>
          <span className="text-xl text-brass" aria-hidden="true">
            →
          </span>
        </span>
      </div>
    </Link>
  );
}
