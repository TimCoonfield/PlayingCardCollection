import { CREATORS } from "@/lib/featured-creators";
import { getBrowseDeckCards } from "@/lib/catalog-browse";
import { getArchiveSearchSeries } from "@/lib/catalog-metadata";
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
type SearchDeck = Awaited<ReturnType<typeof getBrowseDeckCards>>[number];
type SearchSeries = Awaited<ReturnType<typeof getArchiveSearchSeries>>[number];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const rawScope = url.searchParams.get("scope") ?? "all";
  const scope: ArchiveSearchScope = isArchiveSearchScope(rawScope) ? rawScope : "all";

  if (query.length < 2) {
    return Response.json({ decks: [], creators: [], series: [], producers: [], archives: [] });
  }

  const include = (candidate: ArchiveSearchScope) => scope === "all" || scope === candidate;
  const [catalogDecks, catalogSeries] = await Promise.all([
    getBrowseDeckCards(),
    include("series") ? getArchiveSearchSeries() : Promise.resolve([]),
  ]);
  const [decks, creators, series, producers] = await Promise.all([
    findDecks(catalogDecks, query, scope),
    include("creator") ? findEntities(catalogDecks, [], "designer", query) : Promise.resolve([]),
    include("series") ? findEntities(catalogDecks, catalogSeries, "series", query) : Promise.resolve([]),
    include("producer") ? findEntities(catalogDecks, [], "producer", query) : Promise.resolve([]),
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

function findDecks(decks: SearchDeck[], query: string, scope: ArchiveSearchScope) {
  const normalized = query.toLocaleLowerCase();
  const includes = (value: string | null | undefined) =>
    value?.toLocaleLowerCase().includes(normalized) ?? false;
  return decks
    .filter((deck) =>
      scope === "notes"
        ? includes(deck.notes)
        : scope === "creator"
          ? deck.designers.some(includes) || includes(deck.producer)
          : scope === "series"
            ? includes(deck.series) || includes(deck.seriesRaw)
            : scope === "producer"
              ? includes(deck.producer)
              : includes(deck.name)
    )
    .map((deck) => {
      const name = deck.name.toLocaleLowerCase();
      const rank = name === normalized ? 0 : name.startsWith(normalized) ? 1 : name.includes(normalized) ? 2 : 3;
      return { ...deck, rank, href: `/decks/${deck.id}`, meta: deck.designers.join(" / ") || "Deck" };
    })
    .sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name))
    .slice(0, 2)
    .map((deck) => ({
      id: deck.id,
      label: deck.name,
      name: deck.name,
      designer: deck.designers.join(" / ") || null,
      href: deck.href,
      meta: deck.meta,
    }));
}

function findEntities(
  decks: SearchDeck[],
  series: SearchSeries[],
  field: "designer" | "series" | "producer",
  query: string
) {
  const normalized = query.toLocaleLowerCase();
  const rank = (value: string) => {
    const candidate = value.toLocaleLowerCase();
    return candidate === normalized ? 0 : candidate.startsWith(normalized) ? 1 : 2;
  };

  if (field === "series") {
    return series
      .filter(({ name }) => name.toLocaleLowerCase().includes(normalized))
      .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
      .slice(0, 4)
      .map((series): EntityResult => ({
        label: series.name,
        count: series._count.decks,
        href: `/series/${series.slug}`,
      }));
  }

  const counts = new Map<string, number>();
  for (const deck of decks) {
    const labels = field === "designer" ? deck.designers : deck.producer ? [deck.producer] : [];
    for (const label of labels) counts.set(label, (counts.get(label) ?? 0) + 1);
  }
  const labels = Array.from(counts.keys())
    .filter((label) => label.toLocaleLowerCase().includes(normalized))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .slice(0, 4);
  return labels.map((label): EntityResult => ({
    label,
    count: counts.get(label),
    href: `/collection?${field}=${encodeURIComponent(label)}`,
  }));
}
