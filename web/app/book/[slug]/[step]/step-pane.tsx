"use client";

import { Suspense } from "react";
import { motion } from "framer-motion";
import { SummaryCard } from "@/components/booking/summary-card";
import { ConfirmStep, DatesStep, DetailsStep } from "@/components/booking/steps";
import { EASE_WATER } from "@/components/motion";
import type { StepKey } from "@/components/booking/flow-stepper";
import type { Villa } from "@/lib/types";
import type { BookedRange } from "@/lib/availability";

export function StepPane({
  villa,
  step,
  bookedRanges = [],
}: {
  villa: Villa;
  step: StepKey;
  bookedRanges?: BookedRange[];
}) {
  return (
    <div className="grid gap-10 lg:grid-cols-12">
      <motion.div
        key={step}
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, ease: EASE_WATER }}
        className="lg:col-span-7"
      >
        <Suspense>
          {step === "dates" && <DatesStep villa={villa} bookedRanges={bookedRanges} />}
          {step === "details" && <DetailsStep villa={villa} />}
          {step === "confirm" && <ConfirmStep villa={villa} />}
        </Suspense>
      </motion.div>
      <div className="lg:col-span-5">
        <div className="lg:sticky lg:top-24">
          <SummaryCard villa={villa} />
        </div>
      </div>
    </div>
  );
}
