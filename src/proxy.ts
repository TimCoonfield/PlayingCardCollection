import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getIronSession } from "iron-session";
import { sessionOptions, type SessionData } from "@/lib/auth";

/** Routes that require a logged-in session; everything else is browsable read-only. */
function isProtectedPath(pathname: string): boolean {
  if (pathname === "/decks/new") return true;
  if (/^\/decks\/[^/]+\/edit$/.test(pathname)) return true;
  if (pathname === "/coins/new") return true;
  if (/^\/coins\/[^/]+\/edit$/.test(pathname)) return true;
  if (pathname === "/api/upload") return true;
  if (pathname === "/api/ai/identify") return true;
  return false;
}

export async function proxy(request: NextRequest) {
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  const { pathname } = request.nextUrl;
  const isLoginPage = pathname === "/login";

  if (!session.authenticated && isProtectedPath(pathname)) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("from", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (session.authenticated && isLoginPage) {
    return NextResponse.redirect(new URL("/collection", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
