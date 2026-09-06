-- Adds a fallback era classification field for decks with no releaseYear. Era itself becomes a
-- code-level calculated field (src/lib/era.ts's computeEra) for any Deck that has a releaseYear;
-- this column is only ever consulted when releaseYear is null.

-- CreateEnum
CREATE TYPE "Era" AS ENUM ('Modern', 'Vintage', 'Antique');

-- AlterTable
ALTER TABLE "Deck" ADD COLUMN "manualEra" "Era";

-- Backfill: for decks with no releaseYear, carry over whatever era classification the legacy
-- free-text tags array already recorded. Decks with a releaseYear are left NULL since their era
-- is always computed from age going forward. The local + production audit performed before this
-- migration found zero decks with more than one conflicting era tag, so this is unambiguous.
UPDATE "Deck" SET "manualEra" = 'Modern'::"Era"
  WHERE "releaseYear" IS NULL AND 'Modern' = ANY("tags");
UPDATE "Deck" SET "manualEra" = 'Vintage'::"Era"
  WHERE "releaseYear" IS NULL AND 'Vintage' = ANY("tags");
UPDATE "Deck" SET "manualEra" = 'Antique'::"Era"
  WHERE "releaseYear" IS NULL AND 'Antique' = ANY("tags");

-- Owner-reviewed corrections for the two anomalies the pre-migration audit found (no era tag and
-- no releaseYear): "Texas Souvenir Playing Cards" -> Antique, "Ten in One Black" -> Modern.
UPDATE "Deck" SET "manualEra" = 'Antique'::"Era"
  WHERE "name" = 'Texas Souvenir Playing Cards' AND "releaseYear" IS NULL;
UPDATE "Deck" SET "manualEra" = 'Modern'::"Era"
  WHERE "name" = 'Ten in One Black' AND "releaseYear" IS NULL;
