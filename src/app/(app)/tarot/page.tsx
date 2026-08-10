import { prisma } from "@/lib/prisma";
import { DecksLandingPage } from "@/components/decks-landing-page";

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
  const [decks, coins] = await Promise.all([
    prisma.deck.findMany({
      where: { tags: { has: "Tarot" } },
      include: { images: { orderBy: { sortOrder: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.coin.findMany({
      where: { tags: { has: "Tarot" } },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <DecksLandingPage
      title="Tarot Decks"
      heroSvg={TAROT_HERO_SVG}
      blurb="Tarot decks sit at an interesting intersection for me: illustration-heavy, symbol-dense, and built around a fixed 78-card structure that still leaves enormous room for a designer’s voice. I’m not drawn to them for divination—I’m drawn to them as some of the most ambitious, cohesive art projects in the whole hobby, where every single card has to pull its narrative weight. A strong tarot deck tells you who its Major Arcana are before you’ve read a single word. This is where I’m collecting the ones that do that best."
      decks={decks}
      coins={coins}
      showFilters
      filterTagSet="all"
      emptyMessage="No tarot decks yet."
    />
  );
}
