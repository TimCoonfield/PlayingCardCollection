import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSeriesPageData = cache((slug: string) =>
  prisma.series.findUnique({
    where: { slug },
    include: {
      decks: {
        select: {
          id: true,
          name: true,
          designer: true,
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
  })
);
