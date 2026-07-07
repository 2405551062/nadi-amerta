# Nadi Amerta — Requirements Traceability Specification

**Contractual sources:** Use Case Diagram (UC) · BPMN Process Diagram (B) · ERD (Odoo models).
Rule: every page traces to use cases, BPMN steps, ERD entities, Odoo models, and REST endpoints.
No page without traceability; no use case without a page or workflow.

---

## 1. Contract inventory

### 1.1 Actors → app areas
| Actor | App area |
|---|---|
| Customer (Tamu) | Public site + booking flow + guest portal |
| Front Office | `/ops/reception` |
| Back Office | `/ops/backoffice` |
| Finance | `/ops/finance` |
| Housekeeping | `/ops/housekeeping` (+ `/inventory`) |
| F&B | `/ops/fnb` |

### 1.2 Use cases (UC-x)
UC-C1 Book Villa · UC-C2 Receive booking confirmation · UC-C3 Check-in Villa · UC-C4 Cancel Booking (refund policy) · UC-C5 Request additional services · UC-C6 Check-out and make payment · UC-F1 Generate Financial Report (Finance + Back Office) · UC-FO1 Validate villa availability · UC-FO2 Process and confirm reservation · UC-FO3 Assign villa to guest · UC-FO4 Welcome and coordinate guest · UC-FO5 Handle complaint and request · UC-HK1 Clean villa and update status · UC-HK2 Manage Inventory · UC-FB1 Process F&B order and billing

### 1.3 BPMN steps (B-x)
| ID | Lane · Step |
|---|---|
| B1 | Customer · Book Villa (online/agent/walk-in) |
| B2 | FO · Receive booking (OTA/direct) |
| B3 | FO · Villa available? (gateway) |
| B4 | FO · Confirm booking & update system |
| B5 | Customer · Receive booking confirmation |
| B6 | Customer · Check-in villa (arrival) |
| B7 | FO · Check-in process (verify ID, assign villa) |
| B8 | FO · Welcome & coordinate guest |
| B9 | Customer · Stay & use villa services |
| B10 | FO · Monitor villa status (occupied) |
| B11 | FO · Handle request & complaint |
| B12 | BO · Generate booking documentation |
| B13 | BO · Export data for marketing/legal |
| B14 | BO · Generate reports & analytics |
| B15 | F&B · Receive F&B order from guest |
| B16 | F&B · Process payment & send to ERP |
| B17 | Customer · Check-out & make payment |
| B18 | FO · Process check-out (update villa status) |
| B19 | Finance · Retrieve charges from billing |
| B20 | Finance · Process payment (cash/card) |
| B21 | Finance · Validate payment |
| B22 | Finance · Generate invoice |
| B23 | Finance · Update financial reports |
| B24 | HK · Receive clean-villa task (after check-out) |
| B25 | HK · Clean villa & update status (ready for sale) |
| ERP | Core modules: Reservation Mgmt · CRM · Billing · Inventory |

### 1.4 ERD entities (E-x)
`res.partner` · `res.users` · `res.groups` · `product.product` (villa & services; `x_kind`, `x_villa_type`, `x_capacity`, `x_availability`, `x_facilities`) · `sale.order` · `sale.order.line` · `account.move` · `account.payment` · **`villa.reservation`** (custom: partner_id, product_id, sale_order_id, check_in_date, check_out_date, state, notes)

> **Alignment note (contract wins):** `09-odoo-integration.md` previously assumed a community hotel/folio
> module. The ERD's custom **`villa.reservation`** is authoritative — reservations are `villa.reservation`
> records linked to a `sale.order` (villa nights + services + F&B as `sale.order.line`s), invoiced via
> `account.move`, paid via `account.payment`. Availability = absence of overlapping non-cancelled
> `villa.reservation` for the `product.product` villa. Endpoints below reflect this.

### 1.5 Contract gaps surfaced (no unilateral change made)
The BPMN/UC require three workflows the ERD does not model. UI is built and traced to BPMN; backend needs
minimal additions **pending your approval**:
1. **Housekeeping tasks** (B24/B25, UC-HK1) — proposed custom `villa.housekeeping.task` (villa, type, assignee, state, checklist) or reuse `mail.activity`. Villa status itself lives on `product.product.x_availability` per ERD.
2. **Inventory stock** (UC-HK2, ERP Inventory module) — proposed Odoo `stock.quant`/`stock.picking` (standard Inventory app) for amenity/linen stock; ERD models products but not stock levels.
3. **Requests & complaints** (B11, UC-FO5) — proposed custom `villa.guest.request` (partner, reservation, type, priority, state, thread) or Odoo Helpdesk; currently traced to the BPMN CRM module.

---

## 2. Page inventory & traceability matrix

### Guest-facing

| # | Page (route) | Why it exists | Use cases | BPMN | ERD entities | Odoo models | REST endpoints |
|---|---|---|---|---|---|---|---|
| P1 | Landing `/` | Entry to B1 online channel; brand trust for high-AOV booking | UC-C1 | B1 | product.product | product.template/product | `GET /api/villas` (featured) |
| P2 | Villa search `/villas` | Self-service availability validation before booking | UC-C1, UC-FO1 (self-serve) | B1, B3 | product.product, villa.reservation | idem | `GET /api/villas?checkin&checkout&guests…` |
| P3 | Villa detail `/villas/[slug]` | Decision surface; per-date availability + price | UC-C1 | B1, B3 | product.product, villa.reservation | + product.pricelist | `GET /api/villas/[slug]`, `GET …/calendar` |
| P4 | Booking flow `/book/[slug]/(dates·details·confirm)` | Executes B1→B4 online; captures guest, services, payment | UC-C1, UC-C5 (pre-arrival) | B1, B3, B4, B20 (online) | res.partner, villa.reservation, sale.order(.line), account.payment | idem + Midtrans acquirer | `POST /api/reservations/draft`, `POST /api/reservations/[id]/confirm`, `POST /api/webhooks/midtrans` |
| P5 | Confirmation & pre-arrival hub `/stays/[code]` | Proof of B5; pre-check-in (ID upload) accelerates B7 | UC-C2, UC-C3 | B5, B6 (prep), B12 (doc for guest) | villa.reservation, sale.order, account.move | idem | `GET /api/stays/[code]`, `POST …/precheckin`, `GET …/ics` |
| P6 | Auth `/signin` · `/join` | Account access for portal use cases | supports UC-C2…C6 | — | res.users, res.partner | idem | `POST /api/auth/otp`, `POST /api/auth/verify` |
| P7 | Guest dashboard `/portal` | Single view of stay state (B5–B9); journey timeline | UC-C2, UC-C5 | B5, B9 | villa.reservation, sale.order | idem | `GET /api/stays?scope=upcoming` |
| P8 | Reservation history `/portal/stays` | Manage/modify/cancel with refund policy | UC-C4, UC-C2 | B4 (modify), cancel branch of B3/B4 | villa.reservation, sale.order, account.move (credit note) | idem | `GET /api/stays`, `POST /api/stays/[code]/cancel` (two-step refund quote) |
| P9 | Invoices `/portal/invoices` | Guest copy of B22 output; payment evidence | UC-C6 | B22 | account.move, account.payment | idem | `GET /api/invoices`, `GET /api/invoices/[id]/pdf` |
| P10 | Services `/portal/services` | Order additional services during stay | UC-C5 | B9 | product.product (x_kind=service), sale.order.line | idem | `GET /api/services`, `POST /api/services/book` |
| P11 | Dining `/portal/dining` | Guest side of F&B order loop | UC-C5, UC-FB1 (initiates) | B9, B15 | product.product (F&B), sale.order.line | idem (or pos.order) | `GET /api/dining/menu`, `POST /api/dining/orders`, `GET …/status` |
| P12 | **Requests & concierge `/portal/requests`** *(new)* | B11/UC-FO5 have no guest-side surface in the old spec; complaints need a tracked channel, not just WhatsApp | UC-FO5 (guest side), UC-C5 | B11 | res.partner (+gap §1.5.3) | CRM module | `GET/POST /api/requests` |
| P13 | Profile `/portal/profile` | CRM data the ERD stores on res.partner (x_nik_paspor, x_nationality, prefs) | supports all C | ERP CRM | res.partner | idem | `GET/PATCH /api/profile` |
| P14 | About `/about` · Contact `/contact` · FAQ `/faq` | Trust & support; contact is a B11 entry point | UC-FO5 (entry) | B11 (entry) | res.partner (lead) | crm.lead (optional) | `POST /api/contact` |
| P15 | Errors `404` / `500` | Recovery surfaces | — | — | — | — | — |

### Staff-facing (`/ops/*`, guarded by res.groups per E-x RBAC)

| # | Page | Why it exists | Use cases | BPMN | ERD entities | Odoo models | REST endpoints |
|---|---|---|---|---|---|---|---|
| P16 | Admin dashboard `/ops` | GM oversight of the whole process; occupancy/revenue KPIs | UC-F1 (view) | B10, B14, B23 (read) | all | all | `GET /api/ops/kpis`, `GET /api/ops/villa-status` (SSE) |
| P17 | Reception `/ops/reception` | FO lane home: today board, check-in/out, occupancy grid, requests queue | UC-FO1–FO5, UC-C3, UC-C6 (staff side) | B2, B3, B4, B7, B8, B10, B11, B18 | villa.reservation, sale.order, res.partner, product.product | idem | `GET /api/ops/arrivals`, `POST /api/ops/checkin/[id]`, `POST /api/ops/checkout/[id]`, `GET /api/ops/calendar`, `GET/PATCH /api/ops/requests` |
| P18 | New reservation (dialog in P17) | B1's agent/walk-in + B2's OTA channels — bookings that don't come from the website | UC-C1 (assisted), UC-FO1, UC-FO2 | B1 (agent/walk-in), B2, B3, B4 | villa.reservation, sale.order, res.partner | idem | `POST /api/ops/reservations` (source: direct/agent/walkin/ota) |
| P19 | Housekeeping `/ops/housekeeping` | HK lane: post-checkout task queue, status board Dirty→Ready | UC-HK1 | B24, B25, B10 (feeds) | product.product (x_availability) (+gap §1.5.1) | idem | `GET /api/ops/hk/tasks`, `POST …/tasks/[id]/advance`, `PATCH /api/ops/villas/[id]/status` |
| P20 | **HK inventory `/ops/housekeeping/inventory`** *(new)* | UC-HK2 and the ERP Inventory module box have no page in the old spec | UC-HK2 | ERP Inventory | product.product (+gap §1.5.2) | stock.quant/picking | `GET /api/ops/inventory`, `POST …/restock` |
| P21 | **F&B console `/ops/fnb`** *(new)* | UC-FB1/B15–B16 had only a guest surface; kitchen needs an order queue + billing handoff | UC-FB1 | B15, B16 | sale.order.line, account.move | idem (or pos.order) | `GET /api/ops/fnb/orders`, `POST …/orders/[id]/advance`, `POST …/orders/[id]/bill` |
| P22 | Finance `/ops/finance` | Finance lane: charges, payment validation, invoicing, reports | UC-F1, UC-C6 (settlement) | B19, B20, B21, B22, B23 | account.move, account.payment, sale.order | idem | `GET /api/ops/finance/ledger`, `GET …/reconciliation`, `POST …/invoices/[id]/validate`, `POST …/invoices/generate`, `GET …/reports` |
| P23 | **Back office `/ops/backoffice`** *(new)* | B12–B14 (documentation, marketing/legal export, analytics) had no page anywhere | UC-F1 (shared) | B12, B13, B14 | villa.reservation, sale.order, res.partner, account.move | idem | `GET /api/ops/reports/analytics`, `POST /api/ops/exports` (type: booking-docs / marketing / legal), `GET /api/ops/exports/[id]` |

## 3. Coverage verification

**Use cases:** C1→P1–P4, P18 · C2→P5, P7 · C3→P5 (pre-check-in) + P17 (check-in process) · C4→P8 · C5→P4, P10, P11, P12 · C6→P17 (staff) + P9 (evidence) + P22 (settlement) · F1→P22, P23, P16 · FO1→P2 (self-serve), P17/P18 · FO2→P17/P18 · FO3→P17 (check-in sheet villa assignment) · FO4→P17 (welcome checklist) · FO5→P12 (guest) + P17 (queue) · HK1→P19 · HK2→P20 · FB1→P11 (guest) + P21 (staff). **No orphan use cases.**

**BPMN:** B1→P1–P4/P18 · B2→P18 · B3→P2/P3/P17 · B4→P4/P17 · B5→P5 · B6→P5/P17 · B7→P17 · B8→P17 · B9→P7/P10/P11 · B10→P16/P17/P19 · B11→P12/P17 · B12→P23 · B13→P23 · B14→P23/P16 · B15→P11/P21 · B16→P21 · B17→P17+P9 · B18→P17 · B19–B23→P22 · B24/B25→P19. **No orphan steps.**

**ERD:** every entity is read/written by at least one page (res.groups powers `/ops` route guards; res.users powers auth). **No orphan entities.**
