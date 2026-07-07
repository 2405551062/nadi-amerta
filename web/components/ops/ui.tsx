"use client";

/**
 * Shared staff-console primitives — design/07: serif greeting header,
 * hairline KPI cards with sage sparklines, dependency-free SVG area chart.
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

export function OpsHeader({
  greeting,
  sub,
  children,
}: {
  greeting: string;
  sub: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-border bg-ivory-50/60 px-6 py-6 lg:px-10">
      <div>
        <h1 className="text-display-md text-teal-700">{greeting}</h1>
        <p className="mt-1 text-sm text-stone-500">{sub}</p>
      </div>
      {children}
    </header>
  );
}

const SPARK = [4, 6, 5, 7, 6.5, 8, 7.5, 9];

export function Sparkline({ className }: { className?: string }) {
  const points = SPARK.map((v, i) => `${(i / (SPARK.length - 1)) * 100},${32 - v * 3}`).join(" ");
  return (
    <svg viewBox="0 0 100 32" className={cn("h-8 w-full", className)} aria-hidden preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#A8B5A0" strokeWidth="1.5" />
      <polygon points={`0,32 ${points} 100,32`} fill="#A8B5A0" opacity="0.15" />
    </svg>
  );
}

export function KpiCard({
  label,
  value,
  delta,
  tone = "gold",
  mono = false,
}: {
  label: string;
  value: string;
  delta: string;
  tone?: "gold" | "neutral" | "warn";
  mono?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-semibold tracking-[0.08em] text-stone-500 uppercase">{label}</p>
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap",
            tone === "gold" && "bg-amerta-400/15 text-amerta-600",
            tone === "neutral" && "bg-sand-300 text-stone-600",
            tone === "warn" && "bg-terracotta-100 text-terracotta-500"
          )}
        >
          {delta}
        </span>
      </div>
      <p className={cn("mt-2 text-[26px] leading-tight text-ink-900", mono ? "font-mono text-[22px]" : "font-display")}>
        {value}
      </p>
      <Sparkline className="mt-3" />
    </div>
  );
}

/**
 * Area chart — palm fill + gold accent line, draw-in once (motion §3).
 * Values in IDR millions.
 */
export function AreaChart({
  data,
  className,
}: {
  data: { day: string; revenue: number }[];
  className?: string;
}) {
  const W = 600;
  const H = 220;
  const PAD = 28;
  const max = Math.max(...data.map((d) => d.revenue)) * 1.15;
  const x = (i: number) => PAD + (i / (data.length - 1)) * (W - PAD * 2);
  const y = (v: number) => H - PAD - (v / max) * (H - PAD * 2);
  const line = data.map((d, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(d.revenue)}`).join(" ");
  const area = `${line} L${x(data.length - 1)},${H - PAD} L${x(0)},${H - PAD} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={cn("w-full", className)} role="img" aria-label="Revenue, last 30 days">
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line
          key={f}
          x1={PAD}
          x2={W - PAD}
          y1={y(max * f)}
          y2={y(max * f)}
          stroke="#E5DFD0"
          strokeWidth="1"
        />
      ))}
      <motion.path
        d={area}
        fill="#2E4A40"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 0.1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE_WATER }}
      />
      <motion.path
        d={line}
        fill="none"
        stroke="#2E4A40"
        strokeWidth="2"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.9, ease: EASE_WATER }}
      />
      <motion.circle
        cx={x(data.length - 1)}
        cy={y(data[data.length - 1].revenue)}
        r="4"
        fill="#C9A961"
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.9 }}
      />
      {data.map((d, i) =>
        i % 3 === 0 || i === data.length - 1 ? (
          <text key={d.day} x={x(i)} y={H - 8} textAnchor="middle" fontSize="10" fill="#8B8276">
            {d.day}
          </text>
        ) : null
      )}
      <text x={PAD} y={y(max) - 6} fontSize="10" fill="#8B8276">
        IDR {Math.round(max)}M
      </text>
    </svg>
  );
}

export function Panel({
  title,
  action,
  children,
  className,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("rounded-lg border border-border bg-card", className)} aria-label={title}>
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-ink-900">{title}</h2>
        {action}
      </div>
      <div className="p-5">{children}</div>
    </section>
  );
}
