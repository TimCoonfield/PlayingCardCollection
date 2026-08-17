import Link from "next/link";
import { getTagStyle } from "@/lib/placeholders";
import { TagIcon } from "@/components/tag-icon";

const ACCENT_CLASSES: Record<string, string> = {
  plum: "text-plum border-plum/40 hover:bg-plum/10",
  brass: "text-brass border-brass/40 hover:bg-brass/10",
  sage: "text-sage border-sage/40 hover:bg-sage/10",
  brick: "text-brick border-brick/40 hover:bg-brick/10",
  "felt-ink": "text-felt-ink border-felt-ink/30 hover:bg-felt-ink/10",
};

export function CoinTagChip({ tag }: { tag: string }) {
  const style = getTagStyle(tag);
  const accentClass = ACCENT_CLASSES[style.accent] ?? ACCENT_CLASSES.brass;

  return (
    <Link
      href={`/coins?tag=${encodeURIComponent(tag)}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${accentClass}`}
    >
      <TagIcon icon={style.icon} fallback="coin" className="h-3.5 w-3.5 shrink-0" />
      {tag}
    </Link>
  );
}
