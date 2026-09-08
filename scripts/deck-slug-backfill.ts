import { writeFileSync } from "node:fs";
import { Client } from "pg";
import { deckSlugCandidates, type SlugDeck } from "../src/lib/deck-slug";

// Supply DATABASE_URL explicitly (or use node --env-file). This script never chooses production.
async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  if (apply && !args.includes("--confirm")) throw new Error("Applying requires --apply --confirm.");
  if (!process.env.DATABASE_URL) throw new Error("DATABASE_URL is required.");
  const output = args.find((arg) => arg.startsWith("--output="))?.slice(9) ?? "/tmp/card-guy-deck-slugs.json";
  const client = new Client({ connectionString: process.env.DATABASE_URL });
  await client.connect();
  try {
    await client.query(apply ? "BEGIN" : "BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY");
    if (apply) {
      await client.query("SET LOCAL lock_timeout = '15s'");
      await client.query('LOCK TABLE "Deck" IN SHARE ROW EXCLUSIVE MODE');
      await client.query("SELECT pg_advisory_xact_lock(73529, 1)");
    }
    const { rows: columns } = await client.query("SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Deck' AND column_name = 'slug'");
    const migrated = columns.length > 0;
    if (apply && !migrated) throw new Error("Apply the additive deck_slugs migration first.");
    const { rows: decks } = await client.query<SlugDeck & { slug: string | null }>(
      `SELECT "id", "name", "releaseYear", "producer", ${migrated ? '"slug"' : 'NULL::text AS "slug"'} FROM "Deck" ORDER BY "id" COLLATE "C"`
    );
    const occupied = new Map<string, string>(decks.map((deck) => [deck.id, deck.id]));
    if (migrated) {
      const { rows } = await client.query<{ slug: string; deckId: string }>('SELECT "slug", "deckId" FROM "DeckSlugHistory"');
      for (const row of rows) occupied.set(row.slug, row.deckId);
    }
    for (const deck of decks) if (deck.slug) occupied.set(deck.slug, deck.id);
    const plan = decks.filter((deck) => !deck.slug).map((deck) => {
      const slug = deckSlugCandidates(deck).find((candidate) => !occupied.has(candidate) || occupied.get(candidate) === deck.id);
      if (!slug) throw new Error(`No available slug for deck ${deck.id}`);
      occupied.set(slug, deck.id);
      return { id: deck.id, name: deck.name, slug };
    });
    writeFileSync(output, JSON.stringify(plan, null, 2) + "\n");
    if (apply) {
      for (const row of plan) {
        // URL maintenance is not an editorial edit: retain the real existing updatedAt.
        await client.query('UPDATE "Deck" SET "slug" = $1 WHERE "id" = $2 AND "slug" IS NULL', [row.slug, row.id]);
      }
      const { rows } = await client.query(`SELECT count(*)::int AS missing FROM "Deck" d
        LEFT JOIN "DeckSlugHistory" h ON h."slug" = d."slug" AND h."deckId" = d."id"
        WHERE d."slug" IS NULL OR h."slug" IS NULL`);
      if (rows[0].missing !== 0) throw new Error("Backfill verification failed; rolling back.");
    }
    await client.query("COMMIT");
    console.log(`${apply ? "Applied" : "Planned"} ${plan.length} slugs. Review: ${output}`);
    if (apply) console.log("Refresh catalog caches via /api/admin/revalidate-catalog before serving the new URLs.");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    await client.end();
  }
}

main().catch(() => {
  // Driver messages can contain connection details. Do not print secrets on failure.
  console.error("Deck slug backfill failed. No transaction was committed; check the target database, migration state, and flags.");
  process.exitCode = 1;
});
