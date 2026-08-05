import type { ReactNode } from "react";
import Link from "next/link";
import { AnimatedStatValue } from "./animated-stat-value";

function renderStatValue(value: string | number) {
  if (typeof value === "number") return <AnimatedStatValue value={value} />;

  const percentage = value.match(/^(\d+)%$/);
  if (percentage) return <AnimatedStatValue value={Number(percentage[1])} suffix="%" />;

  return value;
}

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
          {renderStatValue(value)}
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
        {renderStatValue(value)}
      </span>
    </div>
  );
}
