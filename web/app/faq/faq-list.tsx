"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Input } from "@/components/ui/input";
import { faqs } from "@/lib/data";
import { cn } from "@/lib/utils";

const CATEGORIES = ["All", ...Array.from(new Set(faqs.map((f) => f.category)))];

/** FAQ — design/04 §6: live search + category chips + accordions. */
export function FaqList() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");

  const results = useMemo(
    () =>
      faqs.filter(
        (f) =>
          (category === "All" || f.category === category) &&
          (query === "" ||
            f.q.toLowerCase().includes(query.toLowerCase()) ||
            f.a.toLowerCase().includes(query.toLowerCase()))
      ),
    [query, category]
  );

  return (
    <div>
      <div className="relative">
        <Search className="absolute top-1/2 left-4 size-4 -translate-y-1/2 text-stone-500" aria-hidden />
        <Input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          aria-label="Search questions"
          className="h-12 bg-white pl-11"
        />
      </div>

      <div className="mt-5 flex flex-wrap gap-2" role="group" aria-label="Filter by category">
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCategory(c)}
            aria-pressed={category === c}
            className={cn(
              "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
              category === c
                ? "border-palm-700 bg-palm-700 text-ivory-50"
                : "border-sand-400 bg-white text-ink-700 hover:border-palm-700"
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {results.length === 0 ? (
        <p className="mt-12 text-center text-ink-700">
          Nothing here —{" "}
          <a href="/contact" className="font-medium text-teal-700 underline underline-offset-4">
            ask us directly
          </a>
          .
        </p>
      ) : (
        <Accordion type="single" collapsible className="mt-8">
          {results.map((f) => (
            <AccordionItem key={f.q} value={f.q}>
              <AccordionTrigger className="py-5 text-left text-base font-medium text-ink-900 hover:no-underline">
                {f.q}
              </AccordionTrigger>
              <AccordionContent className="max-w-[68ch] pb-6 text-[15px] leading-[1.7] text-ink-700">
                {f.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}
    </div>
  );
}
