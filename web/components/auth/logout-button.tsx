"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

export function LogoutButton({
  className,
  redirectTo = "/",
  label = "Sign out",
}: {
  className?: string;
  redirectTo?: string;
  label?: string;
}) {
  const router = useRouter();
  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push(redirectTo);
    router.refresh();
  };
  return (
    <button onClick={logout} className={cn("inline-flex items-center gap-2", className)}>
      <LogOut className="size-4" aria-hidden />
      {label}
    </button>
  );
}
