"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star } from "lucide-react";
import type { Villa } from "@/lib/types";
import { idr, idrLabel } from "@/lib/format";
import { EASE_DRIFT } from "@/components/motion";

const VIEW_LABEL: Record<Villa["view"], string> = {
  river: "River view",
  rice: "Rice paddy view",
  garden: "Garden view",
};

/**
 * Villa card — design/03 §5. Whole card is the link; "Lift" hover (motion §2.5);
 * image carries layoutId for the shared-element transition into the detail hero.
 */
export function VillaCard({
  villa,
  unavailable = false,
  nextOpen,
}: {
  villa: Villa;
  unavailable?: boolean;
  nextOpen?: string;
}) {
  return (
    <motion.article
      whileHover={unavailable ? undefined : { y: -4 }}
      transition={{ duration: 0.3, ease: EASE_DRIFT }}
      className="group h-full"
    >
      <Link
        href={`/villas/${villa.slug}`}
        className="flex h-full flex-col overflow-hidden rounded-lg bg-card shadow-md transition-shadow duration-300 group-hover:shadow-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
        aria-label={`${villa.name} — ${villa.excerpt} ${idrLabel(villa.priceNight)} per night`}
      >
        <div className="relative aspect-[4/3] overflow-hidden">
          <motion.div layoutId={`villa-${villa.slug}`} className="absolute inset-0">
            <Image
              src={villa.image}
              alt={`${villa.name} — ${villa.excerpt}`}
              fill
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              className={`object-cover transition-transform duration-700 ease-water group-hover:scale-105 ${
                unavailable ? "opacity-50 grayscale-[30%]" : ""
              }`}
            />
          </motion.div>
          {unavailable && (
            <span className="absolute top-4 left-4 rounded-full bg-forest-950/70 px-3 py-1 text-[11px] font-semibold tracking-[0.06em] text-ivory-100 uppercase backdrop-blur-sm">
              Unavailable{nextOpen ? ` · next open ${nextOpen}` : " for these dates"}
            </span>
          )}
        </div>

        <div className="flex flex-1 flex-col p-5">
          <div className="flex items-start justify-between gap-3">
            <h3 className="text-display-sm text-teal-700">{villa.name}</h3>
            <span className="mt-1 flex items-center gap-1 text-[13px] text-ink-700">
              <Star className="size-3.5 fill-amerta-400 text-amerta-400" aria-hidden />
              {villa.rating}
            </span>
          </div>
          <p className="mt-1.5 text-[13px] text-stone-500">
            {villa.bedrooms} {villa.bedrooms === 1 ? "Bedroom" : "Bedrooms"} · {villa.sizeM2}m² ·{" "}
            {VIEW_LABEL[villa.view]}
          </p>
          <div className="mt-auto flex items-end justify-between pt-5">
            <p className="text-teal-700">
              <span className="text-price">{idr(villa.priceNight)}</span>
              <span className="ml-1 text-[13px] text-stone-500">/ night</span>
            </p>
            <span className="flex items-center gap-1 text-sm font-medium text-palm-700 opacity-0 transition-all duration-300 group-hover:translate-x-0 group-hover:opacity-100 -translate-x-2">
              View <ArrowRight className="size-4" aria-hidden />
            </span>
          </div>
        </div>
      </Link>
    </motion.article>
  );
}
