"use client";

import { useEffect, useRef, useState } from "react";

type Msg = { role: "user" | "bot"; text: string };

const SUGGESTIONS = ["What's popular?", "Anything vegetarian?", "Not too spicy?", "Recommend a dish"];

// Floating AI concierge for diners — asks the venue's own menu via /api/concierge (Gemini).
// Dynamically imported (ssr:false) so it stays off the menu's critical first-load.
export default function Concierge({ venue, m, venueName }: { venue: string; m?: string; venueName: string }) {
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight, behavior: "smooth" });
  }, [msgs, busy]);

  async function ask(q: string) {
    const question = q.trim();
    if (!question || busy) return;
    setMsgs((prev) => [...prev, { role: "user", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, venue, m }),
      });
      const data = (await res.json()) as { answer?: string };
      setMsgs((prev) => [...prev, { role: "bot", text: data.answer ?? "…" }]);
    } catch {
      setMsgs((prev) => [...prev, { role: "bot", text: "Sorry, I couldn’t answer that just now." }]);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close menu assistant" : "Ask the menu assistant"}
        className="fixed bottom-5 right-5 z-40 flex h-12 items-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-on-accent shadow-plate outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-accent/70"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          {open ? <path d="M18 6 6 18M6 6l12 12" /> : <><path d="M12 2a7 7 0 0 0-7 7c0 2.4 1.2 4.5 3 5.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3c1.8-1.2 3-3.3 3-5.7a7 7 0 0 0-7-7Z" /><path d="M9 21h6" /></>}
        </svg>
        {open ? "Close" : "Ask"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-40 flex max-h-[70vh] w-[min(360px,calc(100vw-2.5rem))] flex-col overflow-hidden rounded-2xl border border-hairline/30 bg-surface shadow-plate">
          <div className="border-b border-hairline/20 px-4 py-3">
            <p className="font-display text-sm text-text-on-surface">Menu assistant</p>
            <p className="text-[0.7rem] text-text-secondary">Ask anything about {venueName}’s menu</p>
          </div>

          <div ref={scroller} className="flex-1 space-y-2.5 overflow-y-auto px-4 py-3">
            {msgs.length === 0 && (
              <p className="text-sm text-text-secondary">
                Hi! I can help you pick something. Try one of these:
              </p>
            )}
            {msgs.map((msg, i) => (
              <div
                key={i}
                className={msg.role === "user" ? "flex justify-end" : "flex justify-start"}
              >
                <span
                  className={
                    msg.role === "user"
                      ? "max-w-[85%] rounded-2xl rounded-br-sm bg-accent px-3 py-2 text-sm text-on-accent"
                      : "max-w-[90%] rounded-2xl rounded-bl-sm bg-black/20 px-3 py-2 text-sm text-text-on-surface"
                  }
                >
                  {msg.text}
                </span>
              </div>
            ))}
            {busy && <p className="text-xs text-text-secondary">Thinking…</p>}
            {msgs.length === 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => ask(s)}
                    className="rounded-full border border-hairline/30 px-2.5 py-1 text-xs text-text-secondary outline-none hover:text-text focus-visible:ring-2 focus-visible:ring-accent/70"
                  >
                    {s}
                  </button>
                ))}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
            }}
            className="flex items-center gap-2 border-t border-hairline/20 p-2.5"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about the menu…"
              className="min-w-0 flex-1 rounded-full border border-hairline/30 bg-black/20 px-3 py-2 text-sm text-text outline-none focus-visible:ring-2 focus-visible:ring-accent/70"
            />
            <button
              type="submit"
              disabled={busy || !input.trim()}
              className="shrink-0 rounded-full bg-accent px-3 py-2 text-sm font-semibold text-on-accent outline-none hover:opacity-90 focus-visible:ring-2 focus-visible:ring-accent/70 disabled:opacity-50"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
