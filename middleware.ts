import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, decryptSession } from "@/lib/auth/jwt";

const DASHBOARD = "/dashboard";
const ADMIN = "/admin";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = await decryptSession(token);

  const isDashboard = pathname.startsWith(DASHBOARD);
  const isAdmin = pathname.startsWith(ADMIN);

  if ((isDashboard || isAdmin) && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  if (isAdmin && session?.role !== "admin") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/admin/:path*"],
};
