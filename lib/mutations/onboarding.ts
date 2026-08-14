"use server";

import { revalidatePath } from "next/cache";
import { requireManager } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";

export type OnbResult = { ok: true } | { ok: false; error: string };

/** The onboarding wizard's "details" step — name + cuisine + currency on the new venue. */
export async function saveOnboardingBasics(input: {
  name: string;
  cuisine: string;
  currency: string;
}): Promise<OnbResult> {
  const { staff, error } = await requireManager();
  if (!staff) return { ok: false, error };

  const name = (input.name || "").trim();
  if (!name) return { ok: false, error: "Give your venue a name." };
  const currency = (input.currency || "NGN").trim().toUpperCase();
  if (currency.length !== 3) return { ok: false, error: "Currency must be a 3-letter code (e.g. NGN)." };

  const supabase = await createClient();
  const { data: rest } = await supabase
    .from("restaurants")
    .select("id")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();
  if (!rest) return { ok: false, error: "Venue not found — try refreshing." };

  const { error: dbErr } = await supabase
    .from("restaurants")
    .update({ name, cuisine: (input.cuisine || "").trim() || null, currency })
    .eq("id", rest.id);
  if (dbErr) return { ok: false, error: dbErr.message };

  revalidatePath("/admin");
  return { ok: true };
}
