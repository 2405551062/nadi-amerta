import { Skeleton } from "@/components/ui/skeleton";

/** Instant loading state for the reservation confirmation page (Note #1/#2). */
export default function StayLoading() {
  return (
    <>
      <div className="h-16" aria-hidden />
      <div className="theme-forest bg-forest-900 py-20 text-center">
        <div className="container-na flex flex-col items-center gap-6">
          <Skeleton className="size-20 rounded-full bg-ivory-100/15" />
          <Skeleton className="h-9 w-80 max-w-full bg-ivory-100/15" />
          <Skeleton className="h-8 w-48 bg-ivory-100/10" />
        </div>
      </div>
      <div className="container-na grid gap-12 py-16 lg:grid-cols-12">
        <div className="space-y-8 lg:col-span-7">
          <Skeleton className="h-40 w-full rounded-lg bg-stone-200/70" />
          <Skeleton className="h-32 w-full rounded-lg bg-stone-200/70" />
        </div>
        <div className="lg:col-span-4 lg:col-start-9">
          <Skeleton className="h-80 w-full rounded-lg bg-stone-200/70" />
        </div>
      </div>
    </>
  );
}
