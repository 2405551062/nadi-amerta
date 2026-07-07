import { PortalNav } from "@/components/portal/portal-nav";
import { Footer } from "@/components/site/footer";

// Portal pages read live Odoo data — never statically prerender.
export const dynamic = "force-dynamic";

/** Guest portal shell — design/06. */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PortalNav />
      <div className="min-h-[70svh]">{children}</div>
      <Footer />
    </>
  );
}
