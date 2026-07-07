import Link from "next/link";
import { LotusMark } from "@/components/site/lotus-mark";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Stay",
    links: [
      { label: "The villas", href: "/villas" },
      { label: "Availability", href: "/villas" },
      { label: "Experiences", href: "/portal/services" },
      { label: "In-villa dining", href: "/portal/dining" },
    ],
  },
  {
    title: "The estate",
    links: [
      { label: "About Nadi Amerta", href: "/about" },
      { label: "Tri Hita Karana", href: "/about" },
      { label: "Journal", href: "/about" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Guests",
    links: [
      { label: "Sign in", href: "/signin" },
      { label: "My stays", href: "/portal/stays" },
      { label: "Invoices", href: "/portal/invoices" },
      { label: "FAQ", href: "/faq" },
    ],
  },
  {
    title: "Team",
    links: [
      { label: "Staff portal", href: "/ops" },
      { label: "Reception", href: "/ops/reception" },
      { label: "Housekeeping", href: "/ops/housekeeping" },
      { label: "Finance", href: "/ops/finance" },
    ],
  },
];

/** Footer — design/03 §8. Forest world, serif invitation, gold hairline. */
export function Footer() {
  return (
    <footer className="theme-forest bg-forest-900 text-ivory-100">
      <div className="container-na py-20 lg:py-24">
        <div className="flex flex-col gap-12 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-md">
            <p className="eyebrow">Nadi Amerta · Ubud</p>
            <h2 className="text-display-md mt-4">The river is waiting.</h2>
          </div>
          <form className="flex w-full max-w-sm gap-3" action="/contact">
            <label htmlFor="footer-email" className="sr-only">
              Email address
            </label>
            <input
              id="footer-email"
              type="email"
              placeholder="Your email"
              className="glass-dark h-12 flex-1 rounded-md px-4 text-sm text-ivory-100 placeholder:text-ivory-100/50 focus:ring-2 focus:ring-amerta-300 focus:outline-none"
            />
            <button
              type="submit"
              className="h-12 rounded-md border border-ivory-100/50 px-5 text-sm font-medium text-ivory-100 transition-colors hover:border-ivory-100 hover:bg-ivory-100/10"
            >
              Keep in touch
            </button>
          </form>
        </div>

        <div className="mt-16 grid grid-cols-2 gap-10 md:grid-cols-4">
          {COLUMNS.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <p className="eyebrow mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[13px] text-ivory-100/60 transition-colors hover:text-amerta-300"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="border-t border-amerta-300/20">
        <div className="container-na flex flex-col items-center gap-4 py-8 text-xs text-ivory-100/50 md:flex-row md:justify-between">
          <div className="flex items-center gap-3">
            <LotusMark className="size-10" />
            <span>© 2026 The Nadi Amerta · Villa &amp; Retreat · Banjar Pengosekan, Ubud, Bali</span>
          </div>
          <span>NPWP 12.345.678.9-901.000 · IUTH 503/Diskop-UMKM/2024 · Payments via Midtrans</span>
        </div>
      </div>
    </footer>
  );
}
