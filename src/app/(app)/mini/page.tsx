import { prisma } from "@/lib/prisma";
import { DeckCard } from "@/components/deck-card";

// Placeholder hero art (magnifying glass over a few mini cards) until a real photo replaces it —
// see the docs at the bottom of this file for how to swap it out.
const MINI_HERO_SVG = (
  <g fill="none" stroke="#f3ead1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="560" y="90" width="90" height="128" rx="8" transform="rotate(-10 605 154)" />
    <rect x="610" y="120" width="90" height="128" rx="8" transform="rotate(7 655 184)" />
    <rect x="540" y="150" width="90" height="128" rx="8" transform="rotate(-18 585 214)" />
    <circle cx="420" cy="300" r="120" />
    <line x1="505" y1="385" x2="630" y2="510" strokeWidth="30" />
  </g>
);

export default async function MiniDecksPage() {
  const decks = await prisma.deck.findMany({
    where: { tags: { has: "Mini" } },
    include: { images: { orderBy: { sortOrder: "asc" }, take: 1 } },
    orderBy: { name: "asc" },
  });

  return (
    <div className="flex flex-col gap-8">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <svg
          viewBox="0 0 800 500"
          preserveAspectRatio="xMaxYMid slice"
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.1] lg:opacity-40"
          aria-hidden="true"
        >
          {MINI_HERO_SVG}
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
            Mini Decks
          </h1>
          <p className="text-sm text-felt-sub">
            There&rsquo;s something irresistible about a deck of cards you can barely believe is
            full-size. Mini decks compress every design decision—typography, line weight,
            color—into a fraction of the space, and somehow the best ones still read perfectly at
            a glance. I love hunting these down as a kind of bonus format: the same artists and
            studios I already follow, reimagined in miniature, often as limited extras rather than
            the main release. They take up almost no shelf space and pack an outsized amount of
            craft into a few square inches. This is where I&rsquo;m keeping track of them.
          </p>
        </div>
      </div>

      {decks.length === 0 ? (
        <p className="py-16 text-center text-felt-sub">No mini decks yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {decks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      )}
    </div>
  );
}
