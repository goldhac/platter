"use server";

import { revalidatePath } from "next/cache";
import { requireOwner } from "@/lib/rbac";
import { createClient } from "@/lib/supabase/server";
import { RESERVED_SLUGS } from "@/lib/venue/resolve";

export type DomainResult = { ok: true; slug?: string } | { ok: false; error: string };

// 2–50 chars, lowercase alnum + hyphens, no leading/trailing hyphen.
const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{0,48}[a-z0-9])?$/;
const DOMAIN_RE = /^(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9-]{1,63}(?<!-))+$/;

/** Change the venue's slug — its `/v/<slug>` path today and `<slug>.<platform>` subdomain later. */
export async function updateSubdomain(input: unknown): Promise<DomainResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };

  const slug = String(input ?? "").trim().toLowerCase();
  if (!SLUG_RE.test(slug)) {
    return { ok: false, error: "Use 2–50 letters, numbers, or hyphens (no leading or trailing hyphen)." };
  }
  if (RESERVED_SLUGS.has(slug)) return { ok: false, error: `“${slug}” is reserved — pick another.` };

  const supabase = await createClient();
  const { data: taken } = await supabase
    .from("restaurants")
    .select("id, tenant_id")
    .eq("slug", slug)
    .maybeSingle();
  if (taken && taken.tenant_id !== staff.tenantId) {
    return { ok: false, error: "That address is already taken." };
  }

  const { data: r } = await supabase
    .from("restaurants")
    .select("id, slug")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();
  if (!r) return { ok: false, error: "Venue not found" };
  if (r.slug === slug) return { ok: true, slug };

  const { error: uErr } = await supabase.from("restaurants").update({ slug }).eq("id", r.id);
  if (uErr) return { ok: false, error: uErr.message };

  revalidatePath("/admin/domains");
  revalidatePath("/admin");
  revalidatePath("/admin/qr");
  return { ok: true, slug };
}

/** Set (or clear, with "") the venue's custom domain. Activating it also needs the
 *  domain added in Railway + DNS pointed; here we just record host→venue. */
export async function updateCustomDomain(input: unknown): Promise<DomainResult> {
  const { staff, error } = await requireOwner();
  if (!staff) return { ok: false, error };

  const raw = String(input ?? "")
    .trim()
    .toLowerCase()
    .replace(/^https?:\/\//, "")
    .replace(/\/.*$/, "");
  const domain = raw || null;
  if (domain && !DOMAIN_RE.test(domain)) {
    return { ok: false, error: "Enter a valid domain, e.g. menu.yourrestaurant.com" };
  }

  const supabase = await createClient();
  if (domain) {
    const { data: taken } = await supabase
      .from("restaurants")
      .select("id, tenant_id")
      .eq("custom_domain", domain)
      .maybeSingle();
    if (taken && taken.tenant_id !== staff.tenantId) {
      return { ok: false, error: "That domain is already connected to another venue." };
    }
  }

  const { data: r } = await supabase
    .from("restaurants")
    .select("id")
    .eq("tenant_id", staff.tenantId)
    .limit(1)
    .maybeSingle();
  if (!r) return { ok: false, error: "Venue not found" };

  const { error: uErr } = await supabase
    .from("restaurants")
    .update({ custom_domain: domain })
    .eq("id", r.id);
  if (uErr) return { ok: false, error: uErr.message };

  revalidatePath("/admin/domains");
  return { ok: true };
}
