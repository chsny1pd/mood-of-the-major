import type { ReactNode } from "react";

/**
 * CSS-based list animation — keeps framer-motion off the feed critical path.
 * MoodDetailPage still uses framer-motion via its own route chunk.
 */
export function AnimatedMoodList({ children }: { children: ReactNode }) {
  return <div className="mood-list mt-6 space-y-4">{children}</div>;
}

export function AnimatedMoodItem({ children }: { children: ReactNode }) {
  return <div className="mood-list__item">{children}</div>;
}
