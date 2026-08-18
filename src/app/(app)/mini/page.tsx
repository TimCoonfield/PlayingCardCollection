import type { Metadata } from "next";
import { getTaggedLandingCatalog } from "@/lib/catalog-browse";
import { DecksLandingPage } from "@/components/decks-landing-page";

export const metadata: Metadata = {
  title: "Mini Decks",
  description: "Miniature-format playing card decks in the Card Guy Archive collection.",
};

// Placeholder hero art (magnifying glass over a few mini cards) until a real photo replaces it —
// see the docs at the bottom of this file for how to swap it out.
const MINI_HERO_SVG = (
  <g fill="none" stroke="#f3ead1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="560" y="90" width="90" height="128" rx="8" transform="rotate(-10 605 154)" />
    <rect x="610" y="120" width="90" height="128" rx="8" transform="rotate(7 655 184)" />
    <rect x="540" y="150" width="90" height="128" rx="8" transform="rotate(-18 585 214)" />
    <circle cx="420" cy="300" r="120" />
    <line x1="505" y1="385" x2="630" y2="510" strokeWidth="30" />
  </g>
);

const MINI_BLURB =
  "There’s something irresistible about a deck of cards you can barely believe is full-size. Mini decks compress every design decision—typography, line weight, color—into a fraction of the space, and somehow the best ones still read perfectly at a glance. I love hunting these down as a kind of bonus format: the same artists and studios I already follow, reimagined in miniature, often as limited extras rather than the main release. They take up almost no shelf space and pack an outsized amount of craft into a few square inches. This is where I’m keeping track of them.";

export default async function MiniDecksPage() {
  const { decks, coins } = await getTaggedLandingCatalog("Mini");

  return (
    <DecksLandingPage
      title="Mini Decks"
      path="/mini"
      heroSvg={MINI_HERO_SVG}
      blurb={MINI_BLURB}
      description={MINI_BLURB}
      decks={decks}
      coins={coins}
      showFilters
      filterTagSet="all"
      emptyMessage="No mini decks yet."
    />
  );
}
