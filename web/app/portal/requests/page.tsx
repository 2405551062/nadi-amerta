/**
 * Requests & concierge — design/10 P12 (new page required by the contract).
 * Traceability: UC-FO5 (guest side), UC-C5 · BPMN B11 · CRM module
 * (ERD gap §1.5.3 — proposed villa.guest.request) · GET/POST /api/requests
 */
import type { Metadata } from "next";
import { RequestsPanel } from "./requests-panel";
import { getRequests } from "@/lib/server/requests";

export const metadata: Metadata = { title: "Requests" };

export default async function RequestsPage() {
  const requests = await getRequests("mine");
  return (
    <main className="container-na py-12 lg:py-16">
      <p className="eyebrow">Concierge</p>
      <h1 className="text-display-md mt-3 text-teal-700">Ask us anything</h1>
      <p className="mt-3 max-w-[60ch] text-[15px] leading-relaxed text-ink-700">
        Requests and concerns land directly with the front office and are tracked until resolved —
        nothing disappears into a lobby notebook.
      </p>
      <RequestsPanel initial={requests} />
    </main>
  );
}
