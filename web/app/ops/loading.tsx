import { Skeleton } from "@/components/ui/skeleton";

/** Instant loading state for the staff ops consoles (Note #1). */
export default function OpsLoading() {
  return (
    <div className="p-6 lg:p-8">
      <Skeleton className="h-8 w-56 bg-stone-200/70" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-24 rounded-lg bg-stone-200/70" />
        ))}
      </div>
      <div className="mt-8 space-y-3">
        {[0, 1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-16 w-full rounded-lg bg-stone-200/70" />
        ))}
      </div>
    </div>
  );
}
