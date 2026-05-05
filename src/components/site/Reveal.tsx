"use client";

import type { ReactNode } from "react";

export function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <div className="opacity-100" style={{ animationDelay: `${delay}s` }}>
      {children}
    </div>
  );
}
