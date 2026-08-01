import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

config({ path: ".env.local" });

interface SeedDeck {
  name: string;
  series: string | null;
  designer: string | null;
  producer: string | null;
  tags: string[];
  ownershipStatus: string;
  qty: number;
  deckNumber: number | null;
  productionRun: number | null;
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

  const batchSize = 200;
  for (let i = 0; i < decks.length; i += batchSize) {
    const batch = decks.slice(i, i + batchSize);
    await prisma.deck.createMany({ data: batch });
    console.log(`  inserted ${Math.min(i + batchSize, decks.length)}/${decks.length}`);
  }

  const total = await prisma.deck.count();
  console.log(`Done. Deck table now has ${total} rows.`);

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
