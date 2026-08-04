import { Toaster } from "sonner";

// Wraps everything under /admin (login + workspace). No auth gate here so the
// login page can render; the gate lives in (workspace)/layout.tsx.
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh bg-ink text-porcelain">
      {children}
      <Toaster theme="dark" position="top-center" richColors closeButton />
    </div>
  );
}
