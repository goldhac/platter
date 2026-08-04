import { createClient } from "@/lib/supabase/server";

export type Role = "owner" | "manager" | "staff";

export type StaffContext = {
  userId: string;
  tenantId: string;
  restaurantId: string | null;
  role: Role;
  fullName: string | null;
  email: string | null;
};

const RANK: Record<Role, number> = { staff: 1, manager: 2, owner: 3 };

/**
 * The authenticated staff member and their tenant/role, or null if the caller is
 * not a signed-in staff member. This is the app-layer half of the security
 * boundary (security.md §1); RLS is the other, independent half.
 */
export async function getCurrentStaff(): Promise<StaffContext | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Reads the caller's own staff row (allowed by the auth_read_staff RLS policy).
  const { data: staff } = await supabase
    .from("staff")
    .select("tenant_id, restaurant_id, role, full_name, email")
    .eq("id", user.id)
    .eq("is_active", true)
    .single();

  if (!staff) return null;

  return {
    userId: user.id,
    tenantId: staff.tenant_id,
    restaurantId: staff.restaurant_id,
    role: staff.role as Role,
    fullName: staff.full_name,
    email: staff.email,
  };
}

/** True if `role` meets or exceeds `required` in the owner > manager > staff order. */
export function hasRole(role: Role, required: Role): boolean {
  return RANK[role] >= RANK[required];
}

/** Gate a server action to manager+; returns the staff context or an error string. */
export async function requireManager(): Promise<
  { staff: StaffContext; error: null } | { staff: null; error: string }
> {
  const staff = await getCurrentStaff();
  if (!staff) return { staff: null, error: "Not signed in" };
  if (!hasRole(staff.role, "manager")) return { staff: null, error: "Managers only" };
  return { staff, error: null };
}

/** Gate a server action to owner only (settings, staff). */
export async function requireOwner(): Promise<
  { staff: StaffContext; error: null } | { staff: null; error: string }
> {
  const staff = await getCurrentStaff();
  if (!staff) return { staff: null, error: "Not signed in" };
  if (!hasRole(staff.role, "owner")) return { staff: null, error: "Owner only" };
  return { staff, error: null };
}
