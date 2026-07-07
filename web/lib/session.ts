/**
 * Session — signed JWT in an httpOnly cookie (jose). Used by route handlers,
 * server components, and (via jwtVerify) middleware.
 */
import "server-only";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.AUTH_SECRET || "dev-insecure-secret-change-me-in-production"
);
export const SESSION_COOKIE = "na_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface Session {
  uid: number; // partner id (guest) or user id (staff)
  email: string;
  name: string;
  role: "guest" | "staff";
  groups?: string[]; // Nadi role names for staff
}

export async function signSession(s: Session): Promise<string> {
  return new SignJWT({ ...s })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifySession(token: string): Promise<Session | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as Session;
  } catch {
    return null;
  }
}

export async function setSession(s: Session) {
  const token = await signSession(s);
  (await cookies()).set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE,
  });
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return token ? verifySession(token) : null;
}

export async function clearSession() {
  (await cookies()).delete(SESSION_COOKIE);
}

export { SECRET as SESSION_SECRET };
