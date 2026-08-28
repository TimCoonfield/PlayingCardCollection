import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { prisma } from "../src/lib/prisma";
import {
  needsDesignerReview,
  splitLegacyDesignerCredit,
} from "../src/lib/designers";

type LegacyDeck = {
  id: string;
  name: string;
  designerLegacy: string | null;
};

const [, , command = "review", ...args] = process.argv;

async function main() {
  if (command === "review") await review();
  else if (command === "reconcile") await reconcile();
  else throw new Error(`Unknown command: ${command}`);
}

async function getLegacyDecks(): Promise<LegacyDeck[]> {
  if (args.includes("--seed-data")) {
    const rows = JSON.parse(
      await readFile(resolve("scripts/seed-data.json"), "utf8")
    ) as Array<{ name: string; designer: string | null }>;
    return rows.map((deck, index) => ({
      id: `seed-${index + 1}`,
      name: deck.name,
      designerLegacy: deck.designer,
    }));
  }
  return prisma.$queryRaw<LegacyDeck[]>`
    SELECT "id", "name", "designer" AS "designerLegacy"
    FROM "Deck"
    ORDER BY "id" ASC
  `;
}

async function review() {
  const decks = await getLegacyDecks();
  const groups = new Map<string, LegacyDeck[]>();
  for (const deck of decks) {
    const credit = deck.designerLegacy?.trim();
    if (!credit || !needsDesignerReview(credit)) continue;
    groups.set(credit, [...(groups.get(credit) ?? []), deck]);
  }

  const rows = Array.from(groups.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([legacyCredit, matches]) => ({
      reason: "ambiguous separator",
      legacyCredit,
      deckCount: matches.length,
      sampleDecks: matches.slice(0, 5).map((deck) => deck.name).join(" | "),
      reviewNote: "Kept as one Designer; split or rename manually if this represents multiple credits.",
    }));

  const outputPath = resolve(valueAfter("--out") ?? "reports/designer-credit-review.csv");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toCsv(rows), "utf8");
  console.log(`Decks: ${decks.length}`);
  console.log(`Ambiguous distinct legacy credits: ${rows.length}`);
  console.log(`Affected Decks: ${rows.reduce((sum, row) => sum + row.deckCount, 0)}`);
  console.log(`Review file: ${outputPath}`);
}

async function reconcile() {
  const decks = await prisma.deck.findMany({
    select: {
      id: true,
      name: true,
      designerLegacy: true,
      designers: {
        orderBy: { sortOrder: "asc" },
        select: { designer: { select: { name: true } } },
      },
    },
    orderBy: { id: "asc" },
  });
  const mismatches = decks.filter((deck) => {
    const expected = splitLegacyDesignerCredit(deck.designerLegacy);
    const actual = deck.designers.map(({ designer }) => designer.name);
    return expected.length !== actual.length || expected.some((name, index) => name !== actual[index]);
  });
  console.log(`Decks: ${decks.length}`);
  console.log(`Decks with normalized designer credits: ${decks.filter((deck) => deck.designers.length > 0).length}`);
  console.log(`Legacy/relation mismatches: ${mismatches.length}`);
  for (const deck of mismatches.slice(0, 20)) {
    console.log(
      `  ${deck.id} | ${deck.name} | legacy: ${deck.designerLegacy ?? "(none)"} | normalized: ${deck.designers.map(({ designer }) => designer.name).join(" / ") || "(none)"}`
    );
  }
  if (mismatches.length > 20) console.log(`  …and ${mismatches.length - 20} more`);
}

function valueAfter(flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function toCsv(rows: Array<Record<string, string | number>>) {
  const headers = ["reason", "legacyCredit", "deckCount", "sampleDecks", "reviewNote"];
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
