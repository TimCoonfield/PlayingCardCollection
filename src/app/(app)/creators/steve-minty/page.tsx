import type { Metadata } from "next";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const STEVE_MINTY_BLURB =
  "Steve Minty is all about story and mythology for me. He takes well-known mythologies and traditions—Japanese, Egyptian, Greek, Día de los Muertos—and gives each one a distinctly Minty spin. The imagery is bold, the symbolism is layered, and his vibrant color palettes stand out immediately among nearly everything else in my collection. Then there are the Signature Series decks. Their elaborate cases seem to defy logic: sculptural, extravagant, and so gloriously over the top that you cannot help but stop and take notice. They turn an already striking deck into a complete display object, and they are not to be missed.";

export const metadata: Metadata = {
  title: "Steve Minty",
  description: "Decks by Steve Minty in the Card Guy Archive collection.",
};

export default async function SteveMintyLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Steve Minty");
  const heroImageUrl = decks.find((deck) => deck.images.length > 0)?.images[0]?.url;

  return (
    <DecksLandingPage
      title="Steve Minty"
      tagline="The Gilded Storyteller"
      path="/creators/steve-minty"
      heroImageUrl={heroImageUrl}
      blurb={STEVE_MINTY_BLURB}
      description={STEVE_MINTY_BLURB}
      decks={decks}
      coins={coins}
      showFilters
      emptyMessage="No Steve Minty decks yet."
    />
  );
}
