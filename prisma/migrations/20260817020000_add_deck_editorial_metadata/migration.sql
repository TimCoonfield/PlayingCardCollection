-- CreateEnum
CREATE TYPE "CollectionReason" AS ENUM (
    'ARTISTRY',
    'CRAFT',
    'LORE',
    'HISTORY',
    'RARITY',
    'ACQUISITION',
    'COMPLETION',
    'VOLUME',
    'PERSONAL'
);

-- AlterTable
ALTER TABLE "Deck"
    ADD COLUMN "collectionReasonPrimary" "CollectionReason",
    ADD COLUMN "collectionReasonSecondary" "CollectionReason",
    ADD COLUMN "hook" VARCHAR(240),
    ADD COLUMN "essay" TEXT,
    ADD COLUMN "notesReviewedAt" TIMESTAMP(3);

-- Prevent the same reason from occupying both positions.
ALTER TABLE "Deck"
    ADD CONSTRAINT "Deck_collectionReasons_distinct_check"
    CHECK (
        "collectionReasonPrimary" IS NULL
        OR "collectionReasonSecondary" IS NULL
        OR "collectionReasonPrimary" <> "collectionReasonSecondary"
    );

-- CreateIndexes
CREATE INDEX "Deck_collectionReasonPrimary_idx"
    ON "Deck"("collectionReasonPrimary");

CREATE INDEX "Deck_collectionReasonSecondary_idx"
    ON "Deck"("collectionReasonSecondary");
