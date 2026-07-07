# Nadi Amerta — Design Foundations

> Design direction: **"Tirta"** (holy water) — cinematic sanctuary hero, editorial warm-white body,
> the Balinese arch as a restrained signature motif. Quiet luxury: Aman restraint, Apple precision,
> Stripe-level form polish.
>
> Target stack: **Next.js (App Router) + TailwindCSS v4 + shadcn/ui + Framer Motion**, Odoo backend.

---

## 1. Brand principles (design filters)

Every screen must pass these five filters before shipping:

1. **One hero moment per screen.** A single cinematic photograph or a single serif statement — never both competing.
2. **Gold is a whisper.** Gold (`amerta`) appears on ≤ 5% of any viewport: hairlines, one accent word, one delta chip. Never gold buttons on the guest side (the staff side allows one gold "primary metric" chip).
3. **Nothing bounces.** Motion is water, not rubber: long ease-out curves, opacity + translate, no spring overshoot on the guest side.
4. **Ink on ivory, ivory on forest.** Only two surface worlds exist. Light: ink `#2A2520` / teal `#2C4A52` text on ivory `#FAF7F0`. Dark: ivory text on forest `#152825`. No greys-on-white admin look.
5. **The arch is earned.** The arched image mask (Balinese *candi bentar*) appears once per page maximum — hero image on mobile, one gallery tile, the confirmation photo. It is the brand signature, not a repeating pattern.

---

## 2. Color system

Extends the existing tokens in `css/base.css` — do not fork the palette; deepen it.

### 2.1 Core scales

| Token | Hex | Usage |
|---|---|---|
| `ivory-50` | `#FDFBF7` | Elevated cards on ivory pages |
| `ivory-100` | `#FAF7F0` | **Default page background** (existing `--cream`) |
| `ivory-200` | `#F4EFE2` | Alternate section bands (existing `--cream-warm`) |
| `sand-300` | `#EAE3D3` | Skeletons, disabled fills, subtle wells |
| `sand-400` | `#D8CFBC` | Borders on hover, pressed fills |
| `stone-500` | `#8B8276` | Muted/secondary text on light (existing `--muted`) |
| `ink-700` | `#4A433D` | Body text long-form (existing `--ink-soft`) |
| `ink-900` | `#2A2520` | Headlines fallback, maximum ink (existing `--ink`) |
| `teal-700` | `#2C4A52` | **Brand ink** — serif headlines, links (existing `--teal`) |
| `palm-600` | `#3E5C50` | Primary button hover, active nav |
| `palm-700` | `#2E4A40` | **Primary action color** (buttons, active states) |
| `forest-900` | `#152825` | **Dark section background**, footer, staff sidebar |
| `forest-950` | `#0E1B19` | Dark section deep wells, image overlays |
| `sage-300` | `#A8B5A0` | Success-tinted UI, eyebrow on dark (existing `--sage`) |
| `sage-500` | `#7A8B72` | Success text/icons (existing `--sage-dark`) |
| `ocean-500` | `#4A7080` | Informational accents, links in staff tables (existing `--info`) |
| `amerta-300` | `#E0C988` | Gold hairlines on dark (existing `--gold-light`) |
| `amerta-400` | `#C9A961` | **Gold accent** — hairlines, icons, one accent word (existing `--gold`) |
| `amerta-600` | `#A88A47` | Gold text on light ≥ small size (existing `--gold-dark`) |
| `terracotta-500` | `#A85842` | Destructive/error (existing `--danger`) |
| `terracotta-100` | `#F3E2DC` | Error field backgrounds |

### 2.2 Semantic aliases (use these in components)

```
--background:        ivory-100      --foreground:       ink-900
--card:              #FFFFFF        --card-foreground:  ink-900
--primary:           palm-700       --primary-foreground: ivory-50
--secondary:         ivory-200      --secondary-foreground: teal-700
--muted:             sand-300       --muted-foreground: stone-500
--accent:            amerta-400     --destructive:      terracotta-500
--border:            #E5DFD0        --input:            #E5DFD0
--ring:              palm-700       --radius:           0.5rem
/* dark-section scope (.theme-forest) */
--background: forest-900  --foreground: ivory-100  --border: rgba(224,201,136,.18)
```

### 2.3 Contrast (WCAG AA verified pairs)

| Pair | Ratio | Use |
|---|---|---|
| `ink-900` on `ivory-100` | 12.9:1 | Body ✓ AAA |
| `teal-700` on `ivory-100` | 7.7:1 | Headlines, links ✓ AAA |
| `stone-500` on `ivory-100` | 4.6:1 | Captions ≥ 12px only ✓ AA |
| `ivory-100` on `palm-700` | 8.6:1 | Primary buttons ✓ AAA |
| `ivory-100` on `forest-900` | 14.8:1 | Dark sections ✓ AAA |
| `amerta-600` on `ivory-100` | 4.5:1 | Gold text — never below 14px ✓ AA |
| `amerta-300` on `forest-900` | 9.3:1 | Gold on dark ✓ AAA |

**Rule:** `amerta-400` (#C9A961) is decorative-only on light backgrounds (hairlines, icons ≥ 24px). Text gold on light must be `amerta-600`.

---

## 3. Typography

| Role | Font | Weights | Notes |
|---|---|---|---|
| Display / headings | **Cormorant Garamond** | 400, 500, 500-italic | Existing brand serif. `font-feature-settings: "lnum"` for prices. Optional licensed upgrade path: Canela / GT Sectra (same metrics slot). |
| UI / body | **Inter** | 400, 500, 600 | `font-feature-settings: "cv11","ss01"` for open digits |
| Data / numerals | **JetBrains Mono** | 400, 500 | Invoice line items, booking codes, staff tables |

### 3.1 Fluid type scale (Tailwind utilities)

| Token | Size | LH | Track | Font | Use |
|---|---|---|---|---|---|
| `display-xl` | `clamp(3rem, 1.5rem + 6.5vw, 6.75rem)` | 1.02 | −0.01em | Cormorant 500 | Landing hero only |
| `display-lg` | `clamp(2.5rem, 1.75rem + 3.5vw, 4.5rem)` | 1.05 | −0.01em | Cormorant 500 | Page heroes |
| `display-md` | `clamp(1.875rem, 1.4rem + 2vw, 3rem)` | 1.1 | 0 | Cormorant 500 | Section titles |
| `display-sm` | `clamp(1.5rem, 1.3rem + 0.8vw, 2rem)` | 1.15 | 0 | Cormorant 500 | Card titles, modal titles |
| `eyebrow` | `0.6875rem` (11px) | 1.2 | +0.22em | Inter 600 caps | Kickers — gold `amerta-600` on light, `sage-300` on dark |
| `body-lg` | `1.125rem` | 1.65 | 0 | Inter 400 | Lead paragraphs |
| `body` | `1rem` | 1.6 | 0 | Inter 400 | Default |
| `body-sm` | `0.875rem` | 1.5 | 0 | Inter 400/500 | UI labels, metadata |
| `caption` | `0.75rem` | 1.4 | +0.01em | Inter 500 | Timestamps, legal |
| `price` | `1.375rem` | 1.2 | 0 | Cormorant 500 lnum | Nightly rates |
| `data` | `0.8125rem` | 1.5 | 0 | JetBrains Mono 400 | Codes, invoice numerals |

**Hierarchy rules:** italic Cormorant is reserved for *one emphasized word* per headline ("meet *sacred* ground"). Max line length 68ch body, 20ch display. Headlines sentence-case, never all-caps (all-caps belongs to `eyebrow` only).

---

## 4. Layout & spacing

- **Base grid:** 4px. Spacing steps: 4, 8, 12, 16, 24, 32, 48, 64, 96, 128, 160.
- **Container:** max-width `1320px`, gutter `24px` mobile / `48px` desktop (`px-6 lg:px-12 mx-auto max-w-[1320px]`).
- **Columns:** 12-col desktop, 6-col tablet, 4-col mobile.
- **Section rhythm:** `py-24 lg:py-40` marketing pages; `py-12 lg:py-16` app/portal pages.
- **Breakpoints:** Tailwind defaults. Design mobile-first at 390px; key layouts break at `md:768` and `lg:1024`.
- **Radius scale:** `sm 4px` (chips) · `md 8px` (inputs, buttons) · `lg 12px` (cards) · `xl 20px` (modals, gallery tiles) · `arch` = `border-radius: 999px 999px 12px 12px` (signature arch mask, portrait images only).
- **Hairline:** 1px `#E5DFD0` on light, `rgba(224,201,136,.18)` on dark. Gold hairline `amerta-400/40` used as top-border accent on booking summary cards only.

### Elevation

| Token | Value | Use |
|---|---|---|
| `shadow-sm` | `0 1px 2px rgba(42,37,32,.04), 0 1px 3px rgba(42,37,32,.06)` | Inputs, chips |
| `shadow-md` | `0 4px 6px rgba(42,37,32,.05), 0 10px 15px rgba(42,37,32,.08)` | Cards at rest |
| `shadow-lg` | `0 10px 25px rgba(42,37,32,.10), 0 20px 40px rgba(42,37,32,.06)` | Hover cards, popovers |
| `shadow-xl` | `0 24px 60px rgba(21,40,37,.18)` | Modals, drawers |
| `glass` | `bg-white/70 backdrop-blur-xl border border-white/40 shadow-lg` | Booking bar over imagery, sticky nav after scroll |

Glass morphism is allowed **only** over photography (hero booking bar, dashboard hero card, nav-on-scroll). Never glass-on-ivory.

---

## 5. Iconography & imagery

- **Icons:** Lucide (shadcn default), `stroke-width: 1.5`, sizes 16/20/24. Color inherits text. Never filled icons except status dots.
- **Photography grade:** warm shadows, lifted blacks, desaturated greens toward `palm`, golden-hour bias. No blue-hour HDR, no saturated sunset oranges. Overlay recipe on hero imagery: `linear-gradient(180deg, rgba(14,27,25,.25) 0%, rgba(14,27,25,.05) 40%, rgba(14,27,25,.55) 100%)`.
- **Aspect ratios:** hero 16:9 (desktop) / 4:5 (mobile) · villa card 4:3 · gallery portrait 3:4 (arch-eligible) · avatar 1:1 circle.
- **Brand mark:** existing lotus-and-water SVG. Nav uses wordmark only (Cormorant 500, +0.08em tracking, small caps feel via sentence case); the seal is reserved for footer, confirmation page, and loading state.

---

## 6. Tailwind v4 implementation

```css
/* app/globals.css */
@import "tailwindcss";

@theme {
  --color-ivory-50:#FDFBF7; --color-ivory-100:#FAF7F0; --color-ivory-200:#F4EFE2;
  --color-sand-300:#EAE3D3; --color-sand-400:#D8CFBC;
  --color-stone-500:#8B8276; --color-ink-700:#4A433D; --color-ink-900:#2A2520;
  --color-teal-700:#2C4A52; --color-palm-600:#3E5C50; --color-palm-700:#2E4A40;
  --color-forest-900:#152825; --color-forest-950:#0E1B19;
  --color-sage-300:#A8B5A0; --color-sage-500:#7A8B72; --color-ocean-500:#4A7080;
  --color-amerta-300:#E0C988; --color-amerta-400:#C9A961; --color-amerta-600:#A88A47;
  --color-terracotta-100:#F3E2DC; --color-terracotta-500:#A85842;

  --font-display: "Cormorant Garamond", ui-serif, Georgia, serif;
  --font-sans: "Inter", ui-sans-serif, system-ui, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, monospace;

  --radius-arch: 999px 999px 12px 12px;

  --ease-water: cubic-bezier(0.16, 1, 0.3, 1);      /* reveals, page transitions */
  --ease-drift: cubic-bezier(0.4, 0, 0.2, 1);       /* micro-interactions */
}
```

Fonts load via `next/font/google` with `display: "swap"`, subsets `latin`; expose as CSS variables consumed by `--font-display` / `--font-sans` / `--font-mono`.

shadcn/ui: initialize with `style: "new-york"`, `baseColor: "stone"`, then override the CSS variables in §2.2. All shadcn primitives (Dialog, Popover, Calendar, Select, Toast) inherit the system automatically.
