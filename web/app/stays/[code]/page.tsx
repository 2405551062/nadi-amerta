/**
 * Reservation confirmation & pre-arrival hub — design/05 §5.
 * Traceability (design/10 P5): UC-C2, UC-C3 (pre-check-in) · BPMN B5, B6, B12 ·
 * villa.reservation + sale.order + account.move · GET /api/stays/[code], POST …/precheckin
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { CalendarPlus, Download, MessageCircle, Upload } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { JourneyTimeline } from "@/components/journey-timeline";
import { LotusMark } from "@/components/site/lotus-mark";
import { Dawn, Reveal } from "@/components/motion";
import { CopyChip } from "./copy-chip";
import { notFound } from "next/navigation";
import { idr, formatRange, quote } from "@/lib/format";
import { buildJourney } from "@/lib/journey";
import { getStayByCode } from "@/lib/server/reservations";
import { getVilla } from "@/lib/server/catalog";
import { getServices } from "@/lib/server/services";

export const metadata: Metadata = { title: "Your reservation" };
export const dynamic = "force-dynamic";

export default async function StayPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const stay = await getStayByCode(decodeURIComponent(code));
  if (!stay) notFound();
  const villa = await getVilla(stay.villaSlug);
  if (!villa) notFound();
  const q = quote(villa.priceNight, stay.nights);

  const crossSell = (await getServices()).filter((s) => s.chapter === "Occasions").slice(0, 2);

  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />

      {/* Hero band — seal → headline → code (design/05 §5.1) */}
      <section className="theme-forest bg-forest-900 py-20 text-center text-ivory-100">
        <div className="container-na flex flex-col items-center">
          <Dawn>
            <LotusMark className="size-20" />
          </Dawn>
          <Dawn delay={0.3}>
            <h1 className="text-display-lg mt-8 text-ivory-50">Your sanctuary is reserved.</h1>
          </Dawn>
          <Dawn delay={0.55}>
            <div
              aria-hidden
              className="mx-auto mt-6 h-px w-40 bg-gradient-to-r from-amerta-300/0 via-amerta-300 to-amerta-300/0"
            />
          </Dawn>
          <Dawn delay={0.7}>
            <CopyChip code={stay.code} />
          </Dawn>
        </div>
      </section>

      <main className="container-na grid gap-12 py-16 lg:grid-cols-12">
        <div className="space-y-10 lg:col-span-7">
          {/* Stay card — the page's single arch */}
          <Reveal>
            <div className="flex flex-col gap-6 rounded-lg bg-card p-6 shadow-md sm:flex-row sm:items-center">
              <div className="rounded-arch relative mx-auto h-36 w-28 shrink-0 overflow-hidden sm:mx-0">
                <Image src={villa.image} alt={villa.name} fill sizes="112px" className="object-cover" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-display-sm text-teal-700">{villa.name}</h2>
                {stay.paymentState && stay.paymentState !== "unpaid" && (
                  <span
                    className={`mt-2 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-medium ${
                      stay.paymentState === "pending"
                        ? "bg-amber-100 text-amber-800"
                        : "bg-sage-300/25 text-palm-700"
                    }`}
                  >
                    <span aria-hidden className="size-1.5 rounded-full bg-current" />
                    {stay.paymentState === "paid" && "Paid in full"}
                    {stay.paymentState === "deposit" && "Deposit paid"}
                    {stay.paymentState === "pending" && "Payment pending"}
                    {stay.paidAmount ? ` · ${idr(stay.paidAmount)}` : ""}
                  </span>
                )}
                <p className="mt-1 text-sm text-ink-700">
                  {formatRange(stay.checkIn, stay.checkOut)} · {stay.nights} nights · {stay.guests} guests
                </p>
                <p className="mt-1 text-[13px] text-stone-500">Check-in from 14:00 · your butler meets you at the gate</p>
                <div className="mt-4 flex flex-wrap justify-center gap-3 sm:justify-start">
                  <a
                    href={`/api/stays/${encodeURIComponent(stay.code)}/ics`}
                    className="flex h-10 items-center gap-2 rounded-md border border-sand-400 bg-white px-4 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700"
                  >
                    <CalendarPlus className="size-4" aria-hidden /> Add to calendar
                  </a>
                  <a
                    href="https://wa.me/628113800108"
                    className="flex h-10 items-center gap-2 rounded-md border border-sand-400 bg-white px-4 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700"
                  >
                    <MessageCircle className="size-4" aria-hidden /> WhatsApp concierge
                  </a>
                </div>
              </div>
            </div>
          </Reveal>

          {/* Pre-check-in — UC-C3 / B6-B7 accelerator */}
          <Reveal>
            <div className="rounded-lg border border-dashed border-amerta-400/50 bg-ivory-50 p-6">
              <h3 className="font-display text-xl text-teal-700">Breeze through arrival</h3>
              <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-700">
                Have a photo of each guest&apos;s passport or ID ready, and your check-in on{" "}
                {stay.checkIn.split(",")[0]} becomes a signature and a welcome drink — nothing more.
              </p>
              <button
                disabled
                title="Online document upload is coming soon"
                className="mt-4 flex h-11 cursor-not-allowed items-center gap-2 rounded-md bg-palm-700/40 px-5 text-sm font-medium text-ivory-50"
              >
                <Upload className="size-4" aria-hidden /> Upload travel documents
                <span className="ml-1 rounded-full bg-ivory-50/20 px-2 py-0.5 text-[11px] font-medium">
                  Soon
                </span>
              </button>
            </div>
          </Reveal>

          {/* Receipt — B12 documentation for the guest */}
          <Reveal>
            <Accordion type="single" collapsible className="rounded-lg bg-card px-6 shadow-sm">
              <AccordionItem value="receipt" className="border-none">
                <AccordionTrigger className="py-5 text-base font-medium text-ink-900 hover:no-underline">
                  Receipt & line items
                </AccordionTrigger>
                <AccordionContent className="pb-6">
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between text-ink-700">
                      <dt>
                        {idr(villa.priceNight)} × {stay.nights} nights
                      </dt>
                      <dd className="font-mono text-[13px]">{idr(q.subtotal)}</dd>
                    </div>
                    <div className="flex justify-between text-ink-700">
                      <dt>PHR tax 10%</dt>
                      <dd className="font-mono text-[13px]">{idr(q.phr)}</dd>
                    </div>
                    <div className="flex justify-between text-ink-700">
                      <dt>Service 8%</dt>
                      <dd className="font-mono text-[13px]">{idr(q.service)}</dd>
                    </div>
                    <div className="flex items-baseline justify-between border-t border-border pt-3">
                      <dt className="font-display text-lg text-ink-900">Paid</dt>
                      <dd className="text-price text-teal-700">{idr(q.total)}</dd>
                    </div>
                  </dl>
                  <Link
                    href={`/api/invoices/${encodeURIComponent(stay.code)}/pdf`}
                    target="_blank"
                    className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
                  >
                    <Download className="size-4" aria-hidden /> Download invoice (PDF)
                  </Link>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Reveal>

          {/* Cross-sell — soft, after everything functional */}
          <Reveal>
            <h3 className="font-display text-xl text-teal-700">While the river waits for you</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {crossSell.map((s) => (
                <Link
                  key={s.id}
                  href="/portal/services"
                  className="group flex gap-4 rounded-lg bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                >
                  <div className="relative size-20 shrink-0 overflow-hidden rounded-md">
                    <Image src={s.image ?? villa.image} alt="" fill sizes="80px" className="object-cover transition-transform duration-700 group-hover:scale-105" />
                  </div>
                  <div>
                    <p className="font-display text-lg text-teal-700">{s.name}</p>
                    <p className="mt-0.5 text-[13px] text-stone-500">
                      {s.duration} · {s.price === 0 ? "Included" : idr(s.price)}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </Reveal>
        </div>

        {/* Journey rail — teaches the portal metaphor */}
        <aside className="lg:col-span-4 lg:col-start-9">
          <Reveal>
            <div className="rounded-lg bg-card p-6 shadow-sm lg:sticky lg:top-24">
              <p className="eyebrow">Before you arrive</p>
              <h3 className="text-display-sm mt-3 mb-6 text-teal-700">Your journey</h3>
              <JourneyTimeline steps={buildJourney(stay, villa.name)} />
              <Link
                href="/portal"
                className="mt-6 block rounded-md bg-palm-700 py-3 text-center text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
              >
                Open your guest portal
              </Link>
            </div>
          </Reveal>
        </aside>
      </main>

      <Footer />
    </>
  );
}
