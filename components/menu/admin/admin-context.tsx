"use client";

import { createContext, useContext } from "react";
import type { MenuItem } from "@/lib/queries/menu";

export type AdminInfo = {
  role: "owner" | "manager" | "staff";
  venueName: string;
  dashboardHref: string;
  editMenuHref: string;
  addItemHref: string;
  /** Base path for the full item editor; the drawer appends the item id (a function here
   * would cross the server→client boundary, which RSC forbids). */
  itemHrefBase: string;
};

export type AdminCtx = {
  admin: AdminInfo | null;
  itemsBySlug: Record<string, MenuItem>;
  preview: boolean;
  setPreview: (v: boolean) => void;
  editSlug: string | null;
  openEdit: (slug: string) => void;
  closeEdit: () => void;
};

/** Default = "not an admin". The public menu ships this (tiny); the real value only
 * exists inside <AdminLayer>, which is dynamically loaded for staff sessions only. */
export const AdminContext = createContext<AdminCtx>({
  admin: null,
  itemsBySlug: {},
  preview: false,
  setPreview: () => {},
  editSlug: null,
  openEdit: () => {},
  closeEdit: () => {},
});

export function useAdmin(): AdminCtx {
  return useContext(AdminContext);
}
