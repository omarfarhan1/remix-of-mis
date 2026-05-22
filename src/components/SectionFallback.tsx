import React from 'react';

/**
 * Lightweight skeleton fallback used for lazy-loaded sections.
 *
 * Designed to:
 *  - Match the dark/light shell background (no flash of white)
 *  - Reserve roughly full-section height to avoid layout shift
 *  - Stay extremely cheap so it ships in the initial bundle
 */
interface Props {
  /** Optional label for screen readers / debugging */
  label?: string;
  /** Compact mode for modals/panels rather than full-page sections */
  compact?: boolean;
}

export function SectionFallback({ label = 'Loading', compact = false }: Props) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={label}
      className={
        compact
          ? 'w-full h-full min-h-[200px] flex items-center justify-center'
          : 'flex-1 w-full min-h-[60vh] flex items-center justify-center'
      }
    >
      <div className="flex flex-col items-center gap-4 opacity-70">
        <div className="w-10 h-10 rounded-full border-2 border-[var(--color-primary-bg,#1D1D1F)]/20 border-t-[#0071E3] animate-spin" />
        <span className="text-[10px] font-black uppercase tracking-[0.25em] text-[#86868B]">
          {label}
        </span>
      </div>
    </div>
  );
}
