import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { StatTile } from "@/components/stat-tile";
import { DeckCard } from "@/components/deck-card";
import { CreatorCard, type CreatorRandomDeck } from "@/components/creator-card";
import { FEATURED_CREATORS } from "@/lib/featured-creators";
import { getTagStyle } from "@/lib/placeholders";

const SPECIALTY_TAGS = ["Mini", "Tarot"] as const;

const SPECIALTY_ACCENT_CLASSES: Record<string, string> = {
  plum: "border-plum/40 hover:bg-plum/10",
  brass: "border-brass/40 hover:bg-brass/10",
  sage: "border-sage/40 hover:bg-sage/10",
  brick: "border-brick/40 hover:bg-brick/10",
  "felt-ink": "border-felt-ink/30 hover:bg-felt-ink/10",
};

export default async function HomePage() {
  const [totalDecks, qtySum, creatorsData, recentDecks, specialtyCounts] = await Promise.all([
    prisma.deck.count(),
    prisma.deck.aggregate({ _sum: { qty: true } }),
    Promise.all(
      FEATURED_CREATORS.map(async (creator) => {
        const [deckCount, randomDecks] = await Promise.all([
          prisma.deck.count({ where: { designer: creator.designer } }),
          prisma.$queryRaw<CreatorRandomDeck[]>`
            SELECT d.id, d.name, d.tags, img.url as "imageUrl"
            FROM "Deck" d
            LEFT JOIN LATERAL (
              SELECT url FROM "DeckImage" WHERE "deckId" = d.id ORDER BY "sortOrder" ASC LIMIT 1
            ) img ON true
            WHERE d.designer = ${creator.designer}
            ORDER BY RANDOM()
            LIMIT 3
          `,
        ]);
        return { ...creator, deckCount, randomDecks };
      })
    ),
    prisma.deck.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        name: true,
        series: true,
        designer: true,
        producer: true,
        qty: true,
        tags: true,
        images: { take: 1, orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
    Promise.all(
      SPECIALTY_TAGS.map((tag) => prisma.deck.count({ where: { tags: { has: tag } } }))
    ),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="flex flex-col gap-4 rounded-lg border border-felt-line bg-felt-surface p-6">
        <h1 className="font-display text-2xl font-semibold text-felt-ink">
          A card collection, catalogued
        </h1>
        <p className="max-w-2xl text-sm text-felt-sub">
          Browse, search, and track a growing collection of playing cards — from limited
          editions and tarot decks to the designers and studios behind them.
        </p>
        <Link
          href="/collection"
          className="self-start rounded-md bg-brass px-4 py-2 text-sm font-semibold text-felt-bg hover:bg-brass-deep"
        >
          View the whole collection
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:w-96">
        <StatTile label="Total unique decks" value={totalDecks} />
        <StatTile label="Total decks" value={qtySum._sum.qty ?? 0} />
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Featured creators</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {creatorsData.map((creator) => (
            <CreatorCard
              key={creator.designer}
              designer={creator.designer}
              producer={creator.producer}
              bio={creator.bio}
              accent={creator.accent}
              initials={creator.initials}
              logoUrl={creator.logoUrl}
              deckCount={creator.deckCount}
              randomDecks={creator.randomDecks}
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Recently added</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {recentDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Specialty collections</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {SPECIALTY_TAGS.map((tag, i) => {
            const style = getTagStyle(tag);
            const accentClass = SPECIALTY_ACCENT_CLASSES[style.accent] ?? SPECIALTY_ACCENT_CLASSES.brass;
            return (
              <Link
                key={tag}
                href={`/collection?tag=${encodeURIComponent(tag)}`}
                className={`flex items-center gap-3 rounded-lg border bg-felt-surface p-4 transition-colors ${accentClass}`}
              >
                <span className="text-3xl leading-none">{style.icon}</span>
                <div className="flex flex-col">
                  <span className="font-display text-lg font-semibold text-felt-ink">
                    {tag} decks
                  </span>
                  <span className="text-sm text-felt-sub">
                    {specialtyCounts[i]} in the collection →
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
