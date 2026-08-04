import Link from "next/link";
import { ModifierList } from "@/components/admin/modifier-list";
import { getModifierGroups } from "@/lib/queries/admin-modifiers";

export const dynamic = "force-dynamic";

export default async function ModifiersPage() {
  const groups = await getModifierGroups();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-porcelain">Add-on groups</h1>
        <Link
          href="/admin/modifiers/new"
          className="tabular rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain"
        >
          + Group
        </Link>
      </div>
      <p className="mt-1 text-sm text-muted">
        Reusable options like &ldquo;Choice of rice&rdquo; or &ldquo;Extras&rdquo;. Attach them to
        items from the item form.
      </p>
      <div className="mt-4">
        <ModifierList groups={groups} />
      </div>
    </div>
  );
}
