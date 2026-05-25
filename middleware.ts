import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { canAccessPath, getDashboardForRole } from "@/lib/route-access";

const protectedPrefixes = ["/dashboard", "/branch-dashboard", "/director"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Legacy /director/* routes → modern /dashboard/*
  if (pathname === "/director" || pathname === "/director/") {
    return NextResponse.redirect(new URL("/dashboard/director", request.url));
  }
  if (pathname.startsWith("/director/")) {
    const rest = pathname.slice("/director".length);
    return NextResponse.redirect(new URL(`/dashboard${rest}`, request.url));
  }

  const token = request.cookies.get("token")?.value;
  const role = request.cookies.get("userRole")?.value ?? "";

  const isProtected = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));

  if (isProtected && !token) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  if (isProtected && token && role && !canAccessPath(role, pathname)) {
    return NextResponse.redirect(new URL(getDashboardForRole(role), request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/branch-dashboard/:path*", "/director", "/director/:path*"],
};
