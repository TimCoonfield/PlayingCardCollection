import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";
import { DeckSpotlightCard } from "@/components/deck-spotlight-card";

// Placeholder hero art (crystal ball, crescent moon, stars) until a real photo replaces it —
// see the docs at the bottom of this file for how to swap it out.
const TAROT_HERO_SVG = (
  <g stroke="#f3ead1" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="480" cy="280" r="130" />
    <ellipse cx="480" cy="410" rx="160" ry="18" />
    <path d="M320 410 q160 44 320 0" />
    <path
      d="M660 110 a42 42 0 1 1 -42 -42 a34 34 0 0 0 42 42 Z"
      fill="#f3ead1"
      stroke="none"
      opacity="0.85"
    />
    <path d="M570 90 l4 10 10 4 -10 4 -4 10 -4 -10 -10 -4 10 -4 Z" fill="#f3ead1" stroke="none" />
    <path
      d="M700 170 l3 7 7 3 -7 3 -3 7 -3 -7 -7 -3 7 -3 Z"
      fill="#f3ead1"
      stroke="none"
      opacity="0.8"
    />
  </g>
);

export default async function TarotDecksPage() {
  const decks = await prisma.deck.findMany({
    where: { tags: { has: "Tarot" } },
    include: { images: { orderBy: { sortOrder: "asc" } } },
    orderBy: { name: "asc" },
  });
  const favoriteDecks = decks.filter((d) => d.favorite);
  const restDecks = decks.filter((d) => !d.favorite);

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <svg
          viewBox="0 0 800 500"
          preserveAspectRatio="xMaxYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] lg:opacity-40"
          aria-hidden="true"
        >
          {TAROT_HERO_SVG}
        </svg>
        <div
          className="pointer-events-none absolute inset-0 hidden lg:block"
          style={{
            background:
              "linear-gradient(to right, color-mix(in srgb, var(--felt-bg) 90%, transparent) 0%, color-mix(in srgb, var(--felt-bg) 90%, transparent) 44%, transparent 58%)",
          }}
        />
        <div className="relative flex flex-col gap-3 p-6 lg:max-w-lg">
          <h1 className="font-display text-2xl font-semibold text-felt-ink sm:text-3xl">
            Tarot Decks
          </h1>
          <p className="text-sm text-felt-sub">
            Tarot decks sit at an interesting intersection for me: illustration-heavy,
            symbol-dense, and built around a fixed 78-card structure that still leaves enormous
            room for a designer&rsquo;s voice. I&rsquo;m not drawn to them for divination—I&rsquo;m
            drawn to them as some of the most ambitious, cohesive art projects in the whole
            hobby, where every single card has to pull its narrative weight. A strong tarot deck
            tells you who its Major Arcana are before you&rsquo;ve read a single word. This is
            where I&rsquo;m collecting the ones that do that best.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No tarot decks yet.</p>
      ) : (
        <>
          {favoriteDecks.length > 0 && (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {favoriteDecks.map((deck) => (
                <DeckSpotlightCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
          {restDecks.length > 0 && (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
              {restDecks.map((deck) => (
                <DeckCard key={deck.id} deck={deck} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
