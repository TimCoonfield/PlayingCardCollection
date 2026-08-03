-- CreateTable
CREATE TABLE "Coin" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "series" TEXT,
    "designer" TEXT,
    "producer" TEXT,
    "material" TEXT,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "ownershipStatus" TEXT NOT NULL DEFAULT 'Owned',
    "qty" INTEGER NOT NULL DEFAULT 1,
    "releaseYear" INTEGER,
    "notes" TEXT,
    "catalogNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Coin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CoinImage" (
    "id" TEXT NOT NULL,
    "coinId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CoinImage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Coin_tags_idx" ON "Coin" USING GIN ("tags");

-- CreateIndex
CREATE INDEX "Coin_designer_idx" ON "Coin"("designer");

-- CreateIndex
CREATE INDEX "Coin_producer_idx" ON "Coin"("producer");

-- CreateIndex
CREATE INDEX "Coin_series_idx" ON "Coin"("series");

-- CreateIndex
CREATE INDEX "CoinImage_coinId_idx" ON "CoinImage"("coinId");

-- AddForeignKey
ALTER TABLE "CoinImage" ADD CONSTRAINT "CoinImage_coinId_fkey" FOREIGN KEY ("coinId") REFERENCES "Coin"("id") ON DELETE CASCADE ON UPDATE CASCADE;
