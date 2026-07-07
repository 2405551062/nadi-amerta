/**
 * Contact — design/04 §5. Split screen: forest contact rail + ivory form.
 * Traceability (design/10 P14): UC-FO5 entry · BPMN B11 (entry) · crm.lead · POST /api/contact
 */
import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Surface } from "@/components/motion";
import { ContactForm } from "./contact-form";

export const metadata: Metadata = { title: "Contact" };

const CHANNELS = [
  { icon: MessageCircle, label: "WhatsApp — fastest", value: "+62 811 3800 108", href: "https://wa.me/628113800108" },
  { icon: Phone, label: "Telephone", value: "+62 361 977 208", href: "tel:+62361977208" },
  { icon: Mail, label: "Email", value: "stay@nadiamerta.com", href: "mailto:stay@nadiamerta.com" },
  { icon: MapPin, label: "The estate", value: "Banjar Pengosekan, Ubud, Bali 80571", href: undefined },
];

export default function ContactPage() {
  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />

      <div className="grid min-h-[calc(100svh-4rem)] lg:grid-cols-12">
        <section className="theme-forest bg-forest-900 px-6 py-16 text-ivory-100 lg:col-span-5 lg:px-12 lg:py-24">
          <Surface>
            <p className="eyebrow">Contact</p>
            <h1 className="text-display-lg mt-4 text-ivory-50">Speak with us</h1>
            <p className="mt-5 max-w-sm leading-relaxed text-ivory-100/70">
              A person answers — never a queue. We are eight villas; we know
              every reservation by name.
            </p>

            <ul className="mt-12 space-y-7">
              {CHANNELS.map((c) => (
                <li key={c.label} className="flex items-start gap-4">
                  <c.icon className="mt-0.5 size-5 text-amerta-300" strokeWidth={1.5} aria-hidden />
                  <div>
                    <p className="text-xs tracking-[0.1em] text-ivory-100/50 uppercase">{c.label}</p>
                    {c.href ? (
                      <a href={c.href} className="mt-1 block text-[15px] text-ivory-100 transition-colors hover:text-amerta-300">
                        {c.value}
                      </a>
                    ) : (
                      <p className="mt-1 text-[15px] text-ivory-100">{c.value}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>

            <p className="mt-12 border-t border-amerta-300/20 pt-6 text-[13px] text-ivory-100/50">
              We are at GMT+8 — Bali time. The front desk never sleeps.
            </p>
          </Surface>
        </section>

        <section className="px-6 py-16 lg:col-span-7 lg:px-16 lg:py-24">
          <Surface className="mx-auto max-w-xl">
            <h2 className="text-display-sm text-teal-700">Write to the house</h2>
            <p className="mt-2 mb-8 text-sm text-stone-500">
              For anything urgent during a stay, WhatsApp reaches your butler directly.
            </p>
            <ContactForm />
          </Surface>
        </section>
      </div>

      <Footer />
    </>
  );
}
