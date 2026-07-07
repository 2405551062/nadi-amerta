/**
 * Services domain — product.template (x_kind=service) + villa.service.booking.
 * Traceability: UC-C5, BPMN B9.
 */
import "server-only";
import { searchRead, create } from "@/lib/odoo";
import { currentPartnerId } from "@/lib/server/util";
import { services as mockServices } from "@/lib/data";
import type { Service } from "@/lib/types";

const USE_ODOO = process.env.USE_ODOO === "true";

interface OdooService {
  id: number;
  name: string;
  x_slug: string | false;
  x_chapter: "Wellness" | "Journeys" | "Occasions" | false;
  x_duration: string | false;
  x_excerpt: string | false;
  list_price: number;
}

export async function getServices(): Promise<Service[]> {
  if (!USE_ODOO) return mockServices;
  try {
    const rows = await searchRead<OdooService>(
      "product.template",
      [["x_kind", "=", "service"]],
      ["name", "x_slug", "x_chapter", "x_duration", "x_excerpt", "list_price"],
      { order: "id" }
    );
    return rows.map((o) => {
      const preset = mockServices.find((s) => s.slug === o.x_slug);
      return {
        id: o.id,
        slug: o.x_slug || "",
        chapter: (o.x_chapter || "Wellness") as Service["chapter"],
        name: o.name,
        duration: o.x_duration || "",
        price: Math.round(o.list_price),
        description: preset?.description || o.x_excerpt || "",
        image: preset?.image,
      };
    });
  } catch (err) {
    console.error("[services] Odoo unreachable, using mock:", (err as Error).message);
    return mockServices;
  }
}

export interface BookServiceInput {
  serviceId: number;
  date?: string;
  slot?: string;
  persons?: number;
  billing?: "folio" | "now";
  notes?: string;
}

export async function bookService(input: BookServiceInput): Promise<number> {
  const pid = await currentPartnerId();
  return create("villa.service.booking", {
    partner_id: pid,
    product_id: input.serviceId,
    slot_date: input.date || false,
    slot_time: input.slot || false,
    persons: input.persons || 1,
    billing: input.billing || "folio",
    notes: input.notes || false,
  });
}
