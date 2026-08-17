import { createHash } from "node:crypto";

export function seriesSlugBase(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[’'\u2018\u2019]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function seriesNameHash(name: string): string {
  return createHash("sha256").update(name).digest("hex");
}

export function seriesCollisionSlug(name: string, hashLength = 8): string {
  const base = seriesSlugBase(name) || "series";
  return `${base}--${seriesNameHash(name).slice(0, hashLength)}`;
}
