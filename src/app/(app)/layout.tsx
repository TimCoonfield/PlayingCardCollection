import Link from "next/link";
import { getSession } from "@/lib/auth";
import { NAVIGATION_CREATORS } from "@/lib/featured-creators";
import { NavBar } from "./nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const isAuthenticated = Boolean(session.authenticated);
  const creatorNavItems = NAVIGATION_CREATORS.map((creator) => ({
    name: creator.displayName ?? creator.designer,
    href: creator.landingPageHref,
  }));

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-felt-bg text-felt-ink">
      <NavBar isAuthenticated={isAuthenticated} creatorNavItems={creatorNavItems} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
      {!isAuthenticated && (
        <footer className="border-t border-felt-line px-4 py-4 text-center sm:px-6">
          <Link href="/login" className="text-xs text-felt-sub hover:text-felt-ink">
            Log in
          </Link>
        </footer>
      )}
    </div>
  );
}
