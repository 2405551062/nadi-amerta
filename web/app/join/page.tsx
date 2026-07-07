/**
 * Join — design/04 §8. Traceability (design/10 P6): res.partner · POST /api/auth/*
 */
import type { Metadata } from "next";
import { AuthPanel } from "@/components/auth/auth-panel";

export const metadata: Metadata = { title: "Create account" };

export default function JoinPage() {
  return <AuthPanel mode="join" />;
}
