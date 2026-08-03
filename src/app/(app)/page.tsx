import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { StatTile } from "@/components/stat-tile";
import { DeckCard } from "@/components/deck-card";
import { CreatorCard, type CreatorRandomDeck } from "@/components/creator-card";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";
import { CardsIcon, PaletteIcon, LayersIcon, CoinIcon } from "@/components/icons";
import { FEATURED_CREATORS } from "@/lib/featured-creators";
import { getTagStyle } from "@/lib/placeholders";

const SPECIALTY_TAGS = ["Mini", "Tarot"] as const;

type SpecialtyTile =
  | { kind: "tag"; tag: (typeof SPECIALTY_TAGS)[number] }
  | { kind: "coins" };

const SPECIALTY_TILES: SpecialtyTile[] = [
  { kind: "tag", tag: "Mini" },
  { kind: "tag", tag: "Tarot" },
  { kind: "coins" },
];

// A faint tiled suit pattern behind the hero, echoing the poster-style creator cards below —
// generated inline so the effect doesn't need a hosted image asset.
const HERO_WATERMARK_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96"><text x="4" y="42" font-size="38" fill="#f3ead1">♠</text><text x="50" y="88" font-size="34" fill="#f3ead1">♦</text></svg>`;
const HERO_WATERMARK_URL = `url("data:image/svg+xml,${encodeURIComponent(HERO_WATERMARK_SVG)}")`;

const SPECIALTY_ACCENT_CLASSES: Record<string, string> = {
  plum: "border-plum/40 hover:bg-plum/10",
  brass: "border-brass/40 hover:bg-brass/10",
  sage: "border-sage/40 hover:bg-sage/10",
  brick: "border-brick/40 hover:bg-brick/10",
  "felt-ink": "border-felt-ink/30 hover:bg-felt-ink/10",
};

export default async function HomePage() {
  const [
    totalDecks,
    designerGroups,
    seriesGroups,
    creatorsData,
    recentDecks,
    specialtyCounts,
    coinCount,
  ] = await Promise.all([
    prisma.deck.count(),
    prisma.deck.groupBy({ by: ["designer"], where: { designer: { not: null } } }),
    prisma.deck.groupBy({ by: ["series"], where: { series: { not: null } } }),
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
    prisma.coin.count(),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div className="relative overflow-hidden rounded-lg border border-felt-line bg-felt-surface">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: HERO_WATERMARK_URL, backgroundRepeat: "repeat" }}
        />
        <div className="relative flex flex-col gap-6 p-6 lg:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <h1 className="font-display text-2xl font-semibold text-felt-ink sm:text-3xl">
              Welcome to the Card Guy Archive
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
              Enter the archives →
            </Link>
          </div>

          <div className="flex flex-col gap-3 lg:w-72 lg:shrink-0">
            <div className="grid grid-cols-2 gap-3">
              <StatTile
                icon={<CardsIcon className="h-6 w-6" />}
                label="Unique decks"
                value={totalDecks}
                href="/collection?type=deck"
              />
              <StatTile
                icon={<PaletteIcon className="h-6 w-6" />}
                label="Designers"
                value={designerGroups.length}
              />
              <StatTile
                icon={<CoinIcon className="h-6 w-6" />}
                label="Coins"
                value={coinCount}
                href="/collection?type=coin"
              />
              <StatTile
                icon={<LayersIcon className="h-6 w-6" />}
                label="Series"
                value={seriesGroups.length}
              />
            </div>
          </div>
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
                  deckCount={creator.deckCount}
                  href={viewAllHref}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm font-medium text-felt-sub">Specialty collections</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {SPECIALTY_TILES.map((tile) => {
            if (tile.kind === "coins") {
              const accentClass = SPECIALTY_ACCENT_CLASSES.brass;
              return (
                <Link
                  key="coins"
                  href="/collection?type=coin"
                  className={`flex items-center gap-3 rounded-lg border bg-felt-surface p-4 transition-colors ${accentClass}`}
                >
                  <CoinIcon className="h-8 w-8 shrink-0 text-brass" />
                  <div className="flex flex-col">
                    <span className="font-display text-lg font-semibold text-felt-ink">Coins</span>
                    <span className="text-sm text-felt-sub">{coinCount} in the collection →</span>
                  </div>
                </Link>
              );
            }

            const tagIndex = SPECIALTY_TAGS.indexOf(tile.tag);
            const style = getTagStyle(tile.tag);
            const accentClass = SPECIALTY_ACCENT_CLASSES[style.accent] ?? SPECIALTY_ACCENT_CLASSES.brass;
            return (
              <Link
                key={tile.tag}
                href={`/collection?tag=${encodeURIComponent(tile.tag)}`}
                className={`flex items-center gap-3 rounded-lg border bg-felt-surface p-4 transition-colors ${accentClass}`}
              >
                <span className="text-3xl leading-none">{style.icon}</span>
                <div className="flex flex-col">
                  <span className="font-display text-lg font-semibold text-felt-ink">
                    {tile.tag} decks
                  </span>
                  <span className="text-sm text-felt-sub">
                    {specialtyCounts[tagIndex]} in the collection →
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
