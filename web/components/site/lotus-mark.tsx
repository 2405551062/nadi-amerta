import { cn } from "@/lib/utils";

/** Brand seal — lotus over water, distilled from the existing logo (index.html). */
export function LotusMark({
  className,
  animate = false,
}: {
  className?: string;
  animate?: boolean;
}) {
  return (
    <svg
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-amerta-400", className)}
      aria-hidden="true"
    >
      <circle cx="100" cy="100" r="92" stroke="currentColor" strokeWidth="1.2" opacity="0.6"
        className={animate ? "seal-draw" : undefined} />
      <circle cx="100" cy="100" r="86" stroke="currentColor" strokeWidth="0.8" opacity="0.4" />
      <path d="M100 55 C 86 70, 82 82, 100 95 C 118 82, 114 70, 100 55 Z" fill="currentColor" opacity="0.95" />
      <path d="M85 70 C 78 78, 78 88, 92 92" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M115 70 C 122 78, 122 88, 108 92" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M40 130 Q 70 120, 100 138 T 160 130" stroke="currentColor" strokeWidth="2" fill="none" />
      <path d="M40 140 Q 70 130, 100 148 T 160 140" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.8" />
      <path d="M40 150 Q 70 140, 100 158 T 160 150" stroke="currentColor" strokeWidth="1.2" fill="none" opacity="0.6" />
    </svg>
  );
}
