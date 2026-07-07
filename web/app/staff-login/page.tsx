/**
 * Staff operations sign-in — authenticates against Odoo res.users (design/04 §8,
 * design/10 P16-P23 RBAC). Dev: admin / admin.
 */
import type { Metadata } from "next";
import Image from "next/image";
import { StaffLoginForm } from "./staff-login-form";

export const metadata: Metadata = { title: "Staff sign-in" };

export default function StaffLoginPage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-12">
      <div className="relative hidden lg:col-span-6 lg:block xl:col-span-7">
        <Image src="/photos/hero-gorge.webp" alt="" fill priority sizes="60vw" className="object-cover" />
        <div className="overlay-hero absolute inset-0" aria-hidden />
        <div className="absolute right-12 bottom-12 left-12 text-ivory-100">
          <p className="eyebrow-dark eyebrow">Nadi Amerta · Operations</p>
          <p className="font-display mt-3 text-2xl leading-snug">
            The house runs on quiet coordination.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center px-6 py-16 lg:col-span-6 xl:col-span-5">
        <StaffLoginForm />
      </div>
    </div>
  );
}
