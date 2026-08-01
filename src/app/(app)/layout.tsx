import { getSession } from "@/lib/auth";
import { NavBar } from "./nav-bar";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();

  return (
    <div className="flex min-h-screen flex-1 flex-col bg-felt-bg text-felt-ink">
      <NavBar isAuthenticated={Boolean(session.authenticated)} />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
