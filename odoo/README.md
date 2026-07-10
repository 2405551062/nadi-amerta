# Nadi Amerta — Odoo Backend

Odoo 17 + PostgreSQL 15, running in Docker inside WSL2, exposing the ERD's models
to the Next.js frontend over the JSON-RPC external API.

> Contract: `../design/09-odoo-integration.md` (data contract) and
> `../design/10-traceability.md` (which models back which pages).

## What's here

```
odoo/
├── docker-compose.yml         Odoo 17 + Postgres 15
├── config/odoo.conf           addons path, db, dev flags
├── .env                       DB_PASSWORD (local dev)
├── addons/nadi_amerta/        the custom module (the ERD lives here)
└── scripts/
    ├── wsl-docker-setup.sh    one-time: install Docker Engine in WSL Ubuntu
    ├── init-db.sh             create + init the `nadi` database
    └── update-module.sh       upgrade the module after edits
```

## The custom module — `nadi_amerta`

Everything the ERD requires that stock Odoo doesn't already provide:

| Model | ERD / BPMN | Notes |
|---|---|---|
| `villa.reservation` | ERD custom model | partner_id, product_id, sale_order_id, dates, state, notes. Workflow: draft → confirmed (B4) → checked_in (B7) → checked_out (B18); check-out spawns a turnover task (B24). |
| `villa.housekeeping.task` | B24/B25 (gap §1.5.1) | Advancing to Done marks the villa Available. |
| `villa.guest.request` | B11 / UC-FO5 (gap §1.5.3) | Guest requests & complaints, mail.thread tracked. |
| `product.template` x_ fields | ERD product.product | x_kind, x_villa_type, x_view, x_bedrooms, x_capacity, x_size_m2, x_min_stay, x_slug, x_facilities, x_availability. |
| `res.partner` x_ fields | ERD res.partner | x_nik_paspor, x_nationality, preferences, loyalty tier. |
| `res.groups` (6) | ERD RBAC | Front Office, Housekeeping, F&B, Finance, Back Office, General Manager. |

Inventory (UC-HK2) reuses the standard Odoo **Inventory** app (`stock`).
Payments/invoicing reuse **Accounting** (`account.move`, `account.payment`) and Sales
(`sale.order`), exactly as the ERD models them.

## First run

Prerequisites (already done on this machine): WSL2 + Ubuntu-24.04 + Docker Engine.
To reproduce elsewhere: `bash scripts/wsl-docker-setup.sh` then `wsl --shutdown`.

```bash
# from Windows PowerShell — everything runs inside the WSL distro
wsl -d Ubuntu-24.04 -u root -- bash -c "cd /mnt/c/xampp/htdocs/nadi-amerta/odoo && docker compose up -d"
wsl -d Ubuntu-24.04 -u root -- bash /mnt/c/xampp/htdocs/nadi-amerta/odoo/scripts/init-db.sh
```

Then:
- Odoo UI → http://localhost:8069  (database `nadi`, login **admin** / **admin**)
- Health probe → http://localhost:8069/nadi/health → `{"status":"ok","villas":8}`

After editing anything under `addons/nadi_amerta/`, apply it:
```bash
wsl -d Ubuntu-24.04 -u root -- bash /mnt/c/xampp/htdocs/nadi-amerta/odoo/scripts/update-module.sh
```

## How the frontend talks to it

The Next.js BFF (`../web/lib/odoo.ts`) calls Odoo's `/jsonrpc` endpoint:

1. `common.authenticate(db, login, key, {})` → uid (cached)
2. `object.execute_kw(db, uid, key, model, method, args, kwargs)`

Config in `../web/.env.local`:

```
ODOO_URL=http://localhost:8069
ODOO_DB=nadi
ODOO_USER=admin
ODOO_API_KEY=admin      # dev; use a real API key in production
USE_ODOO=true           # false → frontend uses lib/data.ts mocks
```

### Production hardening (later)
- Replace `admin`/`admin` with a dedicated **service user** in only the groups it needs,
  and a generated **API key** (Settings → Users → Developer API Keys) — never a password.
- Set a strong `admin_passwd` in `odoo.conf`, `list_db = False`, remove `dev_mode`.
- Put Odoo behind TLS; the BFF talks to it over the private network only.
- Add idempotency keys on booking-confirm / dining-order writes.

## Keeping the stack running (WSL gotcha)

Docker runs **inside** the WSL2 VM. WSL shuts the VM down when it thinks it is idle,
which stops Odoo + Postgres (they auto-restart via `restart: unless-stopped` the next
time the VM boots, but the ~60s gap breaks in-flight requests). Two mitigations are in
place / recommended:

1. **`C:\Users\<you>\.wslconfig`** sets `vmIdleTimeout` high (applied after `wsl --shutdown`).
2. **Hold a session open** while developing — run this in a spare terminal and leave it:
   ```powershell
   wsl -d Ubuntu-24.04 -u root -- sleep infinity
   ```
   As long as a WSL process is attached, the VM stays up.

To always-on it across reboots, add a Windows **Task Scheduler** job (trigger: At log on)
running `wsl -d Ubuntu-24.04 -u root -- bash -lc "cd /mnt/c/xampp/htdocs/nadi-amerta/odoo && docker compose up -d"`.

Health check any time: `curl http://localhost:8069/nadi/health` → `{"villas": 8}`.

## Inspecting the database

Three ways, easiest first.

**1. Odoo web UI (best for browsing/editing).** http://localhost:8069 → db `nadi`,
login **admin** / **admin**. Turn on Developer Mode (Settings → Activate the developer
mode) to see raw models under Settings → Technical. Custom data is under the
**Nadi Amerta** menu.

**2. psql (read-only spot checks).** The Postgres container is **`odoo-db-1`**
(user `odoo`, db `nadi`). Odoo table names use underscores (`villa.reservation` →
`villa_reservation`):

```powershell
# interactive shell
wsl -d Ubuntu-24.04 -u root -- docker exec -it odoo-db-1 psql -U odoo -d nadi

# or one-off query with -c
wsl -d Ubuntu-24.04 -u root -- docker exec odoo-db-1 psql -U odoo -d nadi -c "SELECT name, state, check_in_date FROM villa_reservation ORDER BY id DESC LIMIT 12;"
```

Handy queries once inside:
```sql
\dt villa*                                          -- list custom tables
SELECT name, state, guests, check_in_date, check_out_date FROM villa_reservation ORDER BY id DESC;
SELECT name, x_villa_type, list_price FROM product_template WHERE x_kind='villa';
SELECT name, email, x_loyalty_tier FROM res_partner WHERE email IS NOT NULL;
SELECT * FROM villa_housekeeping_task;
SELECT * FROM villa_guest_request;
\q
```

⚠️ **Read via SQL, but never write via SQL.** Odoo computes/caches fields in the ORM;
direct writes bypass that and corrupt record state. Edit through the UI or the app.

**3. The BFF/API (what the site actually sees).** `http://localhost:3000/api/villas`
returns the same records the browser gets, as JSON — good for confirming UI == DB.

## Verifying the frontend reads Odoo (not mocks)

`scripts/sentinel-test.sh set` writes a sentinel price (7,777,777) onto Villa Tirta in
Postgres; hit `http://localhost:3000/api/villas` and Villa Tirta's `priceNight` shows the
sentinel — impossible from the mock (which says 8,500,000). `scripts/sentinel-test.sh reset`
restores it. This was used to confirm the live wiring end-to-end.

## What the frontend reads/writes from Odoo (all domains live)

| Domain | Odoo model(s) | Reads | Writes |
|---|---|---|---|
| Villas | `product.template` (x_kind=villa) | landing, search, detail | villa status (housekeeping) |
| Reservations | `villa.reservation` (+ `sale.order`) | portal stays, confirmation, reception board, admin | booking confirm, check-in, check-out, cancel, new (reception) |
| Services | `product.template` (service) + `villa.service.booking` | portal services catalog | add-to-stay |
| Dining | `product.template` (fnb) + `villa.fnb.order(.line)` | portal menu, F&B kitchen queue | place order, advance order |
| Requests | `villa.guest.request` | portal requests, reception queue | submit, take, resolve |
| Housekeeping | `villa.housekeeping.task` + villa status | housekeeping board | advance task, set villa status |
| Inventory | `product.template` (supply) | inventory table | restock |
| Invoices/Finance | derived from `villa.reservation` | portal invoices, finance dashboard | — (accounting deferred) |
| Profile | `res.partner` | portal profile | save preferences |

`web/lib/server/*.ts` hold the data-access functions (Odoo call + mapper + mock fallback);
`web/app/api/*` are thin write routes; server components read the `lib/server` functions
directly. Every Odoo-backed page sets `export const dynamic = "force-dynamic"` (or inherits
it from the `portal`/`ops` layout) so it renders per-request against live data.

### Access control note
The BFF authenticates as `admin`, which must belong to the **General Manager** Nadi group
(implies all roles) to read/write the custom models. If writes fail with
"not allowed to create 'Villa Reservation'", run
`scripts/grant-admin.sh` then `docker compose restart odoo`.

### Hardening added (2026-07-07)
- **Auth**: passwordless guest OTP (`villa.otp`, dev code echoed when no SMTP) + staff login
  against `res.users`; signed-JWT session cookie (`jose`); `middleware.ts` guards `/portal`,
  `/ops`, and `/api/ops/*` (401 for API, redirect for pages). Dev staff creds: `admin/admin`.
- **Real availability**: villa search + booking calendars disable dates from actual
  `villa.reservation` overlaps; the model constraint also blocks double-booking on write.
- **Real PDF invoices** (`pdf-lib`) at `/api/invoices/[code]/pdf`; wired to every download button.
- **Cancellation policy engine** (server-computed refund from days-to-arrival) + working
  modify-dates dialog.
- **Housekeeping checklists** persist per item (`checklist_json`); **inventory** restock records
  a `villa.stock.move` audit trail.
- **Real exports**: CSV (marketing / legal / booking-docs / PHR) + analytics PDF at
  `/api/ops/exports/[type]`.
- **Email notifications** via Odoo `mail.mail` on booking confirm + request create/resolve
  (delivered when an outgoing mail server is configured).
- **Real-time**: in-process SSE bus (`/api/ops/stream`) refreshes ops consoles on any change.

### Payments — Midtrans Snap (added 2026-07-07)
The booking flow now collects payment before the reservation is confirmed (BPMN B20):

1. "Confirm & pay" → `POST /api/payments/create` opens a Midtrans **Snap** transaction and
   returns a token; the browser shows the Snap popup (sandbox test cards).
2. On success the browser calls `POST /api/reservations`, which **re-verifies the payment
   server-side** with Midtrans (`/v2/{order}/status`) before running `action_confirm`, then
   records it via `villa.reservation.register_payment` → `payment_state` (`paid`/`deposit`/
   `pending`), `paid_amount`, `payment_ref`, `payment_method`.
3. The confirmation page shows a live "Paid in full / Deposit paid / Payment pending" badge.

Configure keys in `web/.env.local` (`MIDTRANS_SERVER_KEY`, `MIDTRANS_CLIENT_KEY`,
`MIDTRANS_IS_PRODUCTION`). **Leave both keys blank** and the flow falls back to a clearly
labelled *simulated* gateway so the demo works with no account. Get free sandbox keys at
https://dashboard.sandbox.midtrans.com → Settings → Access Keys. Code:
`web/lib/server/payments.ts`, `web/app/api/payments/create/route.ts`. Note: settlement here
relies on the client reporting success + a server status check (no public notification
webhook, since it can't reach localhost) — add the webhook for production.

### Still deferred
Real Odoo **Accounting** posting to `account.move` (invoices are real PDFs but derived from
reservations — needs the Indonesian fiscal localization for journals/taxes); **WhatsApp** notifications
(deep-link only, no Business API); SSE is single-instance (use Redis pub/sub to scale out).
Auth env: set a strong `AUTH_SECRET` and `AUTH_DEV_ECHO=false` in production.
