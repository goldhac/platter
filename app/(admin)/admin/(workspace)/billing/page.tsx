import { redirect } from "next/navigation";
import { BillingView } from "@/components/admin/billing-view";
import { getBilling } from "@/lib/queries/admin-billing";

export const dynamic = "force-dynamic";

export default async function BillingPage() {
  const data = await getBilling();
  if (!data) redirect("/admin/login");

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Plan &amp; billing</h1>
      <p className="mt-1 text-sm text-muted">Your plan, what you&apos;re using, and what Pro unlocks.</p>
      <div className="mt-5">
        <BillingView data={data} />
      </div>
    </div>
  );
}
