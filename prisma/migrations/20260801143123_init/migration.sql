-- CreateTable
CREATE TABLE "Deck" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "designer" TEXT,
    "producer" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownershipStatus" TEXT NOT NULL DEFAULT 'Owned',
    "qty" INTEGER NOT NULL DEFAULT 1,
    "deckNumber" INTEGER,
    "productionRun" INTEGER,
    "notes" TEXT,
    "catalogNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Deck_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DeckImage" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeckImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Deck_tags_idx" ON "Deck" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "Deck_designer_idx" ON "Deck"("designer");

-- CreateIndex
CREATE INDEX "Deck_producer_idx" ON "Deck"("producer");

-- CreateIndex
CREATE INDEX "Deck_series_idx" ON "Deck"("series");

-- CreateIndex
CREATE INDEX "DeckImage_deckId_idx" ON "DeckImage"("deckId");

-- AddForeignKey
ALTER TABLE "DeckImage" ADD CONSTRAINT "DeckImage_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
