/**
 * View-model types for the Nadi Amerta frontend.
 * Field names mirror the contractual ERD (see design/10-traceability.md):
 * Villa → product.product (x_villa_type, x_capacity, x_availability, x_facilities)
 * Reservation → villa.reservation (+ linked sale.order)
 * Invoice → account.move (+ account.payment)
 * GuestRequest → BPMN B11 / CRM module (ERD gap §1.5.3)
 * HousekeepingTask → BPMN B24–B25 (ERD gap §1.5.1)
 * StockItem → ERP Inventory module (ERD gap §1.5.2)
 */

export type VillaView = "river" | "rice" | "garden";
export type VillaStatus = "available" | "occupied" | "cleaning" | "inspection" | "maintenance";

export interface Villa {
  id: number;
  slug: string;
  name: string;
  collection: string;
  view: VillaView;
  bedrooms: number;
  capacity: number;
  sizeM2: number;
  priceNight: number; // integer IDR
  rating: number;
  reviewCount: number;
  image: string;
  images: string[];
  facilities: string[];
  excerpt: string;
  description: string;
  status: VillaStatus;
  minStay: number;
  roomsTotal?: number; // number of identical bookable units (Note #3)
  roomsAvailableNow?: number; // units free today, decreases as bookings are made
  currentGuest?: string;
}

export type ReservationState = "draft" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
export type BookingSource = "direct" | "agent" | "walkin" | "ota";

export interface Reservation {
  id: number;
  code: string;
  villaSlug: string;
  guestName: string;
  guestCountry: string;
  checkIn: string; // "Aug 12, 2026"
  checkOut: string;
  nights: number;
  guests: number;
  state: ReservationState;
  source: BookingSource;
  channel?: string;
  total: number;
  balance: number;
  vip?: boolean;
  eta?: string;
  paymentState?: "unpaid" | "pending" | "deposit" | "paid";
  paidAmount?: number;
  paymentMethod?: string;
}

export type InvoiceState = "paid" | "awaiting" | "refunded";

export interface Invoice {
  id: number;
  number: string;
  reservationCode: string;
  stay: string;
  date: string;
  amount: number;
  state: InvoiceState;
  method: string;
  reference: string;
}

export interface Service {
  id: number;
  slug: string;
  chapter: "Wellness" | "Journeys" | "Occasions";
  name: string;
  duration: string;
  price: number; // 0 = included
  description: string;
  image?: string;
  // Note 2 §5 — realistic villa-provided start time(s) and where it happens.
  times?: string[];
  location?: string;
}

export interface MenuItem {
  id: number;
  category: string;
  name: string;
  description: string;
  price: number;
  dietary: ("vegan" | "gf")[];
  featured?: boolean;
}

export type RequestState = "open" | "in_progress" | "resolved";

export interface GuestRequest {
  id: number;
  type: "request" | "complaint";
  subject: string;
  detail: string;
  state: RequestState;
  created: string;
  villa: string;
  guestName: string;
  priority: "high" | "medium" | "low";
  // Note 2 §3 — inventory requests draw stock; complaints route to engineering.
  route?: "inventory" | "maintenance" | "none";
  maintenanceFlagged?: boolean;
}

export interface HousekeepingTask {
  id: number;
  villaSlug: string;
  type: "Turnover" | "Stayover" | "Deep clean";
  assignee: string;
  assigneeId?: number;
  roomId?: number;
  roomLabel?: string;
  due: string;
  state: "todo" | "doing" | "done";
  checklist: { label: string; done: boolean }[];
  // Housekeeper sign-off — back office / HR reviews the conclusion.
  conclusion?: string;
  submittedAt?: string;
}

export interface StockItem {
  id: number;
  name: string;
  category: string;
  qty: number;
  min: number;
  unit: string;
  supplier: string;
}

export type FnbOrderState = "received" | "kitchen" | "delivering" | "billed";

export interface FnbOrder {
  id: number;
  villaSlug: string;
  guestName: string;
  items: { name: string; qty: number; price: number }[];
  state: FnbOrderState;
  placed: string;
  note?: string;
}

export interface Review {
  id: number;
  quote: string;
  name: string;
  date: string;
  rating: number;
}

export interface LedgerEntry {
  id: number;
  date: string;
  description: string;
  reference: string;
  stream: "Rooms" | "F&B" | "Spa" | "Transfers" | "Expense";
  debit: number;
  credit: number;
}
