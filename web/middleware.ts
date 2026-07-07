/**
 * Route protection (design/10 §2 RBAC). Guards:
 *   /portal/*  → any authenticated session (guest or staff)
 *   /ops/*     → staff session only
 * Unauthenticated users are redirected to the appropriate sign-in with ?next.
 * Runs on the edge; verifies the JWT with jose.
 */
import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me-in-production"
);
const COOKIE = "na_session";

interface SessionClaims {
  role?: "guest" | "staff";
}

async function readSession(req: NextRequest): Promise<SessionClaims | null> {
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as SessionClaims;
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const session = await readSession(req);
  const isApi = pathname.startsWith("/api/");
  const needsStaff = pathname.startsWith("/ops") || pathname.startsWith("/api/ops");

  if (needsStaff && session?.role !== "staff") {
    if (isApi) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const url = req.nextUrl.clone();
    url.pathname = "/staff-login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/portal") && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Staff-only page + API areas, and the guest portal pages.
  matcher: ["/portal/:path*", "/ops/:path*", "/api/ops/:path*"],
};
