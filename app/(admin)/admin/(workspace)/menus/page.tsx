import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMenus } from "@/lib/queries/admin-menus";
import { NewMenuButton } from "@/components/admin/new-menu-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  live: "text-positive",
  draft: "text-muted",
  archived: "text-muted line-through",
};

const pill =
  "tabular rounded-card border border-hairline/30 px-3 py-1.5 text-xs uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70";

export default async function MenusPage() {
  const data = await getAdminMenus();
  if (!data) redirect("/admin/login");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-porcelain">Menus</h1>
          <p className="text-sm text-muted">Each menu has its own theme, schedule, and publish state.</p>
        </div>
        <NewMenuButton />
      </div>

      {data.menus.length === 0 ? (
        <p className="text-sm text-muted">No menus yet — create one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.menus.map((m) => (
            <div key={m.id} className="rounded-card border border-hairline/25 p-4">
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-lg text-porcelain">{m.name}</span>
                <span className={cn("tabular text-[0.6rem] uppercase tracking-wider", STATUS[m.status] ?? "text-muted")}>
                  {m.status}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted">
                <span className="capitalize">{m.themeId}</span> · {m.itemCount} item{m.itemCount === 1 ? "" : "s"}
                {m.isDefault && " · default"}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/theme?m=${m.slug}`} className={pill}>
                  Theme
                </Link>
                <Link href={`/menu?m=${m.slug}`} target="_blank" rel="noopener" className={pill}>
                  View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
