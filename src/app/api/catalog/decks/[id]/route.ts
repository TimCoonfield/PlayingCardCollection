import { deckPath } from "@/lib/deck-path";
import { getPublicDeckDetail } from "@/lib/public-deck-api";
import { getSeriesDeckNavigation } from "@/lib/series-data";
import { hasSeriesPage } from "@/lib/series-visibility";

const PUBLIC_API_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Cache-Control": "public, s-maxage=300, stale-while-revalidate=86400",
  "X-Content-Type-Options": "nosniff",
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  let deck: Awaited<ReturnType<typeof getPublicDeckDetail>>;
  let seriesDeckCount = 0;
  try {
    deck = await getPublicDeckDetail(id);
    if (deck?.series) {
      seriesDeckCount = (await getSeriesDeckNavigation(deck.series.slug)).length;
    }
  } catch {
    return Response.json(
      { error: "The catalog is temporarily unavailable." },
      { status: 503, headers: PUBLIC_API_HEADERS }
    );
  }
  if (!deck) {
    return Response.json(
      { error: "Deck not found." },
      { status: 404, headers: PUBLIC_API_HEADERS }
    );
  }

  const origin = new URL(request.url).origin;
  return Response.json(
    {
      schemaVersion: "1.0",
      data: {
        id: deck.id,
        name: deck.name,
        pageUrl: new URL(deckPath(deck), origin).toString(),
        designers: deck.designers,
        designer: deck.designer,
        producer: deck.producer,
        series: deck.series
          ? {
              id: deck.series.id,
              name: deck.series.name,
              slug: deck.series.slug,
              subtitle: deck.series.subtitle,
              deckCount: seriesDeckCount,
              pageUrl: hasSeriesPage(seriesDeckCount)
                ? new URL(`/series/${deck.series.slug}`, origin).toString()
                : null,
              deckOrder: deck.seriesOrder,
              variantNote: deck.variantNote,
            }
          : null,
        releaseYear: deck.releaseYear,
        releaseYearEstimated: deck.releaseYearEstimated,
        tags: deck.tags,
        ownership: {
          status: deck.ownershipStatus,
          quantity: deck.qty,
        },
        limitedEdition: deck.productionRun || deck.editions.length > 0
          ? {
              productionRun: deck.productionRun,
              ownedCopyNumbers: deck.editions.map((edition) => edition.deckNumber),
            }
          : null,
        collectionReasons: {
          primary: deck.collectionReasonPrimary,
          secondary: deck.collectionReasonSecondary,
        },
        editorial: {
          hook: deck.hook,
          notes: deck.notes,
          essayMarkdown: deck.essay,
          reviewedAt: deck.notesReviewedAt
            ? new Date(deck.notesReviewedAt).toISOString()
            : null,
        },
        catalogNumber: deck.catalogNumber,
        favorite: deck.favorite,
        whiteWhale: deck.whiteWhale,
        images: deck.images,
        createdAt: new Date(deck.createdAt).toISOString(),
        updatedAt: new Date(deck.updatedAt).toISOString(),
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
