/**
 * Villa detail — design/04 §3.
 * Traceability (design/10 P3): UC-C1 · BPMN B1, B3 · product.product (x_facilities,
 * x_capacity) + villa.reservation availability · GET /api/villas/[slug], GET …/calendar
 */
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Bath, BedDouble, ConciergeBell, Star, Users, Waves } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { VillaCard } from "@/components/site/villa-card";
import { Reveal, Stagger, StaggerItem, Surface } from "@/components/motion";
import { reviews } from "@/lib/data";
import { getVilla, getVillas } from "@/lib/server/catalog";
import { getBookedRanges } from "@/lib/server/reservations";
import { BookingCard } from "./booking-card";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const villa = await getVilla((await params).slug);
  return { title: villa ? villa.name : "Villa" };
}

export default async function VillaDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const villa = await getVilla((await params).slug);
  if (!villa) notFound();

  const [all, bookedRanges] = await Promise.all([getVillas(), getBookedRanges(villa.id)]);
  const others = all.filter((v) => v.slug !== villa.slug && v.view === villa.view).slice(0, 3);
  const rituals = [
    "Check-in from 14:00 · check-out 12:00",
    "Welcome flower-water blessing on arrival (included)",
    "Nyepi — the island's Day of Silence — is observed fully; arrivals are not possible that day",
    "Your butler is one WhatsApp message away, 24/7",
  ];

  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />

      {/* Gallery mosaic — one arch tile per page (design/04 §3) */}
      <Surface className="container-na pt-8">
        <div className="grid gap-4 lg:grid-cols-5 lg:grid-rows-2">
          <div className="relative aspect-[4/3] overflow-hidden rounded-xl lg:col-span-3 lg:row-span-2 lg:aspect-auto">
            <Image
              src={villa.images[0]}
              alt={`${villa.name} — main view`}
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 60vw"
              className="object-cover"
            />
          </div>
          <div className="relative hidden overflow-hidden rounded-xl lg:col-span-2 lg:block">
            <Image
              src={villa.images[1]}
              alt={`${villa.name} — second view`}
              fill
              sizes="40vw"
              className="object-cover"
            />
          </div>
          <div className="rounded-arch relative hidden overflow-hidden lg:col-span-2 lg:block">
            <Image
              src={villa.images[2]}
              alt={`${villa.name} — detail view`}
              fill
              sizes="40vw"
              className="object-cover"
            />
            <span className="absolute right-3 bottom-3 rounded-full bg-forest-950/70 px-3 py-1.5 text-xs font-medium text-ivory-100 backdrop-blur-sm">
              View all 24 photos
            </span>
          </div>
        </div>
      </Surface>

      {/* Body — 7/5 editorial + sticky booking card */}
      <main className="container-na grid gap-12 py-12 lg:grid-cols-12 lg:py-16">
        <article className="lg:col-span-7">
          <p className="eyebrow">{villa.collection}</p>
          <h1 className="text-display-lg mt-3 text-teal-700">{villa.name}</h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-ink-700">
            <Star className="size-4 fill-amerta-400 text-amerta-400" aria-hidden />
            <span className="font-medium">{villa.rating}</span>
            <span className="text-stone-500">· {villa.reviewCount} reviews · Ubud, Bali</span>
          </p>

          <ul className="mt-8 flex flex-wrap gap-x-8 gap-y-4 border-y border-border py-6">
            {[
              { icon: Users, text: `${villa.capacity} guests` },
              { icon: BedDouble, text: `${villa.bedrooms} ${villa.bedrooms === 1 ? "bedroom" : "bedrooms"}` },
              { icon: Waves, text: "Private pool" },
              { icon: Bath, text: `${villa.sizeM2} m²` },
              { icon: ConciergeBell, text: "Personal butler" },
            ].map((f) => (
              <li key={f.text} className="flex items-center gap-2.5 text-sm text-ink-700">
                <f.icon className="size-5 text-palm-700" strokeWidth={1.5} aria-hidden />
                {f.text}
              </li>
            ))}
          </ul>

          <Reveal>
            <h2 className="text-display-sm mt-10 text-teal-700">The space</h2>
            <p className="mt-4 max-w-[68ch] text-lg leading-relaxed text-ink-700">{villa.description}</p>
          </Reveal>

          <Reveal>
            <h2 className="text-display-sm mt-12 text-teal-700">What surrounds you</h2>
            <ul className="mt-6 grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
              {villa.facilities.map((f) => (
                <li key={f} className="flex items-center gap-3 text-[15px] text-ink-700">
                  <span className="size-1 rounded-full bg-amerta-400" aria-hidden />
                  {f}
                </li>
              ))}
            </ul>
          </Reveal>

          <Reveal>
            <h2 className="text-display-sm mt-12 text-teal-700">House rituals</h2>
            <ul className="mt-6 space-y-3">
              {rituals.map((r) => (
                <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-ink-700">
                  <span className="font-display text-amerta-600">·</span>
                  {r}
                </li>
              ))}
            </ul>
          </Reveal>
        </article>

        <div className="lg:col-span-5">
          <BookingCard villa={villa} bookedRanges={bookedRanges} />
        </div>
      </main>

      {/* Reviews */}
      <section className="bg-ivory-200/60 py-20" aria-label="Guest reviews">
        <div className="container-na">
          <Reveal>
            <p className="eyebrow">Guest words</p>
            <h2 className="text-display-md mt-4 text-teal-700">
              {villa.rating} · {villa.reviewCount} stays remembered
            </h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <StaggerItem key={r.id}>
                <figure className="h-full rounded-lg bg-ivory-50 p-6 shadow-sm">
                  <blockquote className="text-[15px] leading-[1.7] text-ink-700">“{r.quote}”</blockquote>
                  <figcaption className="mt-5 text-[13px] font-medium text-ink-900">
                    {r.name} <span className="ml-2 font-normal text-stone-500">{r.date}</span>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* Comparison strip */}
      {others.length > 0 && (
        <section className="container-na py-20" aria-label="Other villas">
          <Reveal>
            <p className="eyebrow">Keep looking</p>
            <h2 className="text-display-md mt-4 text-teal-700">Other villas along the river</h2>
          </Reveal>
          <Stagger className="mt-10 grid gap-8 md:grid-cols-3">
            {others.map((v) => (
              <StaggerItem key={v.id}>
                <VillaCard villa={v} />
              </StaggerItem>
            ))}
          </Stagger>
        </section>
      )}

      <div className="pb-[72px] lg:pb-0">
        <Footer />
      </div>
    </>
  );
}
