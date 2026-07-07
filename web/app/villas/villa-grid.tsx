"use client";

import { AnimatePresence, motion } from "framer-motion";
import { VillaCard } from "@/components/site/villa-card";
import { EASE_WATER } from "@/components/motion";
import type { Villa } from "@/lib/types";

/**
 * FLIP-animated results grid — design/04 §2: filter changes reorder with
 * layout animation; removed cards fade + scale .96; entries rise 16px.
 * Unavailable villas stay visible (scarcity + no pogo-sticking).
 */
export function AnimatedVillaGrid({
  villas,
  availability,
  datesChosen,
}: {
  villas: Villa[];
  availability: Record<string, boolean>;
  datesChosen: boolean;
}) {
  if (villas.length === 0) {
    return (
      <div className="py-24 text-center">
        <p className="text-display-sm text-teal-700">No villa matches that combination.</p>
        <p className="mt-3 text-stone-500">
          Try widening the dates by a few days — or ask us directly, we often know a way.
        </p>
      </div>
    );
  }

  return (
    <motion.ul layout className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
      <AnimatePresence mode="popLayout">
        {villas.map((v) => (
          <motion.li
            layout
            key={v.slug}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.4, ease: EASE_WATER }}
          >
            <VillaCard
              villa={v}
              unavailable={datesChosen && !availability[v.slug]}
              nextOpen={datesChosen && !availability[v.slug] ? "Sep 2" : undefined}
            />
          </motion.li>
        ))}
      </AnimatePresence>
    </motion.ul>
  );
}
