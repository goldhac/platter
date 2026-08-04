"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  return (
    <button
      type="button"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        await createClient().auth.signOut();
        router.push("/admin/login");
        router.refresh();
      }}
      className="rounded-card border border-hairline/30 px-3 py-1.5 text-xs text-muted outline-none transition-colors hover:text-porcelain focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
    >
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
