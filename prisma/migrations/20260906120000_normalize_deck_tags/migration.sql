-- Normalize the 6 non-era Deck tags (Gilded, Signed, Mini, Tarot, Prototype, Edge Painted) into a
-- proper many-to-many structure, so a new tag can be added later with an INSERT instead of a
-- schema migration. Era tags (Modern/Vintage/Antique) are intentionally excluded here — they are
-- moving to their own dedicated classification system in a follow-up migration, not into this
-- table. Deck.tags (the physical "tags" column) is left completely untouched as a compatibility
-- mirror; it is renamed to Deck.tagsLegacy at the Prisma schema level only (see @map("tags")).
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(60) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "DeckTag" (
    "deckId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "DeckTag_pkey" PRIMARY KEY ("deckId", "tagId")
);

CREATE UNIQUE INDEX "Tag_name_key" ON "Tag"("name");
CREATE INDEX "DeckTag_tagId_idx" ON "DeckTag"("tagId");

ALTER TABLE "DeckTag" ADD CONSTRAINT "DeckTag_deckId_fkey"
  FOREIGN KEY ("deckId") REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "DeckTag" ADD CONSTRAINT "DeckTag_tagId_fkey"
  FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

INSERT INTO "Tag" ("id", "name") VALUES
  ('tag_' || SUBSTRING(MD5('Gilded') FROM 1 FOR 24), 'Gilded'),
  ('tag_' || SUBSTRING(MD5('Signed') FROM 1 FOR 24), 'Signed'),
  ('tag_' || SUBSTRING(MD5('Mini') FROM 1 FOR 24), 'Mini'),
  ('tag_' || SUBSTRING(MD5('Tarot') FROM 1 FOR 24), 'Tarot'),
  ('tag_' || SUBSTRING(MD5('Prototype') FROM 1 FOR 24), 'Prototype'),
  ('tag_' || SUBSTRING(MD5('Edge Painted') FROM 1 FOR 24), 'Edge Painted');

INSERT INTO "DeckTag" ("deckId", "tagId")
SELECT deck."id", tag."id"
FROM "Deck" AS deck
JOIN "Tag" AS tag ON tag."name" = ANY(deck."tags")
WHERE tag."name" IN ('Gilded', 'Signed', 'Mini', 'Tarot', 'Prototype', 'Edge Painted');
