# Playing Card Collection

A visual tracker for a physical playing card collection: browse/search 2,528 imported
decks and related coins, explore dynamic Series and Creator pages, add records manually
or by AI photo identification, and see collection stats.

## Stack

Next.js (App Router) + Prisma/Postgres + Vercel Blob (images) + Claude vision (AI
identify) + a single shared-password gate (`iron-session`), meant to be deployed to
Vercel.

## Local development

A local Postgres is already running via `npx prisma dev` (no Docker needed) and
`DATABASE_URL` in `.env.local` points at it. The 2,528 decks from the original
spreadsheet are already seeded (`npm run seed`, re-run only deletes-and-reseeds
manually — it no-ops if the table isn't empty).

```bash
npm run dev
```

Open http://localhost:3000 and log in with the password in `.env.local`
(`APP_PASSWORD`, currently `changeme` — change this before sharing the app with
anyone or deploying).

## Required before deploying (or before testing photo upload / AI identify locally)

Fill these into `.env.local` (local) and as Vercel project env vars (prod):

1. **`BLOB_READ_WRITE_TOKEN`** — create a Vercel Blob store (Vercel dashboard →
   Storage → Blob) and copy its read-write token. Needed for any image upload.
2. **`ANTHROPIC_API_KEY`** — an API key from [console.anthropic.com](https://console.anthropic.com).
   Needed for the "Identify with AI" button on the Add Deck page.
3. **`DATABASE_URL`** (prod only) — a Postgres connection string. A free
   [Neon](https://neon.tech) project works well with Vercel. Run
   `npx prisma migrate deploy` against it once before first use.
4. **`SESSION_SECRET`** — already generated in `.env.local` for local dev; generate a
   separate one for prod with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.
5. **`APP_PASSWORD`** — the password used to log in to the app. Set this to something
   real before deploying.
6. **`CACHE_REVALIDATION_SECRET`** — a separate random secret used only by maintenance
   scripts to authenticate catalog-cache refresh requests. Generate it like the session
   secret and set the same value in Vercel and in the local environment used to run a
   production maintenance script.

## Deploying

1. Push this repo to GitHub (or run `vercel` from the CLI) and import it in Vercel.
2. Add the env vars above in the Vercel project settings.
3. Run `npx prisma migrate deploy` against the prod `DATABASE_URL` (locally, with
   `DATABASE_URL` temporarily pointed at prod) to create the schema, then
   `npm run seed` once against prod if it doesn't already have the decks.
4. Deploy.

## Notable structure

- `prisma/schema.prisma` — the Deck, Coin, Series, and Creator data model.
- `scripts/seed.ts` + `scripts/seed-data.json` — one-time import of the original
  spreadsheet's 2,528 rows.
- `scripts/creator-migration.ts` — review possible duplicate Creators, apply only approved
  merges, and audit normalized relations against legacy credit strings.
- `src/proxy.ts` — password-gate check (Next 16 renamed `middleware.ts` → `proxy.ts`).
- `src/app/(app)/` — the public archive shell plus authenticated editing routes.
- `src/app/api/upload` — Vercel Blob client-upload token route.
- `src/app/api/ai/identify` — Claude vision deck identification.
- `src/app/llms.txt` — AI-agent discovery map for the public catalog capabilities.
- `src/app/api/catalog/decks` — public, read-only deck search and detail JSON API.

## Creator duplicate review

Creator names are intentionally migrated exactly as recorded. Generate a reviewable CSV without
changing data, mark only confirmed rows with `MERGE`, then apply those approved decisions:

```bash
npm run creators:migrate -- review
npm run creators:migrate -- apply --confirm
npm run creators:migrate -- reconcile
```

The report is written to `reports/creator-merge-review.csv`. Regenerate it against the target
database before reviewing so Deck and Coin counts reflect that database. Before applying merges,
set `CATALOG_REVALIDATION_URL` to the deployed endpoint (for example,
`https://your-site.example/api/admin/revalidate-catalog`) and make sure the local
`CACHE_REVALIDATION_SECRET` matches the deployed value. The apply command verifies that endpoint
before making any database changes and refreshes all application caches afterward. Use
`--skip-cache-refresh` only when the target is a local or otherwise offline database.
