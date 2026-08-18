import type { Metadata } from "next";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";
import { JACK_BRUTUS_PENNY_IMAGE_URL } from "@/lib/featured-creators";

const JACK_BLURB_TEXT =
  "Some creators make beautiful decks. Some tell compelling stories. Jack Brutus Penny somehow takes ideas that sound completely ridiculous on paper and transforms them into works of art that feel inevitable once they're in your hands. I've been fortunate to support his work from the very beginning with Culturae Animalis, and every release since has only reinforced why he's one of my favorite creators. His decks overflow with detail, creativity, whimsy, and hidden surprises, and beyond the cards, Jack is one of the genuinely kind, intelligent, and creative people I've had the pleasure of calling a friend.";

export const metadata: Metadata = {
  title: "Jack Brutus Penny",
  description: "Decks by Jack Brutus Penny in the Card Guy Archive collection.",
};

export default async function JackBrutusPennyLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Jack Brutus Penny");
  return (
    <DecksLandingPage
      title="Jack Brutus Penny"
      tagline="Master of the Marvelously Absurd"
      path="/creators/jack"
      heroImageUrl={JACK_BRUTUS_PENNY_IMAGE_URL}
      heroObjectRight
      blurb={
        <>
          Some creators make beautiful decks. Some tell compelling stories. Jack Brutus Penny
          somehow takes ideas that sound completely ridiculous on paper and transforms them into
          works of art that feel inevitable once they&apos;re in your hands. I&apos;ve been
          fortunate to support his work from the very beginning with <em>Culturae Animalis</em>,
          and every release since has only reinforced why he&apos;s one of my favorite creators.
          His decks overflow with detail, creativity, whimsy, and hidden surprises, and beyond the
          cards, Jack is one of the genuinely kind, intelligent, and creative people I&apos;ve had
          the pleasure of calling a friend.
        </>
      }
      description={JACK_BLURB_TEXT}
      decks={decks}
      coins={coins}
      showFilters
      emptyMessage="No Jack Brutus Penny decks yet."
    />
  );
}
