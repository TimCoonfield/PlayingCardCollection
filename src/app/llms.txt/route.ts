import { SITE_NAME, SITE_URL } from "@/lib/site";

export function GET() {
  const body = `# ${SITE_NAME}

> A public, owner-maintained visual archive of one personal playing-card and coin collection, including deck metadata, images, series, creators, and collection stories.

Use the public JSON endpoints below for read-only research and analysis. Start with deck search, then follow a result's \`detailUrl\` for the complete public catalog record. The APIs require no authentication, return UTF-8 JSON, allow cross-origin GET requests, and use \`schemaVersion: "1.0"\`. The current agent-facing JSON interface covers decks, not coins.

Search is case-insensitive. Repeated \`designer\`, \`producer\`, or \`series\` parameters match any listed value; repeated \`tag\` parameters require all listed tags. Supported scopes are \`all\`, \`name\`, \`creator\`, \`series\`, \`producer\`, and \`notes\`. Supported sorts are \`relevance\`, \`name-asc\`, \`name-desc\`, \`year-asc\`, \`year-desc\`, and \`recent\`. Optional filters are \`minYear\`, \`maxYear\`, \`favorite\`, \`whiteWhale\`, and \`hasPhoto\`. Pagination uses \`limit\` (1-100, default 50) and \`offset\`; follow \`pagination.nextUrl\` until it is null for collection-wide analysis.

This archive describes what is cataloged, not an authoritative statement that an unlisted deck is not owned. Names and creator credits may contain historical variants. When suggesting decks not in the archive, compare likely aliases and variants, explain uncertainty, and present suggestions rather than asserting absence. For large reads, request up to 100 records per page, follow pagination sequentially, and avoid repeatedly fetching unchanged pages.

No write capability is exposed. Agents may analyze records and propose corrections or additions, but must not claim to have changed the collection. Any future mutation API should require authentication, narrow permissions, validation, an explicit human confirmation step, and an audit trail.

## Public deck data

- [Browse decks](${SITE_URL}/api/catalog/decks?limit=50&offset=0): Paginated summary records for collection-wide analysis; follow \`pagination.nextUrl\`.
- [Search decks](${SITE_URL}/api/catalog/decks?q=Rattler&scope=all&limit=25): Case-insensitive substring search across public deck names, creators, Series, producers, and legacy notes.
- [Filter example](${SITE_URL}/api/catalog/decks?tag=Vintage&hasPhoto=true&sort=year-asc): Combine exact facets, booleans, release-year bounds, and sorting.
- [Single-deck details](${SITE_URL}/api/catalog/decks/REPLACE_WITH_DECK_ID): Replace the final path segment with an \`id\` returned by search. Includes ownership quantity, edition numbers, collection reasons, editorial fields, ordered images, Series context, and timestamps.

## Human-readable archive

- [Collection](${SITE_URL}/collection): Browse decks and coins with the site's interactive filters.
- [Collection statistics](${SITE_URL}/stats): Aggregate counts, designers, eras, release years, and Series.
- [Featured creators](${SITE_URL}/creators): Curated creator profiles and collection context.

## Optional

- [Archive Spotlight search](${SITE_URL}/api/archive-search?q=tarot): UI-oriented mixed search for decks, creators, Series, producers, and specialty archives. Results are intentionally small; use the public deck API for analysis.
- [White Whales](${SITE_URL}/white-whales): The owner's rarest and hardest-won decks.
`;

  return new Response(body, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/markdown; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
