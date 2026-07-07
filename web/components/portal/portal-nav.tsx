"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";

const TABS = [
  { href: "/portal", label: "My Stays", exact: true },
  { href: "/portal/stays", label: "Reservations" },
  { href: "/portal/services", label: "Services" },
  { href: "/portal/dining", label: "Dining" },
  { href: "/portal/invoices", label: "Invoices" },
  { href: "/portal/requests", label: "Requests" },
  { href: "/portal/profile", label: "Profile" },
];

/** Guest portal navbar — design/03 §6: gold underline slides between tabs. */
export function PortalNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-ivory-100/90 backdrop-blur-xl">
      <div className="container-na flex h-16 items-center justify-between gap-6">
        <Link href="/" className="font-display shrink-0 text-xl font-medium tracking-[0.08em] text-ink-900">
          The Nadi Amerta
        </Link>

        <nav
          className="scrollbar-none -mb-px flex h-full items-stretch gap-1 overflow-x-auto"
          aria-label="Guest portal"
        >
          {TABS.map((t) => {
            const active = t.exact ? pathname === t.href : pathname.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex items-center px-3 text-sm whitespace-nowrap transition-colors",
                  active ? "font-medium text-teal-700" : "text-stone-500 hover:text-ink-700"
                )}
              >
                {t.label}
                {active && (
                  <motion.span
                    layoutId="portal-tab"
                    className="absolute inset-x-3 bottom-0 h-0.5 bg-amerta-400"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <LogoutButton
            redirectTo="/signin"
            label=""
            className="text-stone-500 transition-colors hover:text-teal-700"
          />
          <Avatar className="size-9 border border-amerta-400/40 bg-sand-300">
            <AvatarFallback className="font-display bg-sand-300 text-sm text-teal-700">A</AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
