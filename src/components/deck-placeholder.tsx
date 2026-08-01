import { getDeckPlaceholder } from "@/lib/placeholders";

const ICON_SIZE_CLASSES = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-7xl",
};

const GLYPH_SIZE_CLASSES = {
  sm: "text-5xl",
  md: "text-6xl",
  lg: "text-8xl",
};

const ACCENT_CLASSES: Record<string, { text: string; bar: string }> = {
  plum: { text: "text-plum", bar: "bg-plum" },
  brass: { text: "text-brass", bar: "bg-brass" },
  sage: { text: "text-sage", bar: "bg-sage" },
  brick: { text: "text-brick", bar: "bg-brick" },
  "felt-ink": { text: "text-felt-ink", bar: "bg-felt-ink" },
};

export function DeckPlaceholder({
  tags,
  size = "md",
}: {
  tags: string[];
  size?: "sm" | "md" | "lg";
}) {
  const style = getDeckPlaceholder(tags);
  const accent = ACCENT_CLASSES[style.accent] ?? ACCENT_CLASSES.brass;

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-felt-surface-2 to-felt-bg">
      {style.icon ? (
        <span
          className={`${ICON_SIZE_CLASSES[size]} opacity-90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]`}
        >
          {style.icon}
        </span>
      ) : (
        <span className={`${GLYPH_SIZE_CLASSES[size]} font-display ${accent.text} opacity-90`}>
          ♠
        </span>
      )}
      <span className={`absolute inset-x-0 bottom-0 h-[3px] ${accent.bar} opacity-70`} />
    </div>
  );
}
