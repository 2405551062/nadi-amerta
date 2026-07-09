/**
 * Villa catalog data-access — the pattern every domain follows (design/09 §2).
 *
 * Odoo is the source of truth for BUSINESS fields (price, capacity, status,
 * availability). Presentation-only assets not modelled in the ERP (photography,
 * editorial description, review scores) come from the frontend, keyed by slug —
 * a realistic split: marketing assets live with the site, not the ERP.
 *
 * If Odoo is unreachable or USE_ODOO=false, we fall back to the mock entirely,
 * so the UI keeps working offline.
 */
import "server-only";
import { searchRead } from "@/lib/odoo";
import { villas as mockVillas } from "@/lib/data";
import type { Villa, VillaStatus, VillaView } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

/** Raw shape returned by Odoo product.template search_read. */
interface OdooVilla {
  id: number;
  name: string;
  x_slug: string | false;
  x_villa_type: string | false;
  x_view: VillaView | false;
  x_bedrooms: number;
  x_capacity: number;
  x_size_m2: number;
  x_min_stay: number;
  x_availability: VillaStatus | false;
  x_excerpt: string | false;
  x_facilities: string | false;
  x_total_rooms: number;
  x_rooms_available_now: number;
  list_price: number;
}

const VILLA_FIELDS = [
  "name", "x_slug", "x_villa_type", "x_view", "x_bedrooms", "x_capacity",
  "x_size_m2", "x_min_stay", "x_availability", "x_excerpt", "x_facilities",
  "x_total_rooms", "x_rooms_available_now", "list_price",
];

/** Merge an Odoo villa with its presentation assets from the mock (by slug). */
function toVilla(o: OdooVilla): Villa {
  const slug = o.x_slug || "";
  const preset = mockVillas.find((v) => v.slug === slug);
  return {
    id: o.id,
    slug,
    name: o.name,
    collection: o.x_villa_type || preset?.collection || "",
    view: (o.x_view || preset?.view || "garden") as VillaView,
    bedrooms: o.x_bedrooms,
    capacity: o.x_capacity,
    sizeM2: o.x_size_m2,
    priceNight: Math.round(o.list_price),
    status: (o.x_availability || "available") as VillaStatus,
    roomsTotal: o.x_total_rooms || 1,
    roomsAvailableNow: o.x_rooms_available_now ?? o.x_total_rooms ?? 1,
    minStay: o.x_min_stay || 2,
    excerpt: o.x_excerpt || preset?.excerpt || "",
    facilities: o.x_facilities
      ? o.x_facilities.split("\n").map((s) => s.trim()).filter(Boolean)
      : preset?.facilities || [],
    // presentation-only — sourced from the frontend
    description: preset?.description || o.x_excerpt || "",
    image: preset?.image || "/photos/villa-1.webp",
    images: preset?.images || ["/photos/villa-1.webp"],
    rating: preset?.rating ?? 4.8,
    reviewCount: preset?.reviewCount ?? 0,
    currentGuest: preset?.currentGuest,
  };
}

export interface VillaQuery {
  view?: string;
  bedrooms?: string;
  guests?: number;
}

export async function getVillas(q: VillaQuery = {}): Promise<Villa[]> {
  let list: Villa[];

  if (USE_ODOO) {
    try {
      const domain: unknown[] = [["x_kind", "=", "villa"]];
      const rows = await searchRead<OdooVilla>("product.template", domain, VILLA_FIELDS, {
        order: "list_price asc",
      });
      list = rows.map(toVilla);
    } catch (err) {
      console.error("[catalog] Odoo unreachable, using mock villas:", (err as Error).message);
      list = mockVillas;
    }
  } else {
    list = mockVillas;
  }

  // Filters applied in the BFF (mirrors the mock server component logic)
  return list
    .filter((v) => (q.guests ? v.capacity >= q.guests : true))
    .filter((v) => (q.view && q.view !== "any" ? v.view === q.view : true))
    .filter((v) =>
      q.bedrooms && q.bedrooms !== "any"
        ? q.bedrooms === "3"
          ? v.bedrooms >= 3
          : v.bedrooms === Number(q.bedrooms)
        : true
    );
}

/** Map of Odoo product.template id → Villa, for joining reservations/tasks/etc. */
export async function getVillaMap(): Promise<Map<number, Villa>> {
  const list = await getVillas();
  return new Map(list.map((v) => [v.id, v]));
}

/** Map of slug → Villa (for resolving a booking's villa by slug). */
export async function getVillaBySlugMap(): Promise<Map<string, Villa>> {
  const list = await getVillas();
  return new Map(list.map((v) => [v.slug, v]));
}

export async function getVilla(slug: string): Promise<Villa | null> {
  if (USE_ODOO) {
    try {
      const rows = await searchRead<OdooVilla>(
        "product.template",
        [["x_kind", "=", "villa"], ["x_slug", "=", slug]],
        VILLA_FIELDS,
        { limit: 1 }
      );
      if (rows.length) return toVilla(rows[0]);
    } catch (err) {
      console.error("[catalog] Odoo unreachable, using mock villa:", (err as Error).message);
    }
  }
  return mockVillas.find((v) => v.slug === slug) ?? null;
}
