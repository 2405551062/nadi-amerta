"use client";

/**
 * 500 — design/04 §7. Same forest stage; retry + WhatsApp escape hatch.
 */
import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="theme-forest flex min-h-svh flex-col items-center justify-center bg-forest-950 px-6 text-center text-ivory-100">
      <p className="font-display text-xl tracking-[0.08em]">Nadi Amerta</p>
      <h1 className="text-display-lg mt-10 text-ivory-50">Still waters for a moment.</h1>
      <p className="mt-4 max-w-md text-ivory-100/70">
        Something interrupted the flow on our side. Nothing you did — please try again.
      </p>
      <div className="mt-10 flex flex-col gap-4 sm:flex-row">
        <button
          onClick={reset}
          className="inline-flex h-12 items-center rounded-md bg-ivory-100 px-8 text-sm font-medium text-forest-900 transition-colors hover:bg-ivory-200"
        >
          Try again
        </button>
        <Link
          href="https://wa.me/628113800108"
          className="inline-flex h-12 items-center justify-center text-sm font-medium text-ivory-100/80 underline-offset-4 hover:underline"
        >
          WhatsApp the front desk
        </Link>
      </div>
      {error.digest && (
        <p className="mt-12 font-mono text-[11px] text-ivory-100/30">ref {error.digest}</p>
      )}
    </div>
  );
}
