import { Skeleton } from "@/components/ui/skeleton";

/** Instant loading state for the guest portal (Note #1 — perceived speed). */
export default function PortalLoading() {
  return (
    <div>
      <div className="theme-forest bg-forest-900 py-16 lg:py-20">
        <div className="container-na">
          <Skeleton className="h-9 w-64 bg-ivory-100/15" />
          <Skeleton className="mt-8 h-40 w-full max-w-sm rounded-lg bg-ivory-100/10" />
        </div>
      </div>
      <div className="container-na grid gap-12 py-12 lg:grid-cols-12 lg:py-16">
        <div className="space-y-6 lg:col-span-8">
          <Skeleton className="h-7 w-40 bg-stone-200/70" />
          <div className="grid gap-5 sm:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <Skeleton key={i} className="h-56 rounded-lg bg-stone-200/70" />
            ))}
          </div>
          <Skeleton className="h-24 w-full rounded-lg bg-stone-200/70" />
        </div>
        <div className="lg:col-span-4">
          <Skeleton className="h-72 w-full rounded-lg bg-stone-200/70" />
        </div>
      </div>
    </div>
  );
}
