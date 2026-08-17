import { NextRequest, NextResponse } from "next/server";

const PROTECTED = ["/dashboard", "/messages", "/favorites", "/compare"];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isProtected = PROTECTED.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  if (!isProtected) return NextResponse.next();

  const access = request.cookies.get("estatehub_access")?.value;
  const refresh = request.cookies.get("estatehub_refresh")?.value;
  if (access || refresh) return NextResponse.next();

  const login = new URL("/login", request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/dashboard/:path*", "/messages/:path*", "/favorites/:path*", "/compare/:path*"],
};
