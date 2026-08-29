import { createHash, timingSafeEqual } from "node:crypto";
import { revalidateTag } from "next/cache";
import { ALL_CATALOG_CACHE_TAGS } from "@/lib/catalog-cache";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" };

function secretsMatch(provided: string, expected: string) {
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(provided), digest(expected));
}

export async function POST(request: Request) {
  const expectedSecret = process.env.CACHE_REVALIDATION_SECRET;
  if (!expectedSecret) {
    return Response.json(
      { error: "Catalog cache refresh is not configured." },
      { status: 503, headers: NO_STORE_HEADERS }
    );
  }

  const authorization = request.headers.get("authorization") ?? "";
  const providedSecret = authorization.startsWith("Bearer ")
    ? authorization.slice("Bearer ".length)
    : "";
  if (!providedSecret || !secretsMatch(providedSecret, expectedSecret)) {
    return Response.json(
      { error: "Unauthorized" },
      { status: 401, headers: NO_STORE_HEADERS }
    );
  }

  const dryRun = new URL(request.url).searchParams.get("dryRun") === "1";
  if (!dryRun) {
    for (const tag of ALL_CATALOG_CACHE_TAGS) {
      revalidateTag(tag, { expire: 0 });
    }
  }

  return Response.json(
    { ok: true, dryRun, invalidatedTags: dryRun ? 0 : ALL_CATALOG_CACHE_TAGS.length },
    { headers: NO_STORE_HEADERS }
  );
}
