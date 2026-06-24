import { NextResponse, type NextRequest } from "next/server";
import { decryptSession, SESSION_COOKIE } from "@/lib/auth/jwt";

/**
 * Optimistic auth gate. Runs on the Node.js runtime (Next 16 `proxy.ts`
 * convention, replacing `middleware.ts`). This is a first line of defense only:
 * the DAL (`verifySession`) performs the authoritative check at the data source.
 */
export default async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;
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

  if (isLoginRoute && session?.userId) {
    const dest = session.role === "owner" ? "/dashboard" : "/admin";
    return NextResponse.redirect(new URL(dest, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/dashboard/:path*", "/login"],
};
