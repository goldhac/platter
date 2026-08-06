"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCustomDomain, updateSubdomain } from "@/lib/mutations/domains";

const field =
  "w-full rounded-card border border-hairline/30 bg-black/20 px-3 py-2.5 text-sm text-porcelain outline-none focus-visible:ring-2 focus-visible:ring-accent/70";
const btn =
  "tabular shrink-0 rounded-card bg-accent px-3 py-2.5 text-xs uppercase tracking-wider text-porcelain outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50";
const ghost =
  "tabular shrink-0 rounded-card border border-hairline/30 px-3 py-2 text-xs uppercase tracking-wider text-muted outline-none hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70";

function UrlRow({ url }: { url: string }) {
  return (
    <div className="flex items-center gap-2">
      <code className="min-w-0 flex-1 truncate rounded-card border border-hairline/20 bg-black/20 px-3 py-2 text-sm text-porcelain">
        {url}
      </code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(url).then(
            () => toast.success("Copied"),
            () => toast.error("Couldn’t copy"),
          );
        }}
        className={ghost}
      >
        Copy
      </button>
      <a href={url} target="_blank" rel="noopener" className={ghost}>
        Open
      </a>
    </div>
  );
}

export function DomainsForm({
  slug,
  customDomain,
  siteUrl,
  platformDomain,
  canEdit,
}: {
  slug: string;
  customDomain: string | null;
  siteUrl: string;
  platformDomain: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const [slugInput, setSlugInput] = useState(slug);
  const [domainInput, setDomainInput] = useState(customDomain ?? "");
  const [savingSlug, startSlug] = useTransition();
  const [savingDomain, startDomain] = useTransition();

  const liveUrl = `${siteUrl}/v/${slug}`;
  const subdomainUrl = platformDomain ? `https://${slug}.${platformDomain}` : null;

  function saveSlug() {
    const next = slugInput.trim().toLowerCase();
    if (next === slug) return;
    startSlug(async () => {
      const res = await updateSubdomain(next);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Address updated — remember to reprint any QR codes");
      router.refresh();
    });
  }

  function saveDomain() {
    startDomain(async () => {
      const res = await updateCustomDomain(domainInput);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(domainInput.trim() ? "Custom domain saved" : "Custom domain removed");
      router.refresh();
    });
  }

  return (
    <div className="space-y-8">
      {/* Live URL — works today */}
      <section className="space-y-2">
        <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">
          Your menu is live at
        </h2>
        <UrlRow url={liveUrl} />
        <p className="text-xs text-muted">
          This link works now — put it on your bio, socials, or a QR code.
        </p>
      </section>

      {/* Subdomain / address */}
      <section className="space-y-2">
        <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Your address</h2>
        {subdomainUrl ? (
          <>
            <UrlRow url={subdomainUrl} />
            <p className="text-xs text-muted">Your branded subdomain is live.</p>
          </>
        ) : (
          <p className="text-xs text-muted">
            Once a platform domain is connected, this becomes{" "}
            <span className="text-porcelain">{slug}.yourdomain</span>.
          </p>
        )}
        {canEdit && (
          <div className="flex items-center gap-2 pt-1">
            <input
              value={slugInput}
              onChange={(e) => setSlugInput(e.target.value)}
              aria-label="Address (slug)"
              className={field}
              placeholder="your-restaurant"
            />
            <button type="button" onClick={saveSlug} disabled={savingSlug} className={btn}>
              {savingSlug ? "…" : "Save"}
            </button>
          </div>
        )}
        {canEdit && (
          <p className="text-xs text-muted">
            Changing this changes your public link — anything already printed or shared keeps the old
            address, so reprint QR codes after.
          </p>
        )}
      </section>

      {/* Custom domain */}
      <section className="space-y-2">
        <h2 className="tabular text-[0.72rem] uppercase tracking-[0.2em] text-brass">Custom domain</h2>
        <p className="text-xs text-muted">
          Use your own domain (e.g. <span className="text-porcelain">menu.yourrestaurant.com</span>).
        </p>
        {canEdit ? (
          <div className="flex items-center gap-2">
            <input
              value={domainInput}
              onChange={(e) => setDomainInput(e.target.value)}
              aria-label="Custom domain"
              className={field}
              placeholder="menu.yourrestaurant.com"
            />
            <button type="button" onClick={saveDomain} disabled={savingDomain} className={btn}>
              {savingDomain ? "…" : domainInput.trim() ? "Save" : "Clear"}
            </button>
          </div>
        ) : (
          <p className="text-sm text-porcelain">{customDomain ?? "—"}</p>
        )}
        {customDomain && (
          <div className="rounded-card border border-hairline/20 p-3 text-xs text-muted">
            <p className="text-porcelain">To finish connecting {customDomain}:</p>
            <ol className="mt-1 list-decimal space-y-0.5 pl-4">
              <li>
                Add <span className="text-porcelain">{customDomain}</span> as a domain on the Platter
                app in Railway.
              </li>
              <li>At your DNS provider, point it (CNAME) at the target Railway shows.</li>
              <li>TLS is issued automatically — then this domain opens your menu.</li>
            </ol>
          </div>
        )}
      </section>
    </div>
  );
}
