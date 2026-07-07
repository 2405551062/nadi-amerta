/**
 * Guest dashboard — design/06 §1 (render: design/assets/tirta-guest-dashboard.png).
 * Traceability (design/10 P7): UC-C2, UC-C5 · BPMN B5, B9 ·
 * villa.reservation + sale.order · GET /api/stays?scope=upcoming
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Car, Flower2, UtensilsCrossed } from "lucide-react";
import { JourneyTimeline } from "@/components/journey-timeline";
import { Reveal, Stagger, StaggerItem, Surface } from "@/components/motion";
import { StatusBadge } from "@/components/status-badge";
import { idr, formatRange } from "@/lib/format";
import { buildJourney, journeyMonth } from "@/lib/journey";
import { getStays } from "@/lib/server/reservations";
import { getVilla, getVillaBySlugMap } from "@/lib/server/catalog";
import { getProfile } from "@/lib/server/profile";

export const metadata: Metadata = { title: "My stays" };

function daysUntil(dateLabel: string): number {
  const target = new Date(dateLabel);
  if (isNaN(target.getTime())) return 0;
  return Math.max(0, Math.ceil((target.getTime() - Date.now()) / 86_400_000));
}

const SHORTCUTS = [
  {
    icon: UtensilsCrossed,
    image: "/photos/dining.webp",
    title: "In-Villa Dining",
    body: "Chef Ketut's kitchen, served on your riverside deck.",
    href: "/portal/dining",
  },
  {
    icon: Flower2,
    image: "/photos/spa.webp",
    title: "Spa Rituals",
    body: "River stone, sandalwood, and five hundred frangipani.",
    href: "/portal/services",
  },
  {
    icon: Car,
    image: "/photos/villa-2.webp",
    title: "Airport Transfer",
    body: "We track the flight; you just land.",
    href: "/portal/services",
  },
];

export default async function PortalDashboard() {
  const [upcomingList, pastList, profile] = await Promise.all([
    getStays("upcoming"),
    getStays("past"),
    getProfile(),
  ]);
  const upcoming = upcomingList.find((r) => r.state === "confirmed") ?? upcomingList[0];
  const villa = upcoming ? await getVilla(upcoming.villaSlug) : undefined;
  const past = pastList.slice(0, 2);
  const countdown = upcoming ? daysUntil(upcoming.checkIn) : 0;
  const villaMap = await getVillaBySlugMap();

  return (
    <>
      {/* Hero band — forest, glass stay card (design/06 §1.1) */}
      <section className="theme-forest relative overflow-hidden bg-forest-900 text-ivory-100">
        <Image
          src="/photos/hero-dusk.webp"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover opacity-50"
        />
        <div
          className="absolute inset-0 bg-gradient-to-r from-forest-950/80 via-forest-950/40 to-transparent"
          aria-hidden
        />
        <div className="relative container-na py-16 lg:py-20">
          <Surface>
            <h1 className="text-display-md text-ivory-50">
              Welcome back, {profile.name.split(" ")[0]}
            </h1>

            {upcoming && villa ? (
              <div className="glass-dark mt-8 inline-block min-w-[300px] rounded-lg p-6">
                <p className="font-display text-xl text-ivory-50">
                  {villa.name} · {formatRange(upcoming.checkIn, upcoming.checkOut)}
                </p>
                <div aria-hidden className="my-4 h-px w-full bg-amerta-300/30" />
                <p className="font-display text-2xl text-amerta-300">
                  {countdown > 0 ? `${countdown} days until Bali` : "Your stay is here"}
                </p>
                <Link
                  href={`/stays/${upcoming.code}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-amerta-300 underline-offset-4 hover:underline"
                >
                  Manage reservation <ArrowRight className="size-4" aria-hidden />
                </Link>
              </div>
            ) : (
              <div className="glass-dark mt-8 inline-block rounded-lg p-6">
                <p className="font-display text-xl text-ivory-50">The river has missed you.</p>
                <Link
                  href="/villas"
                  className="mt-4 inline-flex h-11 items-center rounded-md bg-ivory-100 px-6 text-sm font-medium text-forest-900 hover:bg-ivory-200"
                >
                  Find your dates
                </Link>
              </div>
            )}
          </Surface>
        </div>
      </section>

      <div className="container-na grid gap-12 py-12 lg:grid-cols-12 lg:py-16">
        <div className="space-y-12 lg:col-span-8">
          {/* Service shortcuts — left-aligned editorial cards (design/00 §3 correction) */}
          <section aria-labelledby="shortcuts-title">
            <h2 id="shortcuts-title" className="text-display-sm text-teal-700">
              For your stay
            </h2>
            <Stagger className="mt-6 grid gap-5 sm:grid-cols-3">
              {SHORTCUTS.map((s) => (
                <StaggerItem key={s.title}>
                  <Link
                    href={s.href}
                    className="group flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div className="relative aspect-[3/2] overflow-hidden">
                      <Image
                        src={s.image}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 100vw, 33vw"
                        className="object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>
                    <div className="flex flex-1 flex-col p-5">
                      <h3 className="font-display text-lg text-teal-700">{s.title}</h3>
                      <p className="mt-1 flex-1 text-[13px] leading-snug text-stone-500">{s.body}</p>
                      <span className="mt-3 flex items-center gap-1 text-[13px] font-medium text-palm-700">
                        Arrange <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" aria-hidden />
                      </span>
                    </div>
                  </Link>
                </StaggerItem>
              ))}
            </Stagger>
          </section>

          {/* Past stays */}
          <section aria-labelledby="past-title">
            <div className="flex items-end justify-between">
              <h2 id="past-title" className="text-display-sm text-teal-700">
                Stays remembered
              </h2>
              <Link
                href="/portal/stays"
                className="text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
              >
                All reservations
              </Link>
            </div>
            <div className="mt-6 space-y-4">
              {past.map((r) => {
                const v = villaMap.get(r.villaSlug);
                if (!v) return null;
                return (
                  <Reveal key={r.id}>
                    <div className="flex items-center gap-5 rounded-lg bg-card p-4 shadow-sm">
                      <div className="relative size-16 shrink-0 overflow-hidden rounded-md">
                        <Image src={v.image} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1">
                        <p className="font-display text-lg text-teal-700">{v.name}</p>
                        <p className="text-[13px] text-stone-500">
                          {formatRange(r.checkIn, r.checkOut)} · {idr(r.total)}
                        </p>
                      </div>
                      <StatusBadge status={r.state} />
                      <Link
                        href={`/book/${v.slug}`}
                        className="hidden text-sm font-medium text-teal-700 underline-offset-4 hover:underline sm:block"
                      >
                        Book again
                      </Link>
                    </div>
                  </Reveal>
                );
              })}
            </div>
          </section>
        </div>

        {/* Journey rail — built from the guest's real upcoming reservation */}
        <aside className="lg:col-span-4">
          <Reveal>
            <div className="rounded-lg bg-card p-6 shadow-sm">
              <p className="eyebrow">Your journey</p>
              {upcoming && villa ? (
                <>
                  <h2 className="text-display-sm mt-3 mb-6 text-teal-700">
                    {villa.name}
                    {journeyMonth(upcoming) ? ` · ${journeyMonth(upcoming)}` : ""}
                  </h2>
                  <JourneyTimeline steps={buildJourney(upcoming, villa.name)} />
                </>
              ) : (
                <>
                  <h2 className="text-display-sm mt-3 mb-3 text-teal-700">No journey yet</h2>
                  <p className="text-sm leading-relaxed text-stone-500">
                    When you reserve a villa, your arrival journey — payment, rituals and
                    check-in — will unfold here.
                  </p>
                  <Link
                    href="/villas"
                    className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
                  >
                    Explore the villas <ArrowRight className="size-4" aria-hidden />
                  </Link>
                </>
              )}
            </div>
          </Reveal>
        </aside>
      </div>
    </>
  );
}
