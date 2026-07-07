import type {
  FnbOrder, GuestRequest, HousekeepingTask, Invoice, LedgerEntry,
  MenuItem, Reservation, Review, Service, StockItem, Villa,
} from "./types";

/* ------------------------------------------------------------------ */
/* Villas — ERD product.product (x_kind=villa)                         */
/* ------------------------------------------------------------------ */

const FACILITIES_BASE = [
  "Private infinity pool", "King bed with canopy", "Rain shower & stone bath",
  "Personal butler", "Riverside deck", "Air conditioning", "Espresso & tea ritual",
  "High-speed Wi-Fi", "In-villa dining", "Yoga mats & blocks", "Safe deposit", "Daily housekeeping",
];

export const villas: Villa[] = [
  {
    id: 1, slug: "villa-tirta", name: "Villa Tirta", collection: "Riverside Collection",
    view: "river", bedrooms: 1, capacity: 2, sizeM2: 150, priceNight: 8_500_000,
    rating: 4.9, reviewCount: 84, image: "/photos/villa-1.webp",
    images: ["/photos/villa-1.webp", "/photos/hero-dusk.webp", "/photos/spa.webp"],
    facilities: FACILITIES_BASE,
    excerpt: "One-bedroom sanctuary suspended over the Ayung gorge.",
    description:
      "Nestled along the banks of the sacred Ayung River, Villa Tirta offers expansive indoor–outdoor living, a private infinity pool, and uninterrupted views of the jungle canopy. Bespoke Balinese design, contemporary comforts, and a dedicated butler shape a stay that is entirely your own.",
    status: "occupied", minStay: 2, currentGuest: "Amara Chen",
  },
  {
    id: 2, slug: "villa-surya", name: "Villa Surya", collection: "Riverside Collection",
    view: "river", bedrooms: 3, capacity: 6, sizeM2: 350, priceNight: 12_500_000,
    rating: 4.9, reviewCount: 61, image: "/photos/villa-2.webp",
    images: ["/photos/villa-2.webp", "/photos/hero-gorge.webp", "/photos/dining.webp"],
    facilities: [...FACILITIES_BASE, "Private chef on request", "Media pavilion"],
    excerpt: "Three bedrooms, a 16-metre pool, and the sunrise to yourself.",
    description:
      "The estate's largest residence faces east over the gorge, catching first light across a 16-metre infinity edge. Three pavilion bedrooms surround a garden courtyard; evenings gather around the riverside fire table.",
    status: "available", minStay: 2,
  },
  {
    id: 3, slug: "villa-chandra", name: "Villa Chandra", collection: "Rice Paddy Collection",
    view: "rice", bedrooms: 2, capacity: 4, sizeM2: 280, priceNight: 9_500_000,
    rating: 4.8, reviewCount: 73, image: "/photos/villa-3.webp",
    images: ["/photos/villa-3.webp", "/photos/villa-4.webp", "/photos/dining.webp"],
    facilities: [...FACILITIES_BASE, "Yoga pavilion", "Paddy-edge bale"],
    excerpt: "Two bedrooms opening onto emerald terraces and a yoga bale.",
    description:
      "Chandra looks west across working rice terraces that turn gold at dusk. A private yoga pavilion sits at the paddy's edge; the limestone pool deck holds the last light of the day.",
    status: "cleaning", minStay: 2,
  },
  {
    id: 4, slug: "villa-lotus", name: "Villa Lotus", collection: "Garden Collection",
    view: "garden", bedrooms: 1, capacity: 2, sizeM2: 140, priceNight: 6_800_000,
    rating: 4.8, reviewCount: 92, image: "/photos/villa-4.webp",
    images: ["/photos/villa-4.webp", "/photos/spa.webp", "/photos/villa-1.webp"],
    facilities: FACILITIES_BASE,
    excerpt: "A canopy bed, a plunge pool, and a garden that hums at dawn.",
    description:
      "Hidden in the heliconia gardens, Lotus is the honeymooners' villa — a single grand pavilion where the bedroom opens fully to a private plunge pool and outdoor stone bath beneath the frangipani.",
    status: "occupied", minStay: 2, currentGuest: "Kenji & Yui Tanaka",
  },
  {
    id: 5, slug: "villa-frangipani", name: "Villa Frangipani", collection: "Garden Collection",
    view: "garden", bedrooms: 2, capacity: 4, sizeM2: 240, priceNight: 8_200_000,
    rating: 4.7, reviewCount: 55, image: "/photos/villa-1.webp",
    images: ["/photos/villa-1.webp", "/photos/villa-3.webp", "/photos/spa.webp"],
    facilities: [...FACILITIES_BASE, "Children's amenities", "Garden dining bale"],
    excerpt: "The family villa — two pavilions around a shaded garden pool.",
    description:
      "Two bedroom pavilions face each other across a 12-metre pool shaded by an old frangipani. A generous garden bale serves long breakfasts and afternoon rain-watching.",
    status: "available", minStay: 2,
  },
  {
    id: 6, slug: "villa-hibiscus", name: "Villa Hibiscus", collection: "Rice Paddy Collection",
    view: "rice", bedrooms: 1, capacity: 2, sizeM2: 145, priceNight: 7_200_000,
    rating: 4.8, reviewCount: 47, image: "/photos/villa-3.webp",
    images: ["/photos/villa-3.webp", "/photos/villa-2.webp", "/photos/dining.webp"],
    facilities: FACILITIES_BASE,
    excerpt: "Paddy-edge stillness with an west-facing plunge pool.",
    description:
      "Hibiscus sits at the quiet northern edge of the terraces. Mornings begin with farmers' voices across the water channels; evenings end in a west-facing pool the exact colour of the sky.",
    status: "inspection", minStay: 2,
  },
  {
    id: 7, slug: "villa-bambu", name: "Villa Bambu", collection: "Riverside Collection",
    view: "river", bedrooms: 2, capacity: 4, sizeM2: 260, priceNight: 9_800_000,
    rating: 4.9, reviewCount: 38, image: "/photos/villa-2.webp",
    images: ["/photos/villa-2.webp", "/photos/hero-dusk.webp", "/photos/villa-4.webp"],
    facilities: [...FACILITIES_BASE, "Bamboo pavilion lounge", "River access path"],
    excerpt: "A soaring bamboo pavilion above the river bend.",
    description:
      "Built around a cathedral of black bamboo, Bambu is the estate's architectural signature. A private path descends to the river bend where morning blessings are held.",
    status: "available", minStay: 3,
  },
  {
    id: 8, slug: "villa-jepun", name: "Villa Jepun", collection: "Garden Collection",
    view: "garden", bedrooms: 1, capacity: 2, sizeM2: 135, priceNight: 6_200_000,
    rating: 4.7, reviewCount: 66, image: "/photos/villa-4.webp",
    images: ["/photos/villa-4.webp", "/photos/villa-1.webp", "/photos/spa.webp"],
    facilities: FACILITIES_BASE,
    excerpt: "The quiet corner villa, wrapped in white jepun blossom.",
    description:
      "Jepun — the Balinese frangipani — surrounds this intimate pavilion on three sides. The most secluded single-bedroom stay on the estate, favoured by writers and long-stay guests.",
    status: "maintenance", minStay: 2,
  },
];

export const villaBySlug = (slug: string) => villas.find((v) => v.slug === slug);

/* ------------------------------------------------------------------ */
/* Reservations — ERD villa.reservation + sale.order                   */
/* ------------------------------------------------------------------ */

export const currentGuest = { name: "Amara Chen", email: "amara@example.com", tier: "Gold" };

export const reservations: Reservation[] = [
  { id: 101, code: "NA-2608-TIR", villaSlug: "villa-tirta", guestName: "Amara Chen", guestCountry: "Singapore", checkIn: "Aug 12, 2026", checkOut: "Aug 16, 2026", nights: 4, guests: 2, state: "confirmed", source: "direct", total: 40_120_000, balance: 0 },
  { id: 102, code: "NA-2601-SUR", villaSlug: "villa-surya", guestName: "Amara Chen", guestCountry: "Singapore", checkIn: "Jan 9, 2026", checkOut: "Jan 14, 2026", nights: 5, guests: 4, state: "checked_out", source: "direct", total: 73_750_000, balance: 0 },
  { id: 103, code: "NA-2504-LOT", villaSlug: "villa-lotus", guestName: "Amara Chen", guestCountry: "Singapore", checkIn: "Apr 2, 2025", checkOut: "Apr 6, 2025", nights: 4, guests: 2, state: "checked_out", source: "ota", channel: "Airbnb", total: 32_096_000, balance: 0 },
  { id: 104, code: "NA-2410-JEP", villaSlug: "villa-jepun", guestName: "Amara Chen", guestCountry: "Singapore", checkIn: "Oct 18, 2024", checkOut: "Oct 20, 2024", nights: 2, guests: 2, state: "cancelled", source: "direct", total: 14_632_000, balance: 0 },
];

/** Today board for reception (BPMN B7/B10/B18) */
export const arrivalsToday: Reservation[] = [
  { id: 201, code: "NA-0607-FRA", villaSlug: "villa-frangipani", guestName: "Sarah Jenkins", guestCountry: "Australia", checkIn: "Jul 6, 2026", checkOut: "Jul 11, 2026", nights: 5, guests: 4, state: "confirmed", source: "direct", total: 48_380_000, balance: 0, eta: "13:00" },
  { id: 202, code: "NA-0607-HIB", villaSlug: "villa-hibiscus", guestName: "Kenji Nakamura", guestCountry: "Japan", checkIn: "Jul 6, 2026", checkOut: "Jul 9, 2026", nights: 3, guests: 2, state: "confirmed", source: "ota", channel: "Booking.com", total: 25_488_000, balance: 12_744_000, eta: "15:30" },
  { id: 203, code: "NA-0607-SUR", villaSlug: "villa-surya", guestName: "Anya Sharma", guestCountry: "India", checkIn: "Jul 6, 2026", checkOut: "Jul 12, 2026", nights: 6, guests: 6, state: "confirmed", source: "agent", total: 88_500_000, balance: 0, vip: true, eta: "17:00" },
];

export const inHouse: Reservation[] = [
  { id: 204, code: "NA-0407-TIR", villaSlug: "villa-tirta", guestName: "Amara Chen", guestCountry: "Singapore", checkIn: "Jul 4, 2026", checkOut: "Jul 8, 2026", nights: 4, guests: 2, state: "checked_in", source: "direct", total: 40_120_000, balance: 2_450_000 },
  { id: 205, code: "NA-0307-LOT", villaSlug: "villa-lotus", guestName: "Kenji & Yui Tanaka", guestCountry: "Japan", checkIn: "Jul 3, 2026", checkOut: "Jul 10, 2026", nights: 7, guests: 2, state: "checked_in", source: "ota", channel: "Agoda", total: 56_168_000, balance: 8_940_000 },
];

export const departuresToday: Reservation[] = [
  { id: 206, code: "NA-0107-CHA", villaSlug: "villa-chandra", guestName: "David & Emma Cole", guestCountry: "United Kingdom", checkIn: "Jul 1, 2026", checkOut: "Jul 6, 2026", nights: 5, guests: 3, state: "checked_in", source: "direct", total: 56_050_000, balance: 1_280_000 },
];

/* ------------------------------------------------------------------ */
/* Invoices — ERD account.move / account.payment                       */
/* ------------------------------------------------------------------ */

export const invoices: Invoice[] = [
  { id: 1, number: "INV/2026/0412", reservationCode: "NA-2608-TIR", stay: "Villa Tirta · Aug 2026", date: "Jul 2, 2026", amount: 40_120_000, state: "paid", method: "Visa •• 4421", reference: "MID-88213904" },
  { id: 2, number: "INV/2026/0102", reservationCode: "NA-2601-SUR", stay: "Villa Surya · Jan 2026", date: "Jan 14, 2026", amount: 73_750_000, state: "paid", method: "Bank transfer (VA)", reference: "MID-71034221" },
  { id: 3, number: "INV/2025/0388", reservationCode: "NA-2504-LOT", stay: "Villa Lotus · Apr 2025", date: "Apr 6, 2025", amount: 32_096_000, state: "paid", method: "QRIS", reference: "MID-60018112" },
  { id: 4, number: "INV/2024/0791", reservationCode: "NA-2410-JEP", stay: "Villa Jepun · Oct 2024", date: "Oct 12, 2024", amount: 14_632_000, state: "refunded", method: "Visa •• 4421", reference: "MID-52290871" },
];

/* ------------------------------------------------------------------ */
/* Services — ERD product.product (x_kind=service)                     */
/* ------------------------------------------------------------------ */

export const services: Service[] = [
  { id: 1, slug: "river-stone-ritual", chapter: "Wellness", name: "River Stone Ritual", duration: "120 min", price: 1_850_000, description: "Warm basalt from the Ayung, sandalwood oil, and four hands. Our signature spa ceremony, held in the riverside pavilion.", image: "/photos/spa.webp" },
  { id: 2, slug: "sunrise-yoga", chapter: "Wellness", name: "Sunrise Yoga over the Gorge", duration: "75 min", price: 0, description: "Daily at 06:30 on the yoga deck. Mats, cold towels, and young coconut included. Included with every stay.", image: "/photos/hero-gorge.webp" },
  { id: 3, slug: "frangipani-bath", chapter: "Wellness", name: "Frangipani Flower Bath", duration: "60 min", price: 950_000, description: "A stone tub of warm water, five hundred blossoms, and absolute quiet — drawn at golden hour in your villa.", image: "/photos/spa.webp" },
  { id: 4, slug: "gorge-trek", chapter: "Journeys", name: "Hidden Gorge Trek & Blessing", duration: "Half day", price: 1_200_000, description: "A guided descent to the river temple with our resident priest; ends with a water blessing and riverside breakfast.", image: "/photos/hero-gorge.webp" },
  { id: 5, slug: "temple-ceremony", chapter: "Journeys", name: "Village Temple Ceremony", duration: "Evening", price: 850_000, description: "Join our banjar's odalan ceremony as an invited guest — dress, offerings, and interpretation provided.", image: "/photos/hero-dusk.webp" },
  { id: 6, slug: "airport-transfer", chapter: "Journeys", name: "Private Airport Transfer", duration: "90 min", price: 650_000, description: "Alphard from Ngurah Rai with cold towels, young coconut, and no small talk unless you want it.", image: "/photos/villa-2.webp" },
  { id: 7, slug: "floating-breakfast", chapter: "Occasions", name: "Floating Breakfast", duration: "Morning", price: 750_000, description: "The classic, done properly: a carved teak tray in your pool, riverside fruit, and Kintamani coffee.", image: "/photos/dining.webp" },
  { id: 8, slug: "riverside-dinner", chapter: "Occasions", name: "Riverside Candlelight Dinner", duration: "Evening", price: 2_400_000, description: "A private table on the river deck, five courses by Chef Ketut, and two hundred candles along the path.", image: "/photos/dining.webp" },
  { id: 9, slug: "proposal", chapter: "Occasions", name: "The Proposal", duration: "Bespoke", price: 4_500_000, description: "Flowers, musicians, a photographer, and a plan B for rain. Told to exactly no one until the moment.", image: "/photos/hero-dusk.webp" },
];

/* ------------------------------------------------------------------ */
/* Dining — ERD product.product (F&B) → sale.order.line                */
/* ------------------------------------------------------------------ */

export const menuCategories = ["From Chef Ketut", "Breakfast", "Balinese", "Western", "Children", "Cellar"];

export const menu: MenuItem[] = [
  { id: 1, category: "From Chef Ketut", name: "Bebek Betutu", description: "Slow-roasted duck in banana leaf, 12 hours, village spice paste — order by 14:00.", price: 480_000, dietary: ["gf"], featured: true },
  { id: 2, category: "From Chef Ketut", name: "Ayung River Prawns", description: "Charcoal-grilled river prawns, sambal matah, lime leaf.", price: 420_000, dietary: ["gf"], featured: true },
  { id: 3, category: "Breakfast", name: "Nadi Amerta Breakfast", description: "Tropical fruit, house granola, eggs any way, Kintamani coffee.", price: 280_000, dietary: [] },
  { id: 4, category: "Breakfast", name: "Bubur Injin", description: "Black rice porridge, palm sugar, young coconut.", price: 180_000, dietary: ["vegan", "gf"] },
  { id: 5, category: "Balinese", name: "Nasi Campur Bali", description: "Ceremonial rice plate — lawar, sate lilit, urab, sambal.", price: 320_000, dietary: [] },
  { id: 6, category: "Balinese", name: "Gado-Gado", description: "Market vegetables, tempe, peanut dressing.", price: 240_000, dietary: ["vegan"] },
  { id: 7, category: "Western", name: "Rigatoni al Ragù", description: "Six-hour beef ragù, aged parmesan.", price: 340_000, dietary: [] },
  { id: 8, category: "Western", name: "Gorge View Burger", description: "Wagyu blend, brioche, hand-cut fries.", price: 380_000, dietary: [] },
  { id: 9, category: "Children", name: "Little Explorer Bowl", description: "Chicken rice bowl, cucumber, no surprises.", price: 160_000, dietary: ["gf"] },
  { id: 10, category: "Cellar", name: "Plaga Chardonnay", description: "Bali's own — bright, cold, made for pool afternoons. Bottle.", price: 520_000, dietary: ["vegan", "gf"] },
];

export const fnbOrders: FnbOrder[] = [
  { id: 301, villaSlug: "villa-tirta", guestName: "Amara Chen", items: [{ name: "Ayung River Prawns", qty: 2, price: 420_000 }, { name: "Plaga Chardonnay", qty: 1, price: 520_000 }], state: "kitchen", placed: "12:42", note: "No chilli in one portion, please." },
  { id: 302, villaSlug: "villa-lotus", guestName: "Kenji & Yui Tanaka", items: [{ name: "Nasi Campur Bali", qty: 2, price: 320_000 }], state: "received", placed: "12:55" },
  { id: 303, villaSlug: "villa-surya", guestName: "Anya Sharma", items: [{ name: "Gorge View Burger", qty: 3, price: 380_000 }, { name: "Little Explorer Bowl", qty: 2, price: 160_000 }], state: "delivering", placed: "12:15" },
  { id: 304, villaSlug: "villa-chandra", guestName: "David & Emma Cole", items: [{ name: "Nadi Amerta Breakfast", qty: 2, price: 280_000 }], state: "billed", placed: "08:05" },
];

/* ------------------------------------------------------------------ */
/* Requests & complaints — BPMN B11 / UC-FO5                           */
/* ------------------------------------------------------------------ */

export const guestRequests: GuestRequest[] = [
  { id: 401, type: "request", subject: "Extra yoga mats", detail: "Could we have two more mats on the deck for tomorrow's sunrise session?", state: "resolved", created: "Jul 5, 09:12", villa: "Villa Tirta", guestName: "Amara Chen", priority: "low" },
  { id: 402, type: "request", subject: "Late checkout on the 8th", detail: "Our flight leaves at 21:40 — is a 16:00 checkout possible?", state: "in_progress", created: "Jul 5, 18:30", villa: "Villa Tirta", guestName: "Amara Chen", priority: "medium" },
  { id: 403, type: "complaint", subject: "Pool heating", detail: "The plunge pool was noticeably cold last evening.", state: "open", created: "Jul 6, 07:48", villa: "Villa Lotus", guestName: "Kenji & Yui Tanaka", priority: "high" },
];

/* ------------------------------------------------------------------ */
/* Housekeeping — BPMN B24/B25 · Inventory — UC-HK2                    */
/* ------------------------------------------------------------------ */

export const hkTasks: HousekeepingTask[] = [
  {
    id: 501, villaSlug: "villa-chandra", type: "Turnover", assignee: "Ni Kadek Ayu", due: "13:00", state: "doing",
    checklist: [
      { label: "Strip & replace linen", done: true }, { label: "Bathroom & amenities", done: true },
      { label: "Pool skim & deck", done: false }, { label: "Minibar restock", done: false },
      { label: "Inspection photos", done: false },
    ],
  },
  {
    id: 502, villaSlug: "villa-hibiscus", type: "Turnover", assignee: "I Wayan Putra", due: "14:30", state: "doing",
    checklist: [
      { label: "Strip & replace linen", done: true }, { label: "Bathroom & amenities", done: true },
      { label: "Pool skim & deck", done: true }, { label: "Minibar restock", done: true },
      { label: "Inspection photos", done: false },
    ],
  },
  {
    id: 503, villaSlug: "villa-tirta", type: "Stayover", assignee: "Ni Luh Sari", due: "12:00", state: "todo",
    checklist: [
      { label: "Refresh linen & towels", done: false }, { label: "Amenity top-up", done: false },
      { label: "Deck & pool check", done: false },
    ],
  },
  {
    id: 504, villaSlug: "villa-jepun", type: "Deep clean", assignee: "I Made Agus", due: "Tomorrow", state: "todo",
    checklist: [
      { label: "Full villa deep clean", done: false }, { label: "AC service access", done: false },
      { label: "Garden path reset", done: false },
    ],
  },
];

export const stock: StockItem[] = [
  { id: 1, name: "Bath towels (white, 700gsm)", category: "Linen", qty: 42, min: 60, unit: "pcs", supplier: "CV Bali Textile" },
  { id: 2, name: "King bed linen set", category: "Linen", qty: 28, min: 24, unit: "sets", supplier: "CV Bali Textile" },
  { id: 3, name: "Frangipani amenity kit", category: "Amenity", qty: 55, min: 40, unit: "kits", supplier: "Utama Spice Bali" },
  { id: 4, name: "Sandalwood massage oil", category: "Spa", qty: 9, min: 12, unit: "L", supplier: "Utama Spice Bali" },
  { id: 5, name: "Kintamani coffee beans", category: "F&B", qty: 18, min: 10, unit: "kg", supplier: "Kintamani Coffee" },
  { id: 6, name: "Pool chlorine tablets", category: "Operations", qty: 31, min: 20, unit: "kg", supplier: "Pasar Badung Co-op" },
];

/* ------------------------------------------------------------------ */
/* Finance — ERD account.move(.line) / account.payment                 */
/* ------------------------------------------------------------------ */

export const ledger: LedgerEntry[] = [
  { id: 1, date: "Jul 6", description: "Villa Frangipani · 5 nights", reference: "NA-0607-FRA", stream: "Rooms", debit: 0, credit: 41_000_000 },
  { id: 2, date: "Jul 6", description: "F&B · in-villa dining", reference: "NA-0407-TIR", stream: "F&B", debit: 0, credit: 1_360_000 },
  { id: 3, date: "Jul 5", description: "River Stone Ritual ×2", reference: "NA-0307-LOT", stream: "Spa", debit: 0, credit: 3_700_000 },
  { id: 4, date: "Jul 5", description: "Airport transfer", reference: "NA-0607-SUR", stream: "Transfers", debit: 0, credit: 650_000 },
  { id: 5, date: "Jul 5", description: "Linen restock · CV Bali Textile", reference: "PO-2026-118", stream: "Expense", debit: 8_400_000, credit: 0 },
  { id: 6, date: "Jul 4", description: "Villa Tirta · 4 nights", reference: "NA-0407-TIR", stream: "Rooms", debit: 0, credit: 34_000_000 },
  { id: 7, date: "Jul 4", description: "Banjar & adat contribution · July", reference: "EXP-BJR-07", stream: "Expense", debit: 3_500_000, credit: 0 },
  { id: 8, date: "Jul 3", description: "Villa Lotus · 7 nights", reference: "NA-0307-LOT", stream: "Rooms", debit: 0, credit: 47_600_000 },
];

export const reconciliation = [
  { id: 1, settlement: "MID-88213904", amount: 40_120_000, invoice: "INV/2026/0412", state: "matched" as const },
  { id: 2, settlement: "MID-88214472", amount: 25_488_000, invoice: "INV/2026/0418", state: "matched" as const },
  { id: 3, settlement: "MID-88215091", amount: 3_700_000, invoice: "—", state: "unmatched" as const },
];

export const revenueSeries = [
  { day: "Jun 8", revenue: 9.2 }, { day: "Jun 11", revenue: 11.4 }, { day: "Jun 14", revenue: 10.1 },
  { day: "Jun 17", revenue: 12.6 }, { day: "Jun 20", revenue: 12.0 }, { day: "Jun 23", revenue: 13.4 },
  { day: "Jun 26", revenue: 12.8 }, { day: "Jun 29", revenue: 14.1 }, { day: "Jul 2", revenue: 13.6 },
  { day: "Jul 5", revenue: 15.4 },
];

export const kpis = {
  occupancy: { value: "87%", delta: "↑ 8 pts vs June", positive: true },
  adr: { value: "IDR 8.6M", delta: "↑ 4% vs June", positive: true },
  revenueMtd: { value: "IDR 412M", delta: "↑ 12% vs June", positive: true },
  arrivalsToday: { value: "3", delta: "earliest 13:00", positive: true },
  phrLiability: { value: "IDR 41.2M", delta: "due Jul 15", positive: false },
  outstanding: { value: "IDR 12.7M", delta: "2 folios", positive: false },
};

/* ------------------------------------------------------------------ */
/* Reviews & FAQ                                                       */
/* ------------------------------------------------------------------ */

export const reviews: Review[] = [
  { id: 1, quote: "We came for four nights and stayed nine. The river does something to your sense of time — and the staff seem to know what you need a full day before you do.", name: "Charlotte M.", date: "May 2026", rating: 5 },
  { id: 2, quote: "The flower-water blessing on arrival undid two years of work stress in about four minutes. Villa Tirta's pool at dawn is the single best thing I've done for myself.", name: "Daniel & Priya", date: "Apr 2026", rating: 5 },
  { id: 3, quote: "Quietly perfect. No lobby music, no laminated menus, no schedule. Just the gorge, Chef Ketut's duck, and the kind of service you only notice afterwards.", name: "Hiroshi T.", date: "Feb 2026", rating: 5 },
];

export const faqs = [
  { category: "Reservations", q: "How far in advance should we book?", a: "For July–August and the December holidays, three to five months. Shoulder seasons usually have availability four to six weeks out. Our calendar shows live availability for every villa." },
  { category: "Reservations", q: "What is the cancellation policy?", a: "Free cancellation until 7 days before arrival for Flexible rates. Within 7 days, the first two nights are retained. Non-refundable rates save 10% and cannot be cancelled — we state the exact cut-off date and amount before you pay." },
  { category: "Payments", q: "Which payment methods do you accept?", a: "Cards (Visa, Mastercard, JCB), Indonesian bank transfer (virtual account), QRIS, GoPay and OVO — all processed securely via Midtrans. Prices include PHR tax (10%) and service (8%)." },
  { category: "Payments", q: "Can I pay a deposit instead of the full amount?", a: "Yes — reserve with a 30% deposit; the balance is charged automatically 7 days before arrival. Both dates and amounts are shown before you confirm." },
  { category: "Getting here", q: "How do we reach the estate from the airport?", a: "We are 90 minutes from Ngurah Rai International. Add a private transfer during booking, or share your flight number and we will track delays and meet you regardless." },
  { category: "During your stay", q: "Is in-villa dining available all day?", a: "The kitchen serves 06:00–22:00 daily. Outside those hours a night menu of cold dishes is available, and your butler can arrange anything within reason." },
  { category: "Nyepi & ceremonies", q: "What happens during Nyepi?", a: "Nyepi is Bali's Day of Silence — one day each March when the whole island pauses: no travel, no outside activity, screened lights after dark. The estate observes it fully; in-house guests describe it as the most memorable day of their stay. Arrivals and departures are not possible on Nyepi, and our calendar blocks it automatically." },
];

/* ------------------------------------------------------------------ */
/* Journey timeline (portal + confirmation)                            */
/* ------------------------------------------------------------------ */

export const journeySteps = [
  { label: "Booked", date: "Jul 2", state: "done" as const },
  { label: "Payment complete", date: "Jul 2", state: "done" as const },
  { label: "Arrival ritual planned", date: "Jul 20", state: "current" as const },
  { label: "Pre-arrival concierge", date: "Aug 5", state: "todo" as const },
  { label: "Check-in at Villa Tirta", date: "Aug 12 · 14:00", state: "todo" as const },
];
