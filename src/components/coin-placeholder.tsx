import { getDeckPlaceholder } from "@/lib/placeholders";

const ICON_SIZE_CLASSES = {
  sm: "text-4xl",
  md: "text-5xl",
  lg: "text-7xl",
};

const ACCENT_CLASSES: Record<string, { text: string; bar: string }> = {
  plum: { text: "text-plum", bar: "bg-plum" },
  brass: { text: "text-brass", bar: "bg-brass" },
  sage: { text: "text-sage", bar: "bg-sage" },
  brick: { text: "text-brick", bar: "bg-brick" },
  "felt-ink": { text: "text-felt-ink", bar: "bg-felt-ink" },
};

export function CoinPlaceholder({
  tags,
  size = "md",
  thickAccent = false,
}: {
  tags: string[];
  size?: "sm" | "md" | "lg";
  thickAccent?: boolean;
}) {
  const style = getDeckPlaceholder(tags);

  return (
    <div className="relative flex h-full w-full items-center justify-center bg-gradient-to-br from-felt-surface-2 to-felt-bg">
      <span className={`${ICON_SIZE_CLASSES[size]} opacity-90 drop-shadow-[0_2px_6px_rgba(0,0,0,0.45)]`}>
        {style.icon ?? "🪙"}
      </span>
      <CoinAccentBar tags={tags} thick={thickAccent} />
    </div>
  );
}

/** The same bottom accent bar the deck placeholder uses, for reuse over a real photo. */
export function CoinAccentBar({ tags, thick = false }: { tags: string[]; thick?: boolean }) {
  const style = getDeckPlaceholder(tags);
  const accent = ACCENT_CLASSES[style.accent] ?? ACCENT_CLASSES.brass;
  return (
    <span className={`absolute inset-x-0 bottom-0 ${thick ? "h-[9px]" : "h-[3px]"} ${accent.bar} opacity-70`} />
  );
}
