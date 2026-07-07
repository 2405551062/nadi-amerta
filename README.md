# Nadi Amerta — Villa & Retreat Operations System

A full-stack reservation & operations platform for a boutique luxury villa in Ubud, Bali.
Enterprise systems case study — Universitas Udayana.

- **Frontend** — Next.js 15 (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Framer Motion
- **Backend / DB** — Odoo 17 + PostgreSQL 15 (Docker), custom `nadi_amerta` addon
- **Integration** — Next.js BFF talks to Odoo over JSON-RPC (browser never touches Odoo directly)
- **Payments** — Midtrans Snap (sandbox), with a simulated fallback when no keys are set

Guests can browse villas, check real availability, book, **pay**, and manage their stay
(dining, services, requests, invoices). Staff get reception, housekeeping, F&B kitchen,
inventory and finance consoles. Everything reads/writes live Odoo records.

## Repository layout

```
nadiamerta/
├── web/            Next.js app (the website + BFF)
├── odoo/           Odoo 17 stack — docker-compose + custom addon + scripts
├── design/         Design spec, BPMN / Use-Case / ERD, page-by-page traceability
└── README.md
```

## Quick start

**Prerequisites:** Node.js 20+, Docker (Docker Desktop is easiest), Git.

```bash
# 1. Backend — Odoo + Postgres
cd odoo
cp .env.example .env
docker compose up -d
bash scripts/init-db.sh          # first time only: creates + seeds the `nadi` DB

# 2. Frontend
cd ../web
cp .env.example .env.local
npm install
npm run dev
```

- Website → http://localhost:3000
- Odoo → http://localhost:8069 (database `nadi`, login `admin` / `admin`)
- Health → http://localhost:8069/nadi/health → `{"villas": 8}`

The database seeds a clean catalog (8 villas, services, menu, staff roles) from the addon's
data files — **runtime data (reservations, orders) is not carried by git.** To move a full
database between machines, use Odoo's backup/restore (see `odoo/README.md`).

> Detailed backend docs, the data contract, and gotchas live in [`odoo/README.md`](odoo/README.md).

## Status

Core guest journey (browse → book → pay → manage) and all staff consoles are functional
against live Odoo. Deferred: real `account.move` accounting posting, WhatsApp Business API,
online ID upload, and production deployment/hardening. See `odoo/README.md` for the full list.

---

*Nadi Amerta — "the river of the nectar of immortality" · flowing with the harmony of Bali.*
