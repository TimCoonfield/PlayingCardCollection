import type { TagIconName } from "@/components/tag-icon";

export interface PlaceholderStyle {
  /** Archival line icon, or null to render the default deck/coin mark. */
  icon: TagIconName | null;
  /** Tailwind color token for the accent bar + glyph (when icon is null). */
  accent: string;
}

const TAG_STYLES: Record<string, PlaceholderStyle> = {
  Tarot: { icon: "tarot", accent: "plum" },
  Mini: { icon: "mini", accent: "brass" },
  Prototype: { icon: "prototype", accent: "sage" },
  Signed: { icon: "signed", accent: "felt-ink" },
  Modern: { icon: null, accent: "brass" },
  Antique: { icon: "antique", accent: "brick" },
  Vintage: { icon: "vintage", accent: "plum" },
  Gilded: { icon: "gilded", accent: "brass" },
  "Edge Painted": { icon: "edge-painted", accent: "sage" },
};

/** Highest-precedence tag first: an earlier entry overrides a later one. */
const PRECEDENCE = ["Tarot", "Mini", "Prototype", "Signed", "Modern", "Antique", "Vintage"];

const GENERIC_PLACEHOLDER: PlaceholderStyle = { icon: null, accent: "brass" };

/** The single style used for a deck's placeholder art, by tag precedence. */
export function getDeckPlaceholder(tags: string[]): PlaceholderStyle {
  for (const tag of PRECEDENCE) {
    if (tags.includes(tag)) return TAG_STYLES[tag];
  }
  return GENERIC_PLACEHOLDER;
}

/** The style for one specific tag chip, regardless of precedence. */
export function getTagStyle(tag: string): PlaceholderStyle {
  return TAG_STYLES[tag] ?? GENERIC_PLACEHOLDER;
}
