# SEO and deck URL rollout

Public URLs use https://www.cardguyarchive.com. Existing pages still read the session
cookie and remain dynamically rendered, with the existing tagged catalog data caches.
Only `/sitemap.xml` has a new one-hour route cache. Entity mutations and the maintenance
cache-refresh endpoint also invalidate the sitemap.

Unfiltered collection pagination uses a self-canonical, with page one normalized to
`/collection`. Search, filter, and alternative-sort URLs use `noindex, follow` without
a canonical pointing at a different result set. Invalid/out-of-range pagination returns
404. Login and editing pages retain their existing noindex policy.

## Stored deck addresses

The `Deck.slug` column is unique and indexed. It is nullable for an additive rollout:
old code can continue to write while the migration is deployed. New application creates
assign a slug in the same transaction; the backfill covers existing rows. A missing slug
uses the ID temporarily, never a slug derived at render time. After rollout, audit for
missing slugs when running out-of-band imports.

The allocator follows the existing Series normalization (ASCII lowercase, hyphens,
accent removal). It tries title plus known release year (without repeating a trailing
year), then producer, then a stable ID-hash suffix. Backfill order is ID ascending with
C collation, so duplicate allocation is deterministic. Existing slugs are never rewritten.
Reserved page names and cuid-shaped slugs cannot be assigned.

`DeckSlugHistory` reserves current and historical slugs. A database trigger records every
assigned slug, including maintenance-script changes, and rejects reuse by another Deck.
Renaming a Deck's title does not change its slug. There is deliberately no new slug editor.
Deleting a Deck cascades its address history; deleted Deck URLs return 404.

Public deck requests resolve an ID, current slug, or former slug. Old addresses redirect
straight to the current slug with **308**, the approved Next.js permanent status. Database
IDs remain the keys for forms, mutations, relationships, and `/api/catalog/decks/[id]`.
API `pageUrl` values, cards, search, Series navigation, and JSON-LD use stored slugs.

## Deployment order (production requires separate authorization)

1. Review `prisma/migrations/20260908020000_deck_slugs/migration.sql` and
   `scripts/deck-slug-backfill.ts`.
2. With the intended database explicitly supplied as `DATABASE_URL`, run the preview:
   `node --import tsx scripts/deck-slug-backfill.ts --output=/tmp/deck-slug-preview.json`.
   This also works before the schema migration and performs only read-only queries.
3. Apply `npx prisma migrate deploy` to that same database after checking pending migrations.
   Migrations are not automatically applied by Vercel.
4. Run `node --import tsx scripts/deck-slug-backfill.ts --apply --confirm --output=/tmp/deck-slug-applied.json`.
   The script writes only previously missing slugs and preserves `Deck.updatedAt`.
5. Deploy the application. Keep catalog writes paused during steps 4–5, or rerun the
   idempotent backfill after deployment to catch rows created by the old application.
6. Use the existing secret-gated `/api/admin/revalidate-catalog` endpoint to clear catalog
   caches and the sitemap. Do not print its authorization secret.
7. Check slug and ID URLs, historical redirects, collection canonicals, robots.txt,
   sitemap XML, and branded 404s. Check page response cache headers in production mode.

Creator slugs, existing editorial copy, and the AI crawler rules are unchanged. Coin
pages are included in the sitemap; Series must meet the existing two-deck public-page
threshold. Hub entries omit lastModified because no authoritative editorial timestamp
exists. Entity entries use their stored updatedAt values.

## Verification completed locally (2026-09-08)

- TypeScript (`npx tsc --noEmit`), ESLint (`npm run lint`), and diff checks passed.
- The migration was applied to localhost, and all 2,528 local Decks received unique
  slugs. A second preview proposed zero changes.
- SQL checks in disposable PGlite verified history reservation, reserved-name rejection,
  slug-clear rejection, and stable URLs after title edits. Prisma transaction checks
  verified automatic creation and both producer/hash collision fallbacks.
- An isolated production build (`next build --webpack`) succeeded. HTTP verification
  used a temporary shared single-connection pg pool because the local Prisma emulator
  permits ten connections; application pooling configuration was not changed.
- All public hubs/specialty pages, pagination, and sampled Deck/Creator/Series pages
  returned 200 with the expected canonical and the existing private/no-store headers.
  Filtered views returned `noindex, follow`. The sitemap returned valid XML with 3,919
  unique local URLs and a route-cache HIT. Its build manifest specifies 3,600 seconds.
- Missing records, unknown routes, invalid specialty subpaths, singleton Series, and
  out-of-range pagination returned branded 404s. Missing-record and ID-redirect checks
  also passed with simulated 500 ms database latency.
- Temporary Deck/Coin/Series fixtures verified historical and ID redirects (308),
  canonical URLs after a slug change, coin metadata, and the stable ID-based API.
  All temporary database records were removed or rolled back.
- Desktop and 390px-wide 404 layouts were viewed in a browser; header search opened.
  A stored-slug Deck page was also viewed in the production build.

These counts describe the local dataset. Verify production counts and live responses
when following the deployment procedure above.
