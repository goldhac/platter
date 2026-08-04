import Link from "next/link";
import { CategoryList } from "@/components/admin/category-list";
import { getAdminCategories } from "@/lib/queries/admin-categories";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const categories = await getAdminCategories();

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl text-porcelain">Categories</h1>
        <Link
          href="/admin/categories/new"
          className="tabular rounded-card bg-accent px-3 py-2 text-xs uppercase tracking-wider text-porcelain"
        >
          + Category
        </Link>
      </div>
      <div className="mt-4">
        <CategoryList categories={categories} />
      </div>
    </div>
  );
}
