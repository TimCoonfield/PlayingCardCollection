# AGENTS.md — Card Guy Archive

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

Guidance for coding agents (Claude Code, Codex, or others) working in this repository. Written
from direct inspection of the code as of this commit — not a generic template. If something
below turns out to be wrong or stale, fix this file in the same change that proves it wrong.

## 1. Project overview

**Card Guy Archive** (package name `playing-card-collection`, site title "Card Guy Archive") is
a personal, single-owner visual catalog for a physical playing-card (and coin) collection
belonging to one person ("Tim" / "The Card Guy," per `src/app/(app)/nav-bar.tsx` and the
homepage copy). It is **not** a multi-tenant SaaS product and **not** an e-commerce site — there
is one collection, one owner, and one shared password for anyone who needs to add/edit content.

- **Public visitors** can browse and search the entire collection read-only, with no login.
- **The owner** logs in with a single shared password to add, edit, delete, and favorite items.
- There is no per-user data, no accounts table, no multi-tenancy of any kind.

Major content types (see [§6 Data model](#6-data-model) for details):

- **Decks** — the primary entity (~2,500 seeded). Have photos, tags, a designer/producer,
  series, release year, ownership/quantity, and optionally numbered limited-edition copies.
- **Coins** — a smaller secondary collectible type, structurally similar to decks but simpler
  (exactly two photos: obverse/reverse; no edition-number concept).
- **Creators** — a small, hand-curated list of favorite designers (`src/lib/featured-creators.ts`),
  **not a database table**. Matched to decks purely by string equality on `designer`/`producer`.
- **Specialty/creator landing pages** — 9 dedicated pages (Souvenir, Mini, Tarot, and 6 creator
  pages) built from one shared layout component.
- **Favorites** — a boolean flag on decks (decks only, not coins) that drives sort order and a
  dedicated "Featured Decks" spotlight treatment on landing pages.

**Inferred design principles** (from the implementation, not stated anywhere explicitly):

- Visual character is "curated antique archive / museum poster," not a generic product catalog.
  Dark felt-green background, brass/gold accents, serif display type for names/titles. See
  [§10](#10-ui-and-design-conventions).
- Prefer showing real collection data (random deck photos, live counts) over static marketing
  copy wherever practical — the homepage, stats page, and landing pages are all driven by live
  Prisma queries, not hardcoded content (except the curated creator bios/photos).
- Every write path re-checks authentication itself, never trusting the UI alone (see
  [§4 Architecture](#4-architecture)) — this is a deliberate, repeated pattern, not an oversight.

## Product owner preferences

These aren't derivable from the code alone — they come from how this project's owner has
directed changes to it over time, and matter for judgment calls the sections below don't cover:

- This is a personal archive and storytelling project, not just an inventory database. Creator
  bios and landing-page copy are written in the owner's own first-person voice (see
  `src/lib/featured-creators.ts` and the blurb text passed into `DecksLandingPage` on each
  landing page) — favor historical context, creator intent, and collection storytelling over
  dry catalog listings when adding this kind of content.
- The owner is receptive to distinctive visual/interaction ideas but has repeatedly pushed back
  on motion or novelty that competes with the deck artwork itself — a slow full-image crossfade
  on the featured-deck cards was tried and explicitly rejected as "distracting" in favor of a
  static layout. Default to static, restrained interactions; treat animation as something to
  justify, not a default.
- When there are multiple reasonable ways to build something, a brief tradeoff explanation is
  more useful than silently picking the most conventional option and moving on.
- Preserve the owner's existing copy and voice (hero blurbs, bios, nav labels) unless a task
  explicitly asks for a rewrite — don't "clean up" prose while doing an unrelated change.
- Treat Blob as the home for dynamically uploaded deck and coin photos. For future fixed creator
  portraits, logos, hero backgrounds, and decorative imagery, consider a pre-sized, compressed,
  content-hashed static asset first; this keeps durable design assets out of the catalog's Blob
  storage and transformation budget. Do not migrate existing curated images without a specific
  request—the current volume is too small to materially affect usage.
- Don't add features just because they're common on inventory/collection or e-commerce sites
  (ratings, carts, generic dashboards) — see [§10](#10-ui-and-design-conventions) for the visual
  character this would violate.

## 2. Technology stack

| Layer | Choice | Where configured |
|---|---|---|
| Framework | Next.js **16.2.12**, App Router | `next.config.ts`, `package.json` |
| UI runtime | React **19.2.4** / React DOM 19.2.4 | `package.json` |
| Language | TypeScript **5.x**, `strict: true` | `tsconfig.json` |
| Styling | Tailwind CSS **v4** (CSS-first config, no `tailwind.config.js`) | `src/app/globals.css`, `postcss.config.mjs` |
| Database | PostgreSQL | via `DATABASE_URL` |
| ORM | Prisma **7.9.1**, `prisma-client` generator (not the older `prisma-client-js`) | `prisma/schema.prisma`, `prisma.config.ts` |
| DB driver | `@prisma/adapter-pg` over `pg` (driver adapter, not Prisma's built-in engine) | `src/lib/prisma.ts` |
| Image storage | Vercel Blob (`@vercel/blob`) | `src/app/api/upload/route.ts`, `src/components/image-uploader.tsx` |
| AI vision | Anthropic SDK, Claude Sonnet 5, structured zod output | `src/lib/anthropic.ts` |
| Auth/session | `iron-session` — single shared password, one cookie, no user table | `src/lib/auth.ts`, `src/proxy.ts` |
| Validation | `zod` v4 | `src/lib/schemas.ts`, `src/lib/coin-schemas.ts` |
| Charts | `recharts` | `src/components/stats-charts.tsx` |
| Script runner | `tsx` (runs `.ts` files directly, used for `scripts/*`) | `package.json` |
| Hosting | Vercel (inferred from Blob usage, `.vercel/` link dir, and README's deploy instructions) | — |
| Package manager | npm (`package-lock.json` present, no yarn/pnpm lockfile) | — |

**Node version**: not pinned anywhere in this repo (no `engines` field in `package.json`, no
`.nvmrc`). Unknown — use whatever Next.js 16 currently requires.

**No test framework is configured** — no Jest/Vitest/Playwright config, no test script in
`package.json`, no `*.test.*` or `__tests__` files anywhere in the repo. See [§13](#13-testing-and-verification).

## 3. Repository structure

```
prisma/
  schema.prisma          # source of truth for the DB shape
  migrations/             # hand-authored + prisma-generated SQL migrations (see §12)
scripts/
  seed.ts                 # one-time bulk import of the original spreadsheet (see §3 warning below)
  seed-data.json           # the ~2,528-row dataset seed.ts reads
  migrate-edition-notes.ts # one-off historical data-cleanup script (already run; kept for reference)
src/
  generated/prisma/        # PRISMA-GENERATED CLIENT — gitignored, never hand-edit. Regenerate with
                            # `npx prisma generate` (also runs automatically via `postinstall`).
  proxy.ts                 # Next 16's renamed middleware.ts — the only route-level auth gate
  lib/
    prisma.ts               # singleton PrismaClient (dev-mode global caching)
    auth.ts                 # iron-session config + getSession()
    schemas.ts               # deck zod schema + ALL_TAGS + parseDeckFormData()
    coin-schemas.ts           # coin zod schema + COIN_TAGS + parseCoinFormData()
    featured-creators.ts       # hand-curated FEATURED_CREATORS array (not DB-backed)
    placeholders.ts            # tag → emoji/color placeholder-art rules (deck & tag chip styling)
    anthropic.ts               # Claude vision deck-identification call
  components/               # shared UI — see §10 for which ones to reuse
  app/
    layout.tsx               # root HTML layout, fonts, metadata
    globals.css               # the entire design-token / Tailwind theme (see §10)
    login/                    # public login page + server action
    api/
      upload/route.ts          # Vercel Blob client-upload token endpoint (session-gated)
      ai/identify/route.ts      # Claude deck-identification endpoint (session-gated)
    (app)/                    # the route group for the whole authenticated-and-public app shell
      layout.tsx                # NavBar + page shell, reads session for isAuthenticated
      page.tsx                   # homepage: hero, featured creators, specialty tiles, recent decks
      nav-bar.tsx                 # top nav (client component)
      logout-action.ts
      collection/page.tsx         # the unified deck+coin search/browse page (merged in JS, see §6)
      stats/page.tsx               # aggregate stats dashboard
      decks/                       # deck CRUD: new/, [id]/, [id]/edit/, actions.ts
      coins/                       # coin CRUD: new/, [id]/, [id]/edit/, actions.ts, page.tsx (redirects to /collection)
      souvenir/, mini/, tarot/      # 3 specialty-collection landing pages (thin wrappers)
      creators/{name}/              # 6 creator landing pages (thin wrappers), one dir per person
```

**Generated/do-not-hand-edit**: `src/generated/prisma/**`, `.next/`, `next-env.d.ts`,
`tsconfig.tsbuildinfo`. All gitignored.

## 4. Architecture

- **Server Components by default.** Every `page.tsx` under `src/app/(app)/` is an async Server
  Component that queries Prisma directly and renders server-side — there is no client-side data
  fetching layer (no SWR/React Query, no `/api` routes for reading data). The only two `api/`
  routes exist because their work (Blob upload tokens, Claude calls) *must* run server-side and
  be called from client code.
- **Mutations are Server Actions**, defined in `actions.ts` files colocated with each resource
  (`src/app/(app)/decks/actions.ts`, `src/app/(app)/coins/actions.ts`), wired to forms via
  `useActionState` in client form components (`deck-form.tsx`, `coin-form.tsx`) or plain
  `<form action={...}>` for simple mutations (delete, favorite-toggle).
- **Auth is checked twice, deliberately**: `src/proxy.ts` (Next 16's renamed `middleware.ts`)
  redirects unauthenticated visitors away from a short allowlist of write routes/pages, **and**
  every Server Action independently calls `getSession()` and checks `session.authenticated`
  before doing anything. The comment in `decks/actions.ts` explains why: *"Server Actions are
  reachable via direct POST requests regardless of what the UI shows, so every mutation checks
  the session itself rather than relying on the proxy or a hidden button."* Do not remove either
  check, and add the same pattern to any new mutation.
- **Client components are the exception, not the default** — used only where interactivity is
  required: image uploader, galleries (carousel state), filter forms (URL-param syncing), the
  favorite-toggle button, nav bar (active-link highlighting). Everything else stays server-only.
- **No global client state manager.** "State" is either server data (re-fetched via
  `router.push`/`revalidatePath` triggering a server re-render) or local `useState` inside a
  single client component. `src/components/collection-filters.tsx` is the most complex example:
  it reads/writes the URL's search params directly and debounces text input before pushing.
- **Business logic lives in `actions.ts` (mutations) and `lib/*.ts` (shared logic/validation)**,
  not scattered across components. Page components mostly compose Prisma queries + presentational
  components; form components mostly manage local upload/edit state and defer validation to the
  zod schemas in `lib/schemas.ts` / `lib/coin-schemas.ts`.
- **Public vs. admin is not a separate app or route tree** — it's the *same* pages for everyone,
  with edit/delete/add UI conditionally rendered based on `isAuthenticated` (computed once per
  page from `getSession()`). There is no `/admin` section.

## 5. Local development

1. Install dependencies: `npm install` (this also runs `prisma generate` via `postinstall`).
2. `.env.local` must define (see README.md for the full explanation of each):
   `DATABASE_URL`, `SHADOW_DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ANTHROPIC_API_KEY`,
   `SESSION_SECRET`, `APP_PASSWORD`. (A `VERCEL_OIDC_TOKEN` var also appears locally but is
   Vercel-CLI-managed, not something you set by hand.)
3. Database: README documents `npx prisma dev` (Prisma's local Postgres, no Docker) as the local
   Postgres. **In practice, treat this as unreliable for schema changes** — see [§12](#12-database-and-migration-safety)
   for the actual working migration procedure used throughout this project's history.
4. The deck table is expected to already be seeded (~2,528 rows). `npm run seed` **no-ops if the
   table already has any rows** (see `scripts/seed.ts`) — it will never duplicate or overwrite.
5. Start the app: `npm run dev`, open `http://localhost:3000`, log in with `APP_PASSWORD`.

**Common pitfalls**:
- Photo upload and AI-identify will silently fail without `BLOB_READ_WRITE_TOKEN` /
  `ANTHROPIC_API_KEY` set — errors surface in the browser, check `.env.local` first.
- `prisma migrate dev` against the local emulator has proven unreliable in this project's
  history; don't assume a failed/hanging migration means your SQL is wrong. See §12.
- Vercel Blob and Next's image optimizer both cache aggressively **by URL**. If you overwrite an
  existing Blob object at the same path/URL to update an image, both layers can keep serving the
  stale cached version indefinitely. Upload to a **new** path/filename instead of overwriting.

## 6. Data model

Authoritative source: `prisma/schema.prisma` (kept intentionally short — read it directly rather
than trusting a stale copy in this doc). Four write-through models: `Series`, `Deck`, `DeckImage`,
`DeckEdition`, plus a standalone `Coin`.

### Deck
The primary entity. Key fields beyond the obvious (`name`, `designer`, `producer`,
`notes`, `catalogNumber`, `releaseYear`): 
- `seriesId: String?` — nullable FK to the one canonical `Series` a Deck belongs to.
  `seriesOrder` provides optional within-Series ordering and `variantNote` explains what
  distinguishes similar members. The physical `series` column remains as a compatibility mirror
  exposed by Prisma as `seriesLegacy`; `seriesRaw` preserves the original imported value and is
  not rewritten when membership or a Series name changes.
- `tags: String[]` — free-form but validated against a fixed allowlist (`ALL_TAGS` in
  `src/lib/schemas.ts`), Postgres GIN-indexed for filtering.
- `qty: Int` — how many physical copies of this deck are owned (default 1).
- `productionRun: Int?` — the total size of a limited print run (the "700" in "391/700"), a
  property of the **deck**, not of any one copy.
- `collectionReasonPrimary` / `collectionReasonSecondary` — nullable `CollectionReason` enum
  values answering why the Deck belongs in the collection. The two values must differ when both
  are present and are filterable independently or together on `/collection`; they are deliberately
  separate from tags.
- Editorial depth is split across `hook` (nullable `VARCHAR(240)`, one-sentence public lead), the
  legacy `notes` text field (preserved as concise Deck/copy commentary), and `essay` (nullable
  Markdown long-form context). `notesReviewedAt` is an explicit owner-set timestamp and must never
  be inferred from whether any editorial field is populated. Hook and essay are intentionally not
  searchable; legacy notes retain their existing search behavior.
- `favorite: Boolean` — deck-only (Coin has no equivalent field). Drives `/collection` sort order
  and the "Featured Decks" spotlight section on every landing page.
- Relations: `images: DeckImage[]` (unbounded, ordered), `editions: DeckEdition[]` (one row per
  *specifically numbered* owned copy — **not** one row per unit of `qty`; a deck can have
  `qty: 3` and 0, 1, 2, or 3 `DeckEdition` rows depending on how many of those copies have a
  known number). The deck-form's zod schema enforces `editionNumbers.length <= qty`.
- Detail-page display logic (see `src/app/(app)/decks/[id]/page.tsx`): if `editions.length > 0`,
  show one tile per edition as `"{deckNumber}/{productionRun}"`; else if `productionRun` is set
  but no editions are recorded, show a single placeholder tile `"XX/{productionRun}"`.

### Series
First-class canonical Deck families. A Series owns its display name, stable unique slug, optional
subtitle, Markdown description, hero override, and free-text attribution label/text. Attribution
is never inferred from member Decks. Every Series is public at `/series/[slug]`; if no hero is set,
the page deterministically assigns one of four static engraved suit emblems from the Series id.
Member Deck imagery is not used as the Series fallback. Legacy
`/collection?series=...` filters remain supported. Backfill, duplicate-review, merge, and rollback
tooling lives in `scripts/series-migration.ts`.

### DeckImage
`{ url, sortOrder }`, cascade-deletes with its Deck. **The image at `sortOrder: 0` (ascending) is
the "main" photo everywhere** — listing thumbnails, the gallery's initial frame, and the
spotlight card's main image all key off "first by `sortOrder`." There is no separate
`isPrimary`/`isMain` flag; reordering is implicit in `sortOrder`, and the multi-image uploader
(`image-uploader.tsx`) appends new uploads at the end (upload order = display order by default).

### DeckEdition
`{ deckId, deckNumber }`, cascade-deletes with its Deck. Exists as its own table (not a scalar
array on Deck) specifically because a deck's `qty` copies can each carry a *different* number
from the same production run — this is real, observed data (see the comment in
`scripts/migrate-edition-notes.ts` about two differently-named catalog entries both claiming
"1299/2500" — the script treats duplicate-number claims across decks as an error to flag, not
silently allow).

### Coin
Structurally parallel to Deck (`name`, `series`, `designer`, `producer`, `tags`,
`ownershipStatus`, `qty`, `releaseYear`, `notes`, `catalogNumber`) but deliberately simpler:
- **No image relation table.** `obverseImageUrl` / `reverseImageUrl` are plain nullable string
  columns directly on `Coin`. This was a deliberate schema change (see the now-dropped
  `CoinImage` model referenced in old migrations) made specifically because a coin always has
  exactly two well-defined photo roles — unlike a deck's open-ended photo count, a relation table
  was overkill. **Do not reintroduce a `CoinImage`-style relation** without a real product reason.
- `material` and `diameter` are coin-only free-text fields (no unit enforced, e.g. `"38mm"`).
- No `favorite` field, no `DeckEdition`-equivalent (coins are never "numbered editions" in this
  data model).
- Coin tag allowlist (`COIN_TAGS` in `src/lib/coin-schemas.ts`) is a **different, smaller list**
  than deck tags (`ALL_TAGS`) — Modern/Vintage/Antique/Gilded/Signed/Prototype only, no
  Mini/Tarot/Edge Painted. Don't assume the two are interchangeable.

### Creators (not a table)
`src/lib/featured-creators.ts` exports a hand-curated `FEATURED_CREATORS: FeaturedCreator[]`
array — bios, taglines, Blob-hosted photo URLs, an accent color, and an optional
`landingPageHref`. **A "creator" has no database row and no foreign key to any deck.** Matching
is done at query time by exact string equality: `where: { designer: creator.designer }`, or
`OR: [{ designer }, { producer }]` when `matchProducerToo: true` (for creators sometimes credited
only as producer). **This is fragile** — a typo or a rename of a deck's `designer` string will
silently stop that deck from appearing on the creator's page, with no error or warning anywhere.

### Deletion rules
Hard deletes only, no soft-delete/undo anywhere in the schema or actions
(`prisma.deck.delete()` / `prisma.coin.delete()` in `decks/actions.ts` / `coins/actions.ts`).
`DeckImage` and `DeckEdition` cascade automatically via `onDelete: Cascade`. The only safety net
is a client-side `confirm()` dialog (`src/components/confirm-submit-button.tsx`) before the
delete form submits — purely a UI courtesy, not enforced server-side.

## 7. Images and media

- **Storage**: Vercel Blob, `public` access. All URLs match
  `https://*.public.blob.vercel-storage.com/...` (allowlisted in `next.config.ts`'s
  `images.remotePatterns` for `next/image`).
- **Upload flow**: client-side direct upload via `@vercel/blob/client`'s `upload()`, which first
  requests a token from `POST /api/upload` (`src/app/api/upload/route.ts`), which itself checks
  `getSession().authenticated` before issuing one. Images are **compressed client-side first**
  (`compressImage()` in `src/components/image-uploader.tsx`) — read the comment block above that
  function before touching it: it exists to work around a proven Vercel Blob upload-stall issue
  on large phone-camera photos, decodes via `<img>` rather than `createImageBitmap` specifically
  for HEIC/Safari compatibility, and every step is wrapped in an explicit timeout because some
  failure modes hang indefinitely rather than erroring. Don't "simplify" this without
  understanding why each piece exists.
- **Deck photos**: unbounded ordered list (`DeckImage`), managed by `image-uploader.tsx`
  (`pathPrefix="decks"`). First by `sortOrder` = main/cover image everywhere.
- **Coin photos**: exactly two fixed named slots (Obverse / Reverse), managed by
  `src/components/coin-photo-slots.tsx` (`pathPrefix="coins"`), stored as the two scalar URL
  columns on `Coin` — not a list, and not reorderable (each slot replaces in place).
- **Display patterns**:
  - Listing thumbnails (`DeckCard`, `CoinCard`): single static image, `object-cover`, no cycling.
  - Detail-page gallery (`DeckGallery`, `CoinGallery`): client-side carousel with prev/next,
    thumbnail strip, and an "N / total" counter — nearly identical components, not shared (a
    known duplication; see [§16](#16-known-risks-and-sharp-edges)).
  - Landing-page "Featured Decks" spotlight (`DeckSpotlightCard`): a deliberately different,
    more dramatic full-bleed poster treatment reserved for favorited decks — main photo + up to
    4 additional photos tiled in a **fixed 2×2 grid** (empty cells stay empty rather than
    stretching to fill), title and a "View deck →" link overlaid on a bottom gradient scrim, all
    `object-cover` (crops to fill, never letterboxes/distorts). Capped at 3 spotlighted decks per
    landing page; any additional favorites beyond 3 fall through into the regular grid instead of
    disappearing.
  - Placeholder art (`DeckPlaceholder`/`CoinPlaceholder`, driven by `src/lib/placeholders.ts`)
    renders when an item has zero photos — a tag-precedence system picks one emoji/suit-glyph +
    accent color per item, so browsing never shows a broken-image icon.
- **Known cache/perf risk**: overwriting an existing Blob object's URL (rather than uploading to
  a new path) leaves both the Blob CDN and Next's image optimizer serving the old file
  indefinitely in practice — always upload replacements to a new filename/path.

## 8. Admin workflows

"Admin" here just means the same pages, authenticated:

- **Create/edit a deck** (`/decks/new`, `/decks/[id]/edit`) → `DeckForm`
  (`src/components/deck-form.tsx`), a client component using `useActionState` against
  `createDeck`/`updateDeck` in `decks/actions.ts`. Includes the AI-identify button
  (`enableAiIdentify` prop, new-deck form only) which POSTs uploaded photo URLs to
  `/api/ai/identify` and pre-fills form fields from the response — the user still reviews/edits
  before saving, nothing auto-submits. The Series field is a searchable selector that can create
  and immediately assign an exact new Series; the preserved legacy value is reference-only. The
  edit form alone exposes Collection Reasons, hook, note guidance, Markdown essay, and the explicit
  editorial-review control; the Add Deck form retains its existing concise fields.
- **Create/edit a coin** (`/coins/new`, `/coins/[id]/edit`) → `CoinForm`
  (`src/components/coin-form.tsx`), same pattern, no AI-identify.
- **Validation**: both forms parse `FormData` through a zod schema
  (`parseDeckFormData`/`parseCoinFormData`) server-side inside the action; field-level errors
  come back as `fieldErrors: Record<string, string>` and render inline per field. There is no
  separate client-side validation layer — the server action is the single source of truth for
  validity.
- **Favorite toggle**: a heart button on the deck detail page only (not on edit/new forms, not on
  coins) — `FavoriteButton` (client) + `toggleFavorite` (server action), optimistic UI update,
  broad `revalidatePath("/", "layout")` afterward since a favorite change can affect many pages
  at once (collection sort order + up to 9 landing pages' featured sections).
- **Delete**: a trash-icon button wrapped in `ConfirmSubmitButton`
  (`src/components/confirm-submit-button.tsx`) on both deck and coin detail pages — confirms via
  `window.confirm()` before the delete form submits.
- **Propagation to the public site**: purely via Next's cache revalidation
  (`revalidatePath(...)` calls at the end of each action) — there is no separate publish step,
  draft state, or review queue. A save is live immediately.
- **Cross-screen consistency to watch**: `ALL_TAGS` (deck tags, `lib/schemas.ts`) is
  hand-duplicated in `src/components/collection-filters.tsx` for the filter checkboxes — if you
  add/remove a deck tag, update both places. Coin tags (`COIN_TAGS`) do not have this duplication
  problem (only used in `coin-form.tsx`).

## 9. Public browsing flows

- **`/collection`**: the single unified search/browse page for **both** decks and coins. It reads
  the shared, write-invalidated browse snapshots in `src/lib/catalog-browse.ts`, applies filters
  server-side, then merges and sorts decks and coins in application code. Deck snapshots are
  cached in 400-row pages to stay below Vercel's per-entry cache limit and include only the first
  image; Collection Reasons add only two small enum values to these snapshots, while hook and essay
  remain out of them and out of search. A separate favorite-image snapshot preserves the
  landing-page mosaics. Do not replace
  this with per-request full-table Prisma queries or a raw SQL UNION without a measured reason.
- **`/stats`**: aggregate dashboard — totals, top designers, Modern/Vintage/Antique era
  breakdown (era = tag membership, not a separate column), release-year histogram, "Biggest
  series" (top 5 by Deck count, each linking to its first-class Series page and showing one
  random member photo), a
  photo-coverage stat (`% of decks with ≥1 photo`), and a recently-added strip. All numbers come
  from server-side Prisma `count`/`groupBy`/`aggregate` calls — no client-side computation.
- **Landing pages** (`/souvenir`, `/mini`, `/tarot`, `/creators/*`) — see [§4](#4-architecture)
  and [§11](#11-coding-conventions) for the shared-component pattern; each page file is only its
  title/tagline/blurb/hero-image/deck-query, everything else lives in
  `src/components/decks-landing-page.tsx`.
- **`/coins`** does not have its own listing UI — it's a redirect to `/collection?type=coin`
  (see `src/app/(app)/coins/page.tsx`), preserving other query params.

## 10. UI and design conventions

**Design tokens** live entirely in `src/app/globals.css` as CSS custom properties, exposed to
Tailwind v4 via an `@theme inline` block — there is **no `tailwind.config.js`**; new theme colors
must be added in `globals.css`, not a JS config file. Palette: `--felt-bg` (dark green
background), `--felt-surface`/`--felt-surface-2` (card backgrounds), `--felt-ink` (primary text,
warm cream), `--felt-sub` (secondary text), `--brass`/`--brass-deep` (primary accent/CTA gold),
`--brick`, `--plum`, `--sage` (secondary tag-driven accent colors), plus `--felt-line` (borders)
and `--felt-header`. Fonts: `font-display` = Spectral (serif, for names/titles/headings),
default sans = Geist (body text).

**Visual character to preserve**: an antique curated-archive/museum-poster feel — dark felt
background, brass borders and gold CTAs, serif display type, generous whitespace, subtle
gradients for text-over-image legibility. **Avoid** anything that reads as generic e-commerce:
no star-rating widgets, no "Add to cart," no bright multi-color badges, no card-shadow-heavy
"product tile" styling beyond what's already established.

**Components to reuse rather than recreate**:
- `StatTile` — the one component for all "icon + big number + label" stat displays, used on the
  homepage, stats page, and deck detail (edition tiles). Supports an optional `href` (wraps in
  `Link`) and optional `icon` (switches to a centered card layout).
- `DeckCard` / `CoinCard` — listing-grid thumbnails; both expect the full Prisma row shape
  (`DeckCardData`/`CoinCardData` interfaces exported alongside them) including `favorite`,
  `images`, `tags`.
- `DeckPlaceholder` / `CoinPlaceholder` + `AccentBar` / `CoinAccentBar` — no-photo fallback art,
  driven by `src/lib/placeholders.ts`'s tag-precedence system (`getDeckPlaceholder`/`getTagStyle`).
- `TagChip` / `CoinTagChip` — tag pill rendering, same placeholder-style system for icon/color.
- `DecksLandingPage` — the shared layout for all 9 specialty/creator pages (see §4). **Any new
  specialty or creator page should be a thin wrapper around this component**, not a new
  hand-built page — this exact mistake (9x copy-pasted pages) was made and then refactored away
  in this project's history; don't repeat it.
- `DeckSpotlightCard` — the "Featured Decks" poster-style card, only used inside
  `DecksLandingPage`.
- `ConfirmSubmitButton` — wrap any destructive form-submit button in this rather than a bare
  `<button type="submit">`.

**Responsive**: Tailwind's default breakpoints (`sm`/`md`/`lg`/`xl`), mobile-first. Grids
typically step `grid-cols-2` (mobile) → `sm:grid-cols-3` → up to `xl:grid-cols-6` for card grids.
Verify any layout change at a narrow width (~375–430px) as well as desktop — this project's
history includes several rounds of "looked right at 1440px, was cropped/cramped on mobile."

**Loading/empty/error states**: forms show a disabled-button "Saving..." state while pending
(`useActionState`'s `pending`), inline red-text field errors, and a top-of-form banner for
whole-form errors. List/grid pages show a centered `felt-sub`-colored message (e.g. "No items
match these filters.") when empty — no skeleton loaders or spinners are used anywhere in this
codebase; keep new empty/loading states consistent with that plain-text convention unless you
have a specific reason to add something heavier.

**Accessibility**: icon-only buttons consistently use `aria-label` + `title` (see edit/delete/
favorite buttons); gallery carousels use `aria-label`/`aria-current` on thumbnail buttons. No
formal accessibility audit or testing tool is set up — treat this as a convention to continue,
not a guarantee already verified.

## 11. Coding conventions

- **Naming**: `kebab-case.tsx` for component files, one primary named export per file matching
  the component name (e.g. `deck-card.tsx` exports `DeckCard`). Route files follow Next's
  required names (`page.tsx`, `layout.tsx`, `actions.ts`, `route.ts`).
- **Imports**: `@/*` path alias maps to `src/*` (see `tsconfig.json`); prefer it over relative
  `../../` paths for anything outside the current directory.
- **TypeScript**: `strict: true`. Data-shape interfaces are typically defined right next to the
  component that needs them (e.g. `DeckCardData` in `deck-card.tsx`) and imported by callers,
  rather than centralized in one giant types file.
- **Validation**: all form input goes through a zod schema in `lib/schemas.ts` /
  `lib/coin-schemas.ts`, parsed from raw `FormData` inside the Server Action via a
  `parse*FormData()` helper — never trust client-supplied data past that boundary.
- **Error handling**: Server Actions return a typed state object (`{ error?, fieldErrors? }`)
  rather than throwing for expected validation failures; unexpected errors in API routes are
  caught and returned as JSON `{ error: string }` with an appropriate status code.
- **Comments**: sparse by convention, but where present they explain *why*, not *what* — several
  load-bearing comments exist explaining non-obvious workarounds (image compression, the
  double auth check, the merge-in-JS collection query, favorite-slice-then-filter logic). Read
  existing comments before changing the code they annotate; preserve or update them, don't
  delete them as "unnecessary."
- **Duplication over premature abstraction**: this codebase intentionally tolerates some small
  duplication (e.g. the two nearly-identical gallery components, the duplicated tag list in
  `collection-filters.tsx`) rather than introducing shared abstractions for two-off cases — but
  the 9 landing pages crossed the threshold where duplication became a real maintenance cost and
  were consolidated (§4, §10). Use judgment: two similar things can stay separate; nine copies of
  the same thing should not.
- **No logging framework** — no `console.log` debugging statements are left in shipped code
  except the one intentional (and documented) diagnostic in `api/upload/route.ts` (see §16).
  Don't add ad-hoc `console.log`s to committed code.
- **CSS**: Tailwind utility classes inline in JSX; no CSS modules, no styled-components, no
  separate `.css` files per component. Arbitrary values (`bg-[...]`, inline `style={{}}` for
  computed gradients) are used sparingly, e.g. for the `color-mix()`-based hero gradient overlays.

## 12. Database and migration safety

**Authoritative schema**: `prisma/schema.prisma`. **Migration history**: `prisma/migrations/`,
one directory per migration, each containing a `migration.sql`.

**The documented/expected procedure** (per README.md) is standard Prisma:
- Local: `npx prisma migrate dev` (generates + applies + regenerates the client).
- Production: `npx prisma migrate deploy` run once against the prod `DATABASE_URL`.

**Do not run the manual production-migration procedure below on your own initiative.** It
describes what has worked in this project's history, not standing authorization to touch
production. Default to preparing the schema change and migration SQL locally, applying and
verifying it against the local database, then stopping to explain what still needs to be applied
to production and how — don't run step 4 (or anything else against the prod `DATABASE_URL`)
unless the user explicitly asks for that specific migration to be deployed.

**What has actually worked in this project's history**, because the local Prisma-Postgres dev
database has proven unreliable for `prisma migrate dev`:
1. Hand-write the migration SQL yourself under
   `prisma/migrations/<YYYYMMDDHHMMSS>_<name>/migration.sql` (look at any existing migration
   folder for the exact format/timestamp convention).
2. Apply it directly with a one-off Node/`tsx` script using `pg`'s `Client` against
   `DATABASE_URL`, then manually `INSERT` the matching row into the `_prisma_migrations` table
   (columns: `id` (`gen_random_uuid()`), `checksum` (sha256 of the SQL text), `migration_name`,
   `finished_at`/`started_at` (`now()`), `applied_steps_count: 1`) so `prisma migrate status`
   history stays consistent with what Prisma would have recorded itself.
3. Run `npx prisma generate` to regenerate `src/generated/prisma`.
4. Repeat the same script (pointed at the production `DATABASE_URL` instead) once the local
   change is verified, to apply it to production. There has been no separate staging environment
   observed in this project's history — verify locally, then apply directly to prod.
5. Delete the one-off script when done; it's scaffolding, not part of the app.

**Rules regardless of which procedure you use**:
- Never edit an already-applied migration file after the fact — write a new migration.
- Every schema change needs a migration; don't hand-edit the production database out-of-band
  without also committing the matching `migration.sql`, or `prisma/schema.prisma` and reality
  will drift.
- Additive/backfill changes (new nullable column, new table) are low-risk. Anything that drops a
  column or table (e.g. the historical `Deck.deckNumber` → `DeckEdition` migration, or
  `CoinImage` → scalar URL columns) needs a real backfill step first if there's existing data to
  preserve — check the corresponding migration files under `prisma/migrations/` for the pattern
  used last time (both of those were done as multi-step: add new shape → backfill → drop old
  shape, across separate migrations).
- After any schema change, re-run `npx tsc --noEmit` — Prisma's generated types will surface any
  now-incompatible query/select code immediately.

## 13. Testing and verification

**There is no automated test suite in this repository** — no unit tests, no integration tests,
no end-to-end tests, no test runner configured. This is a known, real gap, not an oversight to
work around silently.

**What to actually run before considering work done**:
- `npx tsc --noEmit` — the primary automated safety net. Must be clean.
- `npm run lint` (ESLint, `eslint-config-next`) — should be clean; this project has not been
  observed running lint in CI (no CI config exists in the repo), so treat it as a manual check.
- For anything UI-observable: **run the dev server and verify in an actual browser.** This
  project's history strongly favors real verification (screenshots, live interaction, temp test
  data created and then cleaned up via one-off scripts) over claiming a change works from reading
  the code. If you changed a page's rendered output, load it.
- For anything touching the schema: verify the migration applied (`\d "TableName"` or equivalent)
  and that a representative query round-trips correctly before calling it done.

**No CI pipeline exists in this repo** (no `.github/workflows`, no `vercel.json` build hooks
beyond Vercel's own auto-detection) — verification is entirely manual/local right now.

## 14. Deployment

- **Host**: Vercel (inferred: `@vercel/blob` usage, `.vercel/` project-link directory, and
  README's explicit Vercel-based deploy instructions). No `vercel.json` is present, so build/
  routing config is Vercel's Next.js auto-detection defaults.
- **Deploy trigger**: pushing to the connected Git branch (observed behavior this session: a
  push to `main` triggers a production deploy automatically). No separate deploy command is
  defined in this repo.
- **Environment variables** must be set in the Vercel project settings, matching `.env.local`'s
  keys: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `ANTHROPIC_API_KEY`, `SESSION_SECRET`,
  `APP_PASSWORD` (`SHADOW_DATABASE_URL` is a local-migration-only concern, likely not needed in
  prod). Prisma client generation runs automatically via the `postinstall` script during
  Vercel's build.
- **Database migrations do not run automatically on deploy** — there is no deploy-time migration
  step wired up (no `vercel.json` build command override, no CI). Migrations must be applied to
  production manually/out-of-band before or after a deploy that depends on them — see §12.
  **Watch deployment ordering**: if a deploy's code depends on a new column, apply that migration
  to prod *before* the deploy reaches traffic, or the running code will error against the old
  schema.
- **Cache risk on deploy**: see the Blob/image-optimizer caching note in §7 — replacing an image
  by overwriting the same Blob URL will not update what production actually serves.
- **Verifying a successful deploy**: no automated smoke test exists. Manually load the production
  URL and check a page that exercises the changed code path (this project's convention observed
  throughout its history).

## 15. Agent operating rules

- Read the relevant existing code (and its comments) before editing it — several files here have
  non-obvious behavior for good, documented reasons (see §7, §9, §16).
- Prefer the smallest coherent change that accomplishes the task. Don't bundle unrelated cleanup
  into a feature change.
- Preserve the existing architecture (Server Components + Server Actions, no client state
  library, shared `DecksLandingPage` for landing pages) and the established visual system (§10)
  — don't introduce a new pattern for something this codebase already has a working pattern for.
- Don't add a new dependency when something already in `package.json` solves the problem.
- Don't change `prisma/schema.prisma` without also writing the matching migration (§12) — never
  rely on `db push` or manual out-of-band DDL for anything meant to persist.
- Don't edit or delete existing migration files — add a new one.
- Never print, log, or commit real secret values (`.env.local`'s contents, API keys, tokens,
  passwords). If you need to reference an env var in code or docs, name it, don't paste its value.
- Don't claim `tsc`/lint/tests passed, or that a UI change was verified, unless you actually ran
  it in this session. State plainly which commands you ran and what they showed.
- Ask before making a consequential product, data-model, security, destructive, or irreversible
  decision (new data model shape, new auth model, removing an existing feature, a production
  migration). For minor implementation details, follow the established repository patterns
  (§10, §11) and state the assumption afterward instead of stopping to ask — don't turn small
  choices into an interview.
- Avoid broad, unrelated refactors while doing feature work — if you spot something worth fixing
  that's out of scope, mention it rather than fixing it inline.
- Preserve backward compatibility (existing URLs, existing data shapes) unless the task
  explicitly calls for breaking it.

## 16. Known risks and sharp edges

- **`scripts/seed.ts` intentionally seeds legacy Series text, not Series rows.** It maps each
  imported value into both `seriesLegacy` and `seriesRaw`; run the idempotent Series backfill after
  seeding a fresh database. The current mapping was verified against an empty local database
  during the first-class Series implementation.
- **`src/app/api/upload/route.ts` has a leftover diagnostic** in its error path that echoes a
  partial `BLOB_READ_WRITE_TOKEN` (length + first/last few characters) into the JSON response.
  It was added intentionally to debug a real production token-detection issue and does not leak
  the full secret, but don't extend this pattern elsewhere, and consider removing it once Blob
  upload reliability is confirmed stable long-term.
- **Local dev database reliability**: see §12 — `prisma migrate dev` against the local Prisma
  Postgres emulator has a history of hanging/failing in this project. Don't burn time assuming
  your migration SQL is wrong before trying the manual-apply fallback.
- **Blob/image cache**: overwriting an image at an existing Blob URL leaves stale content served
  indefinitely by both the Blob CDN and Next's image optimizer — always use a new path for a
  replacement image (§7).
- **Creator↔deck matching has no referential integrity** (§6) — a `designer` string typo or
  rename silently breaks a creator's landing page with no error surfaced anywhere.
  `collection-filters.tsx`'s duplicated tag list is a smaller version of the same risk class:
  two places that must be kept in sync by hand.
- **`DeckGallery` and `CoinGallery` are near-duplicate components** (§7) — a bug fix or feature
  added to one's carousel behavior needs to be manually ported to the other; they are not shared.
- **No automated tests anywhere** (§13) — any change to shared components
  (`DecksLandingPage`, `DeckCard`/`CoinCard`, `image-uploader.tsx`) has a blast radius across
  many pages with nothing but manual verification to catch a regression.
- **No CI** — lint/typecheck/build failures are only caught locally or at Vercel build time, not
  before a PR/push.
- **`revalidatePath("/", "layout")`** in `toggleFavorite` (decks/actions.ts) is intentionally
  broad (invalidates the entire app layout) because favorites affect many pages at once — this
  is correct as-is, but if you add a new action with cross-cutting effects, follow this same
  broad-invalidation pattern rather than trying to enumerate every affected path.

## 17. Current feature inventory

Confirmed present in the codebase as of this writing:

- Public read-only browsing of the entire deck + coin collection, no login required.
- Unified search/filter/paginate across decks and coins (`/collection`) — text search (name,
  series, designer, producer, notes), designer/producer/series dropdowns, multi-select tag
  filter (AND semantics), deck/coin/all type toggle.
- Deck detail pages with photo gallery, credits, tags, edition-number stat tiles, notes.
- Coin detail pages with obverse/reverse gallery, credits, tags, material/diameter.
- Add/edit/delete for both decks and coins (session-gated), with client-side delete
  confirmation.
- AI-assisted deck identification from photo(s) via Claude Sonnet 5 (deck-add flow only).
- Deck favoriting (heart toggle on detail page) that reorders `/collection` and populates a
  dramatic "Featured Decks" spotlight section (max 3) on every landing page.
- Homepage: hero with live stat tiles (linking to filtered collection views), a "Featured
  creators" poster-card row, a "Specialty collections" tile row (Mini, Tarot, Coins, Souvenir),
  and a "Recently added" strip.
- Stats dashboard: totals, top designers, era pie chart, release-year histogram, biggest-series
  showcase, photo-coverage percentage, recently added.
- 9 dedicated landing pages (Souvenir Decks, Mini Decks, Tarot Decks, and 6 individual featured
  creators), all built from one shared layout component with photo or inline-SVG hero art,
  gradient text-legibility overlay, and a Featured/Collection two-tier deck grid.
- Release-year tracking and display, edition/limited-run number tracking.
- Tag-driven placeholder art for any deck/coin with no photos yet.

## 18. Task-completion checklist

Before declaring a task complete:

- [ ] Read the actual current code of every file you're about to touch (don't rely on memory of
      an earlier version).
- [ ] `npx tsc --noEmit` run and clean.
- [ ] `npm run lint` run and clean (or any new warnings explained).
- [ ] If the change is schema-related: migration file written, applied to local DB, verified,
      and (if the task calls for it) applied to production too — state clearly which of these you
      actually did.
- [ ] If the change is UI-observable: dev server run and the change actually viewed in a browser
      (not just assumed from the diff); mobile-width behavior checked if layout was touched.
- [ ] Any temporary test data created for verification has been cleaned up.
- [ ] No secrets printed, logged, or committed.
- [ ] Existing comments explaining non-obvious behavior were preserved or updated, not deleted.
- [ ] Report exactly which validation commands were run and what they showed — don't claim
      verification that didn't happen.
