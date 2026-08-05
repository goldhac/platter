"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { commitParsedMenu, parseMenuUpload } from "@/lib/mutations/import-menu";
import type { ParsedMenu } from "@/lib/ai/gemini";

const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";

function counts(menu: ParsedMenu) {
  let cats = 0;
  let items = 0;
  for (const g of menu.groups) {
    cats += g.categories.length;
    for (const c of g.categories) items += c.items.length;
  }
  return { groups: menu.groups.length, cats, items };
}

export function MenuImport() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [reading, setReading] = useState(false);
  const [menu, setMenu] = useState<ParsedMenu | null>(null);
  const [committing, start] = useTransition();

  async function read() {
    if (!file) return;
    setReading(true);
    const fd = new FormData();
    fd.append("file", file);
    const res = await parseMenuUpload(fd);
    setReading(false);
    if (!res.ok) {
      toast.error(res.error);
      return;
    }
    setMenu(res.menu);
    const c = counts(res.menu);
    toast.success(`Read ${c.items} items across ${c.cats} sections`);
  }

  // Immutable edit against the held ParsedMenu.
  function edit(mutate: (draft: ParsedMenu) => void) {
    setMenu((prev) => {
      if (!prev) return prev;
      const next = structuredClone(prev) as ParsedMenu;
      mutate(next);
      return next;
    });
  }

  function commit() {
    if (!menu) return;
    start(async () => {
      const res = await commitParsedMenu(menu);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`Created “${menu.menuName}” — ${res.items} items (draft)`);
      router.push(`/admin/menu?m=${res.slug}`);
      router.refresh();
    });
  }

  // ── Review + edit ──────────────────────────────────────────────────────────
  if (menu) {
    const c = counts(menu);
    return (
      <div className="space-y-4">
        <div className="rounded-card border border-hairline/25 bg-black/10 p-3">
          <label className="tabular mb-1 block text-[0.65rem] uppercase tracking-wider text-brass">
            Menu name
          </label>
          <input
            className={field}
            value={menu.menuName}
            onChange={(e) => edit((d) => (d.menuName = e.target.value))}
          />
          <p className="mt-2 text-xs text-muted">
            {c.groups} group{c.groups === 1 ? "" : "s"} · {c.cats} section{c.cats === 1 ? "" : "s"} ·{" "}
            {c.items} item{c.items === 1 ? "" : "s"} · lands as a <span className="text-porcelain">draft</span>{" "}
            to review before publishing.
          </p>
        </div>

        {menu.groups.map((g, gi) => (
          <div key={gi} className="rounded-card border border-hairline/25 p-3">
            <div className="flex items-center gap-2">
              <input
                className={`${field} font-display`}
                value={g.name}
                aria-label="Group name"
                onChange={(e) => edit((d) => (d.groups[gi].name = e.target.value))}
              />
              <button
                type="button"
                onClick={() => edit((d) => d.groups.splice(gi, 1))}
                className="tabular shrink-0 rounded-card border border-hairline/30 px-2 py-2 text-[0.6rem] uppercase tracking-wider text-muted hover:text-accent"
              >
                Remove
              </button>
            </div>

            {g.categories.map((cat, ci) => (
              <div key={ci} className="mt-3 pl-1">
                <div className="flex items-center gap-2">
                  <input
                    className={`${field} text-brass`}
                    value={cat.name}
                    aria-label="Section name"
                    onChange={(e) => edit((d) => (d.groups[gi].categories[ci].name = e.target.value))}
                  />
                  <button
                    type="button"
                    onClick={() => edit((d) => d.groups[gi].categories.splice(ci, 1))}
                    className="tabular shrink-0 rounded-card border border-hairline/30 px-2 py-2 text-[0.6rem] uppercase tracking-wider text-muted hover:text-accent"
                  >
                    ×
                  </button>
                </div>

                <ul className="mt-2 space-y-2">
                  {cat.items.map((it, ii) => (
                    <li key={ii} className="rounded-card border border-hairline/15 p-2">
                      <div className="flex items-center gap-2">
                        <input
                          className={`${field} flex-1`}
                          value={it.name}
                          aria-label="Item name"
                          onChange={(e) =>
                            edit((d) => (d.groups[gi].categories[ci].items[ii].name = e.target.value))
                          }
                        />
                        <input
                          className={`${field} tabular w-24 text-right`}
                          value={String(it.price)}
                          inputMode="decimal"
                          aria-label="Price"
                          onChange={(e) =>
                            edit(
                              (d) =>
                                (d.groups[gi].categories[ci].items[ii].price =
                                  Number(e.target.value) || 0),
                            )
                          }
                        />
                        <button
                          type="button"
                          onClick={() => edit((d) => d.groups[gi].categories[ci].items.splice(ii, 1))}
                          className="shrink-0 rounded-card border border-hairline/30 px-2 py-2 text-muted hover:text-accent"
                          aria-label={`Remove ${it.name}`}
                        >
                          ×
                        </button>
                      </div>
                      <input
                        className={`${field} mt-1.5 text-xs text-muted`}
                        value={it.description ?? ""}
                        placeholder="Description (optional)"
                        aria-label="Item description"
                        onChange={(e) =>
                          edit(
                            (d) =>
                              (d.groups[gi].categories[ci].items[ii].description =
                                e.target.value || undefined),
                          )
                        }
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ))}

        <div className="sticky bottom-0 flex items-center gap-3 border-t border-hairline/20 bg-ink/95 py-3 backdrop-blur">
          <button
            type="button"
            onClick={commit}
            disabled={committing || c.items === 0}
            className="tabular rounded-card bg-accent px-4 py-2.5 text-sm uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
          >
            {committing ? "Creating…" : `Create draft menu · ${c.items} items`}
          </button>
          <button
            type="button"
            onClick={() => {
              setMenu(null);
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            className="rounded-card border border-hairline/30 px-4 py-2.5 text-sm text-muted hover:text-porcelain"
          >
            Discard
          </button>
        </div>
      </div>
    );
  }

  // ── Upload ───────────────────────────────────────────────────────────────
  return (
    <div className="rounded-card border border-dashed border-hairline/30 p-5">
      <p className="text-sm text-porcelain">Snap or upload your existing menu</p>
      <p className="mt-1 text-xs text-muted">
        A photo or PDF — the AI reads the dishes, sections, and prices into a draft you review before
        it goes live. JPG, PNG, WEBP, HEIC, or PDF, up to 10MB.
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*,.pdf,application/pdf"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          className="text-xs text-muted file:mr-3 file:rounded-card file:border-0 file:bg-hairline/20 file:px-3 file:py-2 file:text-xs file:uppercase file:tracking-wider file:text-porcelain"
        />
        <button
          type="button"
          onClick={read}
          disabled={!file || reading}
          className="tabular rounded-card bg-accent px-4 py-2 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
        >
          {reading ? "Reading menu…" : "Read menu"}
        </button>
      </div>
      {reading && (
        <p className="mt-3 animate-pulse text-xs text-brass">
          Reading your menu — this can take 10–30 seconds for a full page.
        </p>
      )}
    </div>
  );
}
