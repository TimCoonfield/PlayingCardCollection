import { Prisma } from "@/generated/prisma/client";
import { isArchiveSearchScope } from "@/lib/archive-search";
import { isCollectionSort, type CollectionSort } from "@/lib/collection-sort";

export function buildDeckBrowseWhere(params: URLSearchParams): Prisma.DeckWhereInput {
  const and: Prisma.DeckWhereInput[] = [];
  const query = (params.get("q") ?? "").trim();
  const rawScope = params.get("scope") ?? "all";
  const scope = isArchiveSearchScope(rawScope) ? rawScope : "all";
  const contains = { contains: query, mode: "insensitive" as const };

  if (query) {
    if (scope === "name") and.push({ name: contains });
    else if (scope === "series") and.push({ series: contains });
    else if (scope === "producer") and.push({ producer: contains });
    else if (scope === "notes") and.push({ notes: contains });
    else if (scope === "creator") {
      and.push({ OR: [{ designer: contains }, { producer: contains }] });
    } else {
      and.push({
        OR: [
          { name: contains },
          { series: contains },
          { designer: contains },
          { producer: contains },
          { notes: contains },
        ],
      });
    }
  }

  const designers = params.getAll("designer");
  const producers = params.getAll("producer");
  const creator = params.get("creator");
  const series = params.getAll("series");
  const tags = params.getAll("tag");
  if (designers.length > 0) and.push({ designer: { in: designers } });
  if (producers.length > 0) and.push({ producer: { in: producers } });
  if (creator) and.push({ OR: [{ designer: creator }, { producer: creator }] });
  if (series.length > 0) and.push({ series: { in: series } });
  if (tags.length > 0) and.push({ tags: { hasEvery: tags } });

  const minYear = toInteger(params.get("minYear"));
  const maxYear = toInteger(params.get("maxYear"));
  if (minYear !== null || maxYear !== null) {
    and.push({
      releaseYear: {
        ...(minYear !== null ? { gte: minYear } : {}),
        ...(maxYear !== null ? { lte: maxYear } : {}),
      },
    });
  }

  return and.length > 0 ? { AND: and } : {};
}

export function getBrowseSort(params: URLSearchParams): CollectionSort {
  const value = params.get("sort") ?? "";
  return isCollectionSort(value) ? value : "featured";
}

export function getBrowseRandomSeed(params: URLSearchParams): number {
  return toInteger(params.get("randomSeed")) ?? 0;
}

function toInteger(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}
