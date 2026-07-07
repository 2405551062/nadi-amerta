/** GET /api/invoices/[code]/pdf — real branded PDF invoice for a reservation. */
import { getStayByCode } from "@/lib/server/reservations";
import { getVilla } from "@/lib/server/catalog";
import { buildInvoicePdf } from "@/lib/server/invoice-pdf";
import { quote } from "@/lib/format";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  const stay = await getStayByCode(decodeURIComponent(code));
  if (!stay) return new Response("Not found", { status: 404 });
  const villa = await getVilla(stay.villaSlug);
  const price = villa?.priceNight ?? Math.round(stay.total / (stay.nights || 1) / 1.18);
  const q = quote(price, stay.nights);

  const pdf = await buildInvoicePdf({
    number: `INV/${stay.code}`,
    date: stay.checkOut,
    guestName: stay.guestName,
    villaName: villa?.name ?? stay.villaSlug,
    code: stay.code,
    checkIn: stay.checkIn,
    checkOut: stay.checkOut,
    nights: stay.nights,
    priceNight: price,
    subtotal: q.subtotal,
    phr: q.phr,
    service: q.service,
    total: q.total,
    status: stay.state === "cancelled" ? "refunded" : stay.balance > 0 ? "balance due" : "paid",
    reference: stay.code,
  });

  return new Response(Buffer.from(pdf), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="Nadi-Amerta-${stay.code}.pdf"`,
    },
  });
}
