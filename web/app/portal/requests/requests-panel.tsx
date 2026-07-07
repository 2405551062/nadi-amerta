"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, Plus } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { StatusBadge } from "@/components/status-badge";
import type { GuestRequest } from "@/lib/types";
import { EASE_WATER } from "@/components/motion";
import { cn } from "@/lib/utils";

export function RequestsPanel({ initial }: { initial: GuestRequest[] }) {
  const router = useRouter();
  const [rows, setRows] = useState<GuestRequest[]>(initial);
  const [formOpen, setFormOpen] = useState(false);
  const [type, setType] = useState<"request" | "complaint">("request");
  const [subject, setSubject] = useState("");
  const [detail, setDetail] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) return;
    // POST /api/requests → creates a villa.guest.request (B11)
    try {
      await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, subject, detail }),
      });
      setRows((r) => [
        {
          id: Date.now(), type, subject, detail, state: "open",
          created: "Just now", villa: "Your stay", guestName: "You",
          priority: type === "complaint" ? "high" : "medium",
        },
        ...r,
      ]);
      setSubject("");
      setDetail("");
      setFormOpen(false);
      toast("Received by the front office", {
        description: "Someone picks this up within minutes during the day.",
      });
      router.refresh();
    } catch {
      toast("Could not send — please try again.");
    }
  };

  return (
    <div className="mt-8 grid gap-10 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <div className="flex items-center justify-between">
          <h2 className="text-display-sm text-teal-700">Your requests</h2>
          <button
            onClick={() => setFormOpen((o) => !o)}
            className="flex h-11 items-center gap-2 rounded-md bg-palm-700 px-5 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
          >
            <Plus className="size-4" aria-hidden /> New request
          </button>
        </div>

        <AnimatePresence>
          {formOpen && (
            <motion.form
              onSubmit={submit}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4, ease: EASE_WATER }}
              className="overflow-hidden"
            >
              <div className="mt-5 space-y-5 rounded-lg bg-card p-6 shadow-sm">
                <RadioGroup
                  value={type}
                  onValueChange={(v) => setType(v as "request" | "complaint")}
                  className="flex gap-3"
                >
                  {(["request", "complaint"] as const).map((t) => (
                    <label
                      key={t}
                      className={cn(
                        "flex flex-1 cursor-pointer items-center gap-3 rounded-md border p-3 text-sm capitalize transition-colors",
                        type === t ? "border-palm-700 bg-sage-300/10" : "border-border"
                      )}
                    >
                      <RadioGroupItem value={t} /> {t === "request" ? "A request" : "Something's not right"}
                    </label>
                  ))}
                </RadioGroup>
                <div className="space-y-2">
                  <Label htmlFor="req-subject">In a few words</Label>
                  <Input
                    id="req-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder={type === "request" ? "Extra yoga mats for tomorrow" : "The plunge pool feels cold"}
                    className="h-12 bg-white"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="req-detail">Details (optional)</Label>
                  <Textarea
                    id="req-detail"
                    rows={3}
                    value={detail}
                    onChange={(e) => setDetail(e.target.value)}
                    className="bg-white"
                  />
                </div>
                <button
                  type="submit"
                  className="h-11 rounded-md bg-palm-700 px-6 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
                >
                  Send to front office
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        <ul className="mt-6 space-y-4">
          <AnimatePresence initial={false}>
            {rows.map((r) => (
              <motion.li
                key={r.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_WATER }}
                className="rounded-lg bg-card p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="font-medium text-ink-900">{r.subject}</p>
                    {r.detail && <p className="mt-1 text-[13px] leading-snug text-stone-500">{r.detail}</p>}
                    <p className="mt-2 text-xs text-stone-500">
                      {r.villa} · {r.created} · {r.type === "complaint" ? "Concern" : "Request"}
                    </p>
                  </div>
                  <StatusBadge status={r.state} />
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </div>

      <aside className="lg:col-span-4 lg:col-start-9">
        <div className="theme-forest rounded-lg bg-forest-900 p-6 text-ivory-100">
          <MessageCircle className="size-6 text-amerta-300" strokeWidth={1.5} aria-hidden />
          <h2 className="font-display mt-4 text-xl text-ivory-50">Need it now?</h2>
          <p className="mt-2 text-sm leading-relaxed text-ivory-100/70">
            During your stay, WhatsApp reaches your butler directly — usually faster than this page.
          </p>
          <a
            href="https://wa.me/628113800108"
            className="mt-5 inline-flex h-11 items-center rounded-md border border-ivory-100/50 px-5 text-sm font-medium text-ivory-100 transition-colors hover:border-ivory-100 hover:bg-ivory-100/10"
          >
            WhatsApp the villa
          </a>
        </div>
      </aside>
    </div>
  );
}
