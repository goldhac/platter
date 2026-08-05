import { CsvImport } from "@/components/admin/csv-import";
import { MenuImport } from "@/components/admin/menu-import";

export const dynamic = "force-dynamic";

export default function DataPage() {
  return (
    <div>
      <h1 className="font-display text-2xl text-porcelain">Import / Export</h1>

      <section className="mt-5">
        <div className="flex items-baseline gap-2">
          <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">
            Import from a photo
          </h2>
          <span className="tabular rounded-full bg-accent/15 px-2 py-0.5 text-[0.55rem] uppercase tracking-wider text-accent">
            AI
          </span>
        </div>
        <div className="mt-3">
          <MenuImport />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Export</h2>
        <p className="mt-1 text-sm text-muted">Download every item as a CSV — your data, any time.</p>
        <a
          href="/api/export"
          className="mt-2 inline-block rounded-card border border-hairline/30 px-3 py-2 text-sm text-muted hover:text-porcelain"
        >
          Download menu.csv
        </a>
      </section>

      <section className="mt-8">
        <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">
          Import from CSV
        </h2>
        <p className="mt-1 text-sm text-muted">
          Advanced — add items in bulk to the current menu from a spreadsheet.
        </p>
        <div className="mt-3">
          <CsvImport />
        </div>
      </section>
    </div>
  );
}
