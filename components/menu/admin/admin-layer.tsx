"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import type { MenuItem } from "@/lib/queries/menu";
import { AdminBar } from "./admin-bar";
import { AdminContext, type AdminInfo } from "./admin-context";
import { QuickEditDrawer } from "./quick-edit-drawer";

/**
 * The whole admin-on-public-menu layer, dynamically imported so its JS only loads inside a
 * staff session (customers never download it). Wraps the menu content so the edit pencils
 * (delegated through MenuBoard) and the draft badges live under `[data-admin-preview]`,
 * which the "view as customer" toggle uses to hide them.
 */
export default function AdminLayer({
  admin,
  itemsBySlug,
  children,
}: {
  admin: AdminInfo;
  itemsBySlug: Record<string, MenuItem>;
  children: React.ReactNode;
}) {
  const [preview, setPreview] = useState(false);
  const [editSlug, setEditSlug] = useState<string | null>(null);

  return (
    <AdminContext.Provider
      value={{
        admin,
        itemsBySlug,
        preview,
        setPreview,
        editSlug,
        openEdit: (slug: string) => setEditSlug(slug),
        closeEdit: () => setEditSlug(null),
      }}
    >
      <div data-admin-preview={preview ? "" : undefined}>{children}</div>
      <AdminBar />
      <QuickEditDrawer />
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </AdminContext.Provider>
  );
}
