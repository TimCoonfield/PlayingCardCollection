export function Pagination({
  page,
  totalPages,
  searchParams,
}: {
  page: number;
  totalPages: number;
  searchParams: URLSearchParams;
}) {
  if (totalPages <= 1) return null;

  const hrefFor = (p: number) => {
    const params = new URLSearchParams(searchParams);
    params.set("page", String(p));
    return `/collection?${params.toString()}`;
  };

  return (
    <div className="flex items-center justify-center gap-4 py-6 text-sm text-felt-sub">
      {page > 1 ? (
        <a href={hrefFor(page - 1)} className="rounded-md border border-felt-line px-3 py-1.5 hover:bg-felt-surface hover:text-felt-ink">
          ← Prev
        </a>
      ) : (
        <span className="rounded-md border border-felt-line/40 px-3 py-1.5 text-felt-sub/40">← Prev</span>
      )}
      <span className="tabular-nums">
        Page {page} of {totalPages}
      </span>
      {page < totalPages ? (
        <a href={hrefFor(page + 1)} className="rounded-md border border-felt-line px-3 py-1.5 hover:bg-felt-surface hover:text-felt-ink">
          Next →
        </a>
      ) : (
        <span className="rounded-md border border-felt-line/40 px-3 py-1.5 text-felt-sub/40">Next →</span>
      )}
    </div>
  );
}
