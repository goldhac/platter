import { ItemForm } from "@/components/admin/item-form";
import { getCategoryOptions } from "@/lib/queries/admin-menu";
import { getModifierGroupOptions } from "@/lib/queries/admin-modifiers";
import { getCurrentStaff } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function NewItemPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const { m } = await searchParams;
  const staff = await getCurrentStaff();
  if (!staff) return null;
  const [categories, modifierGroups] = await Promise.all([
    getCategoryOptions(m), // only the active menu's categories, so the item lands there
    getModifierGroupOptions(),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">New item</h1>
      <p className="mt-1 text-sm text-muted">Lands in draft — publish it from the menu tree.</p>
      <div className="mt-5">
        <ItemForm
          categories={categories}
          tenantId={staff.tenantId}
          modifierGroups={modifierGroups}
          initialModifierGroupIds={[]}
          menuSlug={m}
        />
      </div>
    </div>
  );
}
