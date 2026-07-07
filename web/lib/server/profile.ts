/**
 * Profile domain — res.partner (ERD). Reads/writes the current guest.
 * Traceability: UC-C (CRM), design/10 P13.
 */
import "server-only";
import { searchRead, write } from "@/lib/odoo";
import { currentPartnerId } from "@/lib/server/util";

const USE_ODOO = process.env.USE_ODOO === "true";

export interface Profile {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  passport: string;
  dietary: string[];
  arrivalDrink: string;
  tier: string;
}

const DEFAULT: Profile = {
  id: 0,
  name: "Amara Chen",
  email: "amara@example.com",
  phone: "+65 9123 4567",
  country: "Singaporean",
  passport: "",
  dietary: ["Gluten-free"],
  arrivalDrink: "Young coconut",
  tier: "gold",
};

export async function getProfile(): Promise<Profile> {
  if (!USE_ODOO) return DEFAULT;
  const pid = await currentPartnerId();
  if (!pid) return DEFAULT;
  const rows = await searchRead<{
    id: number;
    name: string;
    email: string | false;
    phone: string | false;
    x_nationality: string | false;
    x_nik_paspor: string | false;
    x_dietary: string | false;
    x_arrival_drink: string | false;
    x_loyalty_tier: string | false;
  }>("res.partner", [["id", "=", pid]], [
    "name", "email", "phone", "x_nationality", "x_nik_paspor", "x_dietary", "x_arrival_drink", "x_loyalty_tier",
  ]);
  const p = rows[0];
  if (!p) return DEFAULT;
  return {
    id: p.id,
    name: p.name,
    email: p.email || "",
    phone: p.phone || "",
    country: p.x_nationality || "",
    passport: p.x_nik_paspor || "",
    dietary: p.x_dietary ? p.x_dietary.split(",").map((s) => s.trim()) : [],
    arrivalDrink: p.x_arrival_drink || "",
    tier: p.x_loyalty_tier || "standard",
  };
}

export interface ProfilePatch {
  name?: string;
  email?: string;
  phone?: string;
  country?: string;
  passport?: string;
  dietary?: string[];
  arrivalDrink?: string;
}

export async function updateProfile(patch: ProfilePatch): Promise<boolean> {
  const pid = await currentPartnerId();
  if (!pid) return false;
  const vals: Record<string, unknown> = {};
  if (patch.name !== undefined) vals.name = patch.name;
  if (patch.email !== undefined) vals.email = patch.email;
  if (patch.phone !== undefined) vals.phone = patch.phone;
  if (patch.country !== undefined) vals.x_nationality = patch.country;
  if (patch.passport !== undefined) vals.x_nik_paspor = patch.passport;
  if (patch.dietary !== undefined) vals.x_dietary = patch.dietary.join(", ");
  if (patch.arrivalDrink !== undefined) vals.x_arrival_drink = patch.arrivalDrink;
  return write("res.partner", [pid], vals);
}
