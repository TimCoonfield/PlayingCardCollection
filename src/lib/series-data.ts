import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSeriesPageData = cache(async (slug: string) => {
  const series = await prisma.series.findUnique({
    where: { slug },
    include: {
      decks: {
        select: {
          id: true,
          name: true,
          designers: {
            orderBy: { sortOrder: "asc" },
            select: { designer: { select: { name: true } } },
          },
          producer: true,
          qty: true,
          tags: true,
          favorite: true,
          whiteWhale: true,
          releaseYear: true,
          seriesOrder: true,
          images: { orderBy: { sortOrder: "asc" }, take: 1, select: { url: true } },
        },
      },
    },
  });
  if (!series) return null;
  return {
    ...series,
    decks: series.decks.map(({ designers, ...deck }) => ({
      ...deck,
      designers: designers.map(({ designer }) => designer.name),
    })),
  };
});
