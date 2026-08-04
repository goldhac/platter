import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/item-form";
import { getCategoryOptions, getItemForEdit } from "@/lib/queries/admin-menu";
import { getItemModifierGroupIds, getModifierGroupOptions } from "@/lib/queries/admin-modifiers";
import { getCurrentStaff } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function EditItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const [categories, item, modifierGroups, modIds] = await Promise.all([
    getCategoryOptions(),
    getItemForEdit(id),
    getModifierGroupOptions(),
    getItemModifierGroupIds(id),
  ]);
  if (!item) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Edit item</h1>
      <p className="mt-1 text-sm text-muted">{item.name}</p>
      <div className="mt-5">
        <ItemForm
          categories={categories}
          initial={item}
          tenantId={staff.tenantId}
          modifierGroups={modifierGroups}
          initialModifierGroupIds={modIds}
        />
      </div>
    </div>
  );
}
