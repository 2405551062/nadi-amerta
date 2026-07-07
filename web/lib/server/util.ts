/** Shared BFF helpers: date formatting + current-guest resolution. */
import "server-only";
import { searchRead } from "@/lib/odoo";

/** Odoo date "2026-08-12" → "Aug 12, 2026" (the frontend's display format). */
export function fmtOdooDate(iso: string | false): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

/** Odoo many2one value: [id, "Name"] | false → id | null */
export function m2oId(v: unknown): number | null {
  return Array.isArray(v) ? (v[0] as number) : null;
}
export function m2oName(v: unknown): string {
  return Array.isArray(v) ? (v[1] as string) : "";
}

/**
 * The logged-in guest's partner id, from the session (design/04 §8).
 * Guest sessions carry the partner id directly. If no session exists and
 * AUTH_DEV_FALLBACK=true, fall back to the demo guest Amara so the portal is
 * still browsable in dev without signing in.
 */
export async function currentPartnerId(): Promise<number | null> {
  const { getSession } = await import("@/lib/session");
  const session = await getSession();
  if (session?.role === "guest") return session.uid;

  if (process.env.AUTH_DEV_FALLBACK === "true") {
    const rows = await searchRead<{ id: number }>(
      "res.partner",
      [["email", "=", "amara@example.com"]],
      ["id"],
      { limit: 1 }
    );
    return rows[0]?.id ?? null;
  }
  return null;
}

export interface PartnerInfo {
  name: string;
  country: string;
  vip: boolean;
}

/** Batch-read partner name/nationality/tier for joining onto reservations. */
export async function partnerMap(ids: number[]): Promise<Map<number, PartnerInfo>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (!unique.length) return new Map();
  const rows = await searchRead<{
    id: number;
    name: string;
    x_nationality: string | false;
    x_loyalty_tier: string | false;
  }>("res.partner", [["id", "in", unique]], ["name", "x_nationality", "x_loyalty_tier"]);
  return new Map(
    rows.map((r) => [
      r.id,
      { name: r.name, country: r.x_nationality || "", vip: r.x_loyalty_tier === "platinum" },
    ])
  );
}
