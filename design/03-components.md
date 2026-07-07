# Nadi Amerta — Component Library

> Every component maps to a shadcn/ui primitive where one exists, restyled through the CSS variables in
> `01-foundations.md`. Sizes in px, spacing on the 4px grid. All interactive elements: min touch target
> 44×44, visible `focus-visible` ring (`2px ring-palm-700 offset 2px`; on dark: `ring-amerta-300`).

---

## 1. Buttons (`shadcn Button` + variants)

| Variant | Rest | Hover | Active | Use |
|---|---|---|---|---|
| `primary` | `bg-palm-700 text-ivory-50`, radius 8, h-48 (lg) / h-40 (md), px-24, Inter 500 15px | `bg-palm-600`, shadow-md | scale .98 | One per view. Reserve, Confirm, Pay |
| `secondary` | `bg-transparent border border-sand-400 text-teal-700` | `border-palm-700 bg-ivory-200/60` | scale .98 | Alternate actions |
| `ghost-dark` | on imagery/forest: `border border-ivory-100/50 text-ivory-100` | `bg-ivory-100/10 border-ivory-100` | — | Hero CTAs on photos |
| `tertiary` | text-only `text-teal-700 underline-offset-4` | underline slides in (200ms) | — | "View all villas →" |
| `destructive` | `bg-terracotta-500 text-ivory-50` | darken 8% | — | Cancel reservation (confirm-guarded) |

Pending state: label crossfades to 16px spinner, width locked. Disabled: 40% opacity + `cursor-not-allowed`, never color-shifted only.

## 2. Inputs (`shadcn Input`, `Textarea`, `Label`)

- Field: h-48, `bg-white border border-[#E5DFD0]` radius 8, px-16, Inter 15px, placeholder `stone-500`.
- **Floating label**: label sits as placeholder, on focus/value animates to −10px above in 11px `eyebrow` style, gold `amerta-600` while focused, `stone-500` at rest (200ms `ease-drift`).
- Focus: border `palm-700` + `ring-2 ring-palm-700/20`. Error: border `terracotta-500`, bg `terracotta-100/40`, 13px message with 16px alert icon below; `aria-describedby` wired. Success (async-validated): 16px sage check fades in right.
- Phone input: country flag select prefixed (defaults ID +62). Currency display fields use JetBrains Mono.

## 3. Dropdown / Select (`shadcn Select`)

Trigger = input styling with chevron (rotates 180°, 200ms). Panel: `bg-white radius 12 shadow-lg border-[#E5DFD0]`, item h-40 px-16, hover `bg-ivory-200`, selected: 16px gold check + Inter 500. Enters `opacity + y:-6→0` 200ms. Full keyboard + typeahead (Radix default).

## 4. Date Picker & Booking Calendar (`shadcn Calendar` / react-day-picker, heavily customized)

The signature input of the product — desktop: 2-month popover (720px) under the date field; mobile: full-height bottom sheet.

- Day cell 44×44, Inter 14px. Today: 4px gold dot under numeral.
- **Range**: endpoints = filled `palm-700` circles (ivory numerals); span = `sage-300/30` band; hover preview of tentative range at 40% opacity before second click.
- Unavailable: `stone-500/50` strikethrough, not clickable. **Nyepi & closures**: sand-300 fill + tooltip "Nyepi — Day of Silence. The island rests." (cultural moment, not an error).
- Price hint under each available day: 10px JetBrains Mono `8.5M` in `stone-500` (villa detail + booking contexts only).
- Min-stay violations: on selecting an invalid checkout, the range shakes ±4px once and a 13px inline note appears: "Villa Tirta asks for a 2-night minimum."
- Footer bar: selected summary "Aug 12 — 16 · 4 nights · IDR 34,000,000" + `Clear` + `Apply` (mobile sheet only; desktop applies live).

## 5. Cards

| Card | Spec |
|---|---|
| **Villa card** | Radius 12 overflow-hidden, 4:3 image (hover: scale 1.05 / 700ms), body p-20 on white: serif `display-sm` name, dot-separated 13px facts (`2 Bedrooms · 280m² · River View`), price row: `price` token in `teal-700` + `/night` 13px stone; top-left status chip if `Last villa for these dates`. Whole card is the link; hover Lift (see motion §2.5); `layoutId="villa-{id}"` image for shared-element transition. |
| **Pricing/rate card** | White, radius 12, hairline border; header serif; feature list 15px with 16px sage checks; footer price serif 28px + caption. Featured tier: `border-amerta-400/50` + tiny gold "Signature" chip — never a gold fill. |
| **Review card** | Ivory-50, radius 12, p-24: 15px/1.7 quote (max 4 lines + "Read more"), footer avatar 32 + name Inter 500 13px + stay date 12px stone + single gold star + `4.9`. |
| **Service card** (portal) | Horizontal: 96×96 rounded image left, right: serif 18px title, 13px description, tertiary link. Hover: Lift + arrow slides 8px. |
| **Booking summary card** | White radius 12 shadow-md, **1px `amerta-400/40` top border** (the one sanctioned gold structural accent). Arch-mask villa photo 96px, serif villa name, dates line, line items 14px with JetBrains Mono amounts right-aligned, hairline dividers, Total row serif 22px, primary button full-width, lock caption 12px. `layout`-animated on line-item change; total counts up 500ms. |

## 6. Navigation

- **Marketing navbar**: transparent over hero (ivory text + ghost CTA), h-80. After 80px scroll → glass (`bg-ivory-100/85 backdrop-blur-xl border-b border-[#E5DFD0]`), h-64, ink text (400ms crossfade). Left: wordmark (Cormorant 500 20px, +0.08em). Center links 14px Inter 500: Villas · Experiences · Dining · Journal · About. Active/hover: 1px gold underline draws left→right 250ms. Right: `Sign in` tertiary + `Reserve` primary-sm.
- **Portal navbar**: ivory solid, tabs My Stays · Services · Dining · Invoices · Profile; active = teal-700 + 2px gold underline that slides between tabs (`layoutId`).
- **Mobile**: hamburger → full-screen forest-900 overlay; links as serif `display-md` ivory stacked, staggered entrance 70ms; contact + language at bottom. Guest portal mobile = bottom tab bar h-64 (Explore/Stays/Dining/Profile), active icon palm-700 + 4px gold dot below, icon crossfade 200ms.

## 7. Sidebar (staff)

`bg-forest-900` w-256 (collapsible → 72px, labels fade, tooltips appear). Gold lotus mark top. Items h-44 radius 8: `text-ivory-100/70` + 20px line icon; hover `bg-white/5 text-ivory-100`; active `bg-white/10 text-ivory-100` + **2px `amerta-400` left rail** that slides between items (`layoutId`). Role badge bottom with avatar + role 12px. Sections per console (see `07-staff-consoles.md`). Mobile: sidebar becomes bottom-sheet nav.

## 8. Footer

`forest-900`, py-96. Top row: serif `display-md` invitation "The river is waiting." + email capture (glass input + ghost button). 4 columns 13px `ivory-100/60` links (hover → `amerta-300`). Bottom bar: brand seal 40px, legal 12px, payment marks (Visa/MC/Midtrans) at 40% opacity. Gold hairline above bottom bar.

## 9. Modals & Drawers (`shadcn Dialog` / `Sheet`)

Overlay `forest-950/60 backdrop-blur-sm`. Panel: white radius 20 shadow-xl, max-w 560 (forms) / 960 (gallery), p-32. Title serif `display-sm` + 15px description. Motion per `02-motion.md` §3. Mobile: all dialogs become bottom sheets with 36×4 drag handle, `sand-400`. Destructive confirms: icon-less, plain language — "Cancel this reservation? Your deposit of IDR 8,500,000 is refundable until Aug 5." + `Keep reservation` (secondary, focused by default) / `Cancel reservation` (destructive).

## 10. Alerts, Toasts, Badges

- **Alert (inline)**: radius 12, 1px border + 4px left rail; info = ocean-500 on `#EDF2F4`-warm; success = sage-500 on `#EFF3EC`; warning = amerta-600 on `#F8F1E1`; error = terracotta-500 on terracotta-100. 20px icon, 14px text, optional action link.
- **Toast (`sonner`)**: white radius 12 shadow-lg, hairline left rail in semantic color, title Inter 500 14px + body 13px, auto-dismiss 5s (pause on hover), max 3. Success booking toast gets a 16px lotus mark instead of a check.
- **Status badge**: pill h-24 px-10 11px Inter 600 caps +0.06em, tinted bg + darker text, leading 6px dot. Guest: Confirmed sage · Pending amerta · Cancelled stone · Completed ocean. Ops: Occupied palm · Cleaning amerta · Inspection ocean · Maintenance terracotta · Available sage · VIP = gold-outline pill (only gold-bordered badge in the system).

## 11. Tables (`shadcn Table` + TanStack)

Staff-side workhorse. Header: 12px caps +0.08em stone-500, `bg-ivory-200/60` sticky. Rows h-56, hairline separated, hover `bg-ivory-200/40`, click opens detail drawer (never inline edit). Numerals right-aligned JetBrains Mono 13px. Selection checkboxes → bulk bar slides up from bottom (h-56 forest-900, ivory text, actions + count). Pagination: "1–20 of 143" + quiet arrows. Empty state: 48px thin-line illustration + serif 20px line + primary action. Loading: 8 skeleton rows.

## 12. Charts (Recharts via shadcn Charts)

Ivory-aware palette: series 1 `palm-700` (area fill = 12% opacity gradient to transparent), series 2 `amerta-400` line 1.5px, series 3 `ocean-500`, comparison dashed `sand-400`. Grid: horizontal hairlines only `#E5DFD0`. Axes 11px Inter stone-500, no axis lines. Tooltip: white radius 8 shadow-lg, 12px, values mono. Draw-in per motion §3. Donut (occupancy): 8px stroke, palm on sand track, center serif 28px value.

## 13. Forms — composition rules

Single column always; groups separated by 32px + serif group heading 20px. Field width = content width (dates 320, phone 360, notes full). Progressive disclosure over tabs. Validation on blur, re-validate on change; submit disabled only while pending — otherwise allow submit and scroll-to-first-error (smooth, then focus). Every form ends with one primary + at most one secondary action, right-aligned desktop / stacked full-width mobile.

## 14. Micro-components

- **Stepper (guests)**: `− 2 +` : 32px circular hairline buttons, value Inter 500; buttons disable at bounds with 40% fade; value ticks ±4px on change.
- **Amount**: `IDR 8,500,000` — "IDR" 11px caps stone, amount mono; totals switch to serif per Booking Summary.
- **Divider with word**: hairline — 11px caps word ("or", "arrival ritual") — hairline; gold word variant on dark.
- **Avatar**: circle, sand-300 bg with serif initial fallback; staff get 8px status dot.
- **Skeleton**: `bg-sand-300` radius-matched shimmer per motion §3; text lines 60/90/75% widths.
- **Tooltip**: forest-900 ivory 12px radius 6, delay 400ms, `opacity+y:-4` 150ms.
