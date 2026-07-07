"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function StaffLoginForm() {
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPending(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ login, password }),
      });
      const data = await res.json();
      if (!data.ok) {
        setError(data.error || "Login failed");
        setPending(false);
        return;
      }
      router.push("/ops");
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
      <h1 className="text-display-md mt-10 text-teal-700">Operations portal</h1>
      <p className="mt-3 text-[15px] text-ink-700">Sign in with your staff account.</p>

      <form onSubmit={submit} className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="s-login">Username</Label>
          <Input id="s-login" value={login} onChange={(e) => setLogin(e.target.value)} required autoComplete="username" className="h-12 bg-white" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="s-pass">Password</Label>
          <Input id="s-pass" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" className="h-12 bg-white" />
        </div>
        {error && <p className="text-[13px] text-terracotta-500" role="alert">{error}</p>}
        <button
          type="submit"
          disabled={pending}
          className="h-12 w-full rounded-md bg-palm-700 text-sm font-medium text-ivory-50 transition-all hover:bg-palm-600 active:scale-[0.98] disabled:opacity-60"
        >
          {pending ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-[13px] text-stone-500">
        Dev credentials: <span className="font-mono">admin / admin</span>
      </p>
      <p className="mt-2 text-[13px] text-stone-500">
        Guest?{" "}
        <Link href="/signin" className="font-medium text-teal-700 underline underline-offset-4">
          Guest sign-in
        </Link>
      </p>
    </div>
  );
}
