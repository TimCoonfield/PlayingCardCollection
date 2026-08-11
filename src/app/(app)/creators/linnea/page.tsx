import { getCreatorLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

const LINNEA_HERO_IMAGE_URL =
  "/images/creators/linnea-gits.webp";

export default async function LinneaLandingPage() {
  const { decks, coins } = await getCreatorLandingCatalog("Linnea Gits");

  return (
    <DecksLandingPage
      title="Linnea Gits"
      tagline="The Painter"
      heroImageUrl={LINNEA_HERO_IMAGE_URL}
      blurb={
        <>
          Linnea Gits may be the finest pure artist working in playing cards. Her painting is
          simply on another level. But what makes Uusi special isn&apos;t just Linnea&apos;s
          remarkable artwork—it&apos;s the creative partnership she shares with Peter Dunham.
          Together they create decks with an emotional depth and sense of purpose that few others
          can match. Every release feels handcrafted, thoughtful, and unmistakably human. <em>Pagan</em>{" "}
          was my first deck of theirs, given to me as a gift, and I&apos;ve been captivated by
          their work ever since. Their decks feel less like products and more like enduring works
          of art.
        </>
      }
      decks={decks}
      coins={coins}
      showFilters
    />
  );
}
