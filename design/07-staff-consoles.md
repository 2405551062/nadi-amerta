# Nadi Amerta — Staff Consoles Specification

Reference render: `assets/tirta-admin-dashboard.png`. Shared shell: forest-900 sidebar (components §7),
ivory canvas, serif greeting header (`Good morning, Made` + date + Balinese calendar note when relevant,
e.g. `Galungan in 4 days`), global search `⌘K` (villas, guests, bookings), notification bell with drawer.
Role-based nav per console; one Next.js app, routes under `/ops/*`, guarded by Odoo roles (§09).
Density: staff tables run h-48 rows (tighter than guest side); typography and color rules unchanged —
**the brand does not stop at the back office.**

---

## 1. Admin Dashboard — `/ops` (General Manager)

### Layout
1. **KPI row** — four hairline cards: Occupancy % · ADR · Revenue MTD · Arrivals today. Each: 12px caps label, 28px value (mono for money), sage sparkline (30d), delta chip `↑ 8 pts vs last month` (gold chip = positive, stone = neutral, terracotta = negative — always with direction glyph + label, never color-only).
2. **Revenue chart** (8 cols): 30-day area chart, palm fill + gold ADR overlay line, range toggle 7/30/90; draw-in once.
3. **Today's arrivals** (4 cols): avatar rows — guest, villa, ETA, status badge (Confirmed/Pending/VIP gold-outline); row → reservation drawer.
4. **Villa status grid**: 8 cards (2×4): villa name, status dot + label (Occupied palm · Cleaning amerta · Available sage · Maintenance terracotta), guest name if occupied, tap → villa drawer with today's timeline. Status changes pulse (motion §3).
5. **Anomaly feed**: quiet alert list from AI insights (e.g., "Villa Lotus consuming 2.1× linen average") — info-variant alerts, dismiss/assign actions.

### Journey & decisions
GM opens at 07:30: money trend, who lands today, what's wrong — in one screen without clicking. Charts draw once (no dancing dashboards); anything actionable opens a drawer instead of navigating away, preserving the morning-scan flow.

## 2. Reception Dashboard — `/ops/reception` (Front Office)

### Layout
1. **Today board** — three columns (kanban-like, drag disabled — state changes via buttons): **Arrivals** (guest card: name, villa, ETA, pickup flag, `Check in` primary-sm) · **In-house** (villa, nights remaining, folio balance mono) · **Departures** (checkout time, folio settled badge, `Check out`).
2. **Check-in sheet** (from Arrivals card): passport/ID capture upload, arrival ritual checklist (blessing prepared ✓, welcome drink), deposit verification line, room-ready indicator live from housekeeping (blocks check-in with amerta warning if villa not `Ready` — override requires manager PIN dialog), `Complete check-in` → card slides to In-house with sage pulse.
3. **Occupancy calendar** — 14-day × 8-villa grid: booking bars (palm = confirmed, sand-outline = pending, stone = OTA-sourced with channel glyph), **Nyepi column shaded sand** with tooltip; drag bar edges to modify dates (confirm dialog with rate delta); click empty cell → new reservation dialog (mini booking flow: guest lookup/create, dates, rate, source).
4. **Guest lookup** `⌘K`: by name/phone/code → profile drawer: preferences (dietary chips!), stay history, loyalty tier, notes field (visible to all staff, timestamped).

### Decisions & motion
Reception thinks in *today* and *the grid* — both are first-class, everything else is drawers. Column moves animate via `layout` (400ms); the room-ready indicator is the housekeeping console's live output — the two consoles share state through Odoo, and the UI makes that dependency visible instead of hiding it.

## 3. Housekeeping Dashboard — `/ops/housekeeping`

### Layout (tablet-first — used standing, on the move)
1. **Villa board**: 8 large cards (2×4 tablet portrait): villa name serif 20px, status segmented control on-card — `Dirty → Cleaning → Inspection → Ready` (tap advances with 300ms color crossfade + pulse; regress requires long-press + confirm). Occupied villas show `Occupied · DND until 12:00` and lock the control.
2. **Task queue**: assignment rows — villa, task type chip (Turnover · Stayover · Deep clean), assignee avatar Select, due chip (red-shifts terracotta when < 30 min to arrival), checklist sheet per task (linen ✓, minibar ✓, pool skim ✓, photo-proof upload for inspection) — completing all items auto-advances villa status.
3. **Supplies strip**: low-stock alerts from inventory (amenity kits, linen) with `Request restock` → creates Odoo internal transfer (§09).
4. **Arrival pressure header**: "3 arrivals today · earliest 13:00 · 2 villas not ready" — the single sentence that runs the morning.

### Decisions & motion
Buttons are 56px — thumb-first; statuses are color + word + position (WCAG); the checklist photo-proof pattern replaces supervisor walk-throughs for stayovers. Card status changes broadcast live to Reception (SSE/polling); the sync moment is celebrated with the sage pulse, not a toast storm.

## 4. Finance Dashboard — `/ops/finance`

### Layout
1. **KPI row**: Revenue MTD · Expenses MTD · Net margin % · **PHR liability** (10% tax collected, owed to Badung regency — with due-date chip) · Outstanding folios.
2. **Revenue vs expense chart**: dual area (palm vs terracotta-40%), monthly toggle; breakdown donut by stream (Rooms · F&B · Spa · Transfers).
3. **Ledger table**: filterable (type, stream, month) — date, description, booking ref (mono link), stream chip, debit/credit mono right-aligned, running balance; export CSV/XLSX.
4. **Payouts & reconciliation**: Midtrans settlement rows vs Odoo invoices with match status (Matched sage · Unmatched terracotta + `Resolve` drawer showing both sides).
5. **Payroll summary card** (read-only from HR module): monthly total by department + service-charge distribution (8%) — links into the HR console.
6. **Tax card**: PHR 10% + service 8% accrued this month, mono, `Generate PHR report (PDF)`.

### Decisions
Finance gets Stripe-dashboard clarity in brand clothing: money is *always* JetBrains Mono right-aligned, credits sage / debits ink (never red for normal debits — terracotta only for anomalies). Reconciliation-as-a-workflow (not a report) is the feature that saves real hours; every number traces to a booking ref one click away.

### Motion (all consoles)
Charts draw once per session; table rows fade in 20ms stagger capped at 10; drawers per component spec; status pulses per motion §3. No parallax, no Ken Burns — staff tools respect the register: calmer, faster (`duration-base` cap 300ms except drawers).
