export interface PlaceholderStyle {
  /** Emoji icon, or null to render the suit-glyph mark instead (colored via CSS). */
  icon: string | null;
  /** Tailwind color token for the accent bar + glyph (when icon is null). */
  accent: string;
}

const TAG_STYLES: Record<string, PlaceholderStyle> = {
  Tarot: { icon: "🔮", accent: "plum" },
  Mini: { icon: "🔍", accent: "brass" },
  Prototype: { icon: "🧪", accent: "sage" },
  Signed: { icon: "✍️", accent: "felt-ink" },
  Modern: { icon: null, accent: "brass" },
  Antique: { icon: "🕰️", accent: "brick" },
  Vintage: { icon: "📻", accent: "plum" },
  Gilded: { icon: "✨", accent: "brass" },
  "Edge Painted": { icon: "🎨", accent: "sage" },
  Souvenir: { icon: "📸", accent: "brick" },
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
