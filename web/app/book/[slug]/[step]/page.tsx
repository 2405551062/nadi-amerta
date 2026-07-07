/**
 * Booking flow steps — /book/[slug]/(dates|details|confirm), design/05.
 * Forward = enter from right, back = from left (Amerta thread continuity).
 */
import { notFound } from "next/navigation";
import { getVilla } from "@/lib/server/catalog";
import { getBookedRanges } from "@/lib/server/reservations";
import { FlowStepper, type StepKey } from "@/components/booking/flow-stepper";
import { StepPane } from "./step-pane";

const STEPS: StepKey[] = ["dates", "details", "confirm"];

export const dynamic = "force-dynamic";

export default async function BookingStepPage({
  params,
}: {
  params: Promise<{ slug: string; step: string }>;
}) {
  const { slug, step } = await params;
  const villa = await getVilla(slug);
  if (!villa || !STEPS.includes(step as StepKey)) notFound();
  const bookedRanges = step === "dates" ? await getBookedRanges(villa.id) : [];

  return (
    <div className="container-na">
      <div className="py-8">
        <FlowStepper slug={slug} current={step as StepKey} />
      </div>
      <StepPane villa={villa} step={step as StepKey} bookedRanges={bookedRanges} />
    </div>
  );
}
