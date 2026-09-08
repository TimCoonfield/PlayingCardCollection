-- Additive rollout: backfill must run before public links switch from IDs to slugs.
ALTER TABLE "Deck" ADD COLUMN "slug" VARCHAR(240);
CREATE UNIQUE INDEX "Deck_slug_key" ON "Deck"("slug");
CREATE TABLE "DeckSlugHistory" (
  "slug" VARCHAR(240) PRIMARY KEY,
  "deckId" TEXT NOT NULL REFERENCES "Deck"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX "DeckSlugHistory_deckId_idx" ON "DeckSlugHistory"("deckId");
ALTER TABLE "Deck" ADD CONSTRAINT "Deck_slug_format_check" CHECK (
  "slug" IS NULL OR ("slug" ~ '^[a-z0-9]+(-[a-z0-9]+)*$'
    AND "slug" NOT IN ('new', 'missing-years') AND "slug" !~ '^c[a-z0-9]{24}$')
);

-- History is enforced in the database, including future maintenance-script renames.
CREATE FUNCTION preserve_deck_slug() RETURNS TRIGGER AS $$
DECLARE owner_id TEXT;
BEGIN
  IF TG_OP = 'UPDATE' AND OLD."slug" IS NOT NULL AND NEW."slug" IS NULL THEN
    RAISE EXCEPTION 'An assigned deck slug cannot be cleared';
  END IF;
  IF NEW."slug" IS NOT NULL THEN
    IF EXISTS (SELECT 1 FROM "Deck" WHERE "id" = NEW."slug" AND "id" <> NEW."id") THEN
      RAISE EXCEPTION 'Deck slug conflicts with an existing ID' USING ERRCODE = '23505';
    END IF;
    INSERT INTO "DeckSlugHistory" ("slug", "deckId") VALUES (NEW."slug", NEW."id")
      ON CONFLICT ("slug") DO NOTHING;
    SELECT "deckId" INTO owner_id FROM "DeckSlugHistory" WHERE "slug" = NEW."slug";
    IF owner_id <> NEW."id" THEN
      RAISE EXCEPTION 'Deck slug is reserved by another deck' USING ERRCODE = '23505';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "Deck_preserve_slug" AFTER INSERT OR UPDATE OF "slug" ON "Deck"
  FOR EACH ROW EXECUTE FUNCTION preserve_deck_slug();
