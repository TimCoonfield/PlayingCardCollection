"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logout } from "./logout-action";

const baseLinks = [
  { href: "/collection", label: "Collection" },
  { href: "/stats", label: "Stats" },
];

export function NavBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const links = isAuthenticated
    ? [baseLinks[0], { href: "/decks/new", label: "Add Deck" }, baseLinks[1]]
    : baseLinks;

  return (
    <header className="sticky top-0 z-10 border-b border-felt-line bg-felt-bg/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/collection" className="flex shrink-0 items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-md border border-brass text-brass">
            ♠
          </span>
          <span className="hidden font-display text-base font-semibold tracking-wide text-felt-ink sm:inline">
            Card Collection
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`whitespace-nowrap rounded-md px-2 py-1.5 transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3 ${
                  isActive ? "font-semibold text-felt-ink" : "text-felt-sub"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
          {isAuthenticated ? (
            <form action={logout}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-md px-2 py-1.5 text-felt-sub transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3"
              >
                Log out
              </button>
            </form>
          ) : (
            <Link
              href="/login"
              className="whitespace-nowrap rounded-md border border-brass px-2 py-1.5 text-brass transition-colors hover:bg-brass/10 sm:px-3"
            >
              Log in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
