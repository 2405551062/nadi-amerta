import { Reveal } from "@/components/motion";
import { cn } from "@/lib/utils";

/** Section header — eyebrow precedes headline by one stagger step (motion §2.3). */
export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description?: string;
  align?: "left" | "center";
  className?: string;
}) {
  return (
    <div className={cn(align === "center" && "mx-auto max-w-2xl text-center", className)}>
      <Reveal>
        <p className="eyebrow">{eyebrow}</p>
      </Reveal>
      <Reveal delay={0.07}>
        <h2 className="text-display-md mt-4 text-teal-700">{title}</h2>
      </Reveal>
      {description && (
        <Reveal delay={0.14}>
          <p className="mt-5 max-w-[68ch] text-lg leading-relaxed text-ink-700">{description}</p>
        </Reveal>
      )}
    </div>
  );
}
