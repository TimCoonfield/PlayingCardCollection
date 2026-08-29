-- Promote the normalized Designer identity to the archive-wide Creator entity. A Creator can be
-- credited as a designer, producer, or both; legacy string columns remain compatibility mirrors.
ALTER TABLE "Designer" RENAME TO "Creator";
ALTER TABLE "Creator" RENAME CONSTRAINT "Designer_pkey" TO "Creator_pkey";
ALTER INDEX "Designer_name_key" RENAME TO "Creator_name_key";

ALTER TABLE "Creator"
  ADD COLUMN "displayName" VARCHAR(240),
  ADD COLUMN "slug" VARCHAR(240),
  ADD COLUMN "tagline" VARCHAR(300),
  ADD COLUMN "description" TEXT,
  ADD COLUMN "heroImageUrl" TEXT,
  ADD COLUMN "favorite" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Deck" ADD COLUMN "producerCreatorId" TEXT;
ALTER TABLE "Coin"
  ADD COLUMN "designerCreatorId" TEXT,
  ADD COLUMN "producerCreatorId" TEXT;

-- Add every exact producer credit and both Coin credit roles to the shared identity table. Existing
-- designer identities keep their ids, so DeckDesigner rows require no rewrite after the table rename.
WITH credits AS (
  SELECT BTRIM("producer") AS name FROM "Deck"
  WHERE "producer" IS NOT NULL AND BTRIM("producer") <> ''
  UNION
  SELECT BTRIM("designer") AS name FROM "Coin"
  WHERE "designer" IS NOT NULL AND BTRIM("designer") <> ''
  UNION
  SELECT BTRIM("producer") AS name FROM "Coin"
  WHERE "producer" IS NOT NULL AND BTRIM("producer") <> ''
)
INSERT INTO "Creator" ("id", "name", "updatedAt")
SELECT 'creator_' || MD5(name), name, CURRENT_TIMESTAMP
FROM credits
ON CONFLICT ("name") DO NOTHING;

-- Preserve the eight hand-curated profiles and their established public URLs. The long-form copy
-- is the owner's existing landing-page prose, moved from code into editable archive data.
UPDATE "Creator" SET
  "slug" = 'giovanni',
  "tagline" = 'The Mythmaker',
  "description" = $profile$Giovanni Meroni is another of my absolute favorite creators, largely because of the depth of the stories he builds behind his decks. My first was Dedalo, which arrived almost accidentally as a single deck in an eBay lot. Its interpretation of the Minotaur, the Labyrinth, and the larger mythology surrounding them drew me in immediately. Since then, I’ve had the privilege of speaking with Giovanni several times, and his excitement when explaining the characters, symbolism, and hidden lore behind his work is infectious. The artwork is striking on its own, but understanding how thoughtfully every detail fits into the story makes the decks far more rewarding. Giovanni creates designs that invite you to keep looking, reading, and discovering.$profile$,
  "heroImageUrl" = '/images/creators/giovanni-meroni.webp',
  "favorite" = true
WHERE "name" = 'Giovanni Meroni';

UPDATE "Creator" SET
  "slug" = 'lorenzo',
  "tagline" = 'The Architect',
  "description" = $profile$Lorenzo Gaggiotti may or may not be my single favorite playing card creator—there are too many artists whose work I love to make that an easy call. But he is probably the clearest archetype of what I want a creator in my collection to be. The House of the Rising Spade was my first deck of his, and it immediately showed me the full package: impeccable artwork, rich storytelling, and phenomenal execution. Lorenzo does not simply design cards; he builds complete worlds around them, with their own characters, symbols, histories, and artifacts. The artistry is second to none, but it is the way every element supports the larger vision that makes his work feel so complete.$profile$,
  "heroImageUrl" = '/images/creators/lorenzo-gaggiotti-hero.webp',
  "favorite" = true
WHERE "name" = 'Lorenzo Gaggiotti';

UPDATE "Creator" SET
  "displayName" = 'Linnea Gits & Peter Dunham',
  "slug" = 'linnea',
  "tagline" = 'The Painter',
  "description" = $profile$Linnea Gits may be the finest pure artist working in playing cards. Her painting is simply on another level. But what makes Uusi special isn't just Linnea's remarkable artwork—it's the creative partnership she shares with Peter Dunham. Together they create decks with an emotional depth and sense of purpose that few others can match. Every release feels handcrafted, thoughtful, and unmistakably human. Pagan was my first deck of theirs, given to me as a gift, and I've been captivated by their work ever since. Their decks feel less like products and more like enduring works of art.$profile$,
  "heroImageUrl" = '/images/creators/linnea-gits.webp',
  "favorite" = true
WHERE "name" = 'Linnea Gits';

UPDATE "Creator" SET
  "displayName" = 'Alessandra Gagliano & Anthony Holt',
  "slug" = 'alessandra',
  "tagline" = 'The Folklorist',
  "description" = $profile$I was backer #2 on Jocu's very first Kickstarter, Fillide, and I've been along for the ride ever since. Alessandra's work has a warmth and humanity to it that I find incredibly distinctive—beautifully illustrated decks steeped in folklore, nature, history and a wonderful sense of place. But Jocu has always been a partnership. Her partner Anthony Holt works alongside her on nearly everything beyond the artwork itself, helping turn those ideas and illustrations into the thoughtful, beautifully produced decks that eventually land in our hands. Together they've built something that feels unmistakably their own, and it's been a genuine pleasure watching that body of work grow from the very beginning.$profile$,
  "heroImageUrl" = '/images/creators/alessandra-gagliano.webp',
  "favorite" = true
WHERE "name" = 'Alessandra Gagliano';

UPDATE "Creator" SET
  "slug" = 'elettra',
  "tagline" = 'The Interpreter',
  "description" = $profile$I’ve had the pleasure of meeting Elettra Deganello at the last several 52+Joker conventions, including 2024, when she created the club deck. She is a wonderful person and an extraordinarily talented illustrator whose care for the form is apparent in everything she makes. Even her simplest designs feel deliberate; every line, character, ornament, and historical reference seems to be there for a reason. Her Pinocchio deck is the one I often describe as the most flawless deck I know. That does not necessarily mean the most elaborate or ambitious—only that there is genuinely nothing about it I would change. It is imaginative, beautifully drawn, perfectly suited to its subject, and executed with remarkable clarity from beginning to end.$profile$,
  "heroImageUrl" = '/images/creators/elettra-deganello.webp',
  "favorite" = true
WHERE "name" = 'Elettra Deganello';

UPDATE "Creator" SET
  "slug" = 'karl',
  "tagline" = 'The Craftsman',
  "description" = $profile$Few creators have changed the way I understand playing cards as profoundly as Karl Gerich. I have poured more time into studying, collecting, and appreciating his work than perhaps that of any other artist. His decks are stunning, but beauty is only the beginning. Gerich understood the history and visual language of playing cards intimately, then reinterpreted them with extraordinary craftsmanship, intelligence, and imagination. Because he controlled so much of the process himself, every deck feels intensely personal—an object made by an artist rather than simply designed by one. His work rewards close study, and each new deck has expanded my appreciation for what playing cards can be. Collecting Gerich has become a collection within the collection.$profile$,
  "heroImageUrl" = '/images/creators/karl-gerich-joker.webp',
  "favorite" = true
WHERE "name" = 'Karl Gerich';

UPDATE "Creator" SET
  "slug" = 'jack',
  "tagline" = 'Master of the Marvelously Absurd',
  "description" = $profile$Some creators make beautiful decks. Some tell compelling stories. Jack Brutus Penny somehow takes ideas that sound completely ridiculous on paper and transforms them into works of art that feel inevitable once they're in your hands. I've been fortunate to support his work from the very beginning with Culturae Animalis, and every release since has only reinforced why he's one of my favorite creators. His decks overflow with detail, creativity, whimsy, and hidden surprises, and beyond the cards, Jack is one of the genuinely kind, intelligent, and creative people I've had the pleasure of calling a friend.$profile$,
  "heroImageUrl" = '/images/creators/jack-brutus-penny.webp'
WHERE "name" = 'Jack Brutus Penny';

UPDATE "Creator" SET
  "slug" = 'steve-minty',
  "tagline" = 'The Gilded Storyteller',
  "description" = $profile$Steve Minty is all about story and mythology for me. He takes well-known mythologies and traditions—Japanese, Egyptian, Greek, Día de los Muertos—and gives each one a distinctly Minty spin. The imagery is bold, the symbolism is layered, and his vibrant color palettes stand out immediately among nearly everything else in my collection. Then there are the Signature Series decks. Their elaborate cases seem to defy logic: sculptural, extravagant, and so gloriously over the top that you cannot help but stop and take notice. They turn an already striking deck into a complete display object, and they are not to be missed.$profile$
WHERE "name" = 'Steve Minty';

-- Generate stable, human-readable slugs for every remaining Creator. Exact slug collisions receive
-- a short deterministic suffix; curated slugs above remain untouched.
WITH normalized AS (
  SELECT
    "id",
    "name",
    COALESCE(
      NULLIF(TRIM(BOTH '-' FROM LOWER(REGEXP_REPLACE(REPLACE("name", '&', ' and '), '[^A-Za-z0-9]+', '-', 'g'))), ''),
      'creator-' || SUBSTRING(MD5("name") FROM 1 FOR 8)
    ) AS base
  FROM "Creator"
  WHERE "slug" IS NULL
), ranked AS (
  SELECT
    normalized.*,
    ROW_NUMBER() OVER (PARTITION BY base ORDER BY "name", "id") AS collision_rank
  FROM normalized
)
UPDATE "Creator" AS creator
SET "slug" = CASE
  WHEN ranked.collision_rank = 1
    AND NOT EXISTS (
      SELECT 1 FROM "Creator" AS reserved
      WHERE reserved."slug" = ranked.base AND reserved."id" <> ranked."id"
    )
    THEN ranked.base
  ELSE ranked.base || '--' || SUBSTRING(MD5(ranked."name") FROM 1 FOR 8)
END
FROM ranked
WHERE creator."id" = ranked."id";

ALTER TABLE "Creator" ALTER COLUMN "slug" SET NOT NULL;
CREATE UNIQUE INDEX "Creator_slug_key" ON "Creator"("slug");

-- Normalize producer and Coin credits to Creator foreign keys while retaining their current text.
UPDATE "Deck" AS deck
SET "producerCreatorId" = creator."id"
FROM "Creator" AS creator
WHERE creator."name" = BTRIM(deck."producer")
  AND deck."producer" IS NOT NULL
  AND BTRIM(deck."producer") <> '';

UPDATE "Coin" AS coin
SET "designerCreatorId" = creator."id"
FROM "Creator" AS creator
WHERE creator."name" = BTRIM(coin."designer")
  AND coin."designer" IS NOT NULL
  AND BTRIM(coin."designer") <> '';

UPDATE "Coin" AS coin
SET "producerCreatorId" = creator."id"
FROM "Creator" AS creator
WHERE creator."name" = BTRIM(coin."producer")
  AND coin."producer" IS NOT NULL
  AND BTRIM(coin."producer") <> '';

CREATE INDEX "Deck_producerCreatorId_idx" ON "Deck"("producerCreatorId");
CREATE INDEX "Coin_designerCreatorId_idx" ON "Coin"("designerCreatorId");
CREATE INDEX "Coin_producerCreatorId_idx" ON "Coin"("producerCreatorId");

ALTER TABLE "Deck" ADD CONSTRAINT "Deck_producerCreatorId_fkey"
  FOREIGN KEY ("producerCreatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Coin" ADD CONSTRAINT "Coin_designerCreatorId_fkey"
  FOREIGN KEY ("designerCreatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Coin" ADD CONSTRAINT "Coin_producerCreatorId_fkey"
  FOREIGN KEY ("producerCreatorId") REFERENCES "Creator"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
