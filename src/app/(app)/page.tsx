import type { ReactNode } from "react";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@/generated/prisma/client";
import { DeckCard } from "@/components/deck-card";
import type { CreatorRandomDeck } from "@/components/creator-card";
import { CreatorSpotlightCard } from "@/components/creator-spotlight-card";
import { SpecialtyCollectionCard } from "@/components/specialty-collection-card";
import {
  CardsIcon,
  PaletteIcon,
  LayersIcon,
  CoinIcon,
  CameraIcon,
  SearchIcon,
} from "@/components/icons";
import { HOMEPAGE_CREATORS } from "@/lib/featured-creators";

const SPECIALTY_TAGS = ["Mini", "Tarot"] as const;

export default async function HomePage() {
  const [
    totalDecks,
    designerGroups,
    seriesGroups,
    creatorsData,
    recentDecks,
    specialtyCounts,
    coinCount,
    souvenirCount,
  ] = await Promise.all([
    prisma.deck.count(),
    prisma.deck.groupBy({ by: ["designer"], where: { designer: { not: null } } }),
    prisma.deck.groupBy({ by: ["series"], where: { series: { not: null } } }),
    Promise.all(
      HOMEPAGE_CREATORS.map(async (creator) => {
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
        favorite: true,
        images: { orderBy: { sortOrder: "asc" }, select: { url: true } },
      },
    }),
    Promise.all(
      SPECIALTY_TAGS.map((tag) => prisma.deck.count({ where: { tags: { has: tag } } }))
    ),
    prisma.coin.count(),
    prisma.deck.count({ where: { series: "Souvenir Decks" } }),
  ]);

  const specialtyCollections = [
    {
      title: "Mini decks",
      description: "Small scale. Full character.",
      count: specialtyCounts[0],
      href: "/mini",
      icon: <SearchIcon />,
      accent: "brass" as const,
    },
    {
      title: "Tarot decks",
      description: "Illustrated worlds & arcana.",
      count: specialtyCounts[1],
      href: "/tarot",
      icon: <span>☾</span>,
      accent: "plum" as const,
    },
    {
      title: "Coins",
      description: "Pocket-sized artifacts.",
      count: coinCount,
      href: "/collection?type=coin",
      icon: <CoinIcon />,
      accent: "brass" as const,
    },
    {
      title: "Souvenir decks",
      description: "Places, journeys & histories.",
      count: souvenirCount,
      href: "/souvenir",
      icon: <CameraIcon />,
      accent: "brick" as const,
    },
  ];

  return (
    <div className="flex flex-col gap-10">
      <section className="archive-hero overflow-hidden rounded-xl border border-brass/35 bg-felt-header shadow-2xl shadow-black/25">
        <div className="archive-hero-art relative isolate flex min-h-[clamp(34rem,108vw,42rem)] items-start overflow-hidden lg:min-h-[36rem] lg:items-center">
          <div className="archive-hero-shade pointer-events-none absolute inset-0 -z-10" />
          <div className="archive-hero-frame pointer-events-none absolute inset-4 z-10 sm:inset-6" />

          <div className="relative z-20 flex w-full max-w-[43rem] flex-col items-center px-8 pb-10 pt-16 text-center sm:px-12 lg:items-start lg:px-14 lg:py-16 lg:text-left xl:px-16">
            <div className="flex w-full max-w-[34rem] items-center gap-4 text-[10px] font-semibold uppercase tracking-[0.42em] text-brass sm:text-xs">
              <span className="h-px flex-1 bg-brass/65" />
              <span aria-hidden="true" className="tracking-[0.3em]">♠ ♥ ♦ ♣</span>
              <span className="h-px flex-1 bg-brass/65" />
            </div>

            <h1 className="mt-6 max-w-[10ch] font-display text-5xl font-semibold leading-[0.96] tracking-[-0.035em] text-felt-ink sm:text-6xl lg:text-7xl xl:text-[5.2rem]">
              The Card Guy Archive
            </h1>

            <div className="archive-hero-divider my-7 h-px w-full max-w-[34rem] bg-brass/70" />

            <p className="max-w-[35rem] text-sm leading-7 text-felt-ink/90 sm:text-base sm:leading-8 lg:text-[1.05rem]">
              I&rsquo;ve been collecting playing cards since 2018, and spent several years running
              a YouTube channel (
              <a
                href="https://www.youtube.com/@TheCardGuyReviews"
                target="_blank"
                rel="noopener noreferrer"
                className="text-brass transition-colors hover:text-brass-deep"
              >
                The Card Guy Reviews
              </a>
              ) doing deck reviews. Along the way I even brought my own deck to life on
              Kickstarter, Rattler Gorge. This is where I catalog and share the collection as it
              keeps growing.
            </p>

            <Link
              href="/collection"
              className="archive-hero-cta mt-8 inline-flex items-center gap-4 bg-brass px-7 py-3.5 text-xs font-bold uppercase tracking-[0.16em] text-felt-header transition hover:bg-brass-deep sm:text-sm"
            >
              Browse the archives <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-brass/45 sm:grid-cols-4">
          <HeroStat
            icon={<CardsIcon className="h-7 w-7" />}
            label="Unique decks"
            value={totalDecks}
            href="/collection?type=deck"
          />
          <HeroStat
            icon={<PaletteIcon className="h-7 w-7" />}
            label="Designers"
            value={designerGroups.length}
          />
          <HeroStat
            icon={<CoinIcon className="h-7 w-7" />}
            label="Coins"
            value={coinCount}
            href="/collection?type=coin"
          />
          <HeroStat
            icon={<LayersIcon className="h-7 w-7" />}
            label="Series"
            value={seriesGroups.length}
          />
        </div>
      </section>

      <div className="flex flex-col gap-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-display text-base font-semibold tracking-wide text-brass">
            Featured creators
          </h2>
          <Link href="/creators" className="text-xs text-felt-sub hover:text-brass">
            Browse all creators →
          </Link>
        </div>
        <div className="flex flex-wrap justify-center gap-4">
          {creatorsData.map((creator) => {
            const viewAllHref =
              creator.landingPageHref ??
              (creator.matchProducerToo
                ? `/collection?creator=${encodeURIComponent(creator.designer)}`
                : `/collection?designer=${encodeURIComponent(creator.designer)}`);
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
                  accent={creator.accent}
                />
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold tracking-wide text-brass">Specialty collections</h2>
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4">
          {specialtyCollections.map((collection, index) => (
            <SpecialtyCollectionCard key={collection.href} index={index} {...collection} />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="font-display text-base font-semibold tracking-wide text-brass">Recently added</h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-10">
          {recentDecks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, (max-width: 1024px) 20vw, 10vw"
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function HeroStat({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: number;
  href?: string;
}) {
  const content = (
    <>
      <span className="text-brass">{icon}</span>
      <span className="font-display text-4xl font-semibold tabular-nums leading-none text-felt-ink sm:text-5xl">
        {value.toLocaleString()}
      </span>
      <span className="text-[10px] uppercase tracking-[0.16em] text-felt-ink/80 sm:text-xs">
        {label}
      </span>
    </>
  );

  const classes =
    "archive-hero-stat relative flex min-h-36 flex-col items-center justify-center gap-3 bg-felt-header/80 px-3 py-6 text-center transition-colors hover:bg-felt-surface/55 sm:min-h-44";

  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <div className={classes}>{content}</div>
  );
}
