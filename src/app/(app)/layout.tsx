import { getSession } from "@/lib/auth";
import { getFavoriteCreators } from "@/lib/catalog-metadata";
import { NavBar } from "./nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const [session, creators] = await Promise.all([getSession(), getFavoriteCreators()]);
  const isAuthenticated = Boolean(session.authenticated);
  const creatorNavItems = creators
    .slice(0, 6)
    .map((creator) => ({
      name: creator.displayName ?? creator.name,
      href: `/creators/${creator.slug}`,
    }));

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-felt-bg text-felt-ink">
      <NavBar isAuthenticated={isAuthenticated} creatorNavItems={creatorNavItems} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
