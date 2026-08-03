"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HeaderSearch } from "@/components/header-search";
import { HomeIcon, CollectionIcon, StatsIcon, PlusIcon, SearchIcon } from "@/components/icons";
import { logout } from "./logout-action";

const baseLinks = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/collection", label: "Collection", icon: CollectionIcon },
  { href: "/stats", label: "Stats", icon: StatsIcon },
];

export function NavBar({ isAuthenticated }: { isAuthenticated: boolean }) {
  const pathname = usePathname();
  const links = isAuthenticated
    ? [baseLinks[0], baseLinks[1], { href: "/decks/new", label: "Add Deck", icon: PlusIcon }, baseLinks[2]]
    : baseLinks;

  return (
    <header className="sticky top-0 z-10 border-b border-felt-line bg-felt-header/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-brass text-lg text-brass sm:h-10 sm:w-10">
            <span className="pointer-events-none absolute inset-[3px] rounded-full border border-brass/40" />
            ♠
          </span>
          <span className="hidden flex-col sm:flex">
            <span className="font-display text-lg font-semibold leading-tight tracking-wide text-felt-ink">
              Card Guy Archive
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-brass/70">
              Tim Coonfield&rsquo;s Playing Card Collection
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm">
          {links.map((link) => {
            const isActive = pathname === link.href || pathname.startsWith(link.href + "/");
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 whitespace-nowrap rounded-md border-b-2 px-2 py-1.5 uppercase tracking-wide transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3 ${
                  isActive ? "border-brass font-semibold text-felt-ink" : "border-transparent text-felt-sub"
                }`}
              >
                <Icon className="hidden h-4 w-4 sm:inline" />
                {link.label}
              </Link>
            );
          })}
          <form
            action="/collection"
            method="GET"
            className="hidden items-center gap-2 rounded-md border border-felt-line bg-felt-surface px-2.5 py-1.5 lg:flex"
          >
            <SearchIcon className="h-4 w-4 shrink-0 text-felt-sub" />
            <input
              type="search"
              name="q"
              placeholder="Search decks, designers, series..."
              className="w-48 bg-transparent text-sm text-felt-ink outline-none placeholder:text-felt-sub/60 xl:w-64"
            />
          </form>
          <div className="lg:hidden">
            <HeaderSearch />
          </div>
          {isAuthenticated && (
            <form action={logout}>
              <button
                type="submit"
                className="whitespace-nowrap rounded-md px-2 py-1.5 uppercase tracking-wide text-felt-sub transition-colors hover:bg-felt-surface hover:text-felt-ink sm:px-3"
              >
                Log out
              </button>
            </form>
          )}
        </nav>
      </div>
    </header>
  );
}
