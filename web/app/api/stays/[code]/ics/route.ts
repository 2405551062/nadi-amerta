/**
 * GET /api/stays/[code]/ics — download the stay as a calendar event (.ics).
 * All-day VEVENT from check-in to check-out (DTEND exclusive = departure day).
 */
import { getStayByCode } from "@/lib/server/reservations";
import { getVilla } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

function icsDate(label: string): string {
  const d = new Date(label);
  if (isNaN(d.getTime())) return "";
  // Use local calendar components — toISOString() would shift the day in +hh zones.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}${m}${day}`;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const { code } = await params;
  const stay = await getStayByCode(decodeURIComponent(code));
  if (!stay) return new Response("Not found", { status: 404 });
  const villa = await getVilla(stay.villaSlug);
  const name = villa?.name ?? "The Nadi Amerta stay";
  const start = icsDate(stay.checkIn);
  const end = icsDate(stay.checkOut);
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Nadi Amerta//Reservations//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${stay.code}@nadiamerta`,
    `DTSTAMP:${stamp}`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:The Nadi Amerta — ${name}`,
    `DESCRIPTION:Reservation ${stay.code}. Check-in from 14:00\\, Ubud\\, Bali.`,
    "LOCATION:The Nadi Amerta Villa & Retreat\\, Banjar Pengosekan\\, Ubud\\, Bali",
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return new Response(lines.join("\r\n"), {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="nadi-amerta-${stay.code}.ics"`,
    },
  });
}
