import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { splitLegacyDesignerCredit } from "../src/lib/designers";
import { creatorCollisionSlug, creatorSlugBase } from "../src/lib/creator-slug";

config({ path: ".env.local" });

interface SeedDeck {
  name: string;
  series: string | null;
  designer: string | null;
  producer: string | null;
  tags: string[];
  ownershipStatus: string;
  qty: number;
  productionRun: number | null;
  releaseYear?: number | null;
  notes: string | null;
  catalogNumber: string | null;
}

async function main() {
  const dataPath = join(__dirname, "seed-data.json");
  const decks: SeedDeck[] = JSON.parse(readFileSync(dataPath, "utf-8"));

  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const prisma = new PrismaClient({ adapter });

  const existing = await prisma.deck.count();
  if (existing > 0) {
    console.log(`Deck table already has ${existing} rows — skipping seed to avoid duplicates.`);
    console.log("Delete existing rows first if you want to re-seed.");
    await prisma.$disconnect();
    return;
  }

  console.log(`Seeding ${decks.length} decks...`);

  const creatorNames = Array.from(
    new Set(
      decks.flatMap((deck) => [
        ...splitLegacyDesignerCredit(deck.designer),
        ...(deck.producer?.trim() ? [deck.producer.trim()] : []),
      ])
    )
  );
  for (const name of creatorNames) {
    const existingCreator = await prisma.creator.findUnique({ where: { name } });
    if (existingCreator) continue;
    const base = creatorSlugBase(name);
    const candidates = base
      ? [base, ...[8, 12, 16, 32, 64].map((length) => creatorCollisionSlug(name, length))]
      : [8, 12, 16, 32, 64].map((length) => creatorCollisionSlug(name, length));
    for (const slug of candidates) {
      if (await prisma.creator.findUnique({ where: { slug } })) continue;
      await prisma.creator.create({ data: { name, slug } });
      break;
    }
  }
  const creators = await prisma.creator.findMany({
    where: { name: { in: creatorNames } },
    select: { id: true, name: true },
  });
  const creatorIdByName = new Map(creators.map((creator) => [creator.name, creator.id]));

  const batchSize = 200;
  for (let i = 0; i < decks.length; i += batchSize) {
    const batch = decks.slice(i, i + batchSize);
    await prisma.deck.createMany({
      data: batch.map((deck) => ({
        name: deck.name,
        seriesLegacy: deck.series,
        seriesRaw: deck.series,
        designerLegacy: deck.designer,
        producer: deck.producer,
        producerCreatorId: deck.producer?.trim()
          ? creatorIdByName.get(deck.producer.trim())
          : undefined,
        tags: deck.tags,
        ownershipStatus: deck.ownershipStatus,
        qty: deck.qty,
        productionRun: deck.productionRun,
        releaseYear: deck.releaseYear,
        notes: deck.notes,
        catalogNumber: deck.catalogNumber,
      })),
    });
    console.log(`  inserted ${Math.min(i + batchSize, decks.length)}/${decks.length}`);
  }

  const insertedDecks = await prisma.deck.findMany({
    where: { designerLegacy: { not: null } },
    select: { id: true, designerLegacy: true },
  });
  await prisma.deckDesigner.createMany({
    data: insertedDecks.flatMap((deck) =>
      splitLegacyDesignerCredit(deck.designerLegacy).map((name, sortOrder) => ({
        deckId: deck.id,
        designerId: creatorIdByName.get(name)!,
        sortOrder,
      }))
    ),
  });

  const total = await prisma.deck.count();
  console.log(`Done. Deck table now has ${total} rows.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
