/**
 * Landing — design/04 §1.
 * Traceability (design/10 P1): UC-C1 entry · BPMN B1 (online) · product.product · GET /api/villas
 */
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { BookingBar } from "@/components/site/booking-bar";
import { VillaCard } from "@/components/site/villa-card";
import { SectionHeading } from "@/components/site/section-heading";
import { ParallaxImage } from "@/components/site/parallax";
import { Dawn, Reveal, Stagger, StaggerItem } from "@/components/motion";
import { reviews } from "@/lib/data";
import { getVillas } from "@/lib/server/catalog";

export const dynamic = "force-dynamic";

const MOVEMENTS = [
  {
    numeral: "i.",
    title: "Arrival",
    body: "A welcome flower-water blessing on the riverbank. Your butler walks you through the gardens — every villa has its own gate, its own pool, its own sky.",
  },
  {
    numeral: "ii.",
    title: "Stay",
    body: "Sunrise yoga over the gorge. Riverside dining curated by Chef Ketut. Spa rituals with Ubud-grown sandalwood and frangipani.",
  },
  {
    numeral: "iii.",
    title: "Farewell",
    body: "A handwritten note. A pressed frangipani. A morning ritual that turns guests into family — and brings them back next season.",
  },
];

export default async function LandingPage() {
  const featured = (await getVillas()).slice(0, 4);

  return (
    <>
      <Navbar overHero />

      {/* ============ Hero — "Dawn" entrance (motion §2.2) ============ */}
      <section className="relative flex min-h-svh flex-col justify-between" aria-label="Welcome">
        <Image
          src="/photos/hero-gorge.webp"
          alt="Infinity pool overlooking the misty Ayung gorge at dawn"
          fill
          priority
          fetchPriority="high"
          sizes="100vw"
          className="object-cover"
        />
        <div className="overlay-hero absolute inset-0" aria-hidden />

        <div className="relative flex flex-1 flex-col items-center justify-center px-6 pt-28 text-center text-ivory-100">
          <Dawn delay={0.2}>
            <p className="eyebrow-dark eyebrow">Boutique Villa &amp; Retreat · Ubud, Bali</p>
          </Dawn>
          <Dawn delay={0.35}>
            <h1 className="text-display-xl mt-6 max-w-5xl text-ivory-50">
              Where flowing waters
              <br />
              meet <em className="italic">sacred</em> ground
            </h1>
          </Dawn>
          <Dawn delay={0.5}>
            <p className="mt-6 max-w-xl text-lg text-ivory-100/80">
              Eight private pool villas on a riverside ridge — the river of
              immortal nectar, flowing through everything we do.
            </p>
          </Dawn>
        </div>

        <div className="relative px-6 pb-10">
          <Dawn delay={0.7}>
            <BookingBar />
          </Dawn>
          <div
            aria-hidden
            className="mx-auto mt-8 h-12 w-px bg-gradient-to-b from-amerta-300/0 via-amerta-300 to-amerta-300/0 motion-safe:animate-pulse"
          />
        </div>
      </section>

      {/* ============ Introduction ============ */}
      <section className="container-na grid gap-10 py-24 lg:grid-cols-12 lg:py-40">
        <div className="lg:col-span-6">
          <SectionHeading
            eyebrow="The estate"
            title="Eight villas. One river. Nothing else for miles."
          />
        </div>
        <Reveal className="lg:col-span-5 lg:col-start-8" delay={0.15}>
          <p className="max-w-[68ch] text-lg leading-relaxed text-ink-700">
            The Nadi Amerta sits on twelve hectares of riverside ridge above the
            Ayung, in the artists&apos; banjar of Pengosekan. Every detail honours
            the Tri Hita Karana philosophy — harmony with the divine, with
            nature, and with one another.
          </p>
          <Link
            href="/about"
            className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-teal-700 underline-offset-4 hover:underline"
          >
            Our story <ArrowRight className="size-4" aria-hidden />
          </Link>
        </Reveal>
      </section>

      {/* ============ Villa collection ============ */}
      <section className="overflow-hidden pb-24 lg:pb-40" aria-labelledby="collection-title">
        <div className="container-na mb-12 flex items-end justify-between">
          <div>
            <Reveal>
              <p className="eyebrow">The collection</p>
            </Reveal>
            <Reveal delay={0.07}>
              <h2 id="collection-title" className="text-display-md mt-4 text-teal-700">
                Choose your sanctuary
              </h2>
            </Reveal>
          </div>
          <Reveal delay={0.14}>
            <Link
              href="/villas"
              className="hidden items-center gap-2 text-sm font-medium text-teal-700 underline-offset-4 hover:underline md:inline-flex"
            >
              View all villas <ArrowRight className="size-4" aria-hidden />
            </Link>
          </Reveal>
        </div>
        {/* 4th card peeks past the container edge — scroll affordance (design/04 §1) */}
        <Stagger className="container-na grid snap-x snap-mandatory auto-cols-[85%] grid-flow-col gap-6 overflow-x-auto pb-4 [scrollbar-width:none] sm:auto-cols-[45%] lg:auto-cols-[31%]">
          {featured.map((v) => (
            <StaggerItem key={v.id} className="snap-start">
              <VillaCard villa={v} />
            </StaggerItem>
          ))}
        </Stagger>
        <div className="container-na mt-6 md:hidden">
          <Link href="/villas" className="text-sm font-medium text-teal-700 underline underline-offset-4">
            View all villas
          </Link>
        </div>
      </section>

      {/* ============ Experience band — forest world, parallax ============ */}
      <section className="theme-forest relative bg-forest-900 text-ivory-100" aria-labelledby="movements-title">
        <ParallaxImage
          src="/photos/hero-dusk.webp"
          alt=""
          className="absolute inset-0 opacity-25"
        />
        <div className="relative container-na py-24 lg:py-40">
          <Reveal>
            <p className="eyebrow">The Nadi Amerta experience</p>
          </Reveal>
          <Reveal delay={0.07}>
            <h2 id="movements-title" className="text-display-md mt-4 max-w-xl text-ivory-50">
              A retreat in three movements
            </h2>
          </Reveal>
          <Stagger className="mt-16 grid gap-12 md:grid-cols-3">
            {MOVEMENTS.map((m) => (
              <StaggerItem key={m.title}>
                <p className="font-display text-3xl text-amerta-300">{m.numeral}</p>
                <h3 className="text-display-sm mt-4 text-ivory-50">{m.title}</h3>
                <p className="mt-3 leading-relaxed text-ivory-100/70">{m.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ Story — the page's single arch ============ */}
      <section className="container-na grid items-center gap-12 py-24 lg:grid-cols-12 lg:py-40">
        <Reveal className="lg:col-span-5">
          <div className="rounded-arch relative mx-auto aspect-[3/4] max-w-md overflow-hidden">
            <Image
              src="/photos/spa.webp"
              alt="Stone bath filled with frangipani blossoms beside an open jungle window"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <div className="lg:col-span-6 lg:col-start-7">
          <SectionHeading
            eyebrow="Tri Hita Karana"
            title="Harmony, three ways"
            description="With the divine — our shrine receives daily offerings and every stay may begin with a water blessing. With nature — the gorge is untouched, the pools are river-fed, the kitchen is planted. With one another — seventy-eight percent of our team walks to work from the surrounding banjar."
          />
          <Reveal delay={0.2}>
            <Link
              href="/about"
              className="mt-8 inline-flex h-12 items-center rounded-md border border-sand-400 px-6 text-sm font-medium text-teal-700 transition-colors hover:border-palm-700 hover:bg-ivory-200/60"
            >
              Meet the people
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============ Reviews ============ */}
      <section className="bg-ivory-200/60 py-24 lg:py-32" aria-labelledby="reviews-title">
        <div className="container-na">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <SectionHeading eyebrow="Guest words" title="Letters from the river" />
            <Reveal delay={0.14}>
              <p className="flex items-center gap-2 text-sm text-ink-700">
                <Star className="size-4 fill-amerta-400 text-amerta-400" aria-hidden />
                <span className="font-medium">4.9</span> · from 312 stays
              </p>
            </Reveal>
          </div>
          <Stagger className="mt-12 grid gap-6 md:grid-cols-3">
            {reviews.map((r) => (
              <StaggerItem key={r.id}>
                <figure className="flex h-full flex-col rounded-lg bg-ivory-50 p-6 shadow-sm">
                  <blockquote className="flex-1 text-[15px] leading-[1.7] text-ink-700">
                    “{r.quote}”
                  </blockquote>
                  <figcaption className="mt-6 flex items-center justify-between text-[13px]">
                    <span className="font-medium text-ink-900">{r.name}</span>
                    <span className="text-stone-500">{r.date}</span>
                  </figcaption>
                </figure>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ============ Pre-footer CTA ============ */}
      <section className="theme-forest bg-forest-950 py-24 text-center lg:py-32">
        <Reveal className="container-na">
          <h2 className="text-display-lg text-ivory-50">The river is waiting.</h2>
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link
              href="/villas"
              className="inline-flex h-12 items-center rounded-md bg-ivory-100 px-8 text-sm font-medium text-forest-900 transition-colors hover:bg-ivory-200"
            >
              Reserve your stay
            </Link>
            <Link
              href="/contact"
              className="inline-flex h-12 items-center rounded-md border border-ivory-100/50 px-8 text-sm font-medium text-ivory-100 transition-colors hover:border-ivory-100 hover:bg-ivory-100/10"
            >
              Speak with us
            </Link>
          </div>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
