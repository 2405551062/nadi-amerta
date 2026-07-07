"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { LotusMark } from "@/components/site/lotus-mark";
import { EASE_WATER } from "@/components/motion";

/**
 * Contact form — design/04 §5. Success replaces the form (B11 entry point;
 * POST /api/contact → crm.lead).
 */
export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [pending, setPending] = useState(false);

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPending(true);
    // POST /api/contact — backend not wired in this phase
    setTimeout(() => setSent(true), 700);
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: EASE_WATER }}
        className="flex h-full min-h-[420px] flex-col items-center justify-center text-center"
        role="status"
      >
        <LotusMark className="size-16" />
        <h2 className="text-display-md mt-6 text-teal-700">Terima kasih.</h2>
        <p className="mt-3 text-ink-700">We reply within one day — usually much sooner.</p>
      </motion.div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-6" noValidate>
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="c-name">Full name</Label>
          <Input id="c-name" name="name" required autoComplete="name" className="h-12 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="c-email">Email</Label>
          <Input id="c-email" name="email" type="email" required autoComplete="email" className="h-12 bg-white" />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-topic">Topic</Label>
        <Select name="topic" defaultValue="reservation">
          <SelectTrigger id="c-topic" className="h-12! w-full bg-white">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="reservation">Reservation</SelectItem>
            <SelectItem value="event">Private event</SelectItem>
            <SelectItem value="press">Press</SelectItem>
            <SelectItem value="partnership">Partnership</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="c-message">Message</Label>
        <Textarea
          id="c-message"
          name="message"
          required
          rows={5}
          className="bg-white"
          placeholder="Dates, questions, celebrations, accessibility — we read every word."
        />
      </div>

      <div className="flex items-start gap-3">
        <Checkbox id="c-consent" required className="mt-0.5" />
        <Label htmlFor="c-consent" className="text-[13px] leading-snug font-normal text-stone-600">
          I agree that The Nadi Amerta may contact me about this enquiry.
        </Label>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full items-center justify-center rounded-md bg-palm-700 px-8 text-sm font-medium text-ivory-50 transition-all duration-200 hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60 sm:w-auto"
      >
        {pending ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
