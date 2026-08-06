import type { ReactNode } from "react";
import Link from "next/link";

export function StatTile({
  label,
  value,
  icon,
  href,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  href?: string;
}) {
  if (icon) {
    const content = (
      <>
        <span className="text-brass">{icon}</span>
        <span className="font-display text-2xl font-semibold tabular-nums text-felt-ink">
          {typeof value === "number" ? value.toLocaleString() : value}
        </span>
        <span className="text-xs uppercase tracking-wide text-felt-sub">{label}</span>
      </>
    );

    if (href) {
      return (
        <Link
          href={href}
          className="flex flex-col items-center gap-1 rounded-lg border border-felt-line bg-felt-surface px-4 py-4 text-center transition-colors hover:border-brass"
        >
          {content}
        </Link>
      );
    }

    return (
      <div className="flex flex-col items-center gap-1 rounded-lg border border-felt-line bg-felt-surface px-4 py-4 text-center">
        {content}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1 rounded-lg border border-felt-line bg-felt-surface px-4 py-3">
      <span className="text-sm text-felt-sub">{label}</span>
      <span className="font-display text-3xl font-semibold tabular-nums text-felt-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
