import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/jwt";
import { verticalForHost } from "@/lib/verticals";
import { verticalRewrite } from "@/lib/verticals/routing";

/**
 * Multi-vertical hosting: loodgietersassistent.nl (and every other live
 * vertical's domain) is served by this same deployment. The app itself —
 * dashboard, login, auth, billing, AI-manager, quotes/invoices — is shared and
 * passes through untouched; only the public marketing pages are rewritten to
 * that vertical's own site under /sites/<vertical> (lib/verticals/routing.ts).
 * An unknown host (localhost, previews) resolves to the default kapper site,
 * so this can never break the existing app if a domain isn't wired up yet.
 */

/**
 * Optimistic auth gate. Runs on the Node.js runtime (Next 16 `proxy.ts`
 * convention, replacing `middleware.ts`). This is a first line of defense only:
 * the DAL (`verifySession`) performs the authoritative check at the data source.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // /sites/* is an internal namespace reached only through the rewrite below;
  // in production a direct hit would duplicate a vertical's site on another
  // host, so it is a 404. (Open in dev to test without a hosts file.)
  if (pathname.startsWith("/sites/") && process.env.NODE_ENV === "production") {
    return new NextResponse("Not found", { status: 404 });
  }

  const rewrite = verticalRewrite(pathname, verticalForHost(req.headers.get("host")));
  if (rewrite) {
    const url = req.nextUrl.clone();
    url.pathname = rewrite.pathname;
    return NextResponse.rewrite(url);
  }

  const isAdminRoute = pathname.startsWith("/admin");
  const isDashboardRoute = pathname.startsWith("/dashboard");
  const isLoginRoute = pathname === "/login";

  if (!isAdminRoute && !isDashboardRoute && !isLoginRoute) return NextResponse.next();

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  if ((isAdminRoute || isDashboardRoute) && !session?.userId) {
    const url = new URL("/login", req.nextUrl);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (isAdminRoute && session?.role !== "admin") {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl));
  }

  if (isLoginRoute && session?.userId) {
    const dest = session.role === "owner" ? "/dashboard" : "/admin";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  // Every page route except Next internals, API routes and files with an
  // extension — plus the two extension-bearing files that are per-site.
  matcher: ["/((?!_next/|api/|.*\\..*).*)", "/sitemap.xml", "/robots.txt"],
};
