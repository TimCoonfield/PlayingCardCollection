-- Normalize Deck designer credits while retaining Deck.designer as a compatibility mirror.
CREATE TABLE "Designer" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(200) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Designer_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeckDesigner" (
    "deckId" TEXT NOT NULL,
    "designerId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "DeckDesigner_pkey" PRIMARY KEY ("deckId", "designerId")
);

CREATE UNIQUE INDEX "Designer_name_key" ON "Designer"("name");
CREATE UNIQUE INDEX "DeckDesigner_deckId_sortOrder_key" ON "DeckDesigner"("deckId", "sortOrder");
CREATE INDEX "DeckDesigner_designerId_idx" ON "DeckDesigner"("designerId");

ALTER TABLE "DeckDesigner" ADD CONSTRAINT "DeckDesigner_deckId_fkey"
  FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeckDesigner" ADD CONSTRAINT "DeckDesigner_designerId_fkey"
  FOREIGN KEY ("designerId") REFERENCES "Designer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Spaced slashes are consistently used as explicit multi-person separators in the imported data.
-- Other non-empty values remain one credit; ambiguous ampersands and punctuation are reported by
-- scripts/designer-migration.ts for manual review rather than split speculatively.
WITH credit_parts AS (
  SELECT DISTINCT BTRIM(part) AS name
  FROM "Deck"
  CROSS JOIN LATERAL UNNEST(
    CASE
      WHEN "designer" ~ '\s+/\s+' THEN REGEXP_SPLIT_TO_ARRAY("designer", '\s+/\s+')
      ELSE ARRAY["designer"]
    END
  ) AS part
  WHERE "designer" IS NOT NULL AND BTRIM("designer") <> '' AND BTRIM(part) <> ''
)
INSERT INTO "Designer" ("id", "name", "updatedAt")
SELECT 'legacy_' || SUBSTRING(MD5(name) FROM 1 FOR 24), name, CURRENT_TIMESTAMP
FROM credit_parts;

WITH credit_parts AS (
  SELECT
    deck."id" AS "deckId",
    BTRIM(part.value) AS name,
    part.ordinality - 1 AS "sortOrder"
  FROM "Deck" AS deck
  CROSS JOIN LATERAL UNNEST(
    CASE
      WHEN deck."designer" ~ '\s+/\s+' THEN REGEXP_SPLIT_TO_ARRAY(deck."designer", '\s+/\s+')
      ELSE ARRAY[deck."designer"]
    END
  ) WITH ORDINALITY AS part(value, ordinality)
  WHERE deck."designer" IS NOT NULL AND BTRIM(deck."designer") <> '' AND BTRIM(part.value) <> ''
)
INSERT INTO "DeckDesigner" ("deckId", "designerId", "sortOrder")
SELECT credit_parts."deckId", designer."id", credit_parts."sortOrder"
FROM credit_parts
JOIN "Designer" AS designer ON designer."name" = credit_parts.name;
