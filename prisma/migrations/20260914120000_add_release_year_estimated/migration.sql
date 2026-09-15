-- Qualifies a Deck's numeric release year without changing how that year is filtered or sorted.
ALTER TABLE "Deck"
ADD COLUMN "releaseYearEstimated" BOOLEAN NOT NULL DEFAULT false;
