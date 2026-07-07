/**
 * 404 — design/04 §7. Forest stage, drifting water lines, two exits.
 */
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="theme-forest relative flex min-h-svh flex-col items-center justify-center overflow-hidden bg-forest-950 px-6 text-center text-ivory-100">
      <svg
        aria-hidden
        viewBox="0 0 1200 200"
        className="pointer-events-none absolute bottom-16 w-[200%] max-w-none opacity-25 motion-safe:animate-[drift_8s_ease-in-out_infinite_alternate]"
        fill="none"
        stroke="#C9A961"
      >
        <path d="M0 80 Q 150 40, 300 80 T 600 80 T 900 80 T 1200 80" strokeWidth="1.5" />
        <path d="M0 120 Q 150 80, 300 120 T 600 120 T 900 120 T 1200 120" strokeWidth="1" opacity="0.7" />
        <path d="M0 160 Q 150 120, 300 160 T 600 160 T 900 160 T 1200 160" strokeWidth="0.8" opacity="0.4" />
      </svg>
      <style>{`@keyframes drift { from { transform: translateX(-4%);} to { transform: translateX(4%);} }`}</style>

      <p className="font-display text-xl tracking-[0.08em]">Nadi Amerta</p>
      <h1 className="text-display-lg mt-10 text-ivory-50">This path returns to the river.</h1>
      <p className="mt-4 max-w-md text-ivory-100/70">
        The page you seek has flowed on. Everything else is where you left it.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-md bg-ivory-100 px-8 text-sm font-medium text-forest-900 transition-colors hover:bg-ivory-200"
        >
          Return home
        </Link>
        <Link
          href="/villas"
          className="inline-flex h-12 items-center justify-center text-sm font-medium text-ivory-100/80 underline-offset-4 hover:underline"
        >
          Browse villas
        </Link>
      </div>
    </div>
  );
}
