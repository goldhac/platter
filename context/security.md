# Platter — Security

> **Status:** v1. Data-handling authority for this project's crown-jewel concern: **tenant isolation** — one tenant must never read or write another tenant's data — and, from Phase 3, **payment data**.
> **When this file and any other file conflict on a data-handling question, this file wins.** Code-level enforcement lives in [`code-standards.md`](code-standards.md), which defers here for policy. The *why* behind the isolation bet is `foundation.md §4 #4` and `§11`.

**Status key:** ✅ enforced · 🟡 in progress · ⬜ planned (later phase)

---

## §1 The crown jewel — tenant isolation

The platform's deepest risk is a cross-tenant leak (`foundation.md §11`). Isolation is enforced with **two independent keys; both are mandatory:**

1. **Postgres RLS (the hard boundary).** Every tenant-owned table has RLS enabled with a policy that requires `tenant_id = auth_tenant_id()` on every read and write, where `auth_tenant_id()` = `select tenant_id from staff where id = auth.uid()`. This holds even if the app layer has a bug.
2. **App-layer scoping (defense in depth).** Every query in `lib/queries` and every write in `lib/mutations` *also* filters by the caller's tenant. UI role-gating is **never** counted as a security control — hiding a button is not access control (`foundation.md §7 #9`).

**The invariant:** a query or policy that touches a tenant-owned table without a `tenant_id` predicate is a **security bug**, not a style issue — treat it like a leaked credential. Reviews reject any unscoped access to tenant tables.

**Tables in scope:** `restaurants`, `menu_groups`, `categories`, `items`, `item_variants`, `modifier_groups`, `modifiers`, `item_modifier_groups`, `staff`, `redirects`, `audit_log`, `menu_events`, and (Phase 2) `orders`, `order_items`. Each carries a denormalized `tenant_id` so the predicate is a single flat comparison (`architecture.md → Data & tenancy`).

## §2 Roles & least privilege

RBAC `owner > manager > staff`, enforced in RLS *and* app layer:

- **anon (public):** `SELECT` only, and only rows with `status='published' AND deleted_at IS NULL`. No access to drafts, deleted rows, `staff`, `audit_log`, `tenants`, or any write.
- **staff:** may write **only** `items.is_available` and `item_variants.is_available` (the sold-out toggle), and read/advance orders — all within their own tenant. A staff token physically cannot edit prices, names, or anything else.
- **manager:** full CRUD on menu entities within their tenant.
- **owner:** the above plus `staff`, `restaurants`, and `tenants` settings — own tenant only.

Least privilege is the default: grant the narrowest policy that makes the role work, then widen only with cause.

## §3 The service-role key (bypasses RLS — handle like plutonium)

- The Supabase **service-role key bypasses RLS entirely.** It is **server-only**: it lives in `SUPABASE_SERVICE_ROLE_KEY`, is read only in server code (`lib/supabase/server` service client, server actions, scripts), and is **never** imported by a client component, never shipped in a client bundle, never prefixed `NEXT_PUBLIC_`.
- Use it only where RLS legitimately can't serve: trusted server-side jobs (the legacy CSV import, cron sold-out reset, analytics rollups). When it is used, the code must **manually re-apply tenant scoping** — the RLS safety net is off, so the app-layer key (§1.2) is the only one left.
- Anything a logged-in user does goes through the **RLS-scoped anon/auth client** (their session cookie), not the service role.

## §4 Secrets & env vars

- Secrets live in env vars only — never hardcoded, never committed. `.env.local` is git-ignored; production secrets live in Vercel/Supabase config.
- Only values safe for the browser may carry the `NEXT_PUBLIC_` prefix: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SITE_URL`. Everything else (`SUPABASE_SERVICE_ROLE_KEY`, `RESTAURANT_WHATSAPP`, future payment keys) is server-only.
- The anon key is *designed* to be public **only because RLS stands behind it** — that is exactly why §1's RLS invariant is non-negotiable.

## §5 App auth & sessions

- Supabase Auth: email+password and magic link. Sessions persist 30 days, rate-limited (A1). Session cookies are HttpOnly and drive the RLS `auth.uid()`.
- `staff.role` is the authorization source of truth, read server-side per request — never trust a role claim from the client.

## §6 Storage (dish photos)

- Upload paths are **tenant-scoped**: `{tenant_id}/{restaurant_id}/{item_id}.webp`. Storage RLS mirrors the DB — a tenant may write only under its own prefix.
- Validate before accepting: type allowlist (image/*), ≤5MB in, re-encode to WebP/AVIF ≤200KB (A7). Never trust the client-supplied filename or MIME blindly.
- Menu images are public-read (they're on a public menu); nothing sensitive goes in Storage.

## §7 Inbound webhooks (Phase 3 — payments)

- ⬜ Paystack/Flutterwave webhooks **must validate the signature** before trusting any field, and must be idempotent (dedupe by event id). Until Phase 3 there are no inbound webhooks.

## §8 Logging & error hygiene

- **Never log** secrets, service-role keys, session tokens, magic-link tokens, or (Phase 2+) guest PII and payment fields.
- Error messages shown to users are safe and generic; the detailed cause is logged server-side with a context prefix, never surfaced raw to the client.
- The analytics beacon (`menu_events`) stores a random `session_id` and event metadata — **no PII, no IP in the payload.** Choose the most privacy-preserving cookie/consent posture by default.

## §9 Sensitive-data categories

- **Guest PII (Phase 2):** room number, name, phone in `orders`. Store only what a fulfillment needs; don't retain beyond operational need. Order history snapshots the item name/price (`order_items.name_snapshot`) rather than joining live — no reason to over-collect.
- **Payment data (Phase 3):** never store card/PAN data — delegate to the payment provider (Paystack) and store only their reference. PCI stays with the provider.
- **Cross-tenant metadata:** analytics and audit logs are themselves tenant-owned and tenant-scoped — a tenant sees only its own events.

## §10 The public/private boundary — stated once

**Intentionally public** (served to anyone with the link): published, non-deleted menu content — names, descriptions, prices, photos, tags. That's the product.

**Must never be public:** drafts, soft-deleted rows, any other tenant's anything, `staff`/`tenants` rows, `audit_log`, service-role access, and Phase-2 guest/order data. The RLS policies in §1–§2 are what hold this line; this file is the authority on where the line sits.
