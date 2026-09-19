import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdminMenus } from "@/lib/queries/admin-menus";
import { NewMenuButton } from "@/components/admin/new-menu-button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

const STATUS: Record<string, string> = {
  live: "text-positive",
  draft: "text-caution",
  archived: "text-text-tertiary line-through",
};

const pill =
  "rounded-sm border border-hairline px-3 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.13em] text-text-secondary outline-none transition-colors hover:border-hairline-strong hover:text-text focus-visible:ring-2 focus-visible:ring-accent/50";

export default async function MenusPage() {
  const data = await getAdminMenus();
  if (!data) redirect("/admin/login");

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl text-text">Menus</h1>
          <p className="text-sm text-text-secondary">Each menu has its own theme, schedule, and publish state.</p>
        </div>
        <NewMenuButton />
      </div>

      {data.menus.length === 0 ? (
        <p className="text-sm text-text-secondary">No menus yet — create one to get started.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {data.menus.map((m) => (
            <div
              key={m.id}
              className="rounded-md border border-hairline bg-surface p-5 transition-colors hover:border-hairline-strong/40"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-display text-lg text-text">{m.name}</span>
                <span
                  className={cn(
                    "font-mono text-[9.5px] uppercase tracking-[0.14em]",
                    STATUS[m.status] ?? "text-text-secondary",
                  )}
                >
                  {m.status}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-text-secondary">
                <span className="capitalize">{m.themeId}</span> · {m.itemCount} item{m.itemCount === 1 ? "" : "s"}
                {m.isDefault && " · default"}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                {/* Fix (§11.1): the Menus page had no way to open a menu — Edit is the primary action. */}
                <Link href={`/admin/menu?m=${m.slug}`} className={pill}>
                  Edit
                </Link>
                <Link href={`/admin/theme?m=${m.slug}`} className={pill}>
                  Theme
                </Link>
                <Link
                  href={`/v/${data.restaurantSlug}?m=${m.slug}`}
                  target="_blank"
                  rel="noopener"
                  className={pill}
                >
                  View ↗
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
