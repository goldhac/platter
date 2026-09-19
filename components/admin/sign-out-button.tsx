"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export function SignOutButton({ className, label }: { className?: string; label?: string }) {
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
      className={
        className ??
        "rounded-sm border border-hairline px-3 py-1.5 text-xs text-text-secondary outline-none transition-colors hover:text-text focus-visible:ring-2 focus-visible:ring-accent/60 disabled:opacity-50"
      }
    >
      {busy ? "Signing out…" : (label ?? "Sign out")}
    </button>
  );
}
