"use client";

import Link from "next/link";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import {
  ArchiveSpotlightTrigger,
  openArchiveSpotlight,
} from "@/components/archive-spotlight";
import { AddMenu } from "@/components/add-menu";
import { SpecialtyCollectionsMenu } from "@/components/specialty-collections-menu";
import { CollectionIcon, StatsIcon } from "@/components/icons";
import { logout } from "./logout-action";

const navLinks = [
  { href: "/collection", label: "Collection", icon: CollectionIcon },
  { href: "/stats", label: "Stats", icon: StatsIcon },
];

export function NavBar({
  isAuthenticated,
  creatorNavItems,
}: {
  isAuthenticated: boolean;
  creatorNavItems: { name: string; href: string }[];
}) {
  const pathname = usePathname();
  const logoLongPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressLogoNavigation = useRef(false);
  const specialtyIsActive =
    pathname === "/creators" ||
    pathname.startsWith("/creators/") ||
    pathname === "/white-whales" ||
    pathname === "/mini" ||
    pathname === "/tarot" ||
    pathname === "/souvenir";

  function cancelLogoLongPress() {
    if (logoLongPressTimer.current) {
      clearTimeout(logoLongPressTimer.current);
      logoLongPressTimer.current = null;
    }
  }

  function startLogoLongPress() {
    cancelLogoLongPress();
    suppressLogoNavigation.current = false;
    logoLongPressTimer.current = setTimeout(() => {
      suppressLogoNavigation.current = true;
      openArchiveSpotlight();
    }, 550);
  }

  return (
    <header className="sticky top-0 z-10 border-b border-felt-line bg-felt-header/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-3 py-3 sm:gap-4 sm:px-6">
        <Link
          href="/"
          onClick={(event) => {
            if (suppressLogoNavigation.current) {
              event.preventDefault();
              suppressLogoNavigation.current = false;
            }
          }}
          className="flex shrink-0 items-center gap-2.5"
        >
          <span
            onPointerDown={startLogoLongPress}
            onPointerUp={cancelLogoLongPress}
            onPointerCancel={cancelLogoLongPress}
            onPointerLeave={cancelLogoLongPress}
            onContextMenu={(event) => event.preventDefault()}
            className="relative flex h-9 w-9 shrink-0 select-none items-center justify-center rounded-full border-2 border-brass text-lg text-brass sm:h-10 sm:w-10"
            title="Press and hold to search"
          >
            <span className="pointer-events-none absolute inset-[3px] rounded-full border border-brass/40" />
            ♠
          </span>
          <span className="hidden flex-col sm:flex">
            <span className="font-display text-lg font-semibold leading-tight tracking-wide text-felt-ink">
              Card Guy Archive
            </span>
            <span className="text-[10px] uppercase tracking-[0.14em] text-brass/70">
              Tim&rsquo;s Playing Card Collection
            </span>
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 text-xs sm:gap-1 sm:text-sm">
          {navLinks.map((link) => {
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
          <SpecialtyCollectionsMenu creators={creatorNavItems} isActive={specialtyIsActive} />
          {isAuthenticated && <AddMenu />}
          <ArchiveSpotlightTrigger />
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
