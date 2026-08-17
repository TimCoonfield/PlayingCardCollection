import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { prisma } from "../src/lib/prisma";
import { seriesCollisionSlug, seriesSlugBase } from "../src/lib/series-slug";

type LegacyDeck = {
  id: string;
  name: string;
  seriesLegacy: string | null;
};

type ReviewRow = {
  reason: string;
  valueA: string;
  valueB: string;
  normalizedA: string;
  normalizedB: string;
  proposedSlugA: string;
  proposedSlugB: string;
  levenshteinDistance: number | "";
  deckCountA: number;
  deckCountB: number;
  sampleDecksA: string;
  sampleDecksB: string;
};

type BackfillManifest = {
  createdAt: string;
  assignments: Array<{
    deckId: string;
    previousSeriesId: string | null;
    assignedSeriesId: string;
    previousSeriesLegacy: string | null;
  }>;
  createdSeries: Array<{ id: string; name: string; slug: string }>;
};

const [, , command = "review", ...args] = process.argv;
const applyRequested = args.includes("--apply");

async function main() {
  if (command === "review") await review();
  else if (command === "apply") await applyBackfill();
  else if (command === "reconcile") await reconcile();
  else if (command === "merge") await mergeSeries(args.filter((arg) => arg !== "--apply"));
  else if (command === "rollback") await rollback(args.filter((arg) => arg !== "--apply"));
  else throw new Error(`Unknown command: ${command}`);
}

async function getLegacyDecks(): Promise<LegacyDeck[]> {
  return prisma.$queryRaw<LegacyDeck[]>`
    SELECT "id", "name", "series" AS "seriesLegacy"
    FROM "Deck"
    ORDER BY "id" ASC
  `;
}

async function review() {
  const decks = await getLegacyDecks();
  const populated = decks.filter((deck) => deck.seriesLegacy?.trim());
  const rawValues = [...new Set(populated.map((deck) => deck.seriesLegacy!))];
  const names = [...new Set(rawValues.map((value) => value.trim()))].sort((a, b) => a.localeCompare(b));
  const byName = new Map<string, LegacyDeck[]>();
  for (const deck of populated) {
    const name = deck.seriesLegacy!.trim();
    byName.set(name, [...(byName.get(name) ?? []), deck]);
  }

  const rows: ReviewRow[] = [];
  addGroupedPairs(rows, "whitespace", rawValues, (value) => value.trim(), byName);
  addGroupedPairs(rows, "case", names, (value) => value.toLocaleLowerCase(), byName);
  addGroupedPairs(rows, "punctuation", names, punctuationKey, byName);
  addGroupedPairs(rows, "slug-collision", names, (value) => seriesSlugBase(value) || "series", byName);

  for (let i = 0; i < names.length; i += 1) {
    for (let j = i + 1; j < names.length; j += 1) {
      if (Math.abs(names[i].length - names[j].length) > 3) continue;
      const distance = levenshtein(names[i].toLocaleLowerCase(), names[j].toLocaleLowerCase());
      if (distance <= 3) rows.push(makeReviewRow("levenshtein", names[i], names[j], byName, distance));
    }
  }

  const outputPath = resolve(valueAfter("--out") ?? "reports/series-duplicate-review.csv");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toCsv(rows), "utf8");

  console.log(`Decks: ${decks.length}`);
  console.log(`Decks with non-empty legacy Series: ${populated.length}`);
  console.log(`Distinct exact trimmed Series names: ${names.length}`);
  console.log(`Review rows: ${rows.length}`);
  console.log(`Review file: ${outputPath}`);
}

function addGroupedPairs(
  rows: ReviewRow[],
  reason: string,
  values: string[],
  key: (value: string) => string,
  byName: Map<string, LegacyDeck[]>
) {
  const groups = new Map<string, string[]>();
  for (const value of values) {
    const normalized = key(value);
    const group = groups.get(normalized) ?? [];
    if (!group.includes(value)) group.push(value);
    groups.set(normalized, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (let i = 0; i < group.length; i += 1) {
      for (let j = i + 1; j < group.length; j += 1) {
        rows.push(makeReviewRow(reason, group[i], group[j], byName, ""));
      }
    }
  }
}

function makeReviewRow(
  reason: string,
  rawA: string,
  rawB: string,
  byName: Map<string, LegacyDeck[]>,
  distance: number | ""
): ReviewRow {
  const valueA = rawA.trim();
  const valueB = rawB.trim();
  const decksA = byName.get(valueA) ?? [];
  const decksB = byName.get(valueB) ?? [];
  return {
    reason,
    valueA: rawA,
    valueB: rawB,
    normalizedA: punctuationKey(valueA),
    normalizedB: punctuationKey(valueB),
    proposedSlugA:
      reason === "slug-collision"
        ? seriesCollisionSlug(valueA)
        : seriesSlugBase(valueA) || seriesCollisionSlug(valueA),
    proposedSlugB:
      reason === "slug-collision"
        ? seriesCollisionSlug(valueB)
        : seriesSlugBase(valueB) || seriesCollisionSlug(valueB),
    levenshteinDistance: distance,
    deckCountA: decksA.length,
    deckCountB: decksB.length,
    sampleDecksA: decksA.slice(0, 3).map((deck) => deck.name).join(" | "),
    sampleDecksB: decksB.slice(0, 3).map((deck) => deck.name).join(" | "),
  };
}

async function applyBackfill() {
  if (!applyRequested) throw new Error("Backfill is a write operation. Re-run with: apply --apply");

  const eligible = await prisma.deck.findMany({
    where: { seriesId: null, seriesLegacy: { not: null } },
    select: { id: true, seriesId: true, seriesLegacy: true, seriesRaw: true },
    orderBy: { id: "asc" },
  });
  const candidates = eligible.filter((deck) => deck.seriesLegacy?.trim());
  const names = [...new Set(candidates.map((deck) => (deck.seriesRaw ?? deck.seriesLegacy)!.trim()))];
  const existing = await prisma.series.findMany({ select: { id: true, name: true, slug: true } });
  const existingByName = new Map(existing.map((series) => [series.name, series]));
  const usedSlugs = new Set(existing.map((series) => series.slug));
  const baseCounts = new Map<string, number>();
  for (const name of names) {
    const base = seriesSlugBase(name) || "series";
    baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
  }

  const createdSeries: Array<{ id: string; name: string; slug: string }> = [];
  await prisma.$transaction(async (tx) => {
    for (const name of names.sort((a, b) => Buffer.from(a).compare(Buffer.from(b)))) {
      if (existingByName.has(name)) continue;
      const base = seriesSlugBase(name) || "series";
      let slug = baseCounts.get(base) === 1 && !usedSlugs.has(base) ? base : seriesCollisionSlug(name);
      for (const hashLength of [8, 12, 16, 32, 64]) {
        if (!usedSlugs.has(slug)) break;
        slug = seriesCollisionSlug(name, hashLength);
      }
      if (usedSlugs.has(slug)) throw new Error(`Could not generate a unique slug for ${name}`);
      const created = await tx.series.create({
        data: { name, slug },
        select: { id: true, name: true, slug: true },
      });
      createdSeries.push(created);
      existingByName.set(name, created);
      usedSlugs.add(slug);
    }

    await tx.$executeRaw`
      UPDATE "Deck" AS deck
      SET
        "seriesRaw" = COALESCE(deck."seriesRaw", deck."series"),
        "seriesId" = series."id"
      FROM "Series" AS series
      WHERE deck."seriesId" IS NULL
        AND deck."series" IS NOT NULL
        AND BTRIM(deck."series") <> ''
        AND series."name" = BTRIM(COALESCE(deck."seriesRaw", deck."series"))
    `;
  }, { maxWait: 10_000, timeout: 120_000 });

  const assigned = await prisma.deck.findMany({
    where: { id: { in: candidates.map((deck) => deck.id) }, seriesId: { not: null } },
    select: { id: true, seriesId: true },
  });
  const assignedById = new Map(assigned.map((deck) => [deck.id, deck.seriesId!]));
  const manifest: BackfillManifest = {
    createdAt: new Date().toISOString(),
    assignments: candidates.flatMap((deck) => {
      const assignedSeriesId = assignedById.get(deck.id);
      return assignedSeriesId
        ? [{
            deckId: deck.id,
            previousSeriesId: deck.seriesId,
            assignedSeriesId,
            previousSeriesLegacy: deck.seriesLegacy,
          }]
        : [];
    }),
    createdSeries,
  };
  console.log(`Created Series: ${createdSeries.length}`);
  console.log(`Assigned Decks: ${manifest.assignments.length}`);
  if (createdSeries.length > 0 || manifest.assignments.length > 0) {
    const manifestPath = resolve(valueAfter("--manifest") ?? "reports/series-backfill-manifest.json");
    await mkdir(dirname(manifestPath), { recursive: true });
    await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
    console.log(`Rollback manifest: ${manifestPath}`);
  } else {
    console.log("No changes; the existing rollback manifest was left untouched.");
  }
  await reconcile();
}

async function reconcile() {
  const [totalDecks, decksWithSeriesId, unresolved] = await Promise.all([
    prisma.deck.count(),
    prisma.deck.count({ where: { seriesId: { not: null } } }),
    prisma.deck.findMany({
      where: { seriesId: null, seriesRaw: { not: null } },
      select: { id: true, name: true, seriesRaw: true, seriesLegacy: true },
    }),
  ]);
  const nonEmptyUnresolved = unresolved.filter((deck) => deck.seriesRaw?.trim());
  console.log(`Total Deck count: ${totalDecks}`);
  console.log(`Decks with seriesId: ${decksWithSeriesId}`);
  console.log(`Decks with non-empty seriesRaw but null seriesId: ${nonEmptyUnresolved.length}`);
  for (const deck of nonEmptyUnresolved.slice(0, 20)) {
    console.log(`  ${deck.id} | ${deck.name} | ${deck.seriesRaw} | legacy mirror: ${deck.seriesLegacy ?? "(cleared)"}`);
  }
  if (nonEmptyUnresolved.length > 20) console.log(`  …and ${nonEmptyUnresolved.length - 20} more`);
}

async function mergeSeries(positional: string[]) {
  const [canonicalSlug, duplicateSlug] = positional.filter((arg) => !arg.startsWith("--"));
  if (!canonicalSlug || !duplicateSlug) {
    throw new Error("Usage: merge <canonical-slug> <duplicate-slug> [--apply]");
  }
  const [canonical, duplicate] = await Promise.all([
    prisma.series.findUnique({ where: { slug: canonicalSlug }, include: { _count: { select: { decks: true } } } }),
    prisma.series.findUnique({ where: { slug: duplicateSlug }, include: { _count: { select: { decks: true } } } }),
  ]);
  if (!canonical || !duplicate) throw new Error("Canonical or duplicate Series was not found.");
  if (canonical.id === duplicate.id) throw new Error("Choose two different Series.");
  console.log(`Canonical: ${canonical.name} (${canonical._count.decks} Decks)`);
  console.log(`Duplicate: ${duplicate.name} (${duplicate._count.decks} Decks)`);
  const editorialFields = ["subtitle", "description", "heroImageUrl", "attributionLabel", "attributionText"] as const;
  const duplicateEditorial = editorialFields.filter((field) => Boolean(duplicate[field]));
  if (duplicateEditorial.length > 0) {
    throw new Error(`Duplicate has editorial data in: ${duplicateEditorial.join(", ")}. Resolve it manually first.`);
  }
  if (!applyRequested) {
    console.log("Dry run only. Re-run with --apply to merge.");
    return;
  }
  await prisma.$transaction(async (tx) => {
    await tx.deck.updateMany({
      where: { seriesId: duplicate.id },
      data: { seriesId: canonical.id, seriesLegacy: canonical.name },
    });
    const remaining = await tx.deck.count({ where: { seriesId: duplicate.id } });
    if (remaining !== 0) throw new Error("Merge verification failed: duplicate still has Decks.");
    await tx.series.delete({ where: { id: duplicate.id } });
  }, { maxWait: 10_000, timeout: 120_000 });
  console.log(`Merged ${duplicate.name} into ${canonical.name}. seriesRaw values were preserved.`);
}

async function rollback(positional: string[]) {
  if (!applyRequested) throw new Error("Rollback is a write operation. Re-run with --apply.");
  const manifestPath = resolve(positional.find((arg) => !arg.startsWith("--")) ?? "reports/series-backfill-manifest.json");
  const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as BackfillManifest;
  let restored = 0;
  await prisma.$transaction(async (tx) => {
    for (const assignment of manifest.assignments) {
      const result = await tx.deck.updateMany({
        where: { id: assignment.deckId, seriesId: assignment.assignedSeriesId },
        data: {
          seriesId: assignment.previousSeriesId,
          seriesLegacy: assignment.previousSeriesLegacy,
        },
      });
      restored += result.count;
    }
    for (const series of [...manifest.createdSeries].reverse()) {
      const current = await tx.series.findUnique({
        where: { id: series.id },
        include: { _count: { select: { decks: true } } },
      });
      if (
        current &&
        current._count.decks === 0 &&
        !current.subtitle &&
        !current.description &&
        !current.heroImageUrl &&
        !current.attributionLabel &&
        !current.attributionText
      ) {
        await tx.series.delete({ where: { id: current.id } });
      }
    }
  }, { maxWait: 10_000, timeout: 120_000 });
  console.log(`Restored ${restored} Deck assignments. seriesRaw was intentionally retained.`);
}

function punctuationKey(value: string) {
  return value
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[\p{P}\p{S}\s]+/gu, "");
}

function levenshtein(a: string, b: string) {
  let previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  for (let i = 1; i <= a.length; i += 1) {
    const current = [i];
    for (let j = 1; j <= b.length; j += 1) {
      current[j] = Math.min(
        current[j - 1] + 1,
        previous[j] + 1,
        previous[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
      );
    }
    previous = current;
  }
  return previous[b.length];
}

function toCsv(rows: ReviewRow[]) {
  const headers: Array<keyof ReviewRow> = [
    "reason",
    "valueA",
    "valueB",
    "normalizedA",
    "normalizedB",
    "proposedSlugA",
    "proposedSlugB",
    "levenshteinDistance",
    "deckCountA",
    "deckCountB",
    "sampleDecksA",
    "sampleDecksB",
  ];
  return [headers.join(","), ...rows.map((row) => headers.map((header) => csvCell(row[header])).join(","))].join("\n") + "\n";
}

function csvCell(value: string | number) {
  const text = String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function valueAfter(flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
