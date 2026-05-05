"use client";

import { useEffect, useState } from "react";
import { ArrowUp } from "lucide-react";

export function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement;
      const total = h.scrollHeight - h.clientHeight;
      const p = total > 0 ? (h.scrollTop / total) * 100 : 0;
      setProgress(p);
      setShowTop(p > 60);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div
        aria-hidden
        className="fixed top-0 left-0 right-0 h-[2px] z-[60] pointer-events-none"
      >
        <div
          className="h-full bg-[var(--color-copper)] transition-[width] duration-100 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <button
        type="button"
        aria-label="Tilbake til toppen"
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className={`fixed bottom-6 right-6 z-50 h-11 w-11 flex items-center justify-center bg-[var(--color-ink)] text-white rounded-[3px] shadow-xl border border-[oklch(0.28_0_0)] transition-all duration-300 hover:bg-[var(--color-copper)] hover:-translate-y-0.5 ${
          showTop ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <ArrowUp className="h-4 w-4" strokeWidth={2} />
      </button>
    </>
  );
}
