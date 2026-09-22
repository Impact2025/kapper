import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/jwt";

/**
 * Fase 7 multi-vertical: loodgietersassistent.nl reuses this exact app
 * (dashboard, auth, billing, AI-manager all stay domain-agnostic) — only the
 * public homepage differs per domain. Only the root path is rewritten; every
 * other route behaves identically no matter which domain served the
 * request, so this can never break the existing app if the domain isn't
 * even wired up yet in Vercel/DNS.
 */
const LOODGIETER_HOSTS = new Set(["loodgietersassistent.nl", "www.loodgietersassistent.nl"]);

/**
 * Optimistic auth gate. Runs on the Node.js runtime (Next 16 `proxy.ts`
 * convention, replacing `middleware.ts`). This is a first line of defense only:
 * the DAL (`verifySession`) performs the authoritative check at the data source.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/") {
    const host = (req.headers.get("host") ?? "").split(":")[0]!.toLowerCase();
    if (LOODGIETER_HOSTS.has(host)) {
      const url = req.nextUrl.clone();
      url.pathname = "/loodgietersassistent";
      return NextResponse.rewrite(url);
    }
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
  matcher: ["/", "/admin/:path*", "/dashboard/:path*", "/login"],
};
