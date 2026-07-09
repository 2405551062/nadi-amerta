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
  groups?: string[];
}

// Note #6 — each ops console requires a specific Nadi role group.
const OPS_ROLE: [string, string][] = [
  ["/ops/reception", "Front Office"],
  ["/ops/housekeeping", "Housekeeping"], // also covers /ops/housekeeping/inventory
  ["/ops/fnb", "Food & Beverage"],
  ["/ops/finance", "Finance"],
  ["/ops/backoffice", "Back Office"],
];

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

  // Note #6 — a signed-in staffer may only open the consoles their role allows.
  // GM (all groups) sees everything; unknown/empty groups fall through (dev safety).
  if (needsStaff && !isApi && session?.role === "staff") {
    const groups = session.groups ?? [];
    if (groups.length && !groups.includes("General Manager")) {
      const match = OPS_ROLE.find(([p]) => pathname.startsWith(p));
      if (match && !groups.includes(match[1])) {
        const url = req.nextUrl.clone();
        url.pathname = "/ops"; // bounce to their dashboard
        return NextResponse.redirect(url);
      }
    }
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
