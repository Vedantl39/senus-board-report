import { useId, useState } from "react";

/**
 * Lightweight hover/focus tooltip used for traceability — shows the source
 * document filename and audited status when hovering a KPI or metric cell.
 * No extra dependency; pure CSS-driven positioning with a small delay-free
 * show/hide via local state so it also works with keyboard focus.
 */
export function Tooltip({ content, children }) {
  const [visible, setVisible] = useState(false);
  const id = useId();

  if (!content) return children;

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onFocus={() => setVisible(true)}
      onBlur={() => setVisible(false)}
      aria-describedby={visible ? id : undefined}
    >
      {children}
      {visible ? (
        <span
          id={id}
          role="tooltip"
          className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 w-max max-w-64 -translate-x-1/2 rounded-md border border-border bg-popover px-2.5 py-1.5 text-[11px] leading-snug text-popover-foreground shadow-lg"
        >
          {content}
        </span>
      ) : null}
    </span>
  );
}
