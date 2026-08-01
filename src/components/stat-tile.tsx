export function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-felt-line bg-felt-surface px-4 py-3">
      <span className="text-sm text-felt-sub">{label}</span>
      <span className="font-display text-3xl font-semibold tabular-nums text-felt-ink">
        {typeof value === "number" ? value.toLocaleString() : value}
      </span>
    </div>
  );
}
