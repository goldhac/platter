import { CategoryForm } from "@/components/admin/category-form";
import { getGroupOptions } from "@/lib/queries/admin-categories";

export const dynamic = "force-dynamic";

export default async function NewCategoryPage() {
  const groups = await getGroupOptions();

  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">New category</h1>
      <div className="mt-5">
        <CategoryForm groups={groups} />
      </div>
    </div>
  );
}
