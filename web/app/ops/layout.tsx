import { OpsSidebar } from "@/components/ops/ops-sidebar";
import { OpsLive } from "@/components/ops/ops-live";
import { getSession } from "@/lib/session";

// Ops consoles read live Odoo data — never statically prerender.
export const dynamic = "force-dynamic";

/**
 * Staff console shell — design/07. Access is enforced by middleware (staff
 * session required); the sidebar reflects the signed-in user (design/10 §2).
 */
export default async function OpsLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  const role = session?.groups?.includes("General Manager")
    ? "General Manager"
    : session?.groups?.[0] ?? "Operations";
  return (
    <div className="flex min-h-svh">
      <OpsLive />
      <OpsSidebar user={session ? { name: session.name, role } : undefined} />
      <main className="min-w-0 flex-1 bg-ivory-100">{children}</main>
    </div>
  );
}
