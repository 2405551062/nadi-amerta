"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { EASE_WATER } from "@/components/motion";

const DIETARY = ["Vegetarian", "Vegan", "Halal", "Gluten-free", "Nut allergy", "Shellfish allergy"];
const DRINKS = ["Young coconut", "Kintamani coffee", "Jamu", "Sparkling water"];

/** Grouped per-card saves; dirty cards grow a Save action (design/06 §2). */
function SectionCard({
  title,
  children,
  dirty,
  onSave,
}: {
  title: string;
  children: React.ReactNode;
  dirty: boolean;
  onSave: () => void;
}) {
  return (
    <motion.section
      layout
      className={cn(
        "rounded-lg bg-card p-6 shadow-sm transition-shadow",
        dirty && "ring-1 ring-amerta-400/50"
      )}
      aria-label={title}
    >
      <h2 className="font-display text-xl text-teal-700">{title}</h2>
      <div className="mt-5 space-y-5">{children}</div>
      <AnimatePresence>
        {dirty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE_WATER }}
            className="overflow-hidden"
          >
            <button
              onClick={onSave}
              className="mt-5 h-11 rounded-md bg-palm-700 px-6 text-sm font-medium text-ivory-50 transition-colors hover:bg-palm-600"
            >
              Save changes
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  country: string;
  passport: string;
  dietary: string[];
  arrivalDrink: string;
}

export function ProfileForm({ profile }: { profile: ProfileData }) {
  const [identity, setIdentity] = useState({ name: profile.name, email: profile.email });
  const [identityDirty, setIdentityDirty] = useState(false);

  const [travel, setTravel] = useState({
    phone: profile.phone,
    country: profile.country || "Singapore",
    language: "en",
    passport: profile.passport,
  });
  const [travelDirty, setTravelDirty] = useState(false);

  const [dietary, setDietary] = useState<string[]>(profile.dietary);
  const [drink, setDrink] = useState(profile.arrivalDrink || "Young coconut");
  const [prefsDirty, setPrefsDirty] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");

  const save = async (which: "identity" | "travel" | "prefs") => {
    // PATCH /api/profile → res.partner
    const patch =
      which === "identity"
        ? { name: identity.name, email: identity.email }
        : which === "travel"
        ? { phone: travel.phone, country: travel.country, passport: travel.passport }
        : { dietary, arrivalDrink: drink };
    try {
      await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (which === "identity") setIdentityDirty(false);
      if (which === "travel") setTravelDirty(false);
      if (which === "prefs") setPrefsDirty(false);
      toast("Saved", { description: "Your preferences travel with every reservation." });
    } catch {
      toast("Could not save — please try again.");
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <SectionCard title="Identity" dirty={identityDirty} onSave={() => save("identity")}>
        <div className="flex items-center gap-4">
          <Avatar className="size-16 border border-amerta-400/40 bg-sand-300">
            <AvatarFallback className="font-display bg-sand-300 text-xl text-teal-700">A</AvatarFallback>
          </Avatar>
          <button className="h-10 rounded-md border border-sand-400 px-4 text-[13px] font-medium text-ink-700 transition-colors hover:border-palm-700">
            Change photo
          </button>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-name">Full name</Label>
            <Input
              id="p-name"
              value={identity.name}
              onChange={(e) => {
                setIdentity((s) => ({ ...s, name: e.target.value }));
                setIdentityDirty(true);
              }}
              className="h-12 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-email">Email</Label>
            <Input
              id="p-email"
              type="email"
              value={identity.email}
              onChange={(e) => {
                setIdentity((s) => ({ ...s, email: e.target.value }));
                setIdentityDirty(true);
              }}
              className="h-12 bg-white"
            />
            <p className="text-xs text-stone-500">Changing your email asks for a fresh sign-in code.</p>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Travel details" dirty={travelDirty} onSave={() => save("travel")}>
        <div className="grid gap-5 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="p-phone">Phone / WhatsApp</Label>
            <Input
              id="p-phone"
              value={travel.phone}
              onChange={(e) => {
                setTravel((s) => ({ ...s, phone: e.target.value }));
                setTravelDirty(true);
              }}
              className="h-12 bg-white"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-passport">Passport / NIK</Label>
            <Input
              id="p-passport"
              value={travel.passport}
              onChange={(e) => {
                setTravel((s) => ({ ...s, passport: e.target.value }));
                setTravelDirty(true);
              }}
              className="h-12 bg-white font-mono"
            />
            <p className="text-xs text-stone-500">Speeds up check-in — stored encrypted.</p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-country">Country</Label>
            <Select
              value={travel.country}
              onValueChange={(v) => {
                setTravel((s) => ({ ...s, country: v }));
                setTravelDirty(true);
              }}
            >
              <SelectTrigger id="p-country" className="h-12! w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {["Indonesia", "Singapore", "Australia", "Japan", "India", "United Kingdom", "United States"].map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="p-lang">Language</Label>
            <Select
              value={travel.language}
              onValueChange={(v) => {
                setTravel((s) => ({ ...s, language: v }));
                setTravelDirty(true);
              }}
            >
              <SelectTrigger id="p-lang" className="h-12! w-full bg-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="id">Bahasa Indonesia</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Preferences" dirty={prefsDirty} onSave={() => save("prefs")}>
        <div>
          <Label className="text-xs tracking-[0.1em] text-stone-500 uppercase">Dietary</Label>
          <div className="mt-2 flex flex-wrap gap-2" role="group" aria-label="Dietary preferences">
            {DIETARY.map((d) => {
              const on = dietary.includes(d);
              return (
                <button
                  key={d}
                  onClick={() => {
                    setDietary((cur) => (on ? cur.filter((x) => x !== d) : [...cur, d]));
                    setPrefsDirty(true);
                  }}
                  aria-pressed={on}
                  className={cn(
                    "h-9 rounded-full border px-4 text-[13px] font-medium transition-colors",
                    on
                      ? "border-palm-700 bg-palm-700 text-ivory-50"
                      : "border-sand-400 bg-white text-ink-700 hover:border-palm-700"
                  )}
                >
                  {d}
                </button>
              );
            })}
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="p-drink">Arrival drink</Label>
          <Select
            value={drink}
            onValueChange={(v) => {
              setDrink(v);
              setPrefsDirty(true);
            }}
          >
            <SelectTrigger id="p-drink" className="h-12! w-full bg-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DRINKS.map((d) => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </SectionCard>

      {/* Danger zone — last, quiet (design/06 §2) */}
      <section className="rounded-lg border border-border bg-ivory-50 p-6" aria-label="Account actions">
        <h2 className="font-display text-xl text-ink-700">Account</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <button
            onClick={() => toast("Signed out everywhere", { description: "All other sessions have been ended." })}
            className="h-11 rounded-md border border-sand-400 px-5 text-sm font-medium text-ink-700 transition-colors hover:border-palm-700"
          >
            Sign out everywhere
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            className="h-11 px-2 text-sm font-medium text-terracotta-500 underline-offset-4 hover:underline"
          >
            Delete account
          </button>
        </div>
      </section>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="max-w-[440px] rounded-xl">
          <DialogHeader>
            <DialogTitle className="text-display-sm font-medium text-teal-700">Delete your account?</DialogTitle>
            <DialogDescription className="pt-2 text-[15px] leading-relaxed">
              Stay history, preferences, and invoices will be permanently removed after the legal
              retention period. Type <strong className="font-mono text-ink-900">DELETE</strong> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="h-12 bg-white font-mono"
            aria-label="Type DELETE to confirm"
          />
          <DialogFooter className="gap-3 sm:gap-3">
            <button
              autoFocus
              onClick={() => setDeleteOpen(false)}
              className="h-11 rounded-md border border-sand-400 px-5 text-sm font-medium text-ink-700 hover:border-palm-700"
            >
              Keep my account
            </button>
            <button
              disabled={confirmText !== "DELETE"}
              onClick={() => {
                setDeleteOpen(false);
                toast("Account deletion requested", { description: "We will email you a confirmation." });
              }}
              className="h-11 rounded-md bg-terracotta-500 px-5 text-sm font-medium text-ivory-50 transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              Delete account
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
