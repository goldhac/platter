import { notFound } from "next/navigation";
import { CategoryForm } from "@/components/admin/category-form";
import { getCategoryForEdit, getGroupOptions } from "@/lib/queries/admin-categories";

export const dynamic = "force-dynamic";

export default async function EditCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [groups, category] = await Promise.all([getGroupOptions(), getCategoryForEdit(id)]);
  if (!category) notFound();

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Edit category</h1>
      <p className="mt-1 text-sm text-muted">{category.name}</p>
      <div className="mt-5">
        <CategoryForm groups={groups} initial={category} />
      </div>
    </div>
  );
}
