/**
 * FAQ — design/04 §6. Traceability (design/10 P14): support surface; JSON-LD FAQPage.
 */
import type { Metadata } from "next";
import { Navbar } from "@/components/site/navbar";
import { Footer } from "@/components/site/footer";
import { Surface } from "@/components/motion";
import { faqs } from "@/lib/data";
import { FaqList } from "./faq-list";

export const metadata: Metadata = { title: "Questions" };

export default function FaqPage() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };

  return (
    <>
      <Navbar />
      <div className="h-16" aria-hidden />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main className="mx-auto w-full max-w-[720px] px-6 py-16 lg:py-24">
        <Surface>
          <p className="eyebrow text-center">We answer everything</p>
          <h1 className="text-display-lg mt-4 text-center text-teal-700">Questions</h1>
          <p className="mt-4 mb-12 text-center text-ink-700">
            The things guests ask before they arrive — answered plainly.
          </p>
          <FaqList />
        </Surface>
      </main>

      <Footer />
    </>
  );
}
