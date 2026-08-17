-- CreateTable
CREATE TABLE "Series" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "slug" VARCHAR(240) NOT NULL,
    "subtitle" VARCHAR(300),
    "description" TEXT,
    "heroImageUrl" TEXT,
    "attributionLabel" VARCHAR(80),
    "attributionText" VARCHAR(300),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Series_pkey" PRIMARY KEY ("id")
);

-- AddColumns
ALTER TABLE "Deck"
    ADD COLUMN "seriesRaw" TEXT,
    ADD COLUMN "seriesId" TEXT,
    ADD COLUMN "seriesOrder" INTEGER,
    ADD COLUMN "variantNote" VARCHAR(300);

-- Preserve the original value byte-for-byte. Trimming is used only by the backfill matcher.
UPDATE "Deck"
SET "seriesRaw" = "series"
WHERE "seriesRaw" IS NULL;

-- CreateIndexes
CREATE UNIQUE INDEX "Series_name_key" ON "Series"("name");
CREATE UNIQUE INDEX "Series_slug_key" ON "Series"("slug");
CREATE INDEX "Deck_seriesId_seriesOrder_idx" ON "Deck"("seriesId", "seriesOrder");

-- AddForeignKey
ALTER TABLE "Deck"
    ADD CONSTRAINT "Deck_seriesId_fkey"
    FOREIGN KEY ("seriesId") REFERENCES "Series"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;
