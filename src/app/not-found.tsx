import { NavBar } from "./(app)/nav-bar";
import { ArchiveNotFound } from "@/components/archive-not-found";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-1 flex-col bg-felt-bg text-felt-ink">
      <NavBar isAuthenticated={false} creatorNavItems={[]} />
      <main><ArchiveNotFound /></main>
    </div>
  );
}
