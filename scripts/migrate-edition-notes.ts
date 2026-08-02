import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

// One-off, second-phase migration: parses "also 391/700"-style text still sitting in some
// decks' notes (left over from before edition numbers were structured data) into additional
// DeckEdition rows, and strips the parsed text back out of notes.
//
// Deliberately conservative: only auto-applies clean, unambiguous cases. Anything else is
// left completely untouched and printed in the report for manual follow-up via the edit page.
//
// Run with no args for a dry run (prints what it *would* do, touches nothing).
// Run with --apply to actually write changes.

const APPLY = process.argv.includes("--apply");

interface Segment {
  raw: string;
  deckNumber: number | null;
  run: number | null;
}

function parseSegment(raw: string): Segment {
  const trimmed = raw.trim();
  const match = trimmed.match(/^(\d+)(?:\s*\/\s*(\d+))?/);
  if (!match) return { raw: trimmed, deckNumber: null, run: null };
  return {
    raw: trimmed,
    deckNumber: Number(match[1]),
    run: match[2] ? Number(match[2]) : null,
  };
}

async function main() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const decks = await prisma.deck.findMany({
    where: { notes: { contains: "also", mode: "insensitive" } },
    include: { editions: true },
  });

  console.log(`Found ${decks.length} decks with "also" text in notes.\n`);

  // Global registry of (deckNumber, productionRun) pairs already claimed by some deck, so we
  // never assign the same numbered copy to two different catalog entries (this happens for
  // real in the source data — see "Black Monolith" / "Black Monolith (signed)" both listing
  // "also 1299/2500").
  const allEditions = await prisma.deckEdition.findMany({ include: { deck: true } });
  const claimed = new Map<string, { deckId: string; deckName: string }>();
  for (const e of allEditions) {
    const key = `${e.deckNumber}/${e.deck.productionRun ?? "?"}`;
    claimed.set(key, { deckId: e.deckId, deckName: e.deck.name });
  }

  let applied = 0;
  const flagged: { deck: (typeof decks)[number]; reason: string }[] = [];

  for (const deck of decks) {
    // Already has more editions than a plain phase-1 backfill would ever have produced (0 or
    // 1) — someone has already manually resolved this deck. Leave it alone.
    if (deck.editions.length > 1) {
      flagged.push({ deck, reason: "already has multiple editions (manually resolved?) — skipped" });
      continue;
    }

    const match = deck.notes!.match(/also\s+(.+)/i);
    if (!match) {
      flagged.push({ deck, reason: "contains \"also\" but not in a recognized pattern" });
      continue;
    }

    const tail = match[1];
    const before = deck.notes!.slice(0, match.index).trim().replace(/[,.\s]+$/, "");

    const rawSegments = tail.split(/,|\band\b/i).map((s) => s.trim()).filter(Boolean);
    const segments = rawSegments.map(parseSegment);

    const firstBad = segments.find((s) => s.deckNumber === null);
    if (firstBad) {
      flagged.push({ deck, reason: `segment "${firstBad.raw}" doesn't start with a number` });
      continue;
    }

    const runMismatch = segments.find(
      (s) => s.run !== null && deck.productionRun !== null && s.run !== deck.productionRun
    );
    if (runMismatch) {
      flagged.push({
        deck,
        reason: `segment "${runMismatch.raw}" run (${runMismatch.run}) doesn't match deck's productionRun (${deck.productionRun})`,
      });
      continue;
    }

    const totalCount = deck.editions.length + segments.length;
    if (totalCount !== deck.qty) {
      flagged.push({
        deck,
        reason: `parsed ${segments.length} new + ${deck.editions.length} existing = ${totalCount} editions, but qty is ${deck.qty}`,
      });
      continue;
    }

    // Prefer the run parsed straight from the note text over the deck's own stored
    // productionRun — some decks (e.g. "Black Monolith (signed)") have no productionRun of
    // their own but the note itself still specifies one ("also 1299/2500").
    const collision = segments
      .map((s) => ({ s, key: `${s.deckNumber}/${s.run ?? deck.productionRun ?? "?"}` }))
      .find(({ key }) => claimed.has(key) && claimed.get(key)!.deckId !== deck.id);
    if (collision) {
      const owner = claimed.get(collision.key)!;
      flagged.push({
        deck,
        reason: `edition ${collision.key} is already claimed by "${owner.deckName}" (${owner.deckId})`,
      });
      continue;
    }

    // Clean — apply.
    const newNotes = before.length > 0 ? before : null;
    console.log(
      `${APPLY ? "Applying" : "[dry run] Would apply"}: "${deck.name}" (${deck.id}) — add edition(s) ${segments
        .map((s) => s.deckNumber)
        .join(", ")}; notes -> ${JSON.stringify(newNotes)}`
    );

    if (APPLY) {
      await prisma.$transaction([
        prisma.deckEdition.createMany({
          data: segments.map((s) => ({ deckId: deck.id, deckNumber: s.deckNumber! })),
        }),
        prisma.deck.update({ where: { id: deck.id }, data: { notes: newNotes } }),
      ]);
    }
    // Claim these numbers regardless of dry-run/apply, so later decks in this same pass are
    // correctly evaluated against them — otherwise a dry run can't accurately preview a
    // same-number collision between two decks processed in the same run (only across runs).
    for (const s of segments) {
      claimed.set(`${s.deckNumber}/${s.run ?? deck.productionRun ?? "?"}`, { deckId: deck.id, deckName: deck.name });
    }
    applied++;
  }

  console.log(`\n${applied} decks ${APPLY ? "updated" : "would be updated"} cleanly.`);
  console.log(`${flagged.length} decks flagged for manual review:\n`);
  for (const { deck, reason } of flagged) {
    console.log(`  - "${deck.name}" (${deck.id}): ${reason}`);
    console.log(`      qty=${deck.qty}, productionRun=${deck.productionRun}, notes=${JSON.stringify(deck.notes)}`);
  }

  if (!APPLY) {
    console.log("\nThis was a dry run — nothing was written. Re-run with --apply to write changes.");
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
