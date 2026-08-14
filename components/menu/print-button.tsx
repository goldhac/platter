"use client";

/** Floating "Save as PDF" control on the print menu — hidden from the printout via .no-print. */
export function PrintButton() {
  return (
    <div className="no-print mb-6 flex justify-center gap-2">
      <button
        type="button"
        onClick={() => window.print()}
        className="rounded-full bg-[color:var(--print-accent)] px-5 py-2 text-sm font-semibold text-white shadow-md outline-none hover:opacity-90"
      >
        Save as PDF / Print
      </button>
    </div>
  );
}
