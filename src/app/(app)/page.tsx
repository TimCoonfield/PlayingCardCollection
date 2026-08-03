import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { StatTile } from "@/components/stat-tile";
import { DeckCard } from "@/components/deck-card";
import { CreatorCard, type CreatorRandomDeck } from "@/components/creator-card";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";
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
        const whereSql = creator.matchProducerToo
          ? Prisma.sql`(d.designer = ${creator.designer} OR d.producer = ${creator.designer})`
          : Prisma.sql`d.designer = ${creator.designer}`;
        const [deckCount, randomDecks] = await Promise.all([
          prisma.deck.count({
            where: creator.matchProducerToo
              ? { OR: [{ designer: creator.designer }, { producer: creator.designer }] }
              : { designer: creator.designer },
          }),
          prisma.$queryRaw<CreatorRandomDeck[]>`
            SELECT d.id, d.name, d.tags, img.url as "imageUrl"
            FROM "Deck" d
            LEFT JOIN LATERAL (
              SELECT url FROM "DeckImage" WHERE "deckId" = d.id ORDER BY "sortOrder" ASC LIMIT 1
            ) img ON true
            WHERE ${whereSql}
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
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex flex-1 flex-col gap-4 rounded-lg border border-felt-line bg-felt-surface p-6">
          <h1 className="font-display text-2xl font-semibold text-felt-ink">
            Tim&rsquo;s Card Collection
          </h1>
          <p className="max-w-2xl text-sm text-felt-sub">
            I&rsquo;ve been collecting playing cards since 2018, and spent several years running
            a YouTube channel (
            <a
              href="https://www.youtube.com/@TheCardGuyReviews"
              target="_blank"
              rel="noopener noreferrer"
              className="text-brass hover:text-brass-deep"
            >
              The Card Guy Reviews
            </a>
            ) doing deck reviews. Along the way I even brought my own deck to life on
            Kickstarter, Rattler Gorge. This is where I catalog and share the collection as it
            keeps growing.
          </p>
          <Link
            href="/collection"
            className="self-start rounded-md bg-brass px-4 py-2 text-sm font-semibold text-felt-bg hover:bg-brass-deep"
          >
            View the whole collection
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-4 lg:w-56 lg:grid-cols-1">
          <StatTile label="Total unique decks" value={totalDecks} />
          <StatTile label="Total decks" value={qtySum._sum.qty ?? 0} />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Featured creators</h2>
        <div className="flex flex-wrap justify-center gap-4">
          {creatorsData.map((creator) => {
            const viewAllHref = creator.matchProducerToo
              ? `/collection?creator=${encodeURIComponent(creator.designer)}`
              : `/collection?designer=${encodeURIComponent(creator.designer)}`;
            return (
              <div
                key={creator.designer}
                className="w-full sm:w-[calc(50%-0.5rem)] xl:w-[calc(33.333%-0.667rem)]"
              >
                {/* Poster-style treatment for all featured creators — a wide image as a
                    full-bleed watermark instead of the bio/logo card. Revert to the old
                    style by swapping back to the commented CreatorCard call below.

                    <CreatorCard
                      designer={creator.designer}
                      producer={creator.producer}
                      bio={creator.bio}
                      accent={creator.accent}
                      initials={creator.initials}
                      logoUrl={creator.logoUrl}
                      logoAlt={creator.logoAlt}
                      deckCount={creator.deckCount}
                      randomDecks={creator.randomDecks}
                      viewAllHref={viewAllHref}
                    /> */}
                <CreatorSpotlightCard
                  name={creator.designer}
                  tagline={creator.tagline}
                  imageUrl={creator.spotlightImageUrl}
                  imageAlt={creator.spotlightImageAlt}
                  href={viewAllHref}
                />
              </div>
            );
          })}
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

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Recently added</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {recentDecks.map((deck) => (
            <DeckCard key={deck.id} deck={deck} />
          ))}
        </div>
      </div>
    </div>
  );
}
