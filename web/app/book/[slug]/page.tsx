import { redirect } from "next/navigation";

export default async function BookingIndex({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;
  const qs = new URLSearchParams(sp).toString();
  redirect(`/book/${slug}/dates${qs ? `?${qs}` : ""}`);
}
