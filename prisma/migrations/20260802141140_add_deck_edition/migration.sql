-- CreateTable
CREATE TABLE "DeckEdition" (
    "id" TEXT NOT NULL,
    "deckId" TEXT NOT NULL,
    "deckNumber" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DeckEdition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeckEdition_deckId_idx" ON "DeckEdition"("deckId");

-- AddForeignKey
ALTER TABLE "DeckEdition" ADD CONSTRAINT "DeckEdition_deckId_fkey" FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
