import { getBrowseDeckCards } from "@/lib/catalog-browse";
import { getArchiveSearchSeries, getCreatorDirectory } from "@/lib/catalog-metadata";
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
type SearchCreator = Awaited<ReturnType<typeof getCreatorDirectory>>[number];

export async function GET(request: Request) {
  const url = new URL(request.url);
  const query = (url.searchParams.get("q") ?? "").trim().slice(0, 80);
  const rawScope = url.searchParams.get("scope") ?? "all";
  const scope: ArchiveSearchScope = isArchiveSearchScope(rawScope) ? rawScope : "all";

  if (query.length < 2) {
    return Response.json({ decks: [], creators: [], series: [], producers: [], archives: [] });
  }

  const include = (candidate: ArchiveSearchScope) => scope === "all" || scope === candidate;
  const [catalogDecks, catalogSeries, catalogCreators] = await Promise.all([
    getBrowseDeckCards(),
    include("series") ? getArchiveSearchSeries() : Promise.resolve([]),
    include("creator") || include("producer") ? getCreatorDirectory() : Promise.resolve([]),
  ]);
  const [decks, creators, series, producers] = await Promise.all([
    findDecks(catalogDecks, query, scope),
    include("creator") ? findCreators(catalogCreators, query) : Promise.resolve([]),
    include("series") ? findSeries(catalogSeries, query) : Promise.resolve([]),
    include("producer")
      ? findCreators(
          catalogCreators.filter((creator) => creator.role.includes("Producer")),
          query,
          "Producer"
        )
      : Promise.resolve([]),
  ]);

  const archiveResults =
    scope === "all"
      ? ARCHIVES.filter((archive) =>
          archive.terms.some((term) => term.includes(query.toLocaleLowerCase()))
        ).map(({ label, href }) => ({ label, href, meta: "Archive" }))
      : [];

  return Response.json({
    decks,
    creators,
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

function findSeries(series: SearchSeries[], query: string) {
  const normalized = query.toLocaleLowerCase();
  const rank = (value: string) => {
    const candidate = value.toLocaleLowerCase();
    return candidate === normalized ? 0 : candidate.startsWith(normalized) ? 1 : 2;
  };

  return series
    .filter(({ name }) => name.toLocaleLowerCase().includes(normalized))
    .sort((a, b) => rank(a.name) - rank(b.name) || a.name.localeCompare(b.name))
    .slice(0, 4)
    .map((item): EntityResult => ({
      label: item.name,
      count: item._count.decks,
      href: `/series/${item.slug}`,
    }));
}

function findCreators(creators: SearchCreator[], query: string, meta = "Creator") {
  const normalized = query.toLocaleLowerCase();
  const rank = (creator: SearchCreator) => {
    const names = [creator.name, creator.displayName].filter(
      (value): value is string => Boolean(value)
    );
    if (names.some((name) => name.toLocaleLowerCase() === normalized)) return 0;
    if (names.some((name) => name.toLocaleLowerCase().startsWith(normalized))) return 1;
    return 2;
  };
  return creators
    .filter((creator) =>
      [creator.name, creator.displayName]
        .filter((value): value is string => Boolean(value))
        .some((value) => value.toLocaleLowerCase().includes(normalized))
    )
    .sort(
      (left, right) =>
        rank(left) - rank(right) ||
        right.deckCount - left.deckCount ||
        left.name.localeCompare(right.name)
    )
    .slice(0, 4)
    .map((creator): EntityResult => ({
      label: creator.displayName ?? creator.name,
      count: creator.deckCount,
      href: `/creators/${creator.slug}`,
      meta,
    }));
}
