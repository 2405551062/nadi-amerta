"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

const LINKS = [
  { href: "/villas", label: "Villas" },
  { href: "/portal/services", label: "Experiences" },
  { href: "/portal/dining", label: "Dining" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

/**
 * Marketing navbar — design/03 §6.
 * `overHero`: transparent ivory-text over photography, turns glass after 80px.
 */
export function Navbar({ overHero = false }: { overHero?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const transparent = overHero && !scrolled && !open;

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-400 ease-drift",
          transparent
            ? "h-20 bg-transparent text-ivory-100"
            : "glass h-16 border-x-0 border-t-0 border-b border-border/80 text-ink-900",
          !overHero && "sticky"
        )}
      >
        <div className="container-na flex h-full items-center justify-between">
          <Link
            href="/"
            className="font-display text-xl font-medium tracking-[0.08em]"
            aria-label="The Nadi Amerta — home"
          >
            The Nadi Amerta
          </Link>

          <nav className="hidden items-center gap-8 lg:flex" aria-label="Primary">
            {LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "group relative text-sm font-medium",
                  transparent ? "text-ivory-100/90 hover:text-ivory-100" : "text-ink-700 hover:text-teal-700"
                )}
              >
                {l.label}
                <span
                  className={cn(
                    "absolute -bottom-1 left-0 h-px w-0 bg-amerta-400 transition-all duration-250 group-hover:w-full",
                    pathname === l.href && "w-full"
                  )}
                />
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-4 lg:flex">
            <Link
              href="/signin"
              className={cn(
                "text-sm font-medium underline-offset-4 hover:underline",
                transparent ? "text-ivory-100/90" : "text-teal-700"
              )}
            >
              Sign in
            </Link>
            <Link
              href="/villas"
              className={cn(
                "inline-flex h-10 items-center rounded-md px-5 text-sm font-medium transition-colors duration-200",
                transparent
                  ? "border border-ivory-100/50 text-ivory-100 hover:border-ivory-100 hover:bg-ivory-100/10"
                  : "bg-palm-700 text-ivory-50 hover:bg-palm-600"
              )}
            >
              Reserve
            </Link>
          </div>

          <button
            className="p-2 lg:hidden"
            onClick={() => setOpen(!open)}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X className="size-6" /> : <Menu className="size-6" />}
          </button>
        </div>
      </header>

      {/* Mobile overlay — forest world, serif links, staggered (design/03 §6) */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="theme-forest fixed inset-0 z-40 flex flex-col justify-between bg-forest-900 px-6 pt-28 pb-10 lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <nav className="flex flex-col gap-2" aria-label="Mobile">
              {[{ href: "/", label: "Home" }, ...LINKS, { href: "/signin", label: "Sign in" }].map(
                (l, i) => (
                  <motion.div
                    key={l.href}
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, ease: EASE_WATER, delay: 0.1 + i * 0.07 }}
                  >
                    <Link
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="text-display-md block py-2 text-ivory-100"
                    >
                      {l.label}
                    </Link>
                  </motion.div>
                )
              )}
            </nav>
            <div className="space-y-1 text-sm text-ivory-100/60">
              <p>Banjar Pengosekan, Ubud, Bali</p>
              <p>WhatsApp +62 811 3800 108 · stay@nadiamerta.com</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
