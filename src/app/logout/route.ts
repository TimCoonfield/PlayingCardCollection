import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

// No nav-bar logout button (see nav-bar.tsx) — hitting this URL directly is the only way to log
// out now. Not gated in src/proxy.ts's matcher: it's a harmless no-op when already logged out.
export async function GET() {
  const session = await getSession();
  session.destroy();
  redirect("/collection");
}
