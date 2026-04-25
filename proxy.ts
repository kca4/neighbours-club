import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import { NextResponse } from "next/server";

// Create a lightweight Auth.js instance that only uses the edge-safe config.
// This never touches Prisma or bcrypt — safe for the Edge Runtime.
const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const session = req.auth;
  const { pathname } = req.nextUrl;

  const isAdminRoute =
    pathname === "/admin" ||
    pathname.startsWith("/admin/") ||
    pathname.startsWith("/api/admin/");

  const isMemberRoute =
    pathname === "/my-deals" ||
    pathname.startsWith("/my-deals/") ||
    pathname === "/account" ||
    pathname.startsWith("/account/") ||
    pathname === "/api/me" ||
    pathname.startsWith("/api/me/") ||
    pathname.startsWith("/api/deals/");

  if (isAdminRoute || isMemberRoute) {
    const isApiRoute = pathname.startsWith("/api/");

    if (!session) {
      if (isApiRoute) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = new URL("/signin", req.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }

    if (isAdminRoute && session.user.role !== "ADMIN") {
      if (isApiRoute) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/my-deals", req.url));
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    "/my-deals",
    "/my-deals/:path*",
    "/account",
    "/account/:path*",
    "/admin",
    "/admin/:path*",
    "/api/me",
    "/api/me/:path*",
    "/api/admin/:path*",
    "/api/deals/:path*",
  ],
};
