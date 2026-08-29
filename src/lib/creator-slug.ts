import { createHash } from "node:crypto";

export function creatorSlugBase(name: string): string {
  return name
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase()
    .replace(/[’'\u2018\u2019]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function creatorNameHash(name: string): string {
  return createHash("sha256").update(name).digest("hex");
}

export function creatorCollisionSlug(name: string, hashLength = 8): string {
  const base = creatorSlugBase(name) || "creator";
  return `${base}--${creatorNameHash(name).slice(0, hashLength)}`;
}
