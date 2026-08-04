import { CSV_COLUMNS, toCsv } from "@/lib/csv";
import { getCurrentStaff } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

// Exports the tenant's items as CSV (A11) — data ownership + backup. RLS scopes
// the query to the caller's tenant.
export async function GET() {
  const staff = await getCurrentStaff();
  if (!staff) return new Response("Unauthorized", { status: 401 });

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("items")
    .select(
      "name, name_zh, description, base_price, spice_level, dietary_tags, allergens, is_featured, status, categories(name)",
    )
    .is("deleted_at", null)
    .order("sort_order");
  if (error) return new Response(error.message, { status: 500 });

  const rows = (data ?? []).map((it) => {
    const c = it.categories as { name: string } | { name: string }[] | null;
    const category = (Array.isArray(c) ? c[0]?.name : c?.name) ?? "";
    return {
      category,
      name: it.name,
      name_zh: it.name_zh ?? "",
      description: it.description ?? "",
      price: String(it.base_price),
      spice_level: String(it.spice_level),
      dietary_tags: (it.dietary_tags ?? []).join("|"),
      allergens: (it.allergens ?? []).join("|"),
      is_featured: it.is_featured ? "yes" : "no",
      status: it.status,
    };
  });

  return new Response(toCsv(rows, [...CSV_COLUMNS]), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": 'attachment; filename="jin-canting-menu.csv"',
    },
  });
}
