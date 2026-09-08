import Link from "next/link";

export function ArchiveNotFound() {
  return (
    <section className="mx-auto flex max-w-xl flex-col items-center px-4 py-20 text-center sm:py-28">
      <span aria-hidden="true" className="font-display text-6xl text-brass">♠</span>
      <p className="mt-8 text-xs font-semibold uppercase tracking-[0.2em] text-brass">404 · Not in the archive</p>
      <h1 className="mt-3 font-display text-4xl font-semibold text-felt-ink sm:text-5xl">A card out of place.</h1>
      <p className="mt-5 text-base leading-7 text-felt-sub">
        I couldn’t find the page you’re looking for. There are plenty of other stories to explore in the collection.
      </p>
      <Link href="/collection" className="mt-8 rounded-md border border-brass px-5 py-3 text-sm font-semibold text-brass transition-colors hover:bg-brass hover:text-felt-header">
        Back to the collection →
      </Link>
      <p className="mt-5 text-sm text-felt-sub">Or use the search in the header to find a deck, creator, or series.</p>
    </section>
  );
}
