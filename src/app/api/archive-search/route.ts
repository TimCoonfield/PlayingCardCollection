import { prisma } from "@/lib/prisma";
import { CREATORS } from "@/lib/featured-creators";
import {
  isArchiveSearchScope,
  type ArchiveSearchScope,
} from "@/lib/archive-search";

const ARCHIVES = [
  { label: "White Whales", href: "/white-whales", terms: ["white whale", "rare"] },
  { label: "Mini Decks", href: "/mini", terms: ["mini", "mini deck"] },
  { label: "Tarot Decks", href: "/tarot", terms: ["tarot", "tarot deck"] },
  { label: "Souvenir Decks", href: "/souvenir", terms: ["souvenir", "souvenir deck"] },
  { label: "Coins", href: "/collection?type=coin", terms: ["coin", "coins"] },
] as const;

type EntityResult = { label: string; href: string; count?: number; meta?: string };

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const rawScope = url.searchParams.get("scope") ?? "all";
  const scope: ArchiveSearchScope = isArchiveSearchScope(rawScope) ? rawScope : "all";

  if (query.length < 2) {
    return Response.json({ decks: [], creators: [], series: [], producers: [], archives: [] });
  }

  const include = (candidate: ArchiveSearchScope) => scope === "all" || scope === candidate;
  const [decks, creators, series, producers] = await Promise.all([
    findDecks(query, scope),
    include("creator") ? findEntities("designer", query) : Promise.resolve([]),
    include("series") ? findEntities("series", query) : Promise.resolve([]),
    include("producer") ? findEntities("producer", query) : Promise.resolve([]),
  ]);

  const creatorResults = creators.map((creator) => {
    const profile = CREATORS.find((entry) => entry.designer === creator.label);
    return {
      ...creator,
      label: profile?.displayName ?? creator.label,
      href: profile?.landingPageHref ?? `/collection?designer=${encodeURIComponent(creator.label)}`,
      meta: "Creator",
    };
  });
  const archiveResults =
    scope === "all"
      ? ARCHIVES.filter((archive) =>
          archive.terms.some((term) => term.includes(query.toLocaleLowerCase()))
        ).map(({ label, href }) => ({ label, href, meta: "Archive" }))
      : [];

  return Response.json({
    decks,
    creators: creatorResults,
    series: series.map((item) => ({ ...item, meta: "Series" })),
    producers: producers.map((item) => ({ ...item, meta: "Producer" })),
    archives: archiveResults,
  });
}

async function findDecks(query: string, scope: ArchiveSearchScope) {
  const field =
    scope === "notes"
      ? { notes: { contains: query, mode: "insensitive" as const } }
      : scope === "creator"
        ? {
            OR: [
              { designer: { contains: query, mode: "insensitive" as const } },
              { producer: { contains: query, mode: "insensitive" as const } },
            ],
          }
        : scope === "series"
          ? { series: { contains: query, mode: "insensitive" as const } }
          : scope === "producer"
            ? { producer: { contains: query, mode: "insensitive" as const } }
            : { name: { contains: query, mode: "insensitive" as const } };
  const rows = await prisma.deck.findMany({
    where: field,
    select: { id: true, name: true, designer: true },
    take: 20,
  });
  const normalized = query.toLocaleLowerCase();
  return rows
    .map((deck) => {
      const name = deck.name.toLocaleLowerCase();
      const rank = name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
      return { ...deck, rank, href: `/decks/${deck.id}`, meta: deck.designer ?? "Deck" };
    })
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((deck) => ({
      id: deck.id,
      label: deck.name,
      name: deck.name,
      designer: deck.designer,
      href: deck.href,
      meta: deck.meta,
    }));
}

async function findEntities(field: "designer" | "series" | "producer", query: string) {
  const candidates =
    field === "designer"
      ? (await prisma.deck.findMany({
          where: { designer: { contains: query, mode: "insensitive" } },
          distinct: ["designer"],
          select: { designer: true },
          take: 6,
        })).map((item) => item.designer)
      : field === "series"
        ? (await prisma.deck.findMany({
            where: { series: { contains: query, mode: "insensitive" } },
            distinct: ["series"],
            select: { series: true },
            take: 6,
          })).map((item) => item.series)
        : (await prisma.deck.findMany({
            where: { producer: { contains: query, mode: "insensitive" } },
            distinct: ["producer"],
            select: { producer: true },
            take: 6,
          })).map((item) => item.producer);
  const labels = candidates
    .filter((value): value is string => Boolean(value))
    .sort((a, b) => {
      const normalized = query.toLocaleLowerCase();
      const rank = (value: string) => {
        const candidate = value.toLocaleLowerCase();
        return candidate === normalized ? 0 : candidate.startsWith(normalized) ? 1 : 2;
      };
      return rank(a) - rank(b) || a.localeCompare(b);
    })
    .slice(0, 4);
  const counts = await Promise.all(
    labels.map((label) =>
      prisma.deck.count({
        where:
          field === "designer"
            ? { designer: label }
            : field === "series"
              ? { series: label }
              : { producer: label },
      })
    )
  );
  return labels.map((label, index): EntityResult => ({
    label,
    count: counts[index],
    href: `/collection?${field}=${encodeURIComponent(label)}`,
  }));
}
