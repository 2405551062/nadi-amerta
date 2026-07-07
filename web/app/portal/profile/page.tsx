/**
 * Profile — design/06 §2.
 * Traceability (design/10 P13): CRM data · ERD res.partner (x_nik_paspor,
 * x_nationality, preferences) · GET/PATCH /api/profile
 */
import type { Metadata } from "next";
import { ProfileForm } from "./profile-form";
import { getProfile } from "@/lib/server/profile";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const profile = await getProfile();
  return (
    <main className="mx-auto w-full max-w-[640px] px-6 py-12 lg:py-16">
      <p className="eyebrow">Your account</p>
      <h1 className="text-display-md mt-3 text-teal-700">Profile</h1>
      <p className="mt-3 text-sm text-stone-500">Told once, remembered every stay.</p>
      <ProfileForm profile={profile} />
    </main>
  );
}
