/** Branded PDF invoice generator (pdf-lib) — real downloadable file. */
import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export interface InvoicePdfData {
  number: string;
  date: string;
  guestName: string;
  guestEmail?: string;
  villaName: string;
  code: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  priceNight: number;
  subtotal: number;
  phr: number;
  service: number;
  total: number;
  method?: string;
  reference?: string;
  status: string;
}

const idr = (n: number) => "IDR " + n.toLocaleString("en-US");

export async function buildInvoicePdf(d: InvoicePdfData): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([595, 842]); // A4
  const serif = await doc.embedFont(StandardFonts.TimesRoman);
  const serifBold = await doc.embedFont(StandardFonts.TimesRomanBold);
  const sans = await doc.embedFont(StandardFonts.Helvetica);

  const ink = rgb(0.16, 0.15, 0.13);
  const teal = rgb(0.17, 0.29, 0.32);
  const gold = rgb(0.79, 0.66, 0.38);
  const stone = rgb(0.55, 0.51, 0.46);
  const M = 56;
  let y = 786;

  const text = (
    s: string, x: number, yy: number,
    opts: { font?: typeof serif; size?: number; color?: typeof ink } = {}
  ) => page.drawText(s, { x, y: yy, font: opts.font ?? sans, size: opts.size ?? 10, color: opts.color ?? ink });

  // Header
  text("NADI AMERTA", M, y, { font: serifBold, size: 22, color: teal });
  text("Villa & Retreat · Ubud, Bali", M, y - 18, { size: 9, color: stone });
  text("INVOICE", 595 - M - 90, y, { font: serifBold, size: 18, color: ink });
  text(d.number, 595 - M - 90, y - 18, { font: sans, size: 10, color: stone });
  y -= 24;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 1, color: gold });
  y -= 34;

  // Bill-to + meta
  text("BILLED TO", M, y, { size: 8, color: stone });
  text("STAY", 320, y, { size: 8, color: stone });
  y -= 15;
  text(d.guestName, M, y, { font: serifBold, size: 12, color: ink });
  text(`${d.villaName}`, 320, y, { font: serifBold, size: 12, color: ink });
  y -= 14;
  if (d.guestEmail) text(d.guestEmail, M, y, { size: 9, color: stone });
  text(`${d.checkIn} — ${d.checkOut}`, 320, y, { size: 9, color: stone });
  y -= 13;
  text(`Booking ${d.code}`, 320, y, { size: 9, color: stone });
  text(`Issued ${d.date}`, M, y, { size: 9, color: stone });
  y -= 34;

  // Line items table
  const rowsX = { desc: M, qty: 330, amt: 595 - M };
  text("DESCRIPTION", rowsX.desc, y, { size: 8, color: stone });
  text("DETAIL", rowsX.qty, y, { size: 8, color: stone });
  page.drawText("AMOUNT", { x: rowsX.amt - sans.widthOfTextAtSize("AMOUNT", 8), y, font: sans, size: 8, color: stone });
  y -= 8;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 0.5, color: rgb(0.9, 0.88, 0.82) });
  y -= 18;

  const line = (desc: string, detail: string, amount: number, bold = false) => {
    const f = bold ? serifBold : serif;
    text(desc, rowsX.desc, y, { font: f, size: 11, color: ink });
    text(detail, rowsX.qty, y, { font: sans, size: 9, color: stone });
    const a = idr(amount);
    page.drawText(a, { x: rowsX.amt - f.widthOfTextAtSize(a, 11), y, font: f, size: 11, color: ink });
    y -= 22;
  };

  line(d.villaName, `${idr(d.priceNight)} × ${d.nights} nights`, d.subtotal);
  line("PHR tax (Pajak Hotel & Restoran)", "10%", d.phr);
  line("Service charge", "8%", d.service);
  y -= 4;
  page.drawLine({ start: { x: M, y }, end: { x: 595 - M, y }, thickness: 0.5, color: rgb(0.9, 0.88, 0.82) });
  y -= 22;
  line("Total", d.status === "paid" ? "Paid in full" : d.status, d.total, true);

  // Payment meta
  y -= 20;
  if (d.method) text(`Payment method: ${d.method}`, M, y, { size: 9, color: stone });
  if (d.reference) text(`Reference: ${d.reference}`, M, y - 13, { size: 9, color: stone });

  // Footer
  text("PHR 10% and service 8% are included above, per Bali regulation.", M, 92, { size: 8, color: stone });
  text("The Nadi Amerta · Banjar Pengosekan, Ubud, Bali · NPWP 12.345.678.9-901.000", M, 78, { size: 8, color: stone });
  text("Thank you for staying by the river.", M, 60, { font: serif, size: 10, color: teal });

  return doc.save();
}
