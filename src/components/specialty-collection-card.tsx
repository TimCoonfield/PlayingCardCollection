import type { CSSProperties, ReactNode } from "react";
import Link from "next/link";

const ACCENT_STYLES = {
  brass: {
    color: "var(--brass)",
    border: "border-brass/50 hover:border-brass",
  },
  plum: {
    color: "var(--plum)",
    border: "border-plum/50 hover:border-plum",
  },
  brick: {
    color: "var(--brick)",
    border: "border-brick/50 hover:border-brick",
  },
  sage: {
    color: "var(--sage)",
    border: "border-sage/50 hover:border-sage",
  },
} as const;

const ARCHIVE_NUMERALS = ["I", "II", "III", "IV", "V"];

export function SpecialtyCollectionCard({
  index,
  title,
  description,
  count,
  href,
  icon,
  accent,
}: {
  index: number;
  title: string;
  description: string;
  count: number;
  href: string;
  icon: ReactNode;
  accent: keyof typeof ACCENT_STYLES;
}) {
  const accentStyle = ACCENT_STYLES[accent];
  const style = {
    "--specialty-accent": accentStyle.color,
    background:
      "radial-gradient(circle at 85% 12%, color-mix(in srgb, var(--specialty-accent) 19%, transparent), transparent 38%), linear-gradient(145deg, var(--felt-surface-2) 0%, var(--felt-surface) 62%, var(--felt-bg) 100%)",
  } as CSSProperties;

  return (
    <Link
      href={href}
      style={style}
      className={`group relative min-h-56 overflow-hidden rounded-lg border p-5 shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-black/35 ${accentStyle.border}`}
    >
      <span
        className="text-[11px] font-semibold uppercase tracking-[0.18em]"
        style={{ color: "color-mix(in srgb, var(--specialty-accent) 76%, var(--felt-ink))" }}
      >
        Archive {ARCHIVE_NUMERALS[index] ?? index + 1}
      </span>

      <span
        aria-hidden="true"
        className="pointer-events-none absolute -right-2 top-2 flex h-28 w-28 rotate-[-8deg] items-center justify-center text-8xl font-light leading-none [&>svg]:h-full [&>svg]:w-full [&>svg]:stroke-[1.1]"
        style={{ color: "color-mix(in srgb, var(--specialty-accent) 29%, transparent)" }}
      >
        {icon}
      </span>

      <h3 className="relative mt-7 max-w-[88%] font-display text-3xl font-bold leading-none tracking-tight text-felt-ink">
        {title}
      </h3>
      <p className="relative mt-2 min-h-10 font-display text-sm italic leading-snug text-felt-sub">
        {description}
      </p>

      <span
        aria-hidden="true"
        className="absolute inset-x-5 bottom-14 h-px opacity-50"
        style={{ background: "linear-gradient(to right, var(--specialty-accent), transparent 82%)" }}
      />
      <span className="absolute inset-x-5 bottom-4 flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className="font-display text-3xl font-semibold leading-none text-felt-ink">
            {count}
          </span>
          <span className="text-[11px] uppercase tracking-wider text-felt-sub">collected</span>
        </span>
        <span className="text-xl" style={{ color: "var(--specialty-accent)" }} aria-hidden="true">
          →
        </span>
      </span>
    </Link>
  );
}
