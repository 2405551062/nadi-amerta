"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Archive, BarChart3, BedDouble, CalendarDays, ChefHat, LayoutDashboard,
  Sparkles, UtensilsCrossed, Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LotusMark } from "@/components/site/lotus-mark";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { LogoutButton } from "@/components/auth/logout-button";

/**
 * Staff console sidebar — design/03 §7. Role-aware (Note #6): each nav item
 * carries the Nadi res.group that grants it; a signed-in staffer only sees the
 * consoles their groups allow. General Manager (all groups) sees everything.
 */
const NAV = [
  { href: "/ops", label: "Dashboard", icon: LayoutDashboard, exact: true, role: "*" },
  { href: "/ops/reception", label: "Reception", icon: CalendarDays, role: "Front Office" },
  { href: "/ops/housekeeping", label: "Housekeeping", icon: Sparkles, exact: true, role: "Housekeeping" },
  { href: "/ops/housekeeping/inventory", label: "Inventory", icon: Archive, role: "Housekeeping" },
  { href: "/ops/fnb", label: "F&B Kitchen", icon: ChefHat, role: "Food & Beverage" },
  { href: "/ops/finance", label: "Finance", icon: Wallet, role: "Finance" },
  { href: "/ops/backoffice", label: "Back Office", icon: BarChart3, role: "Back Office" },
];

export function OpsSidebar({ user }: { user?: { name: string; role: string; groups?: string[] } }) {
  const pathname = usePathname();
  const groups = user?.groups ?? [];
  const isGM = groups.includes("General Manager");
  // No group info → show everything (safe fallback); otherwise filter by role.
  const nav = NAV.filter(
    (item) => item.role === "*" || isGM || groups.length === 0 || groups.includes(item.role)
  );

  return (
    <aside className="theme-forest flex w-16 shrink-0 flex-col border-r border-amerta-300/15 bg-forest-900 lg:w-64">
      <Link href="/" className="flex items-center gap-3 px-4 py-6 lg:px-6" aria-label="The Nadi Amerta home">
        <LotusMark className="size-9 shrink-0" />
        <span className="font-display hidden text-lg font-medium tracking-[0.06em] text-ivory-100 lg:block">
          The Nadi Amerta
        </span>
      </Link>

      <nav className="flex-1 space-y-1 px-2 lg:px-3" aria-label="Operations">
        {nav.map((item) => {
          const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              title={item.label}
              className={cn(
                "relative flex h-11 items-center gap-3 rounded-md px-3 text-sm transition-colors",
                active
                  ? "bg-white/10 text-ivory-100"
                  : "text-ivory-100/70 hover:bg-white/5 hover:text-ivory-100"
              )}
            >
              {active && (
                <motion.span
                  layoutId="ops-rail"
                  className="absolute top-2 bottom-2 left-0 w-0.5 rounded-full bg-amerta-400"
                  transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                />
              )}
              <Icon className="size-5 shrink-0" strokeWidth={1.5} aria-hidden />
              <span className="hidden lg:block">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="space-y-3 border-t border-amerta-300/15 p-4 lg:px-6">
        <div className="flex items-center gap-3">
          <Avatar className="size-9 border border-amerta-300/40">
            <AvatarFallback className="font-display bg-white/10 text-sm text-ivory-100">
              {(user?.name ?? "M")[0]?.toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-sm font-medium text-ivory-100">{user?.name ?? "Staff"}</p>
            <p className="truncate text-xs text-ivory-100/50">{user?.role ?? "Operations"}</p>
          </div>
        </div>
        <LogoutButton
          redirectTo="/staff-login"
          className="text-xs text-ivory-100/60 transition-colors hover:text-amerta-300"
        />
      </div>
    </aside>
  );
}

/** Icon helpers reused by console pages. */
export const OPS_ICONS = { BedDouble, UtensilsCrossed };
