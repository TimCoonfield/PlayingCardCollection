import { getSeriesLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const SOUVENIR_HERO_IMAGE_URL =
  "https://pl3drpvfu4aqzkn0.public.blob.vercel-storage.com/pages/souvenir-hero.jpg";

export default async function SouvenirDecksPage() {
  const { decks, coins } = await getSeriesLandingCatalog("Souvenir Decks");

  return (
    <DecksLandingPage
      title="Souvenir Decks"
      heroImageUrl={SOUVENIR_HERO_IMAGE_URL}
      heroObjectRight
      heroTextMaxWidth="xl"
      blurb="Souvenir decks hold a special place in my collection because they are more than keepsakes—they are small historical objects. I first became interested in them after seeing the Niagara Falls and White Pass and Yukon Route decks at the 2024 52+Joker Convention, and Matt Schacht’s excellent talk the following year only deepened that interest. Made for tourists rather than collectors, these decks preserve how a place, attraction, railroad, or business chose to present itself at a particular moment in time. They can be cheerful, kitschy, and unassuming, but they also capture pieces of history that might otherwise disappear. This is where I’m gathering those stories together."
      decks={decks}
      coins={coins}
      showFilters
      filterTagSet="all"
      emptyMessage="No souvenir decks yet."
    />
  );
}
