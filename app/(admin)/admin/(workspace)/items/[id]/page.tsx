import { notFound } from "next/navigation";
import { ItemForm } from "@/components/admin/item-form";
import { getCategoryOptions, getItemForEdit } from "@/lib/queries/admin-menu";
import { getItemModifierGroupIds, getModifierGroupOptions } from "@/lib/queries/admin-modifiers";
import { getCurrentStaff } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export default async function EditItemPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ m?: string }>;
}) {
  const { id } = await params;
  const { m } = await searchParams;
  const staff = await getCurrentStaff();
  if (!staff) return null;

  const [categories, item, modifierGroups, modIds] = await Promise.all([
    getCategoryOptions(), // unscoped on edit — lets you move an item across menus

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
          menuSlug={m}
        />
      </div>
    </div>
  );
}
