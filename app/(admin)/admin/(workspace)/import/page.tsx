import { BinList } from "@/components/admin/bin-list";
import { CsvImport } from "@/components/admin/csv-import";
import { MenuImport } from "@/components/admin/menu-import";
import { getRecentActivity } from "@/lib/queries/admin-audit";
import { getBinItems } from "@/lib/queries/admin-bin";

export const dynamic = "force-dynamic";

function timeAgo(iso: string): string {
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const eyebrow = "font-mono text-[0.72rem] uppercase tracking-[0.2em] text-hairline-strong";

export default async function DataPage() {
  const [bin, activity] = await Promise.all([getBinItems(), getRecentActivity(10)]);

  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-2xl text-text">Data</h1>
      <p className="mt-1 text-sm text-text-secondary">Export your data, restore deleted items, and see what changed.</p>

      {/* Export */}
      <section className="mt-7">
        <h2 className={eyebrow}>Export</h2>
        <p className="mt-1.5 text-sm text-text-secondary">Download every item as a CSV — your data, any time.</p>
        <a
          href="/api/export"
          className="mt-3 inline-block rounded-sm border border-hairline px-3.5 py-2 text-sm text-text-secondary transition-colors hover:border-hairline-strong hover:text-text"
        >
          Download menu.csv
        </a>
      </section>

      {/* Bin — the screen the delete dialogs promise */}
      <section className="mt-9">
        <h2 className={eyebrow}>Bin</h2>
        <p className="mt-1.5 text-sm text-text-secondary">Deleted items, kept for 30 days before they&apos;re gone for good.</p>
        <div className="mt-3">
          <BinList items={bin} />
        </div>
      </section>

      {/* Recent activity */}
      <section className="mt-9">
        <h2 className={eyebrow}>Recent activity</h2>
        <div className="mt-3 overflow-hidden rounded-md border border-hairline">
          {activity.length === 0 ? (
            <p className="bg-surface p-4 text-sm text-text-secondary">No activity yet.</p>
          ) : (
            activity.map((a) => (
              <div
                key={a.id}
                className="flex items-baseline justify-between gap-4 border-b border-hairline bg-surface px-4 py-3 last:border-0"
              >
                <span className="min-w-0 flex-1 text-sm text-text-secondary">
                  <span className="text-text">{a.actor}</span> {a.action} {a.entity}
                  {a.name ? (
                    <>
                      {" "}
                      <span className="text-text">{a.name}</span>
                    </>
                  ) : null}
                </span>
                <span className="flex-none font-mono text-[0.6rem] uppercase tracking-wider text-text-tertiary">
                  {timeAgo(a.at)}
                </span>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Import */}
      <section className="mt-9">
        <div className="flex items-baseline gap-2">
          <h2 className={eyebrow}>Import from a photo</h2>
          <span className="rounded-full bg-accent-soft px-2 py-0.5 font-mono text-[0.55rem] uppercase tracking-wider text-accent-text">
            AI
          </span>
        </div>
        <div className="mt-3">
          <MenuImport />
        </div>
      </section>

      <section className="mt-9">
        <h2 className={eyebrow}>Import from CSV</h2>
        <p className="mt-1.5 text-sm text-text-secondary">
          Advanced — add items in bulk to the current menu from a spreadsheet.
        </p>
        <div className="mt-3">
          <CsvImport />
        </div>
      </section>
    </div>
  );
}
