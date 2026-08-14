import type { MenuItem } from "@/lib/queries/menu";

/**
 * Admin affordances layered over one menu item — an edit pencil + a "Hidden" badge for
 * drafts. Server-rendered (no per-item JS); the pencil carries `data-edit-slug` and
 * MenuBoard's delegated click handler opens the quick-edit drawer. Only rendered inside a
 * staff session, and inside a `.group.relative` <li>. Hidden in "view as customer" preview
 * via the `[data-admin-preview]` CSS in globals.css.
 */
export function ItemAdminControls({ item }: { item: MenuItem }) {
  const draft = item.status !== "published";
  return (
    <>
      {draft && (
        <span
          data-draft-badge
          className="tabular pointer-events-none absolute left-0 top-2 z-10 rounded-card bg-accent px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-bg"
        >
          Hidden
        </span>
      )}
      <button
        type="button"
        data-edit-slug={item.slug}
        aria-label={`Edit ${item.name}`}
        className="absolute right-1 top-1 z-10 flex h-8 w-8 items-center justify-center rounded-card border border-hairline/40 bg-bg/85 text-text-secondary opacity-0 backdrop-blur transition hover:text-text focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
      >
        <svg
          width="15"
          height="15"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
        </svg>
      </button>
    </>
  );
}
