"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EASE_WATER } from "@/components/motion";
import { cn } from "@/lib/utils";

/**
 * Passwordless auth — design/04 §8. Email → 6-box OTP (auto-advance, paste-aware).
 * Traceability (design/10 P6): res.users/res.partner · POST /api/auth/otp, /api/auth/verify.
 * Demo: any code advances to the portal.
 */
export function AuthForm({ mode }: { mode: "signin" | "join" }) {
  const router = useRouter();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const [error, setError] = useState<string | false>(false);
  const [pending, setPending] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);

  const maskedEmail = email.replace(/^(.).*(@.*)$/, "$1•••$2");

  const sendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(false);
    try {
      const res = await fetch("/api/auth/otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!data.ok) throw new Error(data.error || "Could not send code");
      setDevCode(data.devCode ?? null); // shown in dev when SMTP isn't configured
      setStep("code");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPending(false);
    }
  };

  const setDigit = (i: number, v: string) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) {
      setCode((c) => c.map((d, j) => (j === i ? "" : d)));
      return;
    }
    setCode((c) => {
      const next = [...c];
      for (let k = 0; k < digits.length && i + k < 6; k++) next[i + k] = digits[k];
      return next;
    });
    boxes.current[Math.min(i + digits.length, 5)]?.focus();
  };

  const verify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.join("").length < 6) {
      setError("Please enter all six digits of the code.");
      return;
    }
    setPending(true);
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code: code.join("") }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Invalid code");
        setPending(false);
        return;
      }
      router.push("/portal");
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
      setPending(false);
    }
  };

  return (
    <div className="w-full max-w-sm">
      <Link href="/" className="font-display text-xl font-medium tracking-[0.08em] text-ink-900">
        Nadi Amerta
      </Link>
      <h1 className="text-display-md mt-10 text-teal-700">
        {mode === "signin" ? "Welcome back" : "Create your account"}
      </h1>
      <p className="mt-3 text-[15px] text-ink-700">
        {step === "email"
          ? "No passwords here — we send a six-digit code to your email."
          : `We sent a code to ${maskedEmail}.`}
      </p>

      <div className="relative mt-8 overflow-hidden">
        <AnimatePresence mode="wait" initial={false}>
          {step === "email" ? (
            <motion.form
              key="email"
              onSubmit={sendCode}
              initial={{ opacity: 0, x: -40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_WATER }}
              className="space-y-5"
            >
              {mode === "join" && (
                <div className="space-y-2">
                  <Label htmlFor="auth-name">Full name</Label>
                  <Input
                    id="auth-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    autoComplete="name"
                    className="h-12 bg-white"
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="auth-email">Email</Label>
                <Input
                  id="auth-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  className="h-12 bg-white"
                />
              </div>
              {error && step === "email" && (
                <p className="text-[13px] text-terracotta-500" role="alert">{error}</p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Sending…" : "Continue"}
              </button>
              <p className="text-center text-[13px] text-stone-500">
                Staff member?{" "}
                <Link href="/staff-login" className="font-medium text-teal-700 underline underline-offset-4">
                  Sign in to the operations portal
                </Link>
              </p>
            </motion.form>
          ) : (
            <motion.form
              key="code"
              onSubmit={verify}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.4, ease: EASE_WATER }}
            >
              {devCode && (
                <p className="mb-4 rounded-md bg-amerta-400/10 px-3 py-2 text-[13px] text-amerta-600" role="status">
                  Dev mode (no SMTP): your code is <strong className="font-mono">{devCode}</strong>
                </p>
              )}
              <motion.div
                animate={error ? { x: [0, -4, 4, -4, 4, 0] } : {}}
                transition={{ duration: 0.35 }}
                className="flex justify-between gap-2"
              >
                {code.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => {
                      boxes.current[i] = el;
                    }}
                    inputMode="numeric"
                    autoComplete={i === 0 ? "one-time-code" : "off"}
                    maxLength={6}
                    value={d}
                    aria-label={`Digit ${i + 1} of 6`}
                    onChange={(e) => setDigit(i, e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Backspace" && !d && i > 0) boxes.current[i - 1]?.focus();
                    }}
                    className={cn(
                      "h-14 w-12 rounded-md border bg-white text-center font-mono text-xl focus:ring-2 focus:ring-palm-700/30 focus:outline-none",
                      error ? "border-terracotta-500" : "border-input focus:border-palm-700"
                    )}
                  />
                ))}
              </motion.div>
              {error && (
                <p className="mt-3 text-[13px] text-terracotta-500" role="alert" aria-live="assertive">
                  {error}
                </p>
              )}
              <button
                type="submit"
                disabled={pending}
                className="mt-6 h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60"
              >
                {pending ? "Verifying…" : mode === "signin" ? "Sign in" : "Create account"}
              </button>
              <p className="mt-4 text-center text-[13px] text-stone-500">
                Nothing arrived?{" "}
                <button type="button" onClick={() => setStep("email")} className="font-medium text-teal-700 underline underline-offset-4">
                  Use a different email
                </button>
              </p>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <p className="mt-10 text-[13px] text-stone-500">
        {mode === "signin" ? (
          <>New to Nadi Amerta? <Link href="/join" className="font-medium text-teal-700 underline underline-offset-4">Create an account</Link></>
        ) : (
          <>Already a guest? <Link href="/signin" className="font-medium text-teal-700 underline underline-offset-4">Sign in</Link></>
        )}
      </p>
    </div>
  );
}
