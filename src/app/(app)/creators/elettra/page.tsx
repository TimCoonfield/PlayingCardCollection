import type { Metadata } from "next";
import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const ELETTRA_HERO_IMAGE_URL =
  "/images/creators/elettra-deganello.webp";
const ELETTRA_BLURB =
  "I’ve had the pleasure of meeting Elettra Deganello at the last several 52+Joker conventions, including 2024, when she created the club deck. She is a wonderful person and an extraordinarily talented illustrator whose care for the form is apparent in everything she makes. Even her simplest designs feel deliberate; every line, character, ornament, and historical reference seems to be there for a reason. Her Pinocchio deck is the one I often describe as the most flawless deck I know. That does not necessarily mean the most elaborate or ambitious—only that there is genuinely nothing about it I would change. It is imaginative, beautifully drawn, perfectly suited to its subject, and executed with remarkable clarity from beginning to end.";

export const metadata: Metadata = {
  title: "Elettra Deganello",
  description: "Decks by Elettra Deganello in the Card Guy Archive collection.",
};

export default async function ElettraLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Elettra Deganello");

  return (
    <DecksLandingPage
      title="Elettra Deganello"
      tagline="The Interpreter"
      path="/creators/elettra"
      heroImageUrl={ELETTRA_HERO_IMAGE_URL}
      blurb={ELETTRA_BLURB}
      description={ELETTRA_BLURB}
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
