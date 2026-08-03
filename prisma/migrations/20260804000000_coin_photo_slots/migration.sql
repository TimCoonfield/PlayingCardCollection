-- AlterTable
ALTER TABLE "Coin" ADD COLUMN     "diameter" TEXT,
ADD COLUMN     "obverseImageUrl" TEXT,
ADD COLUMN     "reverseImageUrl" TEXT;

-- Backfill: carry over the first two CoinImage rows (by sortOrder) per coin into the new
-- fixed obverse/reverse columns before the relation table is dropped.
UPDATE "Coin" c
SET "obverseImageUrl" = sub.obverse, "reverseImageUrl" = sub.reverse
FROM (
  SELECT
    "coinId",
    (array_agg(url ORDER BY "sortOrder" ASC))[1] AS obverse,
    (array_agg(url ORDER BY "sortOrder" ASC))[2] AS reverse
  FROM "CoinImage"
  GROUP BY "coinId"
) sub
WHERE c.id = sub."coinId";

-- DropTable
DROP TABLE "CoinImage";
