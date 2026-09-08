import { deckPath } from "@/lib/deck-path";
import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { SITE_URL } from "@/lib/site";
import { hasSeriesPage } from "@/lib/series-visibility";

// This route has no session dependency. Page layouts keep their existing dynamic behavior.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [decks, coins, creators, series] = await Promise.all([
    prisma.deck.findMany({ select: { id: true, slug: true, updatedAt: true }, orderBy: { id: "asc" } }),
    prisma.coin.findMany({ select: { id: true, updatedAt: true }, orderBy: { id: "asc" } }),
    prisma.creator.findMany({ select: { slug: true, updatedAt: true }, orderBy: { slug: "asc" } }),
    prisma.series.findMany({
      select: { slug: true, updatedAt: true, _count: { select: { decks: true } } },
      orderBy: { slug: "asc" },
    }),
  ]);
  // Hub pages have no authoritative editorial timestamp; don't invent one for crawlers.
  return [
    ...["", "/collection", "/creators", "/stats", "/white-whales", "/mini", "/tarot", "/souvenir"]
      .map((path) => ({ url: `${SITE_URL}${path}` })),
    ...decks.map((deck) => ({ url: `${SITE_URL}${deckPath(deck)}`, lastModified: deck.updatedAt })),
    ...coins.map((coin) => ({ url: `${SITE_URL}/coins/${coin.id}`, lastModified: coin.updatedAt })),
    ...creators.map((creator) => ({ url: `${SITE_URL}/creators/${creator.slug}`, lastModified: creator.updatedAt })),
    ...series.filter((entry) => hasSeriesPage(entry._count.decks))
      .map((entry) => ({ url: `${SITE_URL}/series/${entry.slug}`, lastModified: entry.updatedAt })),
  ];
}
