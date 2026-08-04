import { notFound } from "next/navigation";
import { ModifierForm } from "@/components/admin/modifier-form";
import { getModifierGroupForEdit } from "@/lib/queries/admin-modifiers";

export const dynamic = "force-dynamic";

export default async function EditModifierPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const group = await getModifierGroupForEdit(id);
  if (!group) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Edit add-on group</h1>
      <p className="mt-1 text-sm text-muted">{group.name}</p>
      <div className="mt-5">
        <ModifierForm initial={group} />
      </div>
    </div>
  );
}
