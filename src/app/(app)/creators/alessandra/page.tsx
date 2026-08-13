import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const ALESSANDRA_HERO_IMAGE_URL =
  "/images/creators/alessandra-gagliano.webp";

export default async function AlessandraLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Alessandra Gagliano");

  return (
    <DecksLandingPage
      title="Alessandra Gagliano & Anthony Holt"
      tagline="The Folklorist"
      heroImageUrl={ALESSANDRA_HERO_IMAGE_URL}
      blurb="I was backer #2 on Jocu's very first Kickstarter, Fillide, and I've been along for the ride ever since. Alessandra's work has a warmth and humanity to it that I find incredibly distinctive—beautifully illustrated decks steeped in folklore, nature, history and a wonderful sense of place. But Jocu has always been a partnership. Her partner Anthony Holt works alongside her on nearly everything beyond the artwork itself, helping turn those ideas and illustrations into the thoughtful, beautifully produced decks that eventually land in our hands. Together they've built something that feels unmistakably their own, and it's been a genuine pleasure watching that body of work grow from the very beginning."
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
