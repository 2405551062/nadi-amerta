"use client";

/**
 * Booking flow state — design/05. One villa.reservation draft per flow
 * (POST /api/reservations/draft autosave in production); survives refresh
 * via sessionStorage, step lives in the URL.
 */
import { createContext, useContext, useEffect, useState } from "react";
import type { ReactNode } from "react";

export interface BookingState {
  checkin?: string; // ISO yyyy-mm-dd
  checkout?: string;
  guests: number;
  fullName: string;
  email: string;
  phone: string;
  country: string;
  requests: string;
  pickup: boolean; // Arrival ritual — airport pickup (+650k)
  flightNumber: string;
  blessing: boolean; // included
  lateArrival: boolean;
  arrivalWindow: string;
  payment: "full" | "deposit";
}

const DEFAULT: BookingState = {
  guests: 2,
  fullName: "",
  email: "",
  phone: "",
  country: "Indonesia",
  requests: "",
  pickup: false,
  flightNumber: "",
  blessing: true,
  lateArrival: false,
  arrivalWindow: "14:00 — 16:00",
  payment: "full",
};

export const PICKUP_PRICE = 650_000;

const Ctx = createContext<{
  state: BookingState;
  patch: (p: Partial<BookingState>) => void;
} | null>(null);

export function BookingProvider({
  slug,
  initial,
  children,
}: {
  slug: string;
  initial?: Partial<BookingState>;
  children: ReactNode;
}) {
  const key = `na-booking-${slug}`;
  const [state, setState] = useState<BookingState>({ ...DEFAULT, ...initial });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) setState((s) => ({ ...s, ...JSON.parse(saved) }));
    } catch {}
    setHydrated(true);
  }, [key]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(key, JSON.stringify(state));
  }, [state, hydrated, key]);

  return (
    <Ctx.Provider value={{ state, patch: (p) => setState((s) => ({ ...s, ...p })) }}>
      {children}
    </Ctx.Provider>
  );
}

export function useBooking() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useBooking outside BookingProvider");
  return ctx;
}

export function nightsOf(state: BookingState): number {
  if (!state.checkin || !state.checkout) return 0;
  return Math.max(
    0,
    Math.round(
      (new Date(state.checkout).getTime() - new Date(state.checkin).getTime()) / 86_400_000
    )
  );
}

export function fmtISO(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
