import { Skeleton } from "@/components/ui/skeleton";

/** Instant loading state for the villa catalog (Note #1). */
export default function VillasLoading() {
  return (
    <>
      <div className="h-16" aria-hidden />
      <div className="container-na py-12">
        <Skeleton className="h-10 w-72 bg-stone-200/70" />
        <Skeleton className="mt-4 h-5 w-full max-w-xl bg-stone-200/70" />
        <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="space-y-3">
              <Skeleton className="aspect-[4/3] w-full rounded-lg bg-stone-200/70" />
              <Skeleton className="h-6 w-2/3 bg-stone-200/70" />
              <Skeleton className="h-4 w-1/2 bg-stone-200/70" />
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
