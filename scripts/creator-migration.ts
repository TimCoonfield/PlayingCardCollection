import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { prisma } from "../src/lib/prisma";
import { joinDesignerNames } from "../src/lib/designers";

const [, , command = "review", ...args] = process.argv;

async function main() {
  if (command === "review") await review();
  else if (command === "apply") await applyApprovedMerges();
  else if (command === "reconcile") await reconcile();
  else throw new Error(`Unknown command: ${command}`);
}

async function review() {
  const creators = await prisma.creator.findMany({
    select: {
      id: true,
      name: true,
      favorite: true,
      displayName: true,
      tagline: true,
      description: true,
      heroImageUrl: true,
      decksDesigned: { select: { deckId: true, deck: { select: { name: true } } } },
      decksProduced: { select: { id: true, name: true } },
      coinsDesigned: { select: { id: true, name: true } },
      coinsProduced: { select: { id: true, name: true } },
    },
    orderBy: { name: "asc" },
  });

  const rows: Array<Record<string, string | number>> = [];
  for (let leftIndex = 0; leftIndex < creators.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < creators.length; rightIndex += 1) {
      const left = creators[leftIndex];
      const right = creators[rightIndex];
      const reason = similarityReason(left.name, right.name);
      if (!reason) continue;

      const leftCount = itemCount(left);
      const rightCount = itemCount(right);
      const [keep, remove] = preferCreator(left, right, leftCount, rightCount);
      rows.push({
        decision: "",
        reason,
        keepId: keep.id,
        keepName: keep.name,
        removeId: remove.id,
        removeName: remove.name,
        keepItems: itemCount(keep),
        removeItems: itemCount(remove),
        keepSample: sampleItems(keep),
        removeSample: sampleItems(remove),
        reviewNote: "Set decision to MERGE only after confirming these are the same identity.",
      });
    }
  }

  const outputPath = resolve(valueAfter("--out") ?? "reports/creator-merge-review.csv");
  await mkdir(dirname(outputPath), { recursive: true });
  await writeFile(outputPath, toCsv(rows), "utf8");
  console.log(`Creators: ${creators.length}`);
  console.log(`Possible duplicate pairs: ${rows.length}`);
  console.log(`Review file: ${outputPath}`);
  console.log("No records were merged. Set decision=MERGE for approved rows, then run apply --confirm.");
}

async function applyApprovedMerges() {
  if (!args.includes("--confirm")) {
    throw new Error("Refusing to merge without --confirm. Review the report and approve rows first.");
  }
  const inputPath = resolve(valueAfter("--file") ?? "reports/creator-merge-review.csv");
  const rows = parseCsv(await readFile(inputPath, "utf8"));
  const approved = rows.filter((row) => row.decision.trim().toLocaleUpperCase() === "MERGE");
  if (approved.length === 0) {
    console.log("No rows marked MERGE. Nothing changed.");
    return;
  }

  const skipCacheRefresh = args.includes("--skip-cache-refresh");
  if (skipCacheRefresh) {
    console.warn(
      "Skipping application cache refresh. Use this only for local/offline databases; production pages may remain stale."
    );
  } else {
    await refreshCatalogCaches(true);
  }

  let applied = 0;
  let mergeError: unknown;
  try {
    for (const row of approved) {
      await mergeCreators(row.keepId, row.removeId, row.keepName, row.removeName);
      applied += 1;
      console.log(`Merged ${row.removeName} into ${row.keepName}`);
    }
  } catch (error) {
    mergeError = error;
  }

  let refreshError: unknown;
  if (!skipCacheRefresh && applied > 0) {
    try {
      await refreshCatalogCaches(false);
    } catch (error) {
      refreshError = error;
    }
  }

  if (mergeError && refreshError) {
    throw new AggregateError(
      [mergeError, refreshError],
      "A Creator merge failed, and the cache refresh after the completed merges also failed."
    );
  }
  if (mergeError) throw mergeError;
  if (refreshError) throw refreshError;
  console.log(`Applied ${applied} approved Creator merge(s).`);
}

async function refreshCatalogCaches(dryRun: boolean) {
  const endpoint = process.env.CATALOG_REVALIDATION_URL?.trim();
  const secret = process.env.CACHE_REVALIDATION_SECRET;
  if (!endpoint || !secret?.trim()) {
    throw new Error(
      "Creator merges require CATALOG_REVALIDATION_URL and CACHE_REVALIDATION_SECRET. " +
      "Configure both, or use --skip-cache-refresh only for a local/offline database."
    );
  }

  const url = new URL(endpoint);
  if (dryRun) url.searchParams.set("dryRun", "1");
  const response = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
  });
  if (!response.ok) {
    const message = await response.text();
    throw new Error(
      `Catalog cache ${dryRun ? "preflight" : "refresh"} failed (${response.status}): ${message}`
    );
  }
  console.log(dryRun ? "Catalog cache refresh preflight passed." : "Application caches refreshed.");
}

async function mergeCreators(
  keepId: string,
  removeId: string,
  expectedKeepName: string,
  expectedRemoveName: string
) {
  if (!keepId || !removeId || keepId === removeId) throw new Error("Invalid merge ids in review file.");

  await prisma.$transaction(async (tx) => {
    const [keep, remove] = await Promise.all([
      tx.creator.findUnique({ where: { id: keepId } }),
      tx.creator.findUnique({
        where: { id: removeId },
        include: { decksDesigned: { select: { deckId: true } } },
      }),
    ]);
    if (!keep || !remove) throw new Error("A reviewed Creator no longer exists.");
    if (keep.name !== expectedKeepName || remove.name !== expectedRemoveName) {
      throw new Error("Creator names changed after review. Generate a fresh report.");
    }

    const affectedDeckIds = remove.decksDesigned.map(({ deckId }) => deckId);
    for (const deckId of affectedDeckIds) {
      const keepCredit = await tx.deckDesigner.findUnique({
        where: { deckId_designerId: { deckId, designerId: keepId } },
      });
      if (keepCredit) {
        await tx.deckDesigner.delete({
          where: { deckId_designerId: { deckId, designerId: removeId } },
        });
      } else {
        await tx.deckDesigner.update({
          where: { deckId_designerId: { deckId, designerId: removeId } },
          data: { designerId: keepId },
        });
      }

      const credits = await tx.deckDesigner.findMany({
        where: { deckId },
        orderBy: { sortOrder: "asc" },
        select: { designerId: true },
      });
      for (const [index, credit] of credits.entries()) {
        await tx.deckDesigner.update({
          where: { deckId_designerId: { deckId, designerId: credit.designerId } },
          data: { sortOrder: -index - 1 },
        });
      }
      for (const [index, credit] of credits.entries()) {
        await tx.deckDesigner.update({
          where: { deckId_designerId: { deckId, designerId: credit.designerId } },
          data: { sortOrder: index },
        });
      }
    }

    await Promise.all([
      tx.deck.updateMany({
        where: { producerCreatorId: removeId },
        data: { producerCreatorId: keepId, producer: keep.name },
      }),
      tx.coin.updateMany({
        where: { designerCreatorId: removeId },
        data: { designerCreatorId: keepId, designer: keep.name },
      }),
      tx.coin.updateMany({
        where: { producerCreatorId: removeId },
        data: { producerCreatorId: keepId, producer: keep.name },
      }),
    ]);

    for (const deckId of affectedDeckIds) {
      const deck = await tx.deck.findUnique({
        where: { id: deckId },
        select: {
          designers: {
            orderBy: { sortOrder: "asc" },
            select: { designer: { select: { name: true } } },
          },
        },
      });
      if (deck) {
        await tx.deck.update({
          where: { id: deckId },
          data: { designerLegacy: joinDesignerNames(deck.designers.map(({ designer }) => designer.name)) },
        });
      }
    }

    await tx.creator.update({
      where: { id: keepId },
      data: {
        displayName: keep.displayName ?? remove.displayName,
        tagline: keep.tagline ?? remove.tagline,
        description: keep.description ?? remove.description,
        heroImageUrl: keep.heroImageUrl ?? remove.heroImageUrl,
        favorite: keep.favorite || remove.favorite,
      },
    });
    await tx.creator.delete({ where: { id: removeId } });
  });
}

async function reconcile() {
  const [decks, coins] = await Promise.all([
    prisma.deck.findMany({
      select: {
        id: true,
        name: true,
        designerLegacy: true,
        producer: true,
        producerCreator: { select: { name: true } },
        designers: {
          orderBy: { sortOrder: "asc" },
          select: { designer: { select: { name: true } } },
        },
      },
    }),
    prisma.coin.findMany({
      select: {
        id: true,
        name: true,
        designer: true,
        producer: true,
        designerCreator: { select: { name: true } },
        producerCreator: { select: { name: true } },
      },
    }),
  ]);
  const deckMismatches = decks.filter(
    (deck) =>
      deck.designerLegacy !== joinDesignerNames(deck.designers.map(({ designer }) => designer.name)) ||
      deck.producer !== (deck.producerCreator?.name ?? null)
  );
  const coinMismatches = coins.filter(
    (coin) =>
      coin.designer !== (coin.designerCreator?.name ?? null) ||
      coin.producer !== (coin.producerCreator?.name ?? null)
  );
  console.log(`Decks: ${decks.length}; credit mismatches: ${deckMismatches.length}`);
  console.log(`Coins: ${coins.length}; credit mismatches: ${coinMismatches.length}`);
}

interface ReviewCreator {
  id: string;
  name: string;
  favorite: boolean;
  displayName: string | null;
  tagline: string | null;
  description: string | null;
  heroImageUrl: string | null;
  decksDesigned: Array<{ deckId: string; deck: { name: string } }>;
  decksProduced: Array<{ id: string; name: string }>;
  coinsDesigned: Array<{ id: string; name: string }>;
  coinsProduced: Array<{ id: string; name: string }>;
}

function itemCount(creator: ReviewCreator) {
  return new Set([
    ...creator.decksDesigned.map(({ deckId }) => `deck:${deckId}`),
    ...creator.decksProduced.map(({ id }) => `deck:${id}`),
    ...creator.coinsDesigned.map(({ id }) => `coin:${id}`),
    ...creator.coinsProduced.map(({ id }) => `coin:${id}`),
  ]).size;
}

function sampleItems(creator: ReviewCreator) {
  return Array.from(
    new Set([
      ...creator.decksDesigned.map(({ deck }) => deck.name),
      ...creator.decksProduced.map(({ name }) => name),
      ...creator.coinsDesigned.map(({ name }) => name),
      ...creator.coinsProduced.map(({ name }) => name),
    ])
  ).slice(0, 4).join(" | ");
}

function preferCreator(left: ReviewCreator, right: ReviewCreator, leftCount: number, rightCount: number) {
  const profileScore = (creator: ReviewCreator) =>
    Number(creator.favorite) +
    Number(Boolean(creator.displayName)) +
    Number(Boolean(creator.tagline)) +
    Number(Boolean(creator.description)) +
    Number(Boolean(creator.heroImageUrl));
  if (profileScore(left) !== profileScore(right)) {
    return profileScore(left) > profileScore(right) ? [left, right] : [right, left];
  }
  if (leftCount !== rightCount) return leftCount > rightCount ? [left, right] : [right, left];
  return left.name.localeCompare(right.name) <= 0 ? [left, right] : [right, left];
}

function similarityReason(left: string, right: string) {
  const leftCompact = compact(left);
  const rightCompact = compact(right);
  if (leftCompact === rightCompact) return "same after spacing/punctuation normalization";
  if (Math.min(leftCompact.length, rightCompact.length) >= 6 && levenshtein(leftCompact, rightCompact) === 1) {
    return "one-character difference";
  }
  const [shorter, longer] = leftCompact.length <= rightCompact.length
    ? [leftCompact, rightCompact]
    : [rightCompact, leftCompact];
  if (shorter.length >= 6 && longer.length - shorter.length <= 2 && longer.endsWith(shorter)) {
    return "possible short prefix variant";
  }
  return null;
}

function compact(value: string) {
  return value.normalize("NFKD").replace(/\p{M}/gu, "").toLocaleLowerCase().replace(/[^a-z0-9]/g, "");
}

function levenshtein(left: string, right: string) {
  const row = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    let previous = row[0];
    row[0] = leftIndex;
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      const current = row[rightIndex];
      row[rightIndex] = Math.min(
        row[rightIndex] + 1,
        row[rightIndex - 1] + 1,
        previous + Number(left[leftIndex - 1] !== right[rightIndex - 1])
      );
      previous = current;
    }
  }
  return row[right.length];
}

function valueAfter(flag: string) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : undefined;
}

function toCsv(rows: Array<Record<string, string | number>>) {
  const headers = [
    "decision", "reason", "keepId", "keepName", "removeId", "removeName",
    "keepItems", "removeItems", "keepSample", "removeSample", "reviewNote",
  ];
  const escape = (value: string | number | undefined) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return `${headers.join(",")}\n${rows.map((row) => headers.map((header) => escape(row[header])).join(",")).join("\n")}\n`;
}

function parseCsv(input: string) {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted && char === '"' && input[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      record.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[index + 1] === "\n") index += 1;
      record.push(field);
      if (record.some(Boolean)) records.push(record);
      record = [];
      field = "";
    } else {
      field += char;
    }
  }
  if (field || record.length > 0) {
    record.push(field);
    records.push(record);
  }
  const [headers, ...rows] = records;
  if (!headers) return [];
  return rows.map((values) =>
    Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""])) as Record<string, string>
  );
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
