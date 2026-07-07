/**
 * About — design/04 §4.
 * Traceability (design/10 P14): trust-building for UC-C1; B11 entry via contact CTA.
 */
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { SectionHeading } from "@/components/site/section-heading";
import { ParallaxImage } from "@/components/site/parallax";
import { Reveal, Stagger, StaggerItem } from "@/components/motion";

export const metadata: Metadata = { title: "About" };

const PRINCIPLES = [
  { numeral: "i.", title: "Parhyangan", body: "Harmony with the divine. The estate shrine receives offerings each morning; ceremonies set the rhythm of our year." },
  { numeral: "ii.", title: "Pawongan", body: "Harmony among people. Most of our team walks to work from the surrounding banjar — guests are welcomed as family, not files." },
  { numeral: "iii.", title: "Palemahan", body: "Harmony with nature. The gorge is untouched, the pools are river-fed, and the kitchen garden feeds the table." },
];

const STATS = [
  { value: "12ha", label: "riverside land preserved" },
  { value: "78%", label: "team from the local banjar" },
  { value: "0", label: "single-use plastics" },
  { value: "8", label: "villas — never more" },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />

      <section className="relative">
        <ParallaxImage
          src="/photos/hero-dusk.webp"
          alt="The estate pavilion at dusk above the still pool"
          className="h-[52vh] min-h-[380px]"
          priority
        />
        <div className="overlay-hero absolute inset-0" aria-hidden />
        <div className="absolute inset-0 flex items-end">
          <div className="container-na pb-14 text-ivory-100">
            <p className="eyebrow-dark eyebrow">Our story</p>
            <h1 className="text-display-lg mt-4 max-w-2xl text-ivory-50">
              The river of immortal nectar
            </h1>
          </div>
        </div>
      </section>

      <section className="container-na grid gap-12 py-24 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHeading eyebrow="The name" title="Nadi Amerta" />
        </div>
        <Reveal className="space-y-6 text-lg leading-relaxed text-ink-700 lg:col-span-6 lg:col-start-7">
          <p>
            In Balinese, <em className="font-display italic">nadi</em> is the river, the pulse, the channel
            through which life moves. <em className="font-display italic">Amerta</em> is the nectar of
            immortality churned from the ocean at the beginning of the world.
          </p>
          <p>
            Together they name what we found on this ridge in Pengosekan: water that has been
            considered holy for a thousand years, flowing past a village of painters and
            carvers, under a canopy that has never been cut.
          </p>
        </Reveal>
      </section>

      <section className="theme-forest bg-forest-900 py-24 text-ivory-100">
        <div className="container-na">
          <Reveal>
            <p className="eyebrow">Tri Hita Karana</p>
            <h2 className="text-display-md mt-4 text-ivory-50">Three causes of well-being</h2>
          </Reveal>
          <Stagger className="mt-14 grid gap-12 md:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <StaggerItem key={p.title}>
                <p className="font-display text-3xl text-amerta-300">{p.numeral}</p>
                <h3 className="text-display-sm mt-4 text-ivory-50">{p.title}</h3>
                <p className="mt-3 leading-relaxed text-ivory-100/70">{p.body}</p>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section className="container-na grid items-center gap-12 py-24 lg:grid-cols-12">
        <Reveal className="lg:col-span-5">
          <div className="rounded-arch relative mx-auto aspect-[3/4] max-w-md overflow-hidden">
            <Image
              src="/photos/chef.webp"
              alt="Chef Ketut plating in the open kitchen"
              fill
              sizes="(max-width: 1024px) 90vw, 40vw"
              className="object-cover"
            />
          </div>
        </Reveal>
        <div className="lg:col-span-6 lg:col-start-7">
          <SectionHeading
            eyebrow="The people"
            title="Hosts before hoteliers"
            description="Chef Ketut grew up two rice fields from the kitchen he now runs. Our head butler served twelve years at the great houses of the Ayung before coming home. When we say the welcome is genuine, we mean it is literal — most of the team is welcoming you to their own banjar."
          />
        </div>
      </section>

      <section className="bg-ivory-200/60 py-20">
        <Stagger className="container-na grid grid-cols-2 gap-10 text-center md:grid-cols-4">
          {STATS.map((s) => (
            <StaggerItem key={s.label}>
              <p className="font-display text-5xl text-teal-700">{s.value}</p>
              <p className="mt-2 text-sm text-stone-500">{s.label}</p>
            </StaggerItem>
          ))}
        </Stagger>
      </section>

      <section className="theme-forest bg-forest-950 py-24 text-center">
        <Reveal className="container-na">
          <h2 className="text-display-md text-ivory-50">Come and see for yourself.</h2>
          <Link
            href="/villas"
            className="mt-8 inline-flex h-12 items-center rounded-md bg-ivory-100 px-8 text-sm font-medium text-forest-900 transition-colors hover:bg-ivory-200"
          >
            Reserve your stay
          </Link>
        </Reveal>
      </section>

      <Footer />
    </>
  );
}
