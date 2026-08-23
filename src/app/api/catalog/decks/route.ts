import {
  PUBLIC_DECK_SEARCH_SCOPES,
  PUBLIC_DECK_SORTS,
  searchPublicDecks,
  type PublicDeckSearchOptions,
  type PublicDeckSearchScope,
  type PublicDeckSort,
} from "@/lib/public-deck-api";

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;

const PUBLIC_API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = parseSearchOptions(url.searchParams);
  if ("error" in parsed) {
    return Response.json({ error: parsed.error }, { status: 400, headers: PUBLIC_API_HEADERS });
  }

  let result: Awaited<ReturnType<typeof searchPublicDecks>>;
  try {
    result = await searchPublicDecks(parsed);
  } catch {
    return Response.json(
      { error: "The catalog is temporarily unavailable." },
      { status: 503, headers: PUBLIC_API_HEADERS }
    );
  }
  const returned = result.decks.length;

  return Response.json(
    {
      schemaVersion: "1.0",
      data: result.decks.map((deck) => ({
        id: deck.id,
        name: deck.name,
        designer: deck.designer,
        producer: deck.producer,
        series: deck.series
          ? { name: deck.series, slug: deck.seriesSlug }
          : null,
        releaseYear: deck.releaseYear,
        quantity: deck.qty,
        tags: deck.tags,
        favorite: deck.favorite,
        whiteWhale: deck.whiteWhale,
        hasPhoto: deck.images.length > 0,
        imageUrl: deck.images[0]?.url ?? null,
        detailUrl: new URL(`/api/catalog/decks/${deck.id}`, url.origin).toString(),
        pageUrl: new URL(`/decks/${deck.id}`, url.origin).toString(),
      })),
      pagination: {
        total: result.total,
        limit: parsed.limit,
        offset: parsed.offset,
        returned,
        nextUrl:
          parsed.offset + returned < result.total
            ? pageUrl(url, parsed.offset + parsed.limit)
            : null,
        previousUrl:
          parsed.offset > 0
            ? pageUrl(url, Math.max(0, parsed.offset - parsed.limit))
            : null,
      },
      appliedFilters: {
        q: parsed.query || null,
        scope: parsed.scope,
        designer: parsed.designers,
        producer: parsed.producers,
        series: parsed.series,
        tag: parsed.tags,
        minYear: parsed.minYear,
        maxYear: parsed.maxYear,
        favorite: parsed.favorite,
        whiteWhale: parsed.whiteWhale,
        hasPhoto: parsed.hasPhoto,
        sort: parsed.sort,
      },
    },
    { headers: PUBLIC_API_HEADERS }
  );
}

export function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      ...PUBLIC_API_HEADERS,
      "Access-Control-Allow-Methods": "GET, OPTIONS",
    },
  });
}

function parseSearchOptions(
  params: URLSearchParams
): PublicDeckSearchOptions | { error: string } {
  const query = (params.get("q") ?? "").trim();
  if (query.length > 120) return { error: "q must be 120 characters or fewer." };

  const rawScope = params.get("scope") ?? "all";
  if (!PUBLIC_DECK_SEARCH_SCOPES.includes(rawScope as PublicDeckSearchScope)) {
    return { error: `scope must be one of: ${PUBLIC_DECK_SEARCH_SCOPES.join(", ")}.` };
  }

  const defaultSort = query ? "relevance" : "name-asc";
  const rawSort = params.get("sort") ?? defaultSort;
  if (!PUBLIC_DECK_SORTS.includes(rawSort as PublicDeckSort)) {
    return { error: `sort must be one of: ${PUBLIC_DECK_SORTS.join(", ")}.` };
  }

  const minYear = parseOptionalInteger(params.get("minYear"));
  const maxYear = parseOptionalInteger(params.get("maxYear"));
  if (minYear === "invalid" || maxYear === "invalid") {
    return { error: "minYear and maxYear must be whole numbers." };
  }
  if (minYear !== null && maxYear !== null && minYear > maxYear) {
    return { error: "minYear cannot be greater than maxYear." };
  }

  const favorite = parseOptionalBoolean(params.get("favorite"));
  const whiteWhale = parseOptionalBoolean(params.get("whiteWhale"));
  const hasPhoto = parseOptionalBoolean(params.get("hasPhoto"));
  if (favorite === "invalid" || whiteWhale === "invalid" || hasPhoto === "invalid") {
    return { error: "favorite, whiteWhale, and hasPhoto must be true, false, 1, or 0." };
  }

  return {
    query,
    scope: rawScope as PublicDeckSearchScope,
    designers: cleanList(params.getAll("designer")),
    producers: cleanList(params.getAll("producer")),
    series: cleanList(params.getAll("series")),
    tags: cleanList(params.getAll("tag")),
    minYear,
    maxYear,
    favorite,
    whiteWhale,
    hasPhoto,
    sort: rawSort as PublicDeckSort,
    limit: parseBoundedInteger(params.get("limit"), DEFAULT_LIMIT, 1, MAX_LIMIT),
    offset: parseBoundedInteger(params.get("offset"), 0, 0, Number.MAX_SAFE_INTEGER),
  };
}

function cleanList(values: string[]) {
  return Array.from(new Set(values.map((value) => value.trim()).filter(Boolean)));
}

function parseOptionalInteger(value: string | null): number | null | "invalid" {
  if (value === null || value === "") return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : "invalid";
}

function parseOptionalBoolean(value: string | null): boolean | null | "invalid" {
  if (value === null || value === "") return null;
  if (value === "true" || value === "1") return true;
  if (value === "false" || value === "0") return false;
  return "invalid";
}

function parseBoundedInteger(value: string | null, fallback: number, min: number, max: number) {
  if (value === null || value === "") return fallback;
  const parsed = Number(value);
  if (!Number.isInteger(parsed)) return fallback;
  return Math.max(min, Math.min(parsed, max));
}

function pageUrl(current: URL, offset: number) {
  const next = new URL(current);
  next.searchParams.set("offset", String(offset));
  return next.toString();
}
