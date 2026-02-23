import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getSessionFromRequest } from "./lib/auth";

const PUBLIC_PATHS = ["/", "/login", "/signup", "/api/auth/login", "/api/auth/signup", "/join"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + "/"))) {
    return NextResponse.next();
  }

  // Allow static files and Next.js internals
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  const session = await getSessionFromRequest(req);

  if (!session) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Admin route protection
  if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
    const user = await fetch(`${req.nextUrl.origin}/api/user/profile`, {
      headers: { cookie: req.headers.get("cookie") || "" },
    }).then(r => r.ok ? r.json() : null).catch(() => null);

    if (!user?.isAdmin) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // Redirect incomplete onboarding
  if (
    !session.onboardingDone &&
    !pathname.startsWith("/onboarding") &&
    !pathname.startsWith("/api/")
  ) {
    return NextResponse.redirect(new URL("/onboarding", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
