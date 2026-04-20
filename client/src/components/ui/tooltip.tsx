import { useId, type PropsWithChildren } from "react";
import { cn } from "./helpers";

type TooltipProps = PropsWithChildren<{
  content: string;
  className?: string;
}>;

export function Tooltip({ content, className, children }: TooltipProps) {
  const tooltipId = useId();

  return (
    <span className={cn("group relative inline-flex", className)}>
      <span aria-describedby={tooltipId}>{children}</span>
      <span
        id={tooltipId}
        role="tooltip"
        className="pointer-events-none absolute left-1/2 top-full z-30 mt-2 hidden -translate-x-1/2 whitespace-nowrap rounded-xl border border-[var(--color-border)] bg-[var(--color-surface-overlay)] px-3 py-2 text-xs text-[var(--color-text-muted)] shadow-md group-hover:block group-focus-within:block"
      >
        {content}
      </span>
    </span>
  );
}
