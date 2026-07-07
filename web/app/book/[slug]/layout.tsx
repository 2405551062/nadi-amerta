/**
 * Booking flow chrome — design/05 §0: reduced navbar (wordmark + return),
 * state provider shared by the three step routes.
 */
import Link from "next/link";
import { notFound } from "next/navigation";
import { X } from "lucide-react";
import { BookingProvider } from "@/components/booking/booking-context";
import { getVilla } from "@/lib/server/catalog";

export default async function BookingLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const villa = await getVilla(slug);
  if (!villa) notFound();

  return (
    <BookingProvider slug={slug}>
      <header className="sticky top-0 z-40 border-b border-border bg-ivory-100/90 backdrop-blur-xl">
        <div className="container-na flex h-16 items-center justify-between">
          <Link href="/" className="font-display text-xl font-medium tracking-[0.08em] text-ink-900">
            The Nadi Amerta
          </Link>
          <Link
            href={`/villas/${slug}`}
            className="flex items-center gap-1.5 text-sm font-medium text-stone-500 transition-colors hover:text-ink-900"
          >
            <X className="size-4" aria-hidden /> Return to villa
          </Link>
        </div>
      </header>
      <main className="min-h-svh bg-ivory-100 pb-24">{children}</main>
    </BookingProvider>
  );
}
