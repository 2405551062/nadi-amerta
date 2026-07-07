/** GET /api/ops/exports/[type] — real CSV/PDF back-office exports (B12/B13/B14). */
import { bookingDocsCsv, marketingCsv, legalCsv, analyticsPdf, phrCsv } from "@/lib/server/exports";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, { params }: { params: Promise<{ type: string }> }) {
  const { type } = await params;
  const stamp = new Date().toISOString().slice(0, 10);

  try {
    if (type === "analytics") {
      const pdf = await analyticsPdf();
      return new Response(Buffer.from(pdf), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="Nadi-Amerta-Analytics-${stamp}.pdf"`,
        },
      });
    }
    const csv =
      type === "marketing" ? await marketingCsv()
      : type === "legal" ? await legalCsv()
      : type === "booking-docs" ? await bookingDocsCsv()
      : type === "phr" ? await phrCsv()
      : null;
    if (csv === null) return new Response("Unknown export", { status: 404 });
    return new Response(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="Nadi-Amerta-${type}-${stamp}.csv"`,
      },
    });
  } catch (err) {
    return new Response(`Export failed: ${(err as Error).message}`, { status: 500 });
  }
}
