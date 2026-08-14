"use client";

import { useEffect } from "react";

// One tiny client island that drives every scroll reveal on the landing. Server markup marks
// elements with `data-reveal` (visible by default, so no-JS and crawlers see everything). On
// mount we flip on `.reveal-ready`, which arms the hidden state, then reveal anything already
// in view synchronously (no flash) and observe the rest. Respects prefers-reduced-motion.
export function RevealObserver() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    if (!els.length) return;

    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" },
    );

    document.documentElement.classList.add("reveal-ready");
    const vh = window.innerHeight;
    for (const el of els) {
      const r = el.getBoundingClientRect();
      // Already on screen at load → reveal in the same tick so it never flashes hidden.
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add("is-in");
      else io.observe(el);
    }

    return () => io.disconnect();
  }, []);

  return null;
}
