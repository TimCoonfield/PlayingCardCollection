import { del } from "@vercel/blob";
import { prisma } from "@/lib/prisma";

function isManagedBlobUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname.endsWith(".public.blob.vercel-storage.com");
  } catch {
    return false;
  }
}

/**
 * Deletes only managed Blob URLs that no deck or coin still references. Cleanup is best-effort:
 * a storage outage must not turn an otherwise successful catalog save/delete into an error.
 */
export async function deleteUnreferencedBlobUrls(urls: string[]): Promise<void> {
  const candidates = [...new Set(urls)].filter(isManagedBlobUrl);
  if (candidates.length === 0) return;

  try {
    const [deckReferences, coinReferences, seriesReferences] = await Promise.all([
      prisma.deckImage.findMany({
        where: { url: { in: candidates } },
        select: { url: true },
      }),
      prisma.coin.findMany({
        where: {
          OR: [
            { obverseImageUrl: { in: candidates } },
            { reverseImageUrl: { in: candidates } },
          ],
        },
        select: { obverseImageUrl: true, reverseImageUrl: true },
      }),
      prisma.series.findMany({
        where: { heroImageUrl: { in: candidates } },
        select: { heroImageUrl: true },
      }),
    ]);

    const referenced = new Set(deckReferences.map(({ url }) => url));
    for (const coin of coinReferences) {
      if (coin.obverseImageUrl) referenced.add(coin.obverseImageUrl);
      if (coin.reverseImageUrl) referenced.add(coin.reverseImageUrl);
    }
    for (const series of seriesReferences) {
      if (series.heroImageUrl) referenced.add(series.heroImageUrl);
    }

    const unreferenced = candidates.filter((url) => !referenced.has(url));
    if (unreferenced.length > 0) await del(unreferenced);
  } catch {
    // Leave the Blob in place for a later cleanup rather than failing the catalog mutation.
  }
}
